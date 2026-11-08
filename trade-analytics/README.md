# trade-analytics

Medallion pipeline (bronze, silver, gold) that turns the SQLite trade database into an analytics-ready data mart. Silver and gold are Apache Iceberg tables (Parquet files), using a local SQLite catalog.

## Setup

Create a `.env` file with the path to the source SQLite database:

```
FILE_PATH=/path/to/market_stock.db
```

Install dependencies with `uv sync`.

## Pipeline

Run once per day, in this order:

```bash
uv run bronze_pipeline.py   # SQLite -> trade.bronze/<YYYYMMDD>_<table>.parquet
uv run silver_pipeline.py   # trade + market_symbol + market_price -> silver.trade_market
uv run gold_pipeline.py     # silver -> gold.daily_customer_symbol
```

| Layer | Folder | Content |
|---|---|---|
| Bronze | `trade.bronze/` | Raw copy of every SQLite table, one Parquet file per table per day |
| Silver | `trade.silver/` | `silver.trade_market`: one row per trade, joined with symbol and price data, plus a `date` column |
| Gold | `trade.gold/` | `gold.daily_customer_symbol`: one row per date, customer and symbol, with `trade_count` and `total_executed_price` |

## Sync to Databricks (analysis)

Bronze, silver and gold are copied to a Databricks Unity Catalog volume so the data can be analysed there. One-time setup: install the [Databricks CLI](https://docs.databricks.com/aws/en/dev-tools/cli/install) (`brew tap databricks/tap && brew install databricks`), run `databricks auth login --host <workspace-url>`, and create the volume (`databricks volumes create <catalog> <schema> <volume> MANAGED`).

```bash
uv run upload_to_databricks.py              # export + upload; --dry-run to only export and print the commands
```

Silver and gold are Iceberg tables whose metadata holds local paths, so they cannot be copied as they are. The script exports the current snapshot of each to plain Parquet (`trade.export/`) and uploads that. Files are overwritten on every run. The volume defaults to `dbfs:/Volumes/workspace/trade/trade_raw`; set `DATABRICKS_VOLUME` to change it.

Resulting layout in the volume: `bronze/`, `silver/trade_market.parquet`, `gold/daily_customer_symbol.parquet`. Databricks is the analysis side only; the pipeline runs locally and is the source of truth.

## Rules

- **Date:** `trade_timestamp` holds only a time, so a trade's `date` is the date of the bronze file in which it first appeared.
- **Silver** is upserted on `trade_id`, so re-running it never duplicates trades.
- **Gold** counts only successful trades (`status_trade = 1`). It processes only dates not yet in gold, so nothing is counted twice. To rebuild one date: `uv run gold_pipeline.py --date YYYY-MM-DD`.

Keep each `catalog.db` together with its data folder; moving one without the other breaks the tables.
