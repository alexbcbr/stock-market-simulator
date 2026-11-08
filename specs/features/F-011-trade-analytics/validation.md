# F-011 Validation

Mergeable when the checks for every requirement you touched pass. There are no automated tests yet, so these are manual checks that run the scripts, best done in a copy of `trade-analytics/` so the real tables are not touched.

## Global
- `uv run bronze_pipeline.py`, `silver_pipeline.py` and `gold_pipeline.py` run in that order without errors.
- Silver has no duplicate `trade_id`.
- In gold, `sum(total_executed_price)` and `sum(trade_count)` equal the same sums over silver filtered to `status_trade = 1`.

## Per requirement
| Requirement | How it is checked |
|---|---|
| R1 | A file per SQLite table appears in `trade.bronze/` with today's date prefix; a second run the same day changes no file names |
| R2 | A silver row for a known trade has the symbol and price columns filled; `open_price` equals the trade's value; row count equals the trade count |
| R3, R7 (silver) | Add a copy of the bronze trade file with the next day's date plus one new trade, then run silver: old trades keep their date, the new one gets the new date, no duplicate `trade_id` |
| R4 | Two trades by one customer for one symbol on one day become one gold row with `trade_count` 2; two different symbols stay two rows; a trade with `status_trade = 0` is not counted |
| R5 | A second run of gold prints "nothing to process"; `--date` on an existing date rebuilds it with identical totals |
| R6 | Gold has `trade_count` and `total_executed_price` and no average column |
| R7 | Run the whole pipeline twice with no new data: silver and gold row counts and sums are unchanged |
| R8 | `uv run upload_to_databricks.py --dry-run` creates `trade.export/silver` and `trade.export/gold` and prints three `databricks fs cp -r --overwrite` commands |
| R9 | The printed commands only name `trade.bronze`, `trade.export/silver` and `trade.export/gold` |
| R10 | By inspection: nothing in the scripts writes back to the local data from Databricks |

## Before using a real workspace
- Install the Databricks CLI, run `databricks auth login --host <workspace-url>` and check with `databricks current-user me`.
- Create the volume: `databricks volumes create <catalog> <schema> trade_raw MANAGED` (the default target is `dbfs:/Volumes/workspace/trade/trade_raw`; set `DATABRICKS_VOLUME` to change it).
- Run `uv run upload_to_databricks.py`, then list the volume (`databricks fs ls dbfs:/Volumes/...`) and confirm `bronze/`, `silver/trade_market.parquet` and `gold/daily_customer_symbol.parquet` exist.
