# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A stock market simulation game for education. Players submit trades against real historical market price data. The repo is a monorepo containing several interchangeable backends (AWS serverless or FastAPI/Kubernetes), two Vue frontends, a console client, and AI financial-assistant agents with evals.

## Project Structure

```
trade-backend-aws/    # AWS CDK app (TypeScript) — DynamoDB, API Gateway, Lambda, S3/CloudFront
trade-backend-k8s/    # FastAPI backend (Python, uv) + SQLite, Dockerfile, k8s manifest
trade-ui/             # Vue 3 + Vite frontend (TypeScript) — graphs, mobile-friendly layout
trade-ui-basic/       # Simpler variant of trade-ui (adds Toast + notifications store)
trade-console/        # Python terminal client for the FastAPI backend
trade-ai/             # Financial assistant agents (LangChain/LangGraph + Bedrock) + MCP server/client
trade-ai-claude-agent-sdk/          # Same assistant ported to the Claude Agent SDK
trade-ai-microsoft-agent-framework/ # Same assistant hosted with Microsoft Agent Framework (Dockerfile)
evals/                # Arize datasets, inference + LLM-as-judge pipeline for the assistant
yahoo-finance-stocks/ # Python scripts for importing market data into DynamoDB
data/                 # Local SQLite DB (market_stock.db) used by trade-backend-k8s
ddl/                  # SQL schemas + seed (market_price.sql, trade.sql, seed.sql)
spec/                 # Application spec (spec.md)
design/               # Architecture diagrams (design/architecture.md — Mermaid)
docs/                 # Development notes (docs/development.md — k8s/docker/git cheatsheet)
.claude/, .agents/    # Claude Code settings, hooks, and installed skills (Arize, frontend-design)
_PENDING.md           # Personal TODO list for the repo
Makefile              # Root-level CDK deploy shortcuts
```

> `docs/development.md` still references the old names `trade-backend/` (now `trade-backend-aws/` or `trade-backend-k8s/`) and `trade-backend-py`. Prefer the paths above.

## Tooling

Use **bun** for JS/TS (instead of npm/npx) and **uv** for Python (instead of pip/python). Most Python projects are `uv`-managed (`pyproject.toml` + `uv.lock`): use `uv sync` / `uv run`. JS projects still contain a legacy `package-lock.json` (no `bun.lock` yet); `bun install` will generate one.

## Commands

### AWS backend (CDK + Lambda) — `trade-backend-aws/`
```bash
cd trade-backend-aws
bun install
bun run build        # tsc compile
bun run watch        # tsc watch mode

bunx cdk deploy TradeDbStack
bunx cdk deploy TradeControllerStack
bunx cdk deploy TradeUiStack
bunx cdk deploy TradeUiStack --context bucketExists=true   # existing S3 bucket
bunx cdk deploy                                            # all stacks
bunx cdk diff TradeControllerStack
```
The root `Makefile` has similar targets (`deploy-db`, `deploy-controller`, `deploy-ui`, `deploy-all`, `diff-controller`) and now use `trade-backend-aws` with bun/bunx. (`deploy-ui` is defined twice — the later CDK one wins; the first one only syncs `trade-ui/dist` to S3.)

### FastAPI backend — `trade-backend-k8s/`
```bash
cd trade-backend-k8s
uv sync
make run-local       # uv run uvicorn app.main:app --reload  (http://127.0.0.1:8000)
make test            # uv run pytest
make create-db       # recreate ../data/market_stock.db from ../ddl/*.sql
make seed            # load ../ddl/seed.sql
uv run pytest tests/test_trade_repository.py -s --log-cli-level=INFO -q   # single test file

# Container / Kubernetes (see docs/development.md)
docker build -t trade-backend:latest .
kubectl apply -f k8s/deployment.yaml
kubectl port-forward svc/trade-backend 8000:8000
```
Layout: `app/main.py` (FastAPI app + routers), `app/routers/`, `app/services/`, `app/repositories/`, `app/schemas/`, `app/db.py`, `app/utils/`.
Routes: `GET /`, `GET /revenue`, `/market-price` (POST, GET, DELETE `/{symbol}`), `/trade` (POST, GET).

### Frontends — `trade-ui/` and `trade-ui-basic/`
```bash
cd trade-ui          # or trade-ui-basic
bun install
bun run dev          # dev server
bun run build        # type-check + build
bun run lint         # eslint --fix
bun run format       # prettier
```

### Console client — `trade-console/`
```bash
cd trade-console
uv run main.py       # talks to the FastAPI backend via api_client.py (BASE_URL http://127.0.0.1:8000)
```

### AI assistants — `trade-ai*/`
The agents call tools through an MCP server, which in turn calls the FastAPI backend, so start things in this order:
```bash
# 1. FastAPI backend on :8000 (trade-backend-k8s, make run-local)
# 2. MCP stocks server on :8001
cd trade-ai && uv sync && uv run stock_mcp_server.py
# 3. An agent
uv run 04fin_assistant_bp.py                       # trade-ai (LangChain/LangGraph; 01..04 are progressive versions)
cd ../trade-ai-claude-agent-sdk && uv sync && uv run main.py   # Claude Agent SDK (see its README; entry point files are finance_*.py)
cd ../trade-ai-microsoft-agent-framework && uv run python server.py   # also has a Dockerfile
```
MCP tools: `check_user`, `buy_stock`, `list_market_prices`, `list_trades`, `create_trade`. Models are served via AWS Bedrock (needs AWS credentials). Tracing goes to Arize and needs `ARIZE_SPACE_ID`, `ARIZE_API_KEY`, `ARIZE_OTLP_ENDPOINT` in `.env` (never commit `.env`).

