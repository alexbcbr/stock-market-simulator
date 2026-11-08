# trade-ai-crewai

Customer research agent, built on [CrewAI](https://pypi.org/project/crewai/), calling Claude via AWS Bedrock.
A crew of three agents writes one markdown report per customer, with areas of interest and talking points
for a first conversation. Spec: [`specs/features/F-012-customer-research-agent`](../specs/features/F-012-customer-research-agent/).

| Agent | Job |
|---|---|
| Researcher | Searches the public web (DuckDuckGo, no API key) and lists findings with sources |
| Writer | Writes the report: summary, areas of interest, 5 talking points (max 300 words) |
| Reviewer | Checks the report is appropriate, factual and public-only, then saves the final version |

## Prerequisites

- Python >= 3.12, managed via `uv`.
- AWS credentials available via the standard credential chain (profile, env vars, or instance role) with
  Bedrock access to `us.anthropic.claude-haiku-4-5-20251001-v1:0`.
- `customer_research.csv` in this folder: one customer per line, `name, email`, no header. Git-ignored.

Unlike the other agents, this one does not need the FastAPI backend or the MCP server, and it does not use Arize.

## Run

```
cd trade-ai-crewai
uv sync
uv run main.py
```

Reports are written to `reports/<customer>.md` (git-ignored). Running again overwrites them.

## Notes

- The model can be changed with `BEDROCK_MODEL=bedrock/<model-id>`.
- CrewAI tracing and telemetry are turned off in code (`CREWAI_TRACING_ENABLED=false`, `OTEL_SDK_DISABLED=true`),
  so nothing is shared with CrewAI. Only the Bedrock calls and the web searches leave the machine.
- The researcher is capped at 6 iterations so one customer cannot loop for long. CrewAI logs no per-call token
  warnings (that logger is silenced) because Bedrock has no native token counter in it.
- The output path is relative and `main()` changes into this folder: CrewAI reads `output_file` relative to the
  working directory and drops a leading `/`, so an absolute path would create a nested folder.
- The reviewer removes sensitive or intrusive content, but a common name can still match the wrong person.
  Read each report before using it.
- Customer data and reports are personal data: keep both out of git and off shared channels.
- No unit tests yet. Ruff and Pyright run in CI (`ci-python.yml`); `make pydoc` documents `main.py`.
