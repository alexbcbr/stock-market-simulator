---
id: F-011
title: Trade analytics (medallion pipeline)
status: implemented
---
# F-011 Trade analytics (medallion pipeline)

## Context
Analysis of the game data needs a shape different from the transactional tables. This feature adds `trade-analytics/`, a daily batch pipeline that copies the trade database into a bronze, silver and gold layout and syncs it to Databricks for analysis. It reads the SQLite database of the local backend (`FILE_PATH` in `trade-analytics/.env`) and changes nothing in it. Code: `trade-analytics/bronze_pipeline.py`, `silver_pipeline.py`, `gold_pipeline.py`, `upload_to_databricks.py`. The ID is F-011 because F-008 and F-009 are reserved in the roadmap and F-010 is taken.

## User stories
| ID | Priority | Story | Requirements |
|---|---|---|---|
| F-011-S1 | P1 | As an **analyst**, I want a raw daily copy of every table, so I can always go back to the source data. | R1 |
| F-011-S2 | P1 | As an **analyst**, I want one table with each trade joined to its symbol and price data, so I do not write the joins. | R2, R3 |
| F-011-S3 | P1 | As an **analyst**, I want a table already grouped by date, customer and symbol, so queries by customer and day are fast. | R4, R5, R6 |
| F-011-S4 | P1 | As an **analyst**, I want to run the pipeline every day without counting a trade twice. | R3, R5, R7 |
| F-011-S5 | P2 | As an **analyst**, I want the three layers available in Databricks, so I can analyse them in the cloud. | R8, R9, R10 |

## Data
| Layer | Location | Content |
|---|---|---|
| Bronze | `trade.bronze/<YYYYMMDD>_<table>.parquet` | One Parquet file per SQLite table per day; date is the run date |
| Silver | `trade.silver/`, Iceberg table `silver.trade_market` | One row per trade: all `trade` columns, `date`, the `market_symbol` columns, and `highest_price`, `lowest_price`, `volume` from `market_price` |
| Gold | `trade.gold/`, Iceberg table `gold.daily_customer_symbol` | One row per (`date`, `customer_name`, `symbol`) with `name`, `sector`, `industry`, `trade_count` and `total_executed_price` |

Iceberg tables use a local SQLite catalog (`catalog.db` inside each warehouse folder) and Parquet data files. Gold is partitioned by month of `date`.

## Requirements
- **R1** WHEN `bronze_pipeline.py` runs, the system SHALL write every user table of the SQLite database to `trade.bronze/<YYYYMMDD>_<table>.parquet`, discovering the tables at run time. Running it again the same day SHALL overwrite that day's files.
- **R2** WHEN `silver_pipeline.py` runs, the system SHALL left-join the latest bronze `trade` file with the latest `market_symbol` and `market_price` files on `symbol`, and upsert the result into `silver.trade_market` on `trade_id`. `open_price` and `close_price` SHALL come from `trade` only. A trade whose symbol is not found SHALL be kept, with nulls in the joined columns.
- **R3** The system SHALL give each trade a `date` taken from the date prefix of the bronze file in which it first appeared. WHEN a trade already exists in silver, it SHALL keep its original `date`.
- **R4** `gold.daily_customer_symbol` SHALL hold one row per (`date`, `customer_name`, `symbol`), counting only trades with `status_trade = 1`. `trade_count` SHALL be the number of those trades and `total_executed_price` the sum of their `executed_price`.
- **R5** WHEN `gold_pipeline.py` runs, the system SHALL process only dates in silver that are not yet in gold. WHEN run with `--date YYYY-MM-DD`, it SHALL delete that date's rows and rebuild them.
- **R6** Gold SHALL store only additive measures (a count and a sum); averages are computed by the query.
- **R7** Running the pipeline again without new data SHALL change nothing: no duplicate `trade_id` in silver and no extra rows in gold.
- **R8** WHEN `upload_to_databricks.py` runs, the system SHALL export the current data of silver and gold to one plain Parquet file each in `trade.export/`, and upload `trade.bronze/`, `trade.export/silver` and `trade.export/gold` to the Unity Catalog volume with `databricks fs cp -r --overwrite`. With `--dry-run` it SHALL export and print the commands without uploading.
- **R9** The sync SHALL NOT upload `.env` or any `catalog.db`.
- **R10** Databricks SHALL be the analysis side only. The local pipeline is the source of truth and the volume is overwritten from it.

## Out of scope
A quantity per trade and therefore traded value or profit and loss, a failure rate per customer (failed trades are not in gold), scheduling the daily run, creating the Delta tables in Databricks from the uploaded files, and any change to the backends or UIs.

## Decisions
- D1: Iceberg with a local SQLite catalog for silver and gold (no server). Bronze stays plain Parquet.
- D2: Silver and gold are exported to plain Parquet before upload. An Iceberg folder copied as it is cannot be read in Databricks, because its metadata holds local absolute paths, and the data folder can hold files the table no longer references.
- D3: One gold table at the finest requested grain. Any coarser view (per customer per day, leaderboard, per sector) is a `GROUP BY` over it, which is valid because the measures are additive.
- D4: Gold itself is the record of what was processed. Silver carries no "processed" flag, so marking rows would not require rewriting silver files.
- D5: `date` is the extraction day, because `trade_timestamp` has only a time. Silver keeps the first-seen date, because bronze is a full copy every day and the upsert would otherwise move old trades to the newest date.
- D6: Only `status_trade = 1` trades are counted in gold; the other numeric columns and `trade_id` are not carried into it.
- D7: The upload is a Python script, not shell, because exporting Iceberg needs pyiceberg.

## Known gaps
- **G1** `date` is the day the trade was first seen by the pipeline, not the day it happened. A trade made on day 1 but only seen on day 3 is counted on day 3. Adding a date to `trade_timestamp` (roadmap Phase 1, item 2) would remove this.
- **G2** Failed trades (`status_trade = 0`) exist only in silver. There is no failure rate in gold.
- **G3** A change to a trade after its date was processed reaches gold only by re-running that date with `--date`.
- **G4** A date with no successful trades never appears in gold, so it is checked again on every run (harmless).
- **G5** The silver and gold catalogs are local files. Moving a `catalog.db` away from its data breaks the table.
- **G6** There are no automated tests; validation is by running the scripts (see `validation.md`). When this spec was written, the Databricks upload had only been run with `--dry-run`.
