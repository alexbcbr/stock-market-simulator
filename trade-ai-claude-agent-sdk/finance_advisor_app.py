"""Financial assistant with MCP stock tools, built on the Claude Agent SDK.

Port of trade-ai/04fin_assistant_bp.py from LangChain/LangGraph to the Claude
Agent SDK, routed through AWS Bedrock instead of calling LangChain's chat
model wrapper directly. Same MCP tools (list_market_prices, list_trades,
create_trade, check_user, buy_stock) served by stock_mcp_server.py over HTTP.

The Agent SDK drives Claude via a bundled Claude Code CLI subprocess rather
than making in-process API calls, so this agent is locked down to behave like
a narrow financial assistant instead of a general coding agent:
- tools=[] disables all built-in Claude Code tools (Bash, Read, Edit, ...).
- setting_sources=[] skips this repo's CLAUDE.md / .claude/settings.json, so
  no unrelated project instructions or MCP servers leak in.
- strict_mcp_config=True restricts MCP servers to exactly what's configured
  here (the "stocks" server), ignoring any global/project MCP config.
- allowed_tools whitelists the stocks MCP tools so calls never hit a
  permission prompt, which would otherwise hang this non-interactive loop.

ClaudeSDKClient keeps one persistent session across the whole REPL loop,
which is this SDK's equivalent of LangGraph's thread_id-scoped checkpointer -
conversation history lives in the session instead of a separate memory store.

Tracing is sent to Arize AX via openinference-instrumentation-claude-agent-sdk,
which wraps ClaudeSDKClient.connect/query/receive_response (see
instrumentation.py). This captures turn-level spans from the SDK's own calls;
it does not see inside the bundled Claude Code CLI subprocess that actually
talks to Bedrock, so it's not a 1:1 replacement for the original's per-LLM-call
LangChain spans.

Requires stock_mcp_server.py (from trade-ai/) running on http://127.0.0.1:8001
and the trade-backend API running on http://127.0.0.1:8000. Requires
CLAUDE_CODE_USE_BEDROCK=1 and AWS credentials available via the standard AWS
credential chain (profile, env vars, or instance role).
"""

import asyncio

from dotenv import load_dotenv

load_dotenv()

import instrumentation  # must be imported before claude_agent_sdk below

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    TextBlock,
)

SYSTEM_PROMPT = "You're a financial assistant. Don't answer question outside of the context of financial market."

MODEL = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"

STOCK_TOOLS = [
    "mcp__stocks__check_user",
    "mcp__stocks__buy_stock",
    "mcp__stocks__list_market_prices",
    "mcp__stocks__list_trades",
    "mcp__stocks__create_trade",
]

AGENT_OPTIONS = ClaudeAgentOptions(
    model=MODEL,
    system_prompt=SYSTEM_PROMPT,
    effort="medium",
    env={"CLAUDE_CODE_USE_BEDROCK": "1"},
    mcp_servers={
        "stocks": {
            "type": "http",
            "url": "http://127.0.0.1:8001/mcp",
        }
    },
    tools=[],
    allowed_tools=STOCK_TOOLS,
    strict_mcp_config=True,
    setting_sources=[],
    permission_mode="bypassPermissions",
)


async def inference(client: ClaudeSDKClient, question: str) -> str:
    await client.query(question)
    reply_parts = []
    async for message in client.receive_response():
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    reply_parts.append(block.text)
    return "".join(reply_parts)


async def main():
    async with ClaudeSDKClient(options=AGENT_OPTIONS) as client:
        print("*** Welcome to the Financial Bot. How can I help? ***")
        print("***************************************************")
        while True:
            question = await asyncio.to_thread(input, ">> ")
            print(await inference(client, question))
            print("***************************************************")


if __name__ == "__main__":
    asyncio.run(main())
