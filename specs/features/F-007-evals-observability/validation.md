# F-007 Validation

Mergeable when the checks for every requirement you touched pass.

## Per requirement
| Requirement | How it is checked |
|---|---|
| R1 | Run an agent with the keys set; a trace appears in Arize with its tool calls |
| R2 | Dataset files load (`ax datasets export` or reading the CSV) and every row has a category and an expected behavior or golden answer |
| R3 | The pipeline completes from `trade-ai/`: dataset exported, `runs.json` produced, experiment created, `annotations.json` written and applied |
| R4 | Spot-check three rows of `runs.json`: a tool question names the tool, an off-topic question is declined |
| R5 | Pre-commit and the secret scan pass; no key in the diff |
| R6 | Follow `prompt-experimentation.md` with a changed prompt; a second experiment appears for the same dataset |

Scores for the off-topic refusal and user authorization categories do not drop against the last experiment.

## Open (until the gap tasks are done)
- G1: after task 3, the pipeline runs for a new experiment name without editing the script.
- G2: after task 5, a PR with lower scores shows a failing check.
