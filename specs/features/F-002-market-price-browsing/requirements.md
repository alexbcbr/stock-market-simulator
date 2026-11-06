---
id: F-002
title: Market price browsing
status: implemented
---
# F-002 Market price browsing

## Context
Players need to see which stocks exist and the day's prices before buying. API routes live in `trade-backend/src/api/app.ts` (local, Kubernetes, Azure) and the AWS stack; UI in `MarketPricesView`, `MarketPriceList`, `SymbolLink`, `MarketSymbolModal`, `OpenPriceModal`, `MarketVolumeChart` (both `trade-ui` and `trade-ui-basic`). Data comes from F-005.

## User stories
| ID | Priority | Story | Requirements |
|---|---|---|---|
| F-002-S1 | P1 | As a **player**, I want to see every symbol with its open, highest and lowest price, so I can choose what to buy. | R1, R6, R7 |
| F-002-S2 | P2 | As a **player**, I want to open a symbol's details (name, sector, industry), so I know what I am buying. | R4, R5, R8 |
| F-002-S3 | P2 | As a **player**, I want to copy a symbol into the trade form, so I do not mistype it. | R9 |
| F-002-S4 | P3 | As a **facilitator**, I want a chart of trading volume, so I can show which stocks are active. | R10 |
| F-002-S5 | P2 | As an **AI agent**, I want the same price data through the API, so my answers match what players see. | R1, R2, R3 |

## Requirements
### API
- **R1** WHEN `GET /listMarketPrices` is called, the system SHALL return an array of `{symbol, open_price, close_price, highest_price, lowest_price, volume}` as plain JSON, with numbers as JSON numbers.
- **R2** WHEN `GET /getMarketPrice?symbol=X` is called for a known symbol, the system SHALL return that symbol's price object.
- **R3** WHEN `getMarketPrice` is called without `symbol`, the system SHALL answer 400; WHEN the symbol is unknown, it SHALL answer 404.
- **R4** WHEN `GET /getMarketSymbol?symbol=X` is called for a known symbol, the system SHALL return `{symbol, name, lastSale, marketCap, ipoYear, sector, industry, summaryQuote}`.
- **R5** WHEN `getMarketSymbol` is called without `symbol` it SHALL answer 400, and WHEN the symbol is unknown it SHALL answer 404.
- **R6** The same responses and status codes SHALL be returned on AWS, Azure, local and Kubernetes (`api-contract/openapi.yaml`).

### UI
- **R7** WHEN a player opens `/market-prices` (the default route), the UI SHALL list every symbol with open, highest and lowest price formatted as dollars with 2 decimals.
- **R8** WHEN a player selects a symbol, the UI SHALL show the symbol details modal.
- **R9** WHEN a player clicks the copy button next to a symbol, the UI SHALL copy the symbol and show a check mark.
- **R10** The page SHALL offer a "Refresh Prices" action and a price chart opened from the open price.

## Out of scope
Live prices, price history across days, search or filter by sector.

## Decisions
- D1: Market data is a static daily snapshot loaded from CSV (F-005).
- D2: Routes use query strings (`?symbol=`) to stay compatible across API Gateway, APIM and Hono.

## Known gaps
- **G1** `listMarketPrices` is an unpaged Scan (about 1 MB on DynamoDB).
- **G2** The list header is hard-coded as "Trading Day: January 21, 2026" instead of coming from the data.
- **G3** Two near-identical UIs; every change is made twice until they are unified.
- **G4** Symbol lookup is inconsistent across targets: DynamoDB, Cosmos and the SQLite symbol lookup uppercase the input, but the SQLite price lookup does not, so `getMarketPrice?symbol=aaon` answers 404 on local and Kubernetes only. This breaks R6.
