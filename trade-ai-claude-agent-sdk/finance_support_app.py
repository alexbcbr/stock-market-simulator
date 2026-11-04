import asyncio

from dotenv import load_dotenv

load_dotenv()

import instrumentation  # must be imported before claude_agent_sdk below
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, AssistantMessage, TextBlock, ResultMessage

options = ClaudeAgentOptions(
    model="claude-haiku-4-5-20251001",
    allowed_tools=["WebSearch", "WebFetch"],
    permission_mode="acceptEdits",
    env={"CLAUDE_CODE_USE_BEDROCK": "1"},
)

#permission_mode="bypassPermissions",

RESEARCH_PROMPT = "Research {tickers}. Focus on: {focus}. Use web search."

WRITE_PROMPT = (
    "Now write a concise financial report based on your research above. "
    "Do not ask for approval or confirm the structure first — just write the final report directly. "
    "Output the report as plain text in your response only — do not create or save any files."
)

async def financial_report(tickers: str, focus: str) -> str:
    async with ClaudeSDKClient(options=options) as client:
        # Turn 1: Research

        print(f"--- Researching {tickers} ({focus}) ---")
        await client.query(RESEARCH_PROMPT.format(tickers=tickers, focus=focus))
        async for message in client.receive_response():
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        preview = block.text[:200].replace("\n", " ")
                        print(f"  [research] {preview}...")

        # Turn 2: Write report

        print(f"--- Writing report ---")
        await client.query(WRITE_PROMPT)
        report = ""
        async for message in client.receive_response():
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        report += block.text
                        preview = block.text[:200].replace("\n", " ")
                        print(f"  [writing] {preview}...")
            elif isinstance(message, ResultMessage):
                report = message.result or report

        return report


async def main():
    result = await financial_report("AMZN", "financial performance and growth outlook")
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
