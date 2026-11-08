# F-012 Validation

Mergeable when the checks pass.

## Global
- `uvx ruff check .` and `uvx ruff format --check .` pass from the repo root.
- In `trade-ai-crewai/`: `uv sync --frozen`, then `uvx pyright@1.1.414 --pythonpath .venv/bin/python` reports 0 errors.
- `git check-ignore trade-ai-crewai/customer_research.csv trade-ai-crewai/reports/x.md` lists both paths.

## Per requirement
| Requirement | How it is checked |
|---|---|
| R1, R3 | By hand: `uv run main.py` with two lines in the CSV gives two files in `trade-ai-crewai/reports/` and no new folder inside the project, also when started from the repo root with `uv run trade-ai-crewai/main.py` |
| R2, R4, R5 | By hand: read a report; sources are listed, no sensitive topics, doubtful matches are flagged |
| R6 | By hand: no tracing prompt on start |
| R7 | `git check-ignore` above |
| R8 | By hand: set `BEDROCK_MODEL` to another model id and run |

## Before using real customers
Needs AWS credentials with Bedrock access. Treat reports as drafts: check names that are common, because the search can pick the wrong person.
