# F-013 Validation

Mergeable when the checks pass.

## Global
- `uvx ruff check .` and `uvx ruff format --check .` pass from the repo root.
- In `trade-ai-slack-bot/`: `uv sync --frozen` succeeds.
- `git check-ignore trade-ai-slack-bot/.env trade-ai-slack-bot/.slack/apps.dev.json` lists both paths.

## Per requirement
| Requirement | How it is checked |
|---|---|
| R5, R6 | In `trade-ai-slack-bot/` with `.env` filled: `uv run python -c "import asyncio, app; print(asyncio.run(app.answer('What is a stock market?')))"` prints an answer and no tracing error |
| R4 | Same command with `'<@U123>'` prints the greeting without a model call; with a wrong `AZURE_OPENAI_API_KEY` it prints the apology and logs the error |
| R1, R3, R8 | By hand: `source .venv/bin/activate && slack run --app <app-id>`, send a direct message, get a short answer in mrkdwn; edit the message and get no second reply |
| R2 | By hand: mention the bot in a channel and get the answer in a thread under the message |
| R7 | `git check-ignore` above |

## Before running
Needs the Slack CLI logged in to the workspace where the app is installed, and the Azure OpenAI deployment reachable. Run `slack run` with the project's `.venv` activated: the CLI hook calls `python3`, and the system Python does not have `slack_cli_hooks`. Only one `slack run` should be connected at a time; Slack spreads events across all open connections, so a forgotten copy keeps answering.
