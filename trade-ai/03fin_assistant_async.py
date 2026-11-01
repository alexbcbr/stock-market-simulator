"""Financial assistant with MCP stock tools, fully async.

Same MCP tools and agent as 02fin_assistant_with_tools.py (list_market_prices,
list_trades, create_trade, etc. via MultiServerMCPClient over HTTP), but the
whole program runs inside a single event loop instead of spinning one up per
REPL turn:

- main() is async and owns tool loading, agent setup, and the input loop.
- input() is called via asyncio.to_thread() so the blocking read doesn't
  stall the event loop.
- inference() directly awaits agent.ainvoke() - no asyncio.run() per call.

Behaviorally identical to 02fin_assistant_with_tools.py; this version just
avoids repeatedly creating/destroying an event loop on every question.

Requires stock_mcp_server.py running on http://127.0.0.1:8001 and the
trade-backend API running on http://127.0.0.1:8000.
"""

import asyncio

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()

SYSTEM_PROMPT = "You're a financial assistant. Don't answer question outside of the context of financial market."

mcp_client = MultiServerMCPClient({
    "stocks": {
        "url": "http://127.0.0.1:8001/mcp",
        "transport": "http",
    }
})

checkpointer = InMemorySaver()

def build_agent(tools):
    return create_agent(
        model=init_chat_model(
            model='us.anthropic.claude-sonnet-4-5-20250929-v1:0',
            model_provider='bedrock_converse',
            temperature=0.1,
        ),
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
        checkpointer=checkpointer,
    )

async def inference(agent, question: str, thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    result = await agent.ainvoke(
        {"messages": [HumanMessage(content=question)]},
        config=config,
    )
    return result["messages"][-1].content

async def main():
    tools = await mcp_client.get_tools()
    agent = build_agent(tools)

    print("*** Welcome to the Financial Bot. How can I help? ***")
    print("***************************************************")
    thread_id = "cli-session"
    while(True):
        question = await asyncio.to_thread(input, ">> ")
        print(await inference(agent, question, thread_id))
        print("***************************************************")

if __name__ == "__main__":
    asyncio.run(main())
