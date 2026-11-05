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
