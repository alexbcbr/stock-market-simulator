# F-010 Plan

1. **Core** (done): `Customer` model, `CustomerAlreadyExistsError`, `newCustomer`, `CustomerRepository` port, `validateCreateCustomerRequest`. Covers R2 to R7.
2. **Adapters** (done): SQLite table (`schema.ts` and the raw SQL in `db.ts`), DynamoDB conditional put, Cosmos container with encoded `id`. Covers R1, R8, R10, R11.
3. **API** (done): `POST /createCustomer` and `GET /getCustomer` in `api/app.ts`; Lambda handlers; `openapi.yaml`. Covers R1 to R10, R12.
4. **Automation** (done): `TradeDbStack` table, `TradeControllerStack` Lambdas and routes, Terraform container. Covers R13.
5. **Tests** (done): repository contract (in-memory and SQLite; Cosmos when the emulator is set), API tests, OpenAPI route list, smoke checks.
6. **Deploy** (to do by hand): see `validation.md`.
7. **Later** (planned): UI form, a CRM job that sets `crm_managed`, backfill of existing trade names, the same table in the Python backend.
