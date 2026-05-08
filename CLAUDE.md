# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A stock market simulation game for education. Players submit trades against real historical market price data loaded into DynamoDB.

## Project Structure

```
trade-backend/   # AWS CDK app (TypeScript) — infrastructure + Lambda handlers
trade-ui/        # Vue 3 + Vite frontend (TypeScript)
yahoo-finance-stocks/  # Python scripts for importing market data into DynamoDB
data/            # Local SQLite DB (legacy/exploratory)
ddl/             # SQL schema definitions (reference)
spec/            # Application spec
```

## Commands

### Backend (CDK + Lambda)
```bash
cd trade-backend
npm install
npm run build        # tsc compile
npm run watch        # tsc watch mode

# Deploy individual stacks
npx cdk deploy TradeDbStack
npx cdk deploy TradeControllerStack
npx cdk deploy TradeUiStack

# Deploy with existing S3 bucket
npx cdk deploy TradeUiStack --context bucketExists=true

# Deploy all
npx cdk deploy
```

### Frontend (Vue 3 + Vite)
```bash
cd trade-ui
npm install
npm run dev          # dev server
npm run build        # type-check + build
npm run lint         # eslint --fix
npm run format       # prettier
```

### Data Import (Python)
```bash
cd yahoo-finance-stocks
pip install -r requirements.txt
python import_to_dynamodb.py <csv-file>              # import market prices
python import_market_symbols_to_dynamodb.py <file>   # import market symbols
```

## Architecture

### AWS Infrastructure (3 CDK Stacks)

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

**TradeUiStack** — S3 + CloudFront for the built Vue app. The built UI assets must be placed in `trade-backend/website/` before deploying this stack.

### Trade Execution Logic (`tradeService.ts`)

Three `price_mode` values affect how `executed_price` and `status_trade` are determined:
- `market` — random between `lowest_price` and 72% of `highest_price`; always succeeds
- `agent` — random between 70–100% of `highest_price`; always succeeds
- `manual` — user provides `bid_price`; succeeds only if bid is ≤ `lowest + 45% × (highest − lowest)`, otherwise the trade is recorded as failed (`status_trade: false`)

### Frontend

Vue 3 SPA using Pinia stores and Vue Router (hash history). The API base URL is configured via `VITE_URL_TRADE_SERVICES` in a `.env` file.

Three routes:
- `/` — TradesView: submit trades + list all trades or by customer name
- `/market-prices` — MarketPricesView: browse available stocks with prices
- `/leaderboard` — LeaderboardView: ranking by player

The UI reads DynamoDB items returned as raw DynamoDB JSON (e.g., `{ S: "AAPL" }`), not plain JSON — parsing happens in the Pinia stores.

### Environment Variables

Frontend `.env` (in `trade-ui/`):
```
VITE_URL_TRADE_SERVICES=https://<api-gateway-url>/prod/
VITE_LAYOUT=<optional>
```
