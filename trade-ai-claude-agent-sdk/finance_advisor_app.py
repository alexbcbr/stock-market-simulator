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

Tracing: instrumentation.py can send turn-level spans to Arize AX through
openinference-instrumentation-claude-agent-sdk, but this module does not import
it, so no traces are sent unless ``import instrumentation`` is added before the
``claude_agent_sdk`` import. Even then the spans cover only the SDK's own calls
(connect, query, receive_response); they do not show inside the bundled CLI
subprocess that talks to Bedrock, so they are coarser than the per-LLM-call
spans of the LangChain version.

Constraint: ``permission_mode="bypassPermissions"`` is safe here only because
``tools=[]`` removes every built-in tool and ``allowed_tools`` lists just the
stocks tools. Adding a tool to either list widens what the agent can do without
asking.

Requires stock_mcp_server.py (from trade-ai/) running on http://127.0.0.1:8001
and the trade-backend API running on http://127.0.0.1:8000. Requires
CLAUDE_CODE_USE_BEDROCK=1 and AWS credentials available via the standard AWS
credential chain (profile, env vars, or instance role).
"""

import asyncio

from dotenv import load_dotenv

load_dotenv()

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
    """Send one question in the open session and collect the text of the reply.

    Args:
        client: Connected client. Its session holds the conversation, so earlier
            questions in the same client are remembered.
        question: The user's message.

    Returns:
        The assistant's text blocks joined without a separator. Tool calls and
        results are not included. Empty if the reply has no text block.
    """
    await client.query(question)
    reply_parts = []
    async for message in client.receive_response():
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    reply_parts.append(block.text)
    return "".join(reply_parts)


async def main():
    """Open one session and run the question loop until the process is stopped.

    Raises:
        Exception: SDK or connection errors if the MCP server or the bundled CLI
            cannot start. The loop has no exit command; stop it with Ctrl+C or end
            of input (``EOFError``).
    """
    async with ClaudeSDKClient(options=AGENT_OPTIONS) as client:
        print("*** Welcome to the Financial Bot. How can I help? ***")
        print("***************************************************")
        while True:
            question = await asyncio.to_thread(input, ">> ")
            print(await inference(client, question))
            print("***************************************************")


if __name__ == "__main__":
    asyncio.run(main())
