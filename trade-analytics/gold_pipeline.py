"""Gold layer: `gold.daily_customer_symbol`, a pre-aggregated Iceberg data mart.

Grain: one row per (date, customer_name, symbol). Measures are additive (`trade_count`,
`total_executed_price`), so averages are computed at query time and roll up correctly.
Only successful trades (`status_trade = 1`) are counted; failed trades stay in silver only.

Incremental: a date is processed only if it is not yet in gold, so nothing is counted twice.
Use `--date YYYY-MM-DD` to rebuild one date (its rows are deleted first, then re-appended).
"""

import argparse
import os

import pyarrow as pa
from pyiceberg.catalog.sql import SqlCatalog
from pyiceberg.transforms import MonthTransform

SILVER = os.path.abspath("trade.silver")
GOLD = os.path.abspath("trade.gold")
# Grouping columns. name, sector and industry depend on symbol, so they do not change the grain.
KEYS = ["date", "customer_name", "symbol", "name", "sector", "industry"]

ap = argparse.ArgumentParser()
ap.add_argument("--date", help="force reprocess of this date (YYYY-MM-DD)")
args = ap.parse_args()

silver_catalog = SqlCatalog("local", uri=f"sqlite:///{SILVER}/catalog.db", warehouse=f"file://{SILVER}")
catalog = SqlCatalog("gold", uri=f"sqlite:///{GOLD}/catalog.db", warehouse=f"file://{GOLD}")
silver = silver_catalog.load_table("silver.trade_market").scan(
    row_filter="status_trade = 1", selected_fields=tuple(KEYS + ["executed_price"])
).to_pandas()

gold_schema = pa.schema([
    ("date", pa.date32()), ("customer_name", pa.string()), ("symbol", pa.string()),
    ("name", pa.string()), ("sector", pa.string()), ("industry", pa.string()),
    ("trade_count", pa.int64()), ("total_executed_price", pa.float64()),
])
catalog.create_namespace_if_not_exists("gold")
# First run only: create the table and partition it by month of `date`.
if not catalog.table_exists("gold.daily_customer_symbol"):
    gold = catalog.create_table("gold.daily_customer_symbol", schema=gold_schema)
    gold.update_spec().add_field("date", MonthTransform(), "date_month").commit()
gold = catalog.load_table("gold.daily_customer_symbol")

# Gold itself is the watermark: dates already present were processed.
done = set(gold.scan(selected_fields=("date",)).to_pandas()["date"])
pending = {args.date} if args.date else {str(d) for d in set(silver["date"]) - done}

for d in sorted(pending):
    day = silver[silver["date"].astype(str) == d]
    agg = (
        day.groupby(KEYS, dropna=False)["executed_price"]
        .agg(trade_count="count", total_executed_price="sum")
        .reset_index()
        .sort_values(["customer_name", "symbol"])
    )
    # Forced reprocess: remove the old rows first so the date is not counted twice.
    if d in {str(x) for x in done}:
        gold.delete(f"date = '{d}'")
    gold.append(pa.Table.from_pandas(agg, schema=gold_schema, preserve_index=False))
    print(f"{d}: {len(agg)} rows")

if not pending:
    print("nothing to process")
