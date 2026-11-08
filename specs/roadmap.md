# Roadmap

High-level implementation order. Statuses: `implemented` (baseline, documented from the code), `planned`. Details live in each feature folder.

## Phase 0: Baseline (implemented, now documented)
| Order | Feature | Status |
|---|---|---|
| 1 | [F-005 market data import](features/F-005-market-data-import/) | implemented |
| 2 | [F-001 trade execution](features/F-001-trade-execution/) | implemented |
| 3 | [F-002 market price browsing](features/F-002-market-price-browsing/) | implemented |
| 4 | [F-003 leaderboard](features/F-003-leaderboard/) | implemented |
| 5 | [F-004 multi-target backend](features/F-004-multi-target-backend/) | implemented (AWS, Azure, local, Kubernetes deployed and tested by hand) |
| 6 | [F-006 AI financial assistant](features/F-006-ai-financial-assistant/) | implemented (on the Python backend) |
| 7 | [F-007 evals and observability](features/F-007-evals-observability/) | implemented |
| 8 | [F-010 customer registry](features/F-010-customer-registry/) | implemented (code and automation done; not yet deployed) |
| 9 | [F-011 trade analytics](features/F-011-trade-analytics/) | implemented (local pipeline tested; Databricks upload dry-run only) |
| 10 | [F-012 customer research agent](features/F-012-customer-research-agent/) | implemented (CrewAI; no unit tests yet) |

## Phase 1: Close the baseline gaps (planned)
Small items found while writing the specs; each is a task group in its feature's `plan.md`.
1. Remove the legacy `agent` price mode from stored data handling (F-001).
2. Add a date to `trade_timestamp` so ordering spans days (F-001, F-004).
3. Page the Scan-based list routes (F-004).
4. Unify `trade-ui` and `trade-ui-basic` (F-002, F-003).
5. Reset-the-game admin action from the original spec (F-001).
6. Align the Python backend's trade rules with the TypeScript core, or point the agents at the TypeScript backend (F-006).

## Phase 2: New capabilities (planned)
1. **Voice AI** to interact with the data (new feature, F-008 when started).
2. **Kafka-driven PDF reports** generated with LaTeX (new feature, F-009 when started).

## Rules for evolving
- Every change starts as an edit to a feature's `requirements.md` or a new `F-NNN` folder; IDs are never reused or renumbered.
- A feature is mergeable when its `validation.md` checks pass.
