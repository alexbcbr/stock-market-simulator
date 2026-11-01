"""Baseline financial assistant: no tools, Microsoft Agent Framework.

Plain chat agent with a system prompt and conversation memory (per-thread
session), but no tools - it only answers from the model's own knowledge.
Uses Azure AI Foundry's gpt-4.1-mini deployment via the Azure OpenAI chat
client.
"""

import asyncio

from agent_framework import Agent
from agent_framework.openai import OpenAIChatCompletionClient
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = "You're a financial assistant. Don't answer question outside of the context of financial market."

agent = Agent(
    client=OpenAIChatCompletionClient(),
    instructions=SYSTEM_PROMPT,
)

sessions = {}


async def inference(question: str, thread_id: str) -> str:
    session = sessions.setdefault(thread_id, agent.create_session())
    result = await agent.run(question, session=session)
    return result.text


async def main():
    print("*** Welcome to the Financial Bot. How can I help? ***")
    print("***************************************************")
    thread_id = "cli-session"
    while True:
        question = input(">> ")
        print(await inference(question, thread_id))
        print("***************************************************")


if __name__ == "__main__":
    asyncio.run(main())
