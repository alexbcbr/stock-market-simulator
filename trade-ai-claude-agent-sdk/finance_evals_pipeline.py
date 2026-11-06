"""Score recent agent traces with the code evaluators and write results to Arize.

This is a script, not a library: all the work runs at import time. It exports the
last 7 days of spans from the Arize project ``trade-ai-claude-agent-sdk``, keeps
only root spans (one per agent turn), runs every evaluator in ``EVALUATORS``
with tracing suppressed, and logs each result back as span annotations.

Environment:
    ARIZE_API_KEY: Required.
    ARIZE_SPACE_ID: Required.

Constraints:
    The Claude agents send no traces unless instrumentation.py is imported (see
    that file), so the export can be empty and nothing is annotated. Re-running
    overwrites the annotations of the same evaluators on the same spans.
"""

import os

from arize.client import ArizeClient
from dotenv import load_dotenv
from openinference.instrumentation import suppress_tracing
from phoenix.evals import evaluate_dataframe
from phoenix.evals.utils import to_annotation_dataframe

load_dotenv()

from datetime import UTC, datetime, timedelta

from finance_evaluators import EVALUATORS

# Get the spans from AX
arize_client = ArizeClient(api_key=os.environ["ARIZE_API_KEY"])
SPACE_ID = os.environ["ARIZE_SPACE_ID"]
PROJECT_NAME = "trade-ai-claude-agent-sdk"

spans_df = arize_client.spans.export_to_df(
    space_id=SPACE_ID,
    project_name=PROJECT_NAME,
    start_time=datetime.now(UTC) - timedelta(days=7),
    end_time=datetime.now(UTC),
)

parent_spans = spans_df[spans_df["parent_id"].isna()].copy()

with suppress_tracing():
    results = evaluate_dataframe(dataframe=parent_spans, evaluators=EVALUATORS)

## Save annotations back


def log_eval_to_ax(eval_results_df, eval_name):
    """Write one evaluator's results back to Arize as span annotations.

    Reshapes the evaluation frame into the columns Arize expects
    (``eval.<name>.label``, ``.score``, ``.explanation``). The explanation column is
    forced to string because Arize rejects an all-null column, which code
    evaluators produce when nothing fails.

    Args:
        eval_results_df: Output of ``evaluate_dataframe``, indexed by span id.
        eval_name: Evaluator name, for example ``"mentions_ticker"``. It must match
            the evaluator's score column in the frame.

    Raises:
        Exception: Arize client errors on upload are not caught.
    """
    annotations = to_annotation_dataframe(
        dataframe=eval_results_df, score_names=[eval_name]
    )
    # to_annotation_dataframe outputs columns:
    #   name, label, score, explanation, metadata, annotation_name, annotator_kind
    # with context.span_id as the index. AX needs them eval-namespaced.
    annotations = annotations.rename(
        columns={
            "label": f"eval.{eval_name}.label",
            "score": f"eval.{eval_name}.score",
            "explanation": f"eval.{eval_name}.explanation",
        }
    )
    # Drop columns AX doesn't use; they trigger an INFO warning otherwise.
    for col in ("name", "metadata", "annotation_name", "annotator_kind"):
        if col in annotations.columns:
            annotations = annotations.drop(columns=[col])
    # AX requires string dtype for the explanation column. Code evals
    # produce no explanation, leaving an all-null column with null dtype,
    # which AX rejects ("reserved column cannot be coerced to canonical type").
    # Coerce to string so the type is stable.
    expl_col = f"eval.{eval_name}.explanation"
    if expl_col in annotations.columns:
        annotations[expl_col] = annotations[expl_col].fillna("").astype(str)
    # context.span_id must be a column, not just the index
    if annotations.index.name == "context.span_id":
        annotations = annotations.reset_index()
    arize_client.spans.update_evaluations(
        space_id=SPACE_ID,
        project_name=PROJECT_NAME,
        dataframe=annotations,
    )
    print(f"Logged {len(annotations)} {eval_name} evaluations to AX")


for evaluator in EVALUATORS:
    log_eval_to_ax(results, eval_name=evaluator.name)
