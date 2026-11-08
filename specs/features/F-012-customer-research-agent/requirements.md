---
id: F-012
title: Customer research agent (CrewAI)
status: implemented
---
# F-012 Customer research agent (CrewAI)

## Context
Before a first conversation with a customer, the team wants a short brief with the customer's public interests and talking points. This feature adds `trade-ai-crewai/`, a CrewAI crew of three agents (researcher, writer, reviewer) that writes one markdown report per customer. It reads `customer_research.csv` (a local file, git-ignored) and does not call the trade backends or the customers table. Code: `trade-ai-crewai/main.py`. The ID is F-012 because F-008 and F-009 are reserved in the roadmap.

## User stories
| ID | Priority | Story | Requirements |
|---|---|---|---|
| F-012-S1 | P1 | As a **relationship manager**, I want a brief per customer with their areas of interest, so I can prepare a first conversation. | R1, R2, R3 |
| F-012-S2 | P1 | As a **relationship manager**, I want the brief reviewed before I read it, so it contains nothing intrusive or invented. | R4, R5 |
| F-012-S3 | P1 | As an **owner of customer data**, I want the customer list, the reports and the traces to stay on my machine. | R6, R7 |

## Data
| Item | Location | Content |
|---|---|---|
| Input | `trade-ai-crewai/customer_research.csv` | One customer per line, `name, email`, no header. Git-ignored |
| Output | `trade-ai-crewai/reports/<customer>.md` | One report per customer; the file name is the lowercase name with non-alphanumerics turned into `-`. Git-ignored |

## Requirements
- **R1** WHEN `main.py` runs, the system SHALL read every non-empty line of `customer_research.csv` and produce exactly one report per line, in `reports/<customer>.md`, wherever the command is started from. Running again SHALL overwrite that customer's report.
- **R2** The researcher SHALL search the public web (DuckDuckGo, no API key) using the name and email, and list findings with a source URL and a confidence note. Its search loop SHALL be capped (`max_iter=6`).
- **R3** The writer SHALL produce a markdown report of at most 300 words: a short summary, areas of interest, and 5 talking points, each tied to a finding.
- **R4** The reviewer SHALL check that the report uses only public and professional information, is supported by the research, and flags uncertain identity matches. It SHALL remove or reword anything else and save the corrected final report.
- **R5** The agents SHALL NOT use private or sensitive topics: health, religion, politics, family, finances or address.
- **R6** CrewAI tracing and telemetry SHALL be disabled (`CREWAI_TRACING_ENABLED=false`, `OTEL_SDK_DISABLED=true`). Only Bedrock model calls and web searches leave the machine.
- **R7** `customer_research.csv` and `reports/` SHALL be listed in `.gitignore`.
- **R8** The model SHALL be Claude Haiku on AWS Bedrock by default and SHALL be changeable with `BEDROCK_MODEL`.

## Out of scope
Unit tests (planned later), connecting to the customers table or the `allowed_contact` flag, sending the reports anywhere, tracing in Arize or another tool, and checking that the search results are about the right person beyond the reviewer's flag.

## Decisions
- D1: Three sequential agents, no manager agent, to keep the crew small.
- D2: DuckDuckGo through the `ddgs` package so no search API key is needed.
- D3: The output path is relative and `main()` changes to the project folder, because CrewAI treats `output_file` as relative to the working directory and strips a leading `/`.
- D4: The reviewer is the only guard on content. Web research on named people can match the wrong person, so the output is a draft for a human to read.
