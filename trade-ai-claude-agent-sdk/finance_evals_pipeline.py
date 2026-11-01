import os

from openinference.instrumentation import suppress_tracing
from arize.client import ArizeClient
from phoenix.evals import evaluate_dataframe
from phoenix.evals.utils import to_annotation_dataframe

from dotenv import load_dotenv

load_dotenv()

from datetime import datetime, timedelta

from finance_evaluators import EVALUATORS

# Get the spans from AX
arize_client = ArizeClient(api_key=os.environ["ARIZE_API_KEY"])
SPACE_ID = os.environ["ARIZE_SPACE_ID"]
PROJECT_NAME = "trade-ai-claude-agent-sdk"

spans_df = arize_client.spans.export_to_df(
    space_id=SPACE_ID,
    project_name=PROJECT_NAME,
    start_time=datetime.utcnow() - timedelta(days=7),
    end_time=datetime.utcnow(),
)

parent_spans = spans_df[spans_df["parent_id"].isna()].copy()

with suppress_tracing():
    results = evaluate_dataframe(dataframe=parent_spans, evaluators=EVALUATORS)

## Save annotations back

def log_eval_to_ax(eval_results_df, eval_name):
    annotations = to_annotation_dataframe(dataframe=eval_results_df, score_names=[eval_name])
    # to_annotation_dataframe outputs columns:
    #   name, label, score, explanation, metadata, annotation_name, annotator_kind
    # with context.span_id as the index. AX needs them eval-namespaced.
    annotations = annotations.rename(columns={
        "label": f"eval.{eval_name}.label",
        "score": f"eval.{eval_name}.score",
        "explanation": f"eval.{eval_name}.explanation",
    })
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