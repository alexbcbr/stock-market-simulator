# Tech Stack

What the code uses today (baseline). Change this file in the same PR as the change.

## Backend: `trade-backend/` (TypeScript, bun)
| Concern | Choice |
|---|---|
| Language / runtime | TypeScript, bun (tests with `bun test`) |
| Architecture | Ports and adapters: `src/core` (pure rules, `TradeService`, validation, repository ports) + storage adapters + thin entrypoints |
| API contract | `api-contract/openapi.yaml`, plain JSON on every target; validated by a test; imported by Azure API Management |
| Local / Kubernetes | Hono on Bun, Drizzle + SQLite (`data/trade.db`, a PVC on Kubernetes) |
| AWS | API Gateway + Lambda + DynamoDB, CDK (3 stacks); three list routes use DynamoDB VTL mapping templates (no Lambda) |
| Azure | API Management (Consumption) + Functions (Flex Consumption, Hono adapter) + Cosmos DB serverless, Terraform; managed identity, Entra-ID only |
| Local Kubernetes | Docker Desktop cluster, plain `kubectl` driven by a Makefile, single replica |
| Verification | Unit, repository-contract, API and VTL tests; `scripts/smoke.sh <base-url>`; `make validate-*` |

## Python backend: `trade-backend-python/`
FastAPI + SQLite (`data/market_stock.db`, schemas in `ddl/`), `uv`, Dockerfile and Kubernetes manifest. A separate implementation of the same domain; the AI agents and the console client use it. Its rules may differ from the TypeScript core.

## Frontends: `trade-ui/`, `trade-ui-basic/`
Vue 3 + Vite + Pinia + Vue Router (hash history), TypeScript; talk to the TypeScript backend in plain JSON. Near-copies (`-basic` adds Toast and notifications).

## Console client: `trade-console/`
Python terminal client for the FastAPI backend.

## AI: `trade-ai*/`
- MCP stocks server (`trade-ai/stock_mcp_server.py`, :8001) wrapping the FastAPI backend (:8000).
- Agents: LangChain / LangGraph (`trade-ai`), Claude Agent SDK, Microsoft Agent Framework (has a Dockerfile). Models via AWS Bedrock.
- Python via `uv`.

## Evals and observability: `evals/`
Arize (tracing via OTLP, datasets, experiments), LLM-as-judge pipeline (`infer.py`, `judge.py`, `llm-as-judge-pipeline-automation.sh`).

## Data
`yahoo-finance-stocks/` Python importers and CSVs (`prod-data/`), loaded into DynamoDB, SQLite (`scripts/seed.ts`) and Cosmos (`scripts/seed-cosmos.ts`).

## Code documentation
| | Python | TypeScript |
|---|---|---|
| Projects | `trade-backend-python`, `trade-ai`, `trade-ai-claude-agent-sdk`, `trade-ai-microsoft-agent-framework` | `trade-backend/src` |
| Comment style | **Google-style docstrings** (`Args:`, `Returns:`, `Raises:`, `Attributes:`) | **TSDoc** (`@param name - description`, `@returns`, `@throws`, `@remarks`, `@packageDocumentation`) |
| Generator | **pydoc** (`make pydoc`) | **TypeDoc** (`make typedoc`) |
| Output | `docs/trade-backend-python/`, `docs/trade-ai/`, `docs/trade-ai-claude-agent-sdk/` | `docs/trade-backend/` |

Rules:
- Comments explain behavior, constraints, exceptions and usage. They do not repeat what the code shows, such as parameter types.
- Both styles were chosen as the conventional, tool-supported option for each language: pydoc is in the standard library and reads Google-style text as plain text; TSDoc is the Microsoft specification that TypeDoc understands, and TypeScript itself already reads `/** */` comments for editor hints (the older JSDoc tool is not used because it handles TypeScript poorly).
- The pydoc step **imports** each module, so modules that run work on import are excluded. TypeDoc only reads the source and runs nothing.
- The docstring of an MCP tool is sent to the model as its description. It is part of the agent's behavior and is changed only with an eval run (F-006, F-007).
- Output goes to `docs/<project>/`, one folder per project, so same-named modules from different projects (for example `01fin_assistant`, `instrumentation`) never overwrite each other. Regenerating deletes only a project's own HTML files.

Not covered yet: `trade-console`, `yahoo-finance-stocks`, the UIs, the tests and the `deploy/` scripts. There is no lint rule that fails on a missing or malformed docstring.

## Engineering practices
- JS/TS: **bun**, not npm; Python: **uv**, not pip. One lockfile per project.
- CI: GitHub Actions (ruff lint and format, secret scan with gitleaks); optional Claude review on label. Deploys are manual. Branches: `dev` into `main` via PR.
- Secrets: PreToolUse hook, tracked pre-commit hook, GitHub secret scan.
- Code documentation: Google-style docstrings with pydoc (Python) and TSDoc with TypeDoc (TypeScript); see the section above.
