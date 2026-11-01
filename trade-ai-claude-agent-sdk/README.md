# trade-ai-claude-agent-sdk

Financial assistant agent, built on the [Claude Agent SDK](https://pypi.org/project/claude-agent-sdk/),
calling Claude via AWS Bedrock. Same MCP stock tools and behavior as
`trade-ai/04fin_assistant_bp.py` (the LangChain/LangGraph version), ported to
the Claude Agent SDK.

## Prerequisites

- Python >= 3.12, managed via `uv`.
- AWS credentials available via the standard credential chain (profile, env
  vars, or instance role) with Bedrock access to
  `us.anthropic.claude-sonnet-4-5-20250929-v1:0`.
- `trade-ai/stock_mcp_server.py` running on `http://127.0.0.1:8001`.
- `trade-backend` API running on `http://127.0.0.1:8000`.
- `ARIZE_SPACE_ID`, `ARIZE_API_KEY`, `ARIZE_OTLP_ENDPOINT` set in the
  environment (or a `.env` file) for tracing — same variables as
  `trade-ai/.env`.

## Run

```
cd trade-ai-claude-agent-sdk
uv sync
uv run main.py
```

## Notes

- `CLAUDE_CODE_USE_BEDROCK=1` is set automatically if not already present in
  the environment, so Claude is served via Bedrock rather than the
  first-party Anthropic API.
- The agent's built-in Claude Code tools (Bash, Read, Edit, etc.) are
  disabled and filesystem settings/CLAUDE.md loading is turned off
  (`setting_sources=[]`), so this behaves as a narrow financial assistant
  rather than a general coding agent. Only the `stocks` MCP tools are
  allowed: `check_user`, `buy_stock`, `list_market_prices`, `list_trades`,
  `create_trade`.
- Multi-turn conversation memory comes from keeping one `ClaudeSDKClient`
  session open for the life of the REPL loop, rather than a LangGraph
  checkpointer keyed by `thread_id`.
- `temperature` and Bedrock prompt-caching TTL from the original LangChain
  version aren't exposed by the Claude Agent SDK; `effort="medium"` is used
  as the closest available analog to `reasoning_effort="medium"`.
- Tracing is sent to Arize AX via `arize.otel.register` +
  `openinference-instrumentation-claude-agent-sdk`'s `ClaudeAgentSDKInstrumentor`
  (see `instrumentation.py`), which wraps `ClaudeSDKClient.connect` / `query` /
  `receive_response`. This gives turn-level spans from the SDK's own Python
  calls, but — unlike the original's LangChain instrumentation — it can't see
  inside the bundled Claude Code CLI subprocess that actually talks to
  Bedrock, so there's no per-LLM-call span the way the LangChain version had.
- `inference()` prints all text blocks from the turn concatenated together
  (e.g. intermediate narration plus the final answer on a tool-using turn),
  unlike the original which only returned `messages[-1].content`.
