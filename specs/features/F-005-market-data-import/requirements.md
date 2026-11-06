---
id: F-005
title: Market data import
status: implemented
---
# F-005 Market data import

## Context
The game plays against real historical prices, loaded before play. Original spec feature 3 ("Import market data"). Sources are Yahoo Finance CSVs and a NASDAQ symbol list in `yahoo-finance-stocks/prod-data/` (`2026-01-13.csv`, `2026-01-21.csv`, `nasdaq.csv`). The CSV has columns `Close,High,Low,Open,Volume,Ticker`.

## User stories
| ID | Priority | Story | Requirements |
|---|---|---|---|
| F-005-S1 | P1 | As a **facilitator**, I want market prices loaded before the game, so players can trade. | R1, R2, R3 |
| F-005-S2 | P1 | As a **developer**, I want a fresh local database with data in one command, so I can test quickly. | R2 |
| F-005-S3 | P1 | As a **presenter**, I want the same data in every target, so results compare. | R4 |
| F-005-S4 | P2 | As a **facilitator**, I want to load another day's CSV, so the game can use a different day. | R5 |
| F-005-S5 | P2 | As a **facilitator**, I want to be told when the data is bad, so I do not play on a broken day. | R6 |

## Requirements
- **R1** WHEN `import_to_dynamodb.py <csv>` runs, the system SHALL write each row to the DynamoDB `market_price` table with `Ticker` as `symbol` and `Open`, `Close`, `High`, `Low`, `Volume` as `open_price`, `close_price`, `highest_price`, `lowest_price`, `volume`; `import_market_symbols_to_dynamodb.py <file>` SHALL load `market_symbol` the same way.
- **R2** WHEN `scripts/seed.ts` runs (from `make run-local` and at container start), the system SHALL load prices and symbols into SQLite from `2026-01-21.csv` and `nasdaq.csv` unless other files are passed.
- **R3** WHEN `scripts/seed-cosmos.ts` runs with `COSMOS_ENDPOINT`, the system SHALL upsert the same data into the Cosmos `market_price` and `market_symbol` containers using the caller's Azure login, and print the counts.
- **R4** The SQLite and Cosmos seeders SHALL read the CSVs through one shared loader (`scripts/seedData.ts`) so both targets get identical rows.
- **R5** Each seeder SHALL accept a prices CSV path and a symbols CSV path as arguments.
- **R6** The loader SHALL skip a price row whose `Ticker` is empty or whose `Close`, `High`, `Low`, `Open` or `Volume` is empty or not a number (current behavior: the row is dropped without a warning).
- **R7** Symbols SHALL be stored uppercase.
- **R8** WHEN the Python backend is set up, `make create-db` and `make seed` in `trade-backend-k8s/` SHALL create `data/market_stock.db` from `ddl/*.sql`.

## Out of scope
Scheduled or live feeds, intraday history, a UI for uploading files.

## Decisions
- D1: Prices are daily snapshots; one trading day is loaded at a time.
- D2: Seeders share a loader; the DynamoDB importer stays Python for now.
- D3: Cosmos seeding uses Entra ID (`az login`), not keys.

## Known gaps
- **G1** Re-seeding SQLite does not update rows that already exist (`onConflictDoNothing`), while Cosmos upserts; loading a different day into an existing SQLite database keeps the old prices.
- **G2** R6 drops bad rows silently, so a broken CSV looks like a successful import with fewer rows.
- **G3** Three import paths (Python for DynamoDB, TypeScript for SQLite and Cosmos, SQL for the Python backend).
- **G4** Not every ticker is in the production CSV (for example AAPL is missing; smoke tests use AAON).
- **G5** The UI header date is hard-coded rather than read from the data (see F-002 G2).
