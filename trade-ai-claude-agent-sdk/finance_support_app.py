"""Research-and-report example on the Claude Agent SDK, using web search.

Unlike ``finance_advisor_app.py`` this agent does not use the stocks MCP server
or the trade backend. It searches the public web, so its numbers are real market
data from the web and are unrelated to the simulator's prices. It runs
``claude-haiku-4-5`` through AWS Bedrock (``CLAUDE_CODE_USE_BEDROCK=1``), needs
AWS credentials, and allows only ``WebSearch`` and ``WebFetch``.

Run it with ``uv run finance_support_app.py``; it prints progress and a report
for the hard-coded ticker AMZN.
"""

import asyncio

from dotenv import load_dotenv

load_dotenv()

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    ResultMessage,
    TextBlock,
)

options = ClaudeAgentOptions(
    model="claude-haiku-4-5-20251001",
    allowed_tools=["WebSearch", "WebFetch"],
    permission_mode="acceptEdits",
    env={"CLAUDE_CODE_USE_BEDROCK": "1"},
)

# permission_mode="bypassPermissions",

RESEARCH_PROMPT = "Research {tickers}. Focus on: {focus}. Use web search."

WRITE_PROMPT = (
    "Now write a concise financial report based on your research above. "
    "Do not ask for approval or confirm the structure first — just write the final report directly. "
    "Output the report as plain text in your response only — do not create or save any files."
)


async def financial_report(tickers: str, focus: str) -> str:
    """Research tickers on the web, then write a plain-text report in a second turn.

    Both turns use one session, so the second turn sees the research. Progress
    lines (the first 200 characters of each text block) are printed as they arrive.
    The prompt tells the model not to write files, but that is only an instruction:
    ``permission_mode="acceptEdits"`` would let it edit files if it chose to.

    Args:
        tickers: Symbols to research, as free text (for example ``"AMZN"``).
        focus: What to concentrate on, as free text.

    Returns:
        The report text. Taken from the final result message when present,
        otherwise the concatenated text blocks of the second turn.

    Raises:
        Exception: SDK or Bedrock errors are not caught.
    """
    report = ""
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

        print("--- Writing report ---")
        await client.query(WRITE_PROMPT)
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
    """Print a report for the hard-coded example: AMZN, financial performance and growth outlook."""
    result = await financial_report("AMZN", "financial performance and growth outlook")
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
