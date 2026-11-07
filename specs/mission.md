# Mission

## What this is
Stock Market Simulator is an educational, intraday trading game. Players buy and sell stocks against **real historical market price data**; no real money or live market connection is involved.

## Why it exists
It is a teaching tool for Gartner customers: it shows how **AI agents can be implemented in critical workloads**. A trade is a small but realistic critical transaction, with rules (pricing, success or failure, authorization) that must behave the same whether a human or an agent triggers it.

## Who uses it
| Role | Does |
|---|---|
| Player (customer) | Submits buy orders (manual or by strategy), sells, lists their own trades |
| Admin / facilitator | Sees all trades and the leaderboard, loads market data, resets the game |
| AI agent | Acts for a player through a controlled tool interface (check user, list prices, list trades, create trade) |
| Developer / presenter | Runs the same system locally, on Kubernetes, AWS or Azure to show portability |

## Principles
1. **One set of rules.** Trade execution logic lives once (`trade-backend/src/core`), never re-implemented per platform.
2. **One API contract.** Every deployment answers `trade-backend/api-contract/openapi.yaml` with plain JSON, and is verified by `scripts/smoke.sh`.
3. **Agents are first-class but controlled.** Agents go through a narrow tool interface (MCP), and their behavior is measured with evals and traces.
4. **Simple and teachable.** Prefer vanilla, readable choices over clever ones; this is a demo others will read.
5. **Safe by default.** No secrets in the repo (three guardrail layers); source code is scanned for vulnerabilities by SonarQube Cloud (see `tech-stack.md`); deploys are manual and deliberate.

## Non-goals
- Real-time or live market data, real money, or brokerage integration.
- High availability or horizontal scale (the local and Kubernetes targets run a single replica on SQLite).
- Multi-tenant security: player identity is a free-text customer name (the agent path checks a fixed allow-list).

## Success looks like
- A presenter can demonstrate a human trade and an agent trade side by side, on any of the four targets, with identical results.
- A change to a business rule is made once and passes the shared test and smoke suites on every target.
- Agent answers can be evaluated against golden datasets and traced.
