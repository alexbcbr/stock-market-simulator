"""Slack bot that answers messages with an OpenAI Agents SDK agent on an Azure OpenAI deployment.

It answers direct messages (``message.im``) and mentions in channels (``app_mention``). In a
channel the bot's own ``@mention`` is removed before the text goes to the model, and the reply
stays in the thread the message came from. Each message is answered on its own: the agent does
not see earlier messages of the conversation.

Reads from the environment (or ``.env``, which never overrides variables already set):

- ``SLACK_BOT_TOKEN`` and ``SLACK_APP_TOKEN`` for Socket Mode (``slack run`` also provides them).
- ``AZURE_OPENAI_BASE_URL`` (ending in ``/openai/v1/``), ``AZURE_OPENAI_API_KEY`` and
  ``AZURE_OPENAI_DEPLOYMENT`` for the model.

The app is async (``AsyncApp``) so every agent run shares one event loop with the
``AsyncOpenAI`` client. Tracing is disabled because the SDK exports traces to OpenAI by default,
which needs an ``OPENAI_API_KEY`` this project does not have.
"""

import asyncio
import logging
import os
import re

from agents import Agent, OpenAIChatCompletionsModel, Runner, set_tracing_disabled
from dotenv import load_dotenv
from openai import AsyncOpenAI
from slack_bolt.adapter.socket_mode.async_handler import AsyncSocketModeHandler
from slack_bolt.async_app import AsyncApp, AsyncSay

load_dotenv()
set_tracing_disabled(True)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MENTION = re.compile(r"<@[A-Z0-9]+>")
FALLBACK_REPLY = "Sorry, I couldn't answer that right now. Please try again."

client = AsyncOpenAI(
    base_url=os.environ["AZURE_OPENAI_BASE_URL"],
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
)

agent = Agent(
    name="Slack Assistant",
    instructions=(
        "You are a helpful assistant answering messages in Slack. Answer briefly. "
        "Format with Slack mrkdwn (*bold*, _italic_, `code`, bullet lists); do not use Markdown headings or tables."
    ),
    model=OpenAIChatCompletionsModel(
        model=os.environ["AZURE_OPENAI_DEPLOYMENT"],
        openai_client=client,
    ),
)

app = AsyncApp(token=os.environ.get("SLACK_BOT_TOKEN"))


def strip_mentions(text: str) -> str:
    """Remove ``<@USERID>`` mentions and surrounding whitespace from a Slack message."""
    return MENTION.sub("", text or "").strip()


async def answer(text: str) -> str:
    """Ask the agent about a user's message.

    Args:
        text: The message as typed by the user, possibly containing mentions.

    Returns:
        The agent's reply. If the model call fails, the error is logged and
        a short apology is returned instead, so the user always gets a reply.
    """
    question = strip_mentions(text)
    if not question:
        return "Hi! Ask me anything."
    try:
        result = await Runner.run(agent, question)
    except Exception:
        logger.exception("Agent run failed")
        return FALLBACK_REPLY
    return str(result.final_output)


@app.event("app_mention")
async def handle_mention(event: dict, say: AsyncSay) -> None:
    """Answer a channel mention in a thread under it (or in its existing thread)."""
    thread_ts = event.get("thread_ts") or event.get("ts")
    await say(text=await answer(event.get("text", "")), thread_ts=thread_ts)


@app.event("message")
async def handle_direct_message(event: dict, say: AsyncSay) -> None:
    """Answer a direct message. Edits, deletions and other message subtypes are ignored."""
    if event.get("channel_type") != "im" or event.get("subtype"):
        return
    await say(text=await answer(event.get("text", "")), thread_ts=event.get("thread_ts"))


async def main() -> None:
    await AsyncSocketModeHandler(app, os.environ.get("SLACK_APP_TOKEN")).start_async()


if __name__ == "__main__":
    asyncio.run(main())
