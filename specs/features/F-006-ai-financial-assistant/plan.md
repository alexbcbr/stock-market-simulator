# F-006 Plan

1. **MCP server and tools** (done). Covers R1-R5, R9.
2. **Agents on three frameworks** (done). Covers R6-R8.
3. **Tool hygiene** (planned, fixes G1, G2): remove or implement the `buy_stock` stub; move the allow-list to configuration.
4. **Enforce authorization in the tool layer** (planned, fixes G3)
   1. Decide the rule: `create_trade` refuses a customer who is not in the allow-list, regardless of what the model did.
   2. Write the requirement and a test that bypasses the model and calls the tool directly.
5. **Point agents at the TypeScript backend** (planned, fixes G4)
   1. Add a base-URL setting or a second MCP server for the TypeScript API contract (the route names differ from the FastAPI ones).
   2. Decide whether `trade-backend-python` stays as a teaching example.
   3. Re-run the evals (F-007) to confirm no regression.
6. **Voice AI** (planned): separate feature F-008 when started.
