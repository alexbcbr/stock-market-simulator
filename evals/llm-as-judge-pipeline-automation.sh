
cd trade-ai
ax datasets export financial_golden_answer --space "Default Space" --stdout > ../evals/golden_examples.json
uv run python3 ../evals/infer.py < ../evals/golden_examples.json > ../evals/runs.json
  
ax experiments create --name "golden-answer-sonnet-4-5-v2" --dataset "financial_golden_answer" --space "Default Space" --file ../evals/runs.json

ax experiments export "golden-answer-sonnet-4-5-v2" --dataset "financial_golden_answer" --space "Default Space" --stdout > ../evals/exported_runs.json

uv run python3 ../evals/judge.py --examples ../evals/golden_examples.json --runs ../evals/exported_runs.json > ../evals/annotations.json

ax experiments annotate-runs "golden-answer-sonnet-4-5-v2" --dataset "financial_golden_answer" --space "Default Space" --file ../evals/annotations.json