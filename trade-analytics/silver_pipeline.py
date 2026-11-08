"""Silver layer: denormalized `silver.trade_market` Iceberg table.

Joins the latest bronze `trade` file with `market_symbol` and `market_price` on `symbol` (left
joins, so only symbols that appear in `trade` are kept) and upserts the result on `trade_id`.
Each trade gets a `date`, taken from the date prefix of the bronze file in which it first
appeared. `open_price` and `close_price` come from `trade` only. Safe to re-run.
"""

import os
from glob import glob

import pandas as pd
import pyarrow as pa
from pyiceberg.catalog.sql import SqlCatalog

WAREHOUSE = os.path.abspath("trade.silver")


def latest(table):
    """Returns the path of the newest bronze Parquet file for `table`.

    Raises:
        ValueError: If no bronze file exists for the table.
    """
    return max(glob(f"trade.bronze/*_{table}.parquet"))


trade_file = latest("trade")
trade = pd.read_parquet(trade_file)
# trade_timestamp holds only a time of day, so the date comes from the bronze file name.
trade["date"] = pd.to_datetime(os.path.basename(trade_file)[:8], format="%Y%m%d").date()

symbol = pd.read_parquet(latest("market_symbol"))
# Drop the columns that already exist in trade, to avoid duplicates after the join.
price = pd.read_parquet(latest("market_price")).drop(
    columns=["open_price", "close_price"]
)

df = trade.merge(symbol, on="symbol", how="left").merge(price, on="symbol", how="left")

catalog = SqlCatalog(
    "local", uri=f"sqlite:///{WAREHOUSE}/catalog.db", warehouse=f"file://{WAREHOUSE}"
)
catalog.create_namespace_if_not_exists("silver")
data = pa.Table.from_pandas(df, preserve_index=False)
table = catalog.create_table_if_not_exists("silver.trade_market", schema=data.schema)

# bronze is a full copy of trade every day: keep the first-seen date of trades already in silver
first_seen = (
    table.scan(selected_fields=("trade_id", "date"))
    .to_pandas()
    .set_index("trade_id")["date"]
)
df["date"] = [first_seen.get(i, d) for i, d in zip(df["trade_id"], df["date"])]
data = pa.Table.from_pandas(df, schema=data.schema, preserve_index=False)
# Upsert: update trades already in silver, insert new ones. Never creates duplicate trade_id.
table.upsert(data, join_cols=["trade_id"])

print(f"silver.trade_market: {len(table.scan().to_arrow())} rows")
