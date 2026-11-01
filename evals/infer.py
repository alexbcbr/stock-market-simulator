"""Run the trade-ai financial assistant's system prompt against each dataset
question and collect outputs for an Arize experiment.

Usage (from the trade-ai/ directory, so uv run has the right deps):

    cd ../trade-ai
    ax datasets export financial_golden_answer --space "Default Space" --stdout \
      | uv run python3 ../evals/infer.py > ../evals/runs.json
"""

import json
import sys
import time

from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage

SYSTEM_PROMPT = "You're a financial assistant. Don't answer questions outside of the context of financial market."
MODEL_ID = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"

model = init_chat_model(
    model=MODEL_ID,
    model_provider="bedrock_converse",
    temperature=0.1,
    region_name="us-west-2",
)

examples = json.load(sys.stdin)
runs = []

for ex in examples:
    question = ex["additional_properties"]["question"]
    start = time.time()

    result = model.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=question),
    ])
    output_text = result.content

    latency_ms = round((time.time() - start) * 1000)
    runs.append({
        "example_id": ex["id"],
        "output": output_text,
        "metadata": {"model": MODEL_ID, "latency_ms": latency_ms},
    })
    print(f"  {ex['id']}: {latency_ms}ms", file=sys.stderr)

json.dump(runs, sys.stdout, indent=2)
