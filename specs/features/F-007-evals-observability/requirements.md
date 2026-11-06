---
id: F-007
title: Evals and observability
status: implemented
---
# F-007 Evals and observability

## Context
Agents in critical workloads must be measurable. Agent runs are traced to Arize and scored by an LLM-as-judge pipeline against datasets. Files: `evals/` (datasets, `infer.py`, `judge.py`, `llm-as-judge-pipeline-automation.sh`, `prompt-experimentation.md`, `ARIZE.README`) and each agent's `instrumentation.py`. The evaluated agent is F-006.

## User stories
| ID | Priority | Story | Requirements |
|---|---|---|---|
| F-007-S1 | P1 | As a **developer**, I want every agent run traced, so I can see which tools it called and why. | R1 |
| F-007-S2 | P1 | As a **developer**, I want to score the agent against known questions, so I notice when a change makes it worse. | R2, R3, R4 |
| F-007-S3 | P2 | As a **presenter**, I want to show a traced agent run next to its scores, so the audience sees agents are measurable. | R1, R5 |
| F-007-S4 | P2 | As a **developer**, I want to test prompt changes against the same dataset, so I can compare versions. | R6 |

## Requirements
- **R1** WHEN an agent runs with `ARIZE_SPACE_ID`, `ARIZE_API_KEY` and `ARIZE_OTLP_ENDPOINT` set, the system SHALL send its traces to Arize through OTLP.
- **R2** The datasets `financial_expected_behaviour_dataset.csv` and `financial_golden_answer_dataset.csv` SHALL hold questions with an expected behavior or a golden answer, grouped by category (investing advice, market price lookup, trade history, place trade, user authorization, off-topic refusal).
- **R3** WHEN `llm-as-judge-pipeline-automation.sh` runs from `trade-ai/`, the system SHALL export the dataset, run `infer.py` on each question, create an Arize experiment, run `judge.py` and annotate the experiment runs with the scores.
- **R4** WHEN the expected behavior is a tool call, the inferred answer SHALL name the tool and its arguments rather than invent data; WHEN it is a refusal, the answer SHALL decline politely (per `evals/prompt-experimentation.md`).
- **R5** Keys SHALL be read from `.env` and SHALL NOT be committed.
- **R6** `evals/prompt-experimentation.md` SHALL document how to run the same dataset against a changed prompt.

## Out of scope
Production monitoring and alerts, cost tracking, evaluating the TypeScript backend (covered by `bun test`).

## Decisions
- D1: Arize hosts traces, datasets and experiments.
- D2: A judge model scores each answer against a golden answer or an expected behavior.
- D3: Evals run on demand; they are not part of CI because they cost tokens.

## Known gaps
- **G1** The pipeline script has hard-coded names (experiment `golden-answer-sonnet-4-5-v2`, dataset, space), so each run needs an edit.
- **G2** No regression gate: nothing fails when scores drop.
- **G3** The datasets are small and miss cases such as failed manual bids and unauthorized trade attempts.
- **G4** No evals for the Claude Agent SDK and Microsoft agents beyond `trade-ai-claude-agent-sdk/finance_evals_pipeline.py` (checked separately).
