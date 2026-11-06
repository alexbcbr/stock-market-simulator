# F-005 Validation

Mergeable when the checks for every requirement you touched pass.

## Per requirement
| Requirement | How it is checked |
|---|---|
| R1 | Importer prints the number of items written; the count in `market_price` equals the CSV's valid rows; smoke price checks pass on AWS |
| R2 | `make run-local`, then `GET /listMarketPrices` returns the CSV's valid row count and `getMarketPrice?symbol=AAON` returns 200 |
| R3 | `seed-cosmos.ts` prints `Seeded N market prices and M symbols`; running it twice leaves the same counts |
| R4 | Seed a SQLite database and Cosmos with the same CSV; counts and a sample row match |
| R5 | Run a seeder with a small test CSV; only its rows appear |
| R6 | A CSV with an empty `Close` and a non-numeric `Volume`: those rows are skipped (until task 5, when a warning is also expected) |
| R7 | A lowercase ticker in the CSV is stored uppercase |
| R8 | `make create-db seed` then `pytest` pass in `trade-backend-k8s/` |

## Open (until the gap tasks are done)
- G1: after task 4, seeding a changed CSV into an existing SQLite database updates the prices.
- G2: after task 5, a CSV with bad rows reports how many were skipped.
