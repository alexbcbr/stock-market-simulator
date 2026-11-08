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

Tracing: this module imports instrumentation.py, which sends turn-level spans to
Arize AX through openinference-instrumentation-claude-agent-sdk. It therefore
needs ARIZE_SPACE_ID, ARIZE_API_KEY and ARIZE_OTLP_ENDPOINT (a missing one
raises KeyError at import). The spans cover only the SDK's own calls
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

# Must come after load_dotenv() (it reads the Arize keys at import) and before
# any claude_agent_sdk import (the instrumentor patches that library).
import instrumentation  # noqa: F401  isort: skip
from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    TextBlock,
    ToolResultBlock,
    UserMessage,
)
from opentelemetry import trace

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


MAX_TOOL_RESULT_CHARS = 5000


def _tool_result_text(block: ToolResultBlock) -> str:
    """Return the text of a tool result, or an empty string if it has none."""
    content = block.content
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(
            part["text"]
            for part in content
            if isinstance(part, dict) and part.get("text")
        )
    return ""


async def inference(client: ClaudeSDKClient, question: str) -> str:
    """Send one question in the open session and collect the text of the reply.

    The successful tool results of the turn are also recorded on the turn's root
    span as ``retrieval.documents.N.document.content`` (OpenInference
    convention), so an Arize evaluator can use them as ``context`` (for example
    faithfulness). Each result is cut at ``MAX_TOOL_RESULT_CHARS`` characters.
    Errored tool calls are left out, and a turn with no tool result gets no such
    attributes.

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
    tool_results = []
    async for message in client.receive_response():
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    reply_parts.append(block.text)
        elif isinstance(message, UserMessage) and isinstance(message.content, list):
            for block in message.content:
                if isinstance(block, ToolResultBlock) and not block.is_error:
                    text = _tool_result_text(block)
                    if text:
                        tool_results.append(text[:MAX_TOOL_RESULT_CHARS])
            # The root span stays current (and open) while this loop runs, so
            # this is a no-op when tracing is off.
            span = trace.get_current_span()
            for i, text in enumerate(tool_results):
                span.set_attribute(f"retrieval.documents.{i}.document.content", text)
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
