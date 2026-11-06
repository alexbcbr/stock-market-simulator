# F-002 Plan

1. **API** (done): price and symbol routes on all four targets. Covers R1-R6.
2. **UI** (done): list, modal, copy button, chart in both UIs. Covers R7-R10.
3. **Paging for the price list** (planned, fixes G1)
   1. Add `limit` and `next_token` to the contract; update R1.
   2. Support it in DynamoDB (VTL), SQLite and Cosmos adapters.
   3. Update the UI to load more.
4. **Show the real trading day** (planned, fixes G2): return the data date from the API (or the seed) and display it.
5. **Case-insensitive symbol lookups** (planned, fixes G4): normalize the symbol once in the core (not in each adapter or route), so price and symbol lookups agree; add the requirement and a repository contract test with a lowercase symbol.
6. **Unify the UIs** (planned, fixes G3, shared with F-003): decide the surviving UI, port Toast and notifications if kept, delete the other, update `CLAUDE.md` and deploy scripts.
