# F-010 Validation

Mergeable when the checks for every requirement you touched pass.

## Global
- In `trade-backend/`: `bun run build` and `bun test` pass.
- `bun run cdk synth` (from `trade-backend/`) succeeds and `terraform validate` passes in `deploy/azure-terraform`.
- `scripts/smoke.sh <url>` passes on every target you deploy.

## Per requirement
| Requirement | How it is checked |
|---|---|
| R1, R2, R5, R7 | `tests/api.test.ts` (defaults, optional fields, `crm_managed` ignored); smoke `createCustomer defaults` |
| R3, R4, R6 | `tests/api.test.ts` table of 400 cases; smoke `createCustomer invalid body` and `missing name` |
| R8, R9 | `tests/api.test.ts` and smoke `getCustomer`, `unknown name`, `missing name` |
| R10 | `tests/api.test.ts` duplicate case; contract test `create with an existing name throws`; smoke `createCustomer duplicate` |
| R11 | `tests/api.test.ts` `customers and trades are independent` |
| R12 | `tests/openapi.test.ts` route list; smoke on each target |
| R13 | `cdk synth` shows the `customers` table; `terraform validate`; SQLite is created by `tests/repositories.test.ts` |

## Before using a real target
- **AWS:** `bun run cdk deploy TradeDbStack` first (creates the table), then `TradeControllerStack`. Both stacks only add resources.
- **Azure:** `terraform apply`, then `publish-function.sh` (the new routes are in the Function bundle and `openapi.yaml` is re-imported by API Management).
- **Cosmos adapter:** run `tests/cosmos.contract.test.ts` against the emulator (see its header); it now includes the customer contract.
