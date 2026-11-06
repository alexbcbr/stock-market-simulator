# F-002 Validation

Mergeable when the checks for every requirement you touched pass, and the global checks pass.

## Global
- `bun test` in `trade-backend/` passes; `scripts/smoke.sh <base-url>` passes on the targets you changed (default symbol AAON; it must exist in `market_price`).
- In the UI you changed: `bun run build` and `bun run lint` pass.

## Per requirement
| Requirement | How it is checked |
|---|---|
| R1 | Smoke "listMarketPrices is plain JSON"; VTL test shows plain JSON (no `{"S":..}`) on AWS |
| R2, R3 | Smoke: getMarketPrice 200, unknown symbol 404, missing symbol 400 |
| R4, R5 | Smoke: getMarketSymbol 200 and 404; API test for 400 |
| R6 | Smoke on two or more targets gives identical shapes; `tests/openapi.test.ts` passes |
| R7-R10 | Manual in the browser: open `/market-prices`, list loads, modal opens, copy button shows a check mark, refresh reloads |

## Open (until the gap tasks are done)
- G1: after task 3, a list larger than one page returns each symbol exactly once across pages.
- G2: after task 4, the header date matches the loaded data.
- G4: after task 5, `getMarketPrice?symbol=aaon` returns AAON on every target (the repository contract test uses a lowercase symbol).
