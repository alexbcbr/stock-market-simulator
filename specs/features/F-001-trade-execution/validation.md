# F-001 Validation

Mergeable when the checks for every requirement you touched pass, and the global checks pass.

## Global
- `bun test` in `trade-backend/` passes (engine, service, repository contract, API, OpenAPI, VTL).
- `scripts/smoke.sh <base-url>` passes (15 checks) on each target you changed.
- `tests/openapi.test.ts` passes; responses match the schemas.

## Per requirement
| Requirement | How it is checked |
|---|---|
| R1, R2, R3 | Engine tests with a seeded random source at the three manual cases and both boundaries (bid equal to highest, bid equal to lowest, and just above the 45% threshold) |
| R4 | API test: manual without `bid_price`, and with a negative one, answers 400 |
| R5, R6 | Engine tests: with random = 0 and 1, the price equals each range edge for every strategy |
| R7, R8 | API tests: missing field, unknown mode and the legacy `agent` answer 400 |
| R9 | API/service test: unknown symbol answers 404 and no trade is stored; lowercase symbol is stored uppercase |
| R10 | Service test: record fields, `price_difference == close_price - executed_price`, `status_sell == false`; smoke buy check returns 201 |
| R11 | Repository contract: `markSold` flips only the matching key; smoke sell check |
| R12, R13 | Repository contract and smoke: list all, list by customer, newest first |
| R14 | Smoke script on two or more targets returns the same shapes; VTL test shows plain JSON on AWS |

## Open (until the gap tasks are done)
- G1: after task 5, ordering is correct across two different days and old rows still list.
- G3, G4: after task 7, selling a failed trade answers 400 and an unknown trade answers 404, on every adapter.
