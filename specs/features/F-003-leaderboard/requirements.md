---
id: F-003
title: Leaderboard
status: implemented
---
# F-003 Leaderboard

## Context
The dashboard from the original spec (feature 1): shows who gained most. Implemented as `LeaderboardView`, `TradeLeaderboard` and `MarketVolumeChart` in both UIs at `/leaderboard`. There is no leaderboard endpoint: the UI ranks the result of `GET /listAllTrades` (F-001 R12). Profit means `price_difference = close_price - executed_price` (F-001 R10).

## User stories
| ID | Priority | Story | Requirements |
|---|---|---|---|
| F-003-S1 | P1 | As a **facilitator**, I want a ranking of sold trades by profit, so I can announce who is winning. | R1, R2, R3 |
| F-003-S2 | P1 | As a **player**, I want to see my trade next to the others with price paid, sell price and profit, so I can compare my result. | R4, R5 |
| F-003-S3 | P2 | As a **facilitator**, I want to see whether a trade came from a person, the market or an agent strategy, so I can compare humans and agents. | R6 |
| F-003-S4 | P3 | As a **facilitator**, I want the top three highlighted, so the winners stand out. | R7 |
| F-003-S5 | P2 | As a **facilitator**, I want to compare human and agent results per player, so the lesson about agents is visible. | none yet (see Known gaps) |

## Requirements
- **R1** The leaderboard SHALL include only trades with `status_trade = true` and `status_sell = true`.
- **R2** The leaderboard SHALL sort by `price_difference`, largest first.
- **R3** WHEN no trade qualifies, the leaderboard SHALL show an empty table without an error.
- **R4** Each row SHALL show rank, customer, symbol, open price, purchase price (`executed_price`), sell price (`close_price`), profit, source, timestamp and trade id.
- **R5** Prices SHALL be shown as dollars with 2 decimals; profit SHALL show a sign (`+` for zero or gain) and an up or down arrow.
- **R6** The source column SHALL show a distinct icon for `manual`, `market`, `agent_conservative`, `agent_moderate` and `agent_aggressive`; the legacy `agent` SHALL show the aggressive icon; any other value SHALL show a question mark.
- **R7** Ranks 1, 2 and 3 SHALL have distinct highlight styles.

## Out of scope
Cumulative scores per player, per-day boards, server-side ranking, live updates.

## Decisions
- D1: Ranking is computed in the UI from `listAllTrades`; revisit if the data grows.
- D2: Sell price is the stored `close_price`, so a sold trade's profit does not change after the sale (F-001 D5).

## Known gaps
- **G1** The board ranks individual trades, not players: one player can fill many rows.
- **G2** It relies on `listAllTrades`, which is unpaged (F-002 G1).
- **G3** Two near-identical UIs (shared with F-002 G3).
- **G4** No comparison of human versus agent results (S5).
