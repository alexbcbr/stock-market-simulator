# F-003 Plan

1. **Leaderboard UI** (done): table, ranks, source icons, volume chart in both UIs. Covers R1-R7.
2. **Per-player ranking** (planned, fixes G1)
   1. Decide the score (sum of profit per customer, or best trade) and write it as new requirements.
   2. Compute it in the UI; add an endpoint only if the list outgrows the client.
3. **Human versus agent view** (planned, fixes G4, story S5): group the score by source type, using `trade_source`.
4. **Unify the UIs** (planned, fixes G3): same task group as F-002 task 6.
