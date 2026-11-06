"""Smoke test of the MCP stocks server with a one-shot LangChain agent.

Asks a single hard-coded question ("list all the stocks which are available for
buying?"), prints the answer and exits. Use it to check that the MCP server and
the AWS Bedrock credentials work; the conversational agents are the numbered
``0N_fin_assistant`` files.

Requires ``stock_mcp_server.py`` running on ``http://127.0.0.1:8001`` and AWS
credentials with access to the Bedrock model.
"""

import asyncio

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain_mcp_adapters.client import MultiServerMCPClient

load_dotenv()

client = MultiServerMCPClient(
    {
        "stocks": {
            "url": "http://127.0.0.1:8001/mcp",
            "transport": "http",
        }
    }
)


async def main():
    """Ask one question through an agent that has the MCP tools and print the reply.

    Raises:
        Exception: Connection errors from the MCP client if the server is not
            running, or Bedrock errors if credentials or model access are missing.
            Nothing is caught.
    """

    llm = init_chat_model(
        "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
        model_provider="bedrock_converse",
        temperature=0.3,
    )

    agent = create_agent(model=llm, tools=await client.get_tools())

    result = await agent.ainvoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "list all the stocks which are available for buying?",
                }
            ]
        }
    )

    print(result["messages"][-1].content)


if __name__ == "__main__":
    print("begining")
    asyncio.run(main())
    print("end")
