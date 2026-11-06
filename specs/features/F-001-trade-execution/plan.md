# F-001 Plan

Baseline (done): tasks 1-4. Planned: tasks 5-9.

1. **Pure engine and service** (done): `computeExecution`, `TradeService`, validation, in-memory fakes. Covers R1-R9.
2. **Storage adapters** (done): DynamoDB, SQLite (Drizzle), Cosmos, all passing the same repository contract tests. Covers R10-R13.
3. **API** (done): Hono routes (local, Kubernetes, Azure) and API Gateway + Lambda handlers (AWS), all on the core. Covers R7-R14.
4. **UI** (done): trade form with strategy selection, trade list with a Sell action.
5. **Add a date to `trade_timestamp`** (planned, fixes G1)
   1. Decide the format (ISO 8601) and the key/sort impact on DynamoDB, Cosmos and SQLite.
   2. Update R10 and R13, the OpenAPI contract, the engine and the UI display.
   3. Tolerate or migrate old `HH:MM:SS` rows.
6. **Reset the simulation** (planned, fixes G2, story S7)
   1. Define what reset clears (trades only, or prices too).
   2. Write the requirement (new R-number), then add an admin endpoint to the contract and all adapters; protect it.
   3. Add an admin action in the UI.
7. **Make selling safe** (planned, fixes G3 and G4)
   1. Decide the rule: reject selling when `status_trade` is false (400); answer 404 when no trade matches.
   2. Add the requirements (new R-numbers), change `sellTrade` to report whether a row changed, update all three adapters and the contract.
8. **Retire the legacy `agent` mode** (planned): migrate stored rows to a current mode, then drop it from the types and the UI.
9. **Align the Python backend** (planned, fixes G5): compare `trade_services.py` with R1-R14, or retire it for trades (see F-006).
