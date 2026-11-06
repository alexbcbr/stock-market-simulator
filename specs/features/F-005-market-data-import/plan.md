# F-005 Plan

1. **DynamoDB importers** (done): prices and symbols. Covers R1.
2. **SQLite and Cosmos seeders** (done): shared loader. Covers R2-R5, R7.
3. **Python backend seed** (done): `ddl/` scripts. Covers R8.
4. **Make seeding consistent** (planned, fixes G1)
   1. Decide the rule: replace existing rows by symbol on every target.
   2. Change SQLite to upsert; add a repository or seed test that re-seeds with different values.
5. **Report bad rows** (planned, fixes G2): count and list skipped rows, fail when the share of bad rows is above a threshold; add the requirement.
6. **One import path** (planned, fixes G3)
   1. Add a DynamoDB seeder to the TypeScript scripts using the shared loader.
   2. Retire the Python importers once outputs match.
7. **Trading day from the data** (planned, fixes G5): store the date with the prices and expose it (shared with F-002 task 4).
