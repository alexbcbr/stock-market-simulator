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
    """Answer one question, keeping the conversation per thread.

    Args:
        question: The user's message.
        thread_id: Conversation key. Sessions are created on first use and kept in
            the module-level ``sessions`` dict, so history is shared by every caller
            of this process and lost on exit; there is no eviction.

    Returns:
        The assistant's reply text.

    Raises:
        Exception: Errors from the model client (configuration, auth, throttling)
            are not caught.
    """
    session = sessions.setdefault(thread_id, agent.create_session())
    result = await agent.run(question, session=session)
    return result.text


async def main():
    """Run a console question loop until the process is stopped.

    ``input()`` blocks the event loop while waiting, which is harmless for this
    single-user loop but means nothing else can run in the same loop.
    """
    print("*** Welcome to the Financial Bot. How can I help? ***")
    print("***************************************************")
    thread_id = "cli-session"
    while True:
        question = input(">> ")
        print(await inference(question, thread_id))
        print("***************************************************")


if __name__ == "__main__":
    asyncio.run(main())
