# F-003 Validation

Mergeable when the checks for every requirement you touched pass.

## Global
- In each UI you changed: `bun run build` and `bun run lint` pass.
- If an endpoint is added: it is in `openapi.yaml`, covered by `scripts/smoke.sh`, and returns the same order on every target.

## Per requirement
| Requirement | How it is checked |
|---|---|
| R1 | Manual with seeded trades: an unsold trade and a failed trade do not appear |
| R2 | Two sold trades with different `price_difference`: the larger is rank 1 (a component test when the UI gets a test runner) |
| R3 | Empty data: the page shows an empty table, no error |
| R4-R5 | Manual: columns present, `$12.34` formatting, `+` and arrow on gain, arrow on loss |
| R6 | Manual: one trade per source shows the right icon; the legacy `agent` shows the aggressive icon |
| R7 | Manual: ranks 1 to 3 are styled |

The UIs have no automated tests today (lint and type-check only), so R1-R7 are manual checks until a component test setup is added.

## Open (until the gap tasks are done)
- G1: after task 2, a player with two sold trades appears once with the summed score.
