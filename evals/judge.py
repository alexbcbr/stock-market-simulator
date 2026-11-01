"""LLM-as-judge: grade each experiment run's output against the dataset's
expected_answer, and produce an annotations file for `ax experiments
annotate-runs`.

Usage (from the trade-ai/ directory, so uv run has the right deps):

    cd ../trade-ai
    uv run python3 ../evals/judge.py \
      --examples ../evals/golden_examples.json \
      --runs ../evals/exported_runs.json \
      > ../evals/annotations.json

Where:
  --examples is the output of `ax datasets export ... --stdout`
  --runs     is the output of `ax experiments export ... --stdout`
    (must be exported AFTER `ax experiments create`, so each run has its id)

Requires an annotation config named "correctness" to exist in the space
before `ax experiments annotate-runs` will accept these annotations:

    ax annotation-configs create categorical \
      --name "correctness" --space "Default Space" \
      --value correct --value incorrect
"""

import argparse
import json
import sys

from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage

JUDGE_PROMPT = """You are grading whether a financial assistant's answer matches the intent and key facts of a reference answer.

Question: {question}

Reference answer: {expected_answer}

Assistant's answer: {output}

Does the assistant's answer convey the same key information as the reference answer, even if worded differently? Minor phrasing differences are fine; missing or contradicting key facts is not. Respond with exactly one word: "correct" or "incorrect"."""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--examples", required=True, help="Path to exported dataset JSON")
    parser.add_argument("--runs", required=True, help="Path to exported experiment runs JSON")
    args = parser.parse_args()

    judge_model = init_chat_model(
        model="us.anthropic.claude-sonnet-4-5-20250929-v1:0",
        model_provider="bedrock_converse",
        temperature=0,
        region_name="us-west-2",
    )

    with open(args.examples) as f:
        examples = {ex["id"]: ex["additional_properties"] for ex in json.load(f)}

    with open(args.runs) as f:
        runs = json.load(f)

    annotations = []
    for run in runs:
        ex = examples[run["example_id"]]
        prompt = JUDGE_PROMPT.format(
            question=ex["question"],
            expected_answer=ex["expected_answer"],
            output=run["output"],
        )
        result = judge_model.invoke([HumanMessage(content=prompt)])
        label = result.content.strip().lower()
        label = "correct" if "correct" in label and "incorrect" not in label else "incorrect"

        annotations.append({
            "record_id": run["id"],
            "values": [{"name": "correctness", "label": label}],
        })
        print(f"  run {run['id']}: {label}", file=sys.stderr)

    json.dump(annotations, sys.stdout, indent=2)


if __name__ == "__main__":
    main()
