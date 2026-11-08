"""Bronze layer: raw copy of every SQLite table to Parquet.

Reads the SQLite database at `FILE_PATH` (from `.env`) and writes one file per table to
`trade.bronze/<YYYYMMDD>_<table>.parquet`, where the date is the run date. Tables are discovered
at run time, so no schema is defined here. Each run is a full copy; re-running on the same day
overwrites that day's files.
"""

import os
import sqlite3
from datetime import date

import pandas as pd
from dotenv import load_dotenv

load_dotenv()
con = sqlite3.connect(os.environ["FILE_PATH"])
# Every user table, skipping SQLite's internal sqlite_* tables.
tables = [
    r[0]
    for r in con.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
]

for t in tables:
    out = f"trade.bronze/{date.today():%Y%m%d}_{t}.parquet"
    pd.read_sql(f'SELECT * FROM "{t}"', con).to_parquet(out, index=False)
    print("wrote", out)
