"""Minimal OpenAI Agents SDK agent running on an Azure OpenAI deployment.

Sends one prompt to the agent and prints the reply. Reads
AZURE_OPENAI_BASE_URL (ending in /openai/v1/), AZURE_OPENAI_API_KEY and
AZURE_OPENAI_DEPLOYMENT from .env.

Tracing is disabled because the SDK exports traces to OpenAI by default,
which needs an OPENAI_API_KEY this project does not have.
"""

import os

from agents import Agent, OpenAIChatCompletionsModel, Runner, set_tracing_disabled
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()
set_tracing_disabled(True)

client = AsyncOpenAI(
    base_url=os.environ["AZURE_OPENAI_BASE_URL"],
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
)

agent = Agent(
    name="Assistant",
    instructions="You are a helpful assistant. Answer briefly.",
    model=OpenAIChatCompletionsModel(
        model=os.environ["AZURE_OPENAI_DEPLOYMENT"],
        openai_client=client,
    ),
)


def main():
    result = Runner.run_sync(agent, "In one sentence, what is a stock market?")
    print(result.final_output)


if __name__ == "__main__":
    main()
