"""Uploads bronze, silver and gold to a Databricks Unity Catalog volume with the Databricks CLI.

Bronze is already plain Parquet and is copied as is. Silver and gold are Iceberg tables whose
metadata holds local absolute paths, so they cannot be read in Databricks if copied raw. Instead,
the current snapshot of each is exported to one plain Parquet file in `trade.export/` and that is
uploaded. Load them into Delta tables in Databricks afterwards.

Target layout (under the volume): bronze/, silver/trade_market.parquet, gold/daily_customer_symbol.parquet.
Existing files are overwritten, so re-running refreshes the volume.

Requires `databricks auth login` to have been done. Use `--dry-run` to export locally and print
the upload commands without running them.
"""

import argparse
import os
import shutil
import subprocess

from pyiceberg.catalog.sql import SqlCatalog

VOLUME = os.environ.get("DATABRICKS_VOLUME", "dbfs:/Volumes/workspace/trade/trade_raw")
EXPORT = "trade.export"
# Per layer: (warehouse folder, catalog name, Iceberg table). The catalog name must match the one
# used when the table was created in silver_pipeline.py / gold_pipeline.py.
TABLES = {
    "silver": ("trade.silver", "local", "silver.trade_market"),
    "gold": ("trade.gold", "gold", "gold.daily_customer_symbol"),
}

ap = argparse.ArgumentParser()
ap.add_argument(
    "--dry-run",
    action="store_true",
    help="export locally and print the upload commands only",
)
ap.add_argument(
    "--profile", help="~/.databrickscfg profile (default profile if omitted)"
)
args = ap.parse_args()

# Fresh export every run, so tables removed locally do not linger.
shutil.rmtree(EXPORT, ignore_errors=True)
for layer, (folder, catalog_name, name) in TABLES.items():
    warehouse = os.path.abspath(folder)
    catalog = SqlCatalog(
        catalog_name,
        uri=f"sqlite:///{warehouse}/catalog.db",
        warehouse=f"file://{warehouse}",
    )
    out = f"{EXPORT}/{layer}/{name.split('.')[1]}.parquet"
    os.makedirs(os.path.dirname(out), exist_ok=True)
    df = catalog.load_table(name).scan().to_pandas()
    df.to_parquet(out, index=False)
    print(f"exported {name}: {len(df)} rows -> {out}")

for local, remote in [
    ("trade.bronze", "bronze"),
    (f"{EXPORT}/silver", "silver"),
    (f"{EXPORT}/gold", "gold"),
]:
    cmd = ["databricks", "fs", "cp", "-r", "--overwrite", local, f"{VOLUME}/{remote}"]
    if args.profile:
        cmd += ["--profile", args.profile]
    print(" ".join(cmd))
    if not args.dry_run:
        subprocess.run(cmd, check=True)
