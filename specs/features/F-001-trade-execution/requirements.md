---
id: F-001
title: Trade execution
status: implemented
---
# F-001 Trade execution

## Context
A player buys a stock for the day and later sells it. The price paid depends on the day's market price and a chosen strategy. Rules live in `trade-backend/src/core/tradeEngine.ts`, `tradeService.ts` and `validation.ts`. Original spec: `specs/spec.md` (feature 2, Buyer option).

Terms: *range* = `highest_price - lowest_price` of the symbol's market price. *Trade* = one stored purchase.

## User stories
Priority: P1 = the game does not work without it, P2 = important, P3 = nice to have.

| ID | Priority | Story | Requirements |
|---|---|---|---|
| F-001-S1 | P1 | As a **player**, I want to buy a stock at a bid I choose, so I decide how much to risk. | R1, R2, R3, R4, R9 |
| F-001-S2 | P1 | As a **player**, I want to buy at the market or with a strategy (conservative, moderate, aggressive), so I can trade without picking a price. | R5, R6, R9 |
| F-001-S3 | P1 | As a **player**, I want to sell a trade I bought, so I lock in the day's close as my result. | R10, R11 |
| F-001-S4 | P1 | As a **player**, I want to see my trades newest first, so I find my latest order. | R12, R13 |
| F-001-S5 | P2 | As a **facilitator**, I want to see every trade, so I can follow the whole game. | R12 |
| F-001-S6 | P2 | As an **AI agent** acting for a player, I want the same rules and clear error messages as a human, so my trades are comparable. | R7, R8, R14 |
| F-001-S7 | P3 | As a **facilitator**, I want to reset the simulation between sessions. | none yet (see Known gaps) |

## Requirements
Written in EARS style: *WHEN* a condition, *the system SHALL* respond. Each one is testable. IDs are permanent (use as `F-001-R1`).

### Pricing
- **R1** WHEN `price_mode` is `manual` and `bid_price` is greater than or equal to the symbol's `highest_price`, the system SHALL execute at `highest_price` with `status_trade = true`.
- **R2** WHEN `price_mode` is `manual` and `bid_price` is less than or equal to `lowest_price`, the system SHALL record the trade at `bid_price` with `status_trade = false`.
- **R3** WHEN `price_mode` is `manual` and `bid_price` is between `lowest_price` and `highest_price`, the system SHALL execute at `bid_price`, and `status_trade` SHALL be true only if a random point in `[lowest_price, highest_price]` is greater than `lowest_price + 45% x range`.
- **R4** WHEN `price_mode` is `manual`, the system SHALL require `bid_price` to be a non-negative number.
- **R5** WHEN `price_mode` is `market`, the system SHALL execute at a random price between `lowest_price + 48% x range` and `highest_price`, with `status_trade = true`.
- **R6** WHEN `price_mode` is `agent_aggressive`, `agent_moderate` or `agent_conservative`, the system SHALL execute with `status_trade = true` at a random price within `lowest_price + [0, 50%]`, `[5%, 45%]` or `[10%, 40%]` of the range respectively.
- All executed prices are rounded to 2 decimals, except R1 and R3, which use the stored/bid value as is.

### Validation and errors
- **R7** WHEN `symbol`, `customer_name` or `price_mode` is missing, the system SHALL answer 400 with an `error` message naming the required fields.
- **R8** WHEN `price_mode` is not one of `manual`, `market`, `agent_conservative`, `agent_moderate`, `agent_aggressive` (including the legacy `agent`), the system SHALL answer 400.
- **R9** WHEN the symbol (case-insensitive; stored uppercase) has no market price, the system SHALL answer 404 and SHALL NOT store a trade.

### Trade record
- **R10** WHEN a buy succeeds in being recorded (even with `status_trade = false`), the system SHALL answer 201 with the trade: `trade_id`, `symbol`, `customer_name`, `executed_price`, `open_price`, `close_price`, `price_difference = close_price - executed_price`, `status_trade`, `status_sell = false`, `trade_source = price_mode`, `trade_timestamp`.
- **R11** WHEN `POST /sellStock` receives `trade_id` and `trade_timestamp`, the system SHALL set that trade's `status_sell = true` and answer `{ "success": true }`; WHEN either field is missing it SHALL answer 400.

### Listing
- **R12** WHEN `GET /listAllTrades` is called, the system SHALL return all trades as plain JSON on every target.
- **R13** WHEN `POST /listTradesByCustomerName` is called with `customer_name`, the system SHALL return only that customer's trades, newest first by `trade_timestamp`; WHEN `customer_name` is missing it SHALL answer 400.
- **R14** The same input SHALL produce the same status code and response shape on AWS, Azure, local and Kubernetes (`api-contract/openapi.yaml`).

## Out of scope
Real money, order books, partial fills, short selling, prices from outside the loaded CSVs.

## Decisions
- D1: Pricing is a pure function with an injectable random source so tests are deterministic.
- D2: The legacy `agent` price mode appears only on old stored trades and is rejected for new ones (R8).
- D3: `trade_timestamp` is `HH:MM:SS` in America/Los_Angeles with no date; with `trade_id` it forms the trade key and it is the sort order (R13).
- D4: Plain JSON on every target (R14).
- D5: The sell price is the symbol's `close_price` captured at buy time, so selling changes only `status_sell`.

## Known gaps (each has a task in plan.md)
- **G1** No date in `trade_timestamp`: ordering is only correct within one day.
- **G2** No reset action (S7).
- **G3** The API allows selling a trade whose `status_trade` is false; only the UI hides the Sell button.
- **G4** `POST /sellStock` answers `{ "success": true }` for an unknown `trade_id` or a wrong `trade_timestamp`, although nothing changes.
- **G5** The Python backend (`trade-backend-k8s`) has its own `create_trade` and may not follow R1 to R14.
