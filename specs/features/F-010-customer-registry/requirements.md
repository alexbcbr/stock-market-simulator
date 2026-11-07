---
id: F-010
title: Customer registry
status: implemented
---
# F-010 Customer registry

## Context
Until now a player existed only as the free-text `customer_name` on each trade (F-001). This feature adds a `customers` table so a name can carry contact data and a CRM flag. It is a registry beside the trades, not a login or an ownership rule. Code: `core/models/customer.ts`, `CustomerRepository` in `core/ports.ts`, `validateCreateCustomerRequest` in `core/validation.ts`, the routes in `api/app.ts`, the Lambda handlers `handlers/createCustomer.ts` and `handlers/getCustomer.ts`, and one adapter each for SQLite, DynamoDB and Cosmos DB. The ID is F-010 because F-008 and F-009 are reserved in the roadmap.

## User stories
| ID | Priority | Story | Requirements |
|---|---|---|---|
| F-010-S1 | P1 | As a **facilitator**, I want to register a player with name, full name and email, so I can reach them after the game. | R1, R2, R3, R4 |
| F-010-S2 | P1 | As a **facilitator**, I want to record whether the player agreed to be contacted, so I respect their choice. | R5, R6 |
| F-010-S3 | P1 | As a **facilitator**, I want to look a player up by name, so I can check what is stored. | R8, R9 |
| F-010-S4 | P2 | As a **CRM integration** (future), I want `crm_managed` to start false and be changed only by me, so the flag is trustworthy. | R7 |

## Data
`customers` (SQLite and DynamoDB table; Cosmos container of the same name):

| Field | Type | Rule |
|---|---|---|
| `customer_name` | text | Key; required, non-empty; same text as `trade.customer_name` |
| `fullname` | text, nullable | Optional |
| `email` | text, nullable | Optional; format not checked |
| `allowed_contact` | boolean | Default false |
| `crm_managed` | boolean | Always false on creation |

Keys per target: SQLite primary key `customer_name`; DynamoDB partition key `customer_name`; Cosmos partition key `/customer_name` with `id` = the URL-encoded name (Cosmos forbids `/ \ ? #` in an `id`).

## Requirements
- **R1** WHEN `POST /createCustomer` receives a body with a non-empty string `customer_name`, the system SHALL store the customer and answer 201 with the stored customer.
- **R2** `fullname` and `email` SHALL be optional; WHEN not sent they SHALL be stored and returned as `null`.
- **R3** WHEN `customer_name` is missing, empty or not a string, the system SHALL answer 400 `{ "error": "customer_name is required" }`.
- **R4** WHEN `fullname` or `email` is sent as something other than a string, the system SHALL answer 400 and store nothing.
- **R5** WHEN `allowed_contact` is sent as a boolean, the system SHALL store that value; WHEN it is not sent (or `null`), the system SHALL store false.
- **R6** WHEN `allowed_contact` is sent as anything other than a boolean (for example the string `"false"`), the system SHALL answer 400.
- **R7** The system SHALL store `crm_managed` as false on creation and SHALL ignore a `crm_managed` sent by the caller. No route changes it.
- **R8** WHEN `GET /getCustomer?customer_name=X` matches a stored customer exactly (case-sensitive), the system SHALL answer 200 with `{customer_name, fullname, email, allowed_contact, crm_managed}`; WHEN no customer matches it SHALL answer 404 `{ "error": "Customer not found" }`.
- **R9** WHEN `getCustomer` is called without `customer_name`, the system SHALL answer 400.
- **R10** WHEN `createCustomer` receives a `customer_name` that already exists, the system SHALL answer 409, leave the stored customer unchanged, and not apply a new `allowed_contact`.
- **R11** The `customers` table SHALL have no foreign key or check against `trade`: a trade MAY be bought for a name with no customer, and a customer MAY have no trades.
- **R12** AWS, Azure, local and Kubernetes SHALL return the same status codes and JSON shapes (`api-contract/openapi.yaml`, `scripts/smoke.sh`).
- **R13** Deploying the infrastructure SHALL create the table everywhere: `TradeDbStack` (DynamoDB `customers`), `deploy/azure-terraform/main.tf` (Cosmos container `customers`), and `openDatabase` (SQLite `CREATE TABLE IF NOT EXISTS`), and `ddl/customers.sql` holds the same table as a standalone script.

## Out of scope
Updating or deleting a customer, listing customers, setting `crm_managed` (a future CRM integration owns it), email format validation, and linking trades to customers.

## Decisions
- D1: Insert-only. A duplicate name is a 409, not an upsert, so a second call cannot silently change `allowed_contact`.
- D2: The table is called `customers` (plural, as requested), unlike the singular `trade` and `market_symbol`.
- D3: No service class. The repository is handed to the app like `symbols`, and the defaults live in `newCustomer`.
- D4: Route names follow the existing verb style (`createCustomer`, `getCustomer`, query parameter `customer_name`).
- D5: Existing trade names are not backfilled into `customers`.

## Known gaps
- **G1** The DynamoDB and Cosmos adapters are not run by the default tests (no local emulator for DynamoDB; Cosmos is skipped without `COSMOS_EMULATOR_*`). The shared contract in `tests/repositoryContract.ts` covers them once run against a real target.
- **G2** Names match exactly, so `Alex` and `alex` are two customers, as for trades.
- **G3** The UIs and the Python backend do not know customers yet. The table is still created in `market_stock.db` (`make create-db` runs `ddl/customers.sql`) and seeded with the four players from the seed trades, so the data is ready, but that backend has no customer routes.
- **G4** The Lambda handler answers 500 for a body that is not valid JSON, while the Hono app answers 400 (same difference as `buyStock`, F-001).
