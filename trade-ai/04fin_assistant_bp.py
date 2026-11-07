"""Production-style financial assistant: async, traced, with prompt caching.

Same agent and MCP tools as 03fin_assistant_async.py, plus:

- Arize tracing: ``instrumentation`` is imported before LangChain and MCP so
  their calls are patched. It needs ``ARIZE_SPACE_ID``, ``ARIZE_API_KEY`` and
  ``ARIZE_OTLP_ENDPOINT``; without them the import fails with ``KeyError`` and
  the program does not start.
- Bedrock prompt caching with a 5 minute TTL, and ``reasoning_effort="medium"``.
- On exit the tracer is flushed and shut down, so the last spans are not lost.

This is the version the evals in ``evals/`` run against.

Requires stock_mcp_server.py running on http://127.0.0.1:8001, the Python
backend (trade-backend-python) on http://127.0.0.1:8000, and AWS credentials
with Bedrock access.
"""

import asyncio

from dotenv import load_dotenv

load_dotenv()

import instrumentation  # must be imported before langchain/mcp below
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain_aws.middleware.prompt_caching import BedrockPromptCachingMiddleware
from langchain_core.messages import HumanMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.checkpoint.memory import InMemorySaver

SYSTEM_PROMPT = "You're a financial assistant. Don't answer question outside of the context of financial market."

mcp_client = MultiServerMCPClient(
    {
        "stocks": {
            "url": "http://127.0.0.1:8001/mcp",
            "transport": "streamable_http",
        }
    }
)

checkpointer = InMemorySaver()


def build_agent(tools):
    """Create the traced agent with the given tools.

    Args:
        tools: LangChain tools loaded from the MCP server.

    Returns:
        The compiled agent with in-memory conversation history, prompt caching and
        medium reasoning effort.
    """
    return create_agent(
        model=init_chat_model(
            model="us.anthropic.claude-sonnet-4-5-20250929-v1:0",
            model_provider="bedrock_converse",
            temperature=0.1,
            reasoning_effort="medium",
        ),
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
        checkpointer=checkpointer,
        middleware=[
            BedrockPromptCachingMiddleware(ttl="5m")
        ],  # 5m default other option 1h
    )


async def inference(agent, question: str, thread_id: str):
    """Answer one question.

    Args:
        agent: Agent from ``build_agent``.
        question: The user's message.
        thread_id: Conversation key; calls with the same id share history, which is
            kept in memory only.

    Returns:
        The assistant's reply text.
    """
    config = {"configurable": {"thread_id": thread_id}}
    result = await agent.ainvoke(
        {"messages": [HumanMessage(content=question)]},
        config=config,
    )
    return result["messages"][-1].content


async def main():
    """Load the MCP tools and run the question loop.

    The tracer is always flushed and shut down in a ``finally`` block, including
    after Ctrl+C or end of input, so exit does not drop pending spans.

    Raises:
        Exception: Connection errors if the MCP server is not running.
    """
    tools = await mcp_client.get_tools()
    agent = build_agent(tools)

    print("*** Welcome to the Financial Bot. How can I help? ***")
    print("***************************************************")
    thread_id = "cli-session"
    try:
        while True:
            question = await asyncio.to_thread(input, ">> ")
            print(await inference(agent, question, thread_id))
            print("***************************************************")
    finally:
        instrumentation.tracer_provider.force_flush()
        instrumentation.tracer_provider.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
