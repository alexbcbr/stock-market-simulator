---
id: F-013
title: Slack assistant bot
status: implemented
---
# F-013 Slack assistant bot

## Context
Players and the team already use Slack, so a question about stocks or investing should not require opening another tool. This feature adds `trade-ai-slack-bot/`, a Slack app (**AI Finance Helper**) built with Bolt for Python that answers direct messages and channel mentions with a model on Azure OpenAI. It uses the OpenAI Agents SDK in the same way as `trade-ai-openai/`, with the code copied rather than shared, so the two projects stay independent. It does not call the trade backends or the MCP server yet. Code: `trade-ai-slack-bot/app.py`. The project was created with the Slack CLI from `slack-samples/bolt-python-blank-template` and linked to an app that already exists in App Settings.

## User stories
| ID | Priority | Story | Requirements |
|---|---|---|---|
| F-013-S1 | P1 | As a **player**, I want to send the bot a direct message and get an answer, so I can ask about stocks without leaving Slack. | R1, R3, R4 |
| F-013-S2 | P1 | As a **team member**, I want to mention the bot in a channel and get the answer in a thread, so the channel stays readable. | R2, R3, R4 |
| F-013-S3 | P2 | As a **developer**, I want the keys kept out of git and the model changeable by configuration, so I can run the bot safely on my machine. | R5, R6, R7 |

## Configuration
| Variable | Used for |
|---|---|
| `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` | Slack Socket Mode. `slack run` provides them; `.env` is the fallback when running `python app.py` |
| `AZURE_OPENAI_BASE_URL` | Azure OpenAI endpoint, ending in `/openai/v1/` |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI key |
| `AZURE_OPENAI_DEPLOYMENT` | Name of the model deployment |

All of them are read from the environment or from `trade-ai-slack-bot/.env`, which never overrides a variable that is already set.

## Requirements
- **R1** WHEN a user sends the bot a direct message (`message.im`), the system SHALL reply in the same conversation with the model's answer to that message. Edits, deletions and other message subtypes SHALL be ignored.
- **R2** WHEN a user mentions the bot in a channel (`app_mention`), the system SHALL remove the `<@USERID>` mentions from the text and reply in a thread under that message, or in the existing thread if the mention was in one.
- **R3** Each message SHALL be answered on its own: the agent SHALL NOT receive earlier messages of the conversation.
- **R4** IF the model call fails, the system SHALL log the error and reply with a short apology, so the user always gets a reply. A message with no text left after removing mentions SHALL get a greeting without calling the model.
- **R5** The model SHALL be the Azure OpenAI deployment named by `AZURE_OPENAI_DEPLOYMENT`, called through the OpenAI Agents SDK (`OpenAIChatCompletionsModel` with an `AsyncOpenAI` client).
- **R6** OpenAI Agents SDK tracing SHALL be disabled, because it exports to OpenAI by default and needs an `OPENAI_API_KEY` this project does not have.
- **R7** `.env`, `.venv` and `.slack/apps.dev.json` SHALL be git-ignored.
- **R8** The agent instructions SHALL ask for brief answers in Slack mrkdwn (no Markdown headings or tables).

## Out of scope
Conversation memory, calling the trade backends or the MCP tools (placing trades from Slack), deploying the bot (it runs locally with `slack run`), tracing and evals, and unit tests.

## Decisions
- D1: Socket Mode, so the bot runs on a laptop with no public URL.
- D2: The app is async (`AsyncApp` and `AsyncSocketModeHandler`, which need `aiohttp`). Every agent run then shares one event loop with the `AsyncOpenAI` client. Calling `Runner.run_sync` from the sync Bolt worker threads would reuse that client across event loops.
- D3: The agent code is copied from `trade-ai-openai/` instead of imported, so either project can change without breaking the other.
- D4: Channel answers go in a thread to keep channels readable; direct messages are answered in place.
- D5: The ID is F-013 because F-008 and F-009 are reserved in the roadmap and F-012 is taken.