### Evals — `evals/`
Arize-based. `evals/llm-as-judge-pipeline-automation.sh` runs the full loop: export dataset (`ax datasets export`) → `infer.py` → create experiment → `judge.py` → annotate runs. Run it from `trade-ai/` (it uses `uv run` and `../evals/` paths). Datasets: `financial_expected_behaviour_dataset.csv`, `financial_golden_answer_dataset.csv`. See `evals/ARIZE.README` and `evals/prompt-experimentation.md`.

### Data import (Python) — `yahoo-finance-stocks/`
```bash
cd yahoo-finance-stocks
uv venv && uv pip install -r requirements.txt        # no pyproject.toml here, only requirements.txt
uv run python import_to_dynamodb.py <csv-file>              # import market prices
uv run python import_market_symbols_to_dynamodb.py <file>   # import market symbols
```
Data lives in `prod-data/`, `test-data/`, `exploratory-data/`; see `README_IMPORTER.md` and `README_datasource.md`.

## Architecture

### AWS Infrastructure (`trade-backend-aws`, 3 CDK Stacks)

**TradeDbStack** — creates DynamoDB tables:
- `market_price` (PK: `symbol`) — daily OHLCV data per ticker
- `market_symbol` (PK: `symbol`) — ticker metadata (name, sector, industry)
- `trade` (PK: `trade_id`, SK: `trade_timestamp`) — executed trades, with GSI `idx_trade_customer_name` (PK: `customer_name`, SK: `trade_timestamp`)

**TradeControllerStack** — API Gateway REST API at `/prod`:
- `GET /listAllTrades` — DynamoDB Scan integration (no Lambda)
- `POST /listTradesByCustomerName` — DynamoDB Query via GSI (no Lambda)
- `GET /listMarketPrices` — DynamoDB Scan integration (no Lambda)
- `GET /getMarketPrice?symbol=X` — Lambda (`src/handlers/getMarketPrice.ts`)
- `GET /getMarketSymbol?symbol=X` — Lambda (`src/handlers/getMarketSymbol.ts`)
- `POST /buyStock` — Lambda (`src/handlers/buyStock.ts`)

Handlers also exist for `listMarketPrices.ts` and `sellStock.ts`; models in `src/models/`, logic in `src/services/`.

**TradeUiStack** — S3 + CloudFront for the built Vue app. The built UI assets must be placed in `trade-backend-aws/website/` before deploying this stack.

### Trade Execution Logic (`trade-backend-aws/src/services/tradeService.ts`)

Three `price_mode` values affect how `executed_price` and `status_trade` are determined:
- `market` — random between `lowest_price` and 72% of `highest_price`; always succeeds
- `agent` — random between 70–100% of `highest_price`; always succeeds
- `manual` — user provides `bid_price`; succeeds only if bid is ≤ `lowest + 45% × (highest − lowest)`, otherwise the trade is recorded as failed (`status_trade: false`)

The FastAPI backend (`trade-backend-k8s`) is a separate, SQLite-backed implementation of the same domain (see `ddl/` for its schema); verify its logic in `app/services/` rather than assuming it matches the above.

### Frontend (`trade-ui`, `trade-ui-basic`)

Vue 3 SPA using Pinia stores and Vue Router (hash history). Three routes:
- `/` — TradesView: submit trades + list all trades or by customer name
- `/market-prices` — MarketPricesView: browse available stocks with prices
- `/leaderboard` — LeaderboardView: ranking by player

When targeting the AWS backend, the UI reads DynamoDB items returned as raw DynamoDB JSON (e.g., `{ S: "AAPL" }`), not plain JSON — parsing happens in the Pinia stores.

The two UIs are near-copies; `trade-ui-basic` adds `components/Toast.vue` and `stores/notifications.ts`, and they differ in `App.vue`, `TradeList.vue`, `TradeLeaderboard.vue`, `services/api.ts`, and the `marketPrices`/`trades` stores. Unifying them is an open TODO in `_PENDING.md` — check whether a change needs to be applied to both.

### Environment Variables

Frontend `.env` (in `trade-ui/` / `trade-ui-basic/`; gitignored):
```
VITE_URL_TRADE_SERVICES=https://<api-gateway-url>/prod/
VITE_LAYOUT=<optional>
```
Note: `src/config/index.ts` reads `VITE_URL_SERVICES` while `src/services/api.ts` reads `VITE_URL_TRADE_SERVICES` — confirm which is in use before changing either.

AI projects: `.env` files with Arize keys (see above).

## Claude Code setup in this repo

- `.claude/settings.json` registers a `PreToolUse` hook (`.claude/hooks/check-secrets-before-git.sh`) that blocks `git commit` / `git push` run by Claude when staged or unpushed changes look like they contain secrets or env files. Don't bypass it.
- `.githooks/pre-commit` (tracked) blocks commits that stage env files or secret patterns, for commits made by anyone, not just Claude. `core.hooksPath` is per-clone, so run `make setup-hooks` once after cloning. `.github/workflows/secret-scan.yml` re-checks on GitHub after push.
- `.claude/skills/` and `.agents/skills/` hold Arize skills (tracing, datasets, evaluators, experiments, prompts) and `frontend-design`; `skills-lock.json` pins them.
