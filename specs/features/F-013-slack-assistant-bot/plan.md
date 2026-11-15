# F-013 Plan

1. **Slack app** (done): project created with `slack create` from `slack-samples/bolt-python-blank-template` and linked to the existing app; the manifest subscribes to `app_mention` and `message.im` with the `chat:write`, `app_mentions:read` and `im:history` scopes.
2. **Echo bot** (done): first version replied with the user's text followed by "understood", to check the Slack wiring.
3. **Model answers** (done): the agent from `trade-ai-openai/` (Azure OpenAI through the OpenAI Agents SDK), async Bolt app, threads for channel mentions, error reply. Covers R1 to R6, R8.
4. **Repo hygiene** (done): `.gitignore` from the template covers `.env` and `.venv`; `uv.lock` generated; module docstring and Google-style docstrings in `app.py`. Covers R7.
5. **Docs** (partly done): root `README.md` mentions the bot. `trade-ai-slack-bot/README.md` is still the Slack template's README.
6. **Pipeline** (partly done): the project is in the `ci-python.yml` Pyright matrix. Not in `make pydoc` yet: importing `app.py` needs the `AZURE_OPENAI_*` variables, so pydoc must run with them set or skip it.
7. **Later** (planned): unit tests with a stubbed agent and Slack client; conversation memory from the thread history; MCP tools so the bot can list prices and place trades; tracing in Arize like F-007.
