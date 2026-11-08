"""Customer research crew: researcher -> writer -> reviewer, one markdown report per customer.

Reads ``customer_research.csv`` (one customer per line, ``name, email``, no header), searches the public web
for professional and public interests, and writes ``reports/<customer>.md`` with talking points for a first
conversation. Run with ``uv run main.py``.

Needs AWS credentials with Bedrock access. The model can be changed with the ``BEDROCK_MODEL`` env var.
Customer data and reports are personal data: both are git-ignored. CrewAI tracing and telemetry are
disabled so nothing leaves the machine except the Bedrock and search calls.
"""

import csv
import logging
import os
import re
from pathlib import Path

# Keep everything local: no CrewAI tracing upload and no anonymous telemetry. Set before importing crewai.
os.environ["CREWAI_TRACING_ENABLED"] = "false"
os.environ["OTEL_SDK_DISABLED"] = "true"

from crewai import LLM, Agent, Crew, Process, Task
from crewai.tools import tool
from ddgs import DDGS

# Bedrock has no native token counter in CrewAI; the fallback estimate logs a warning on every call.
logging.getLogger("crewai.llms.base_llm").setLevel(logging.ERROR)

HERE = Path(__file__).parent
CSV_FILE = HERE / "customer_research.csv"
REPORTS_DIR = "reports"  # relative on purpose: CrewAI treats output_file as relative to the working directory

llm = LLM(
    model=os.getenv(
        "BEDROCK_MODEL", "bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0"
    ),
    temperature=0.2,
)


@tool("web_search")
def web_search(query: str) -> str:
    """Search the public web and return the top results (title, url, snippet)."""
    results = DDGS().text(query, max_results=6)
    return (
        "\n".join(f"- {r['title']} ({r['href']}): {r['body']}" for r in results)
        or "No results."
    )


researcher = Agent(
    role="Researcher",
    goal="Find public, professional information and interests about {customer}.",
    backstory=(
        "You research a person by name or email using only public web sources. You skip anything private or "
        "sensitive (health, religion, politics, family, finances, address) and you say so when you cannot "
        "tell whether a result is really about this person."
    ),
    tools=[web_search],
    llm=llm,
    max_iter=6,  # caps the search/think loop so one customer cannot run indefinitely
    verbose=True,
)
writer = Agent(
    role="Writer",
    goal="Turn the findings into a short markdown report with talking points for a first conversation.",
    backstory="You write brief, friendly, factual briefs for a customer-facing team. You never invent facts.",
    llm=llm,
)
reviewer = Agent(
    role="Reviewer",
    goal="Make sure the report is appropriate, factual and useful, and return the final version.",
    backstory=(
        "You check that the report only uses public, professional information, contains nothing sensitive or "
        "intrusive, flags uncertain identity matches, and has no unsupported claims. You fix problems by "
        "removing or rewording them."
    ),
    llm=llm,
)


def build_crew(customer: str, output_file: str) -> Crew:
    research = Task(
        description="Research {customer}. Find role, employer, public interests and recent public activity.",
        expected_output="Bullet list of findings, each with its source URL and a confidence note.",
        agent=researcher,
    )
    write = Task(
        description=(
            "Write the report in markdown: a 2-line summary, 'Areas of interest', and 5 'Talking points' "
            "for an initial conversation, each tied to a finding."
        ),
        expected_output="A markdown report of at most 300 words.",
        agent=writer,
        context=[research],
    )
    review = Task(
        description=(
            "Review the report for appropriateness (public and professional information only), accuracy "
            "against the research, and tone. Return the corrected final report, markdown only."
        ),
        expected_output="The final markdown report.",
        agent=reviewer,
        context=[research, write],
        output_file=output_file,
    )
    return Crew(
        agents=[researcher, writer, reviewer],
        tasks=[research, write, review],
        process=Process.sequential,
    )


def read_customers() -> list[tuple[str, str]]:
    with CSV_FILE.open(newline="") as f:
        return [
            (r[0].strip(), r[1].strip() if len(r) > 1 else "")
            for r in csv.reader(f)
            if r and r[0].strip()
        ]


def main() -> None:
    os.chdir(
        HERE
    )  # reports/ always lands inside this folder, wherever the script is started from
    Path(REPORTS_DIR).mkdir(exist_ok=True)
    for name, email in read_customers():
        out = f"{REPORTS_DIR}/{re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')}.md"
        print(f"Researching {name}...")
        build_crew(name, out).kickoff(
            inputs={"customer": f"{name} ({email})" if email else name}
        )
        print(f"  -> {out}")


if __name__ == "__main__":
    main()
