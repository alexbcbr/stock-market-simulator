# F-011 Plan

1. **Bronze** (done): `bronze_pipeline.py`, dated Parquet copy of every SQLite table. Covers R1.
2. **Silver** (done): `silver_pipeline.py`, joins and Iceberg upsert on `trade_id`, first-seen `date`. Covers R2, R3, R7.
3. **Gold** (done): `gold_pipeline.py`, `gold.daily_customer_symbol`, month partition, incremental by date and `--date` rebuild. Covers R4, R5, R6, R7.
4. **Databricks sync** (done): `upload_to_databricks.py`, export of silver and gold to Parquet and upload with the Databricks CLI. Covers R8, R9, R10.
5. **Docs** (done): module docstrings in each script and `trade-analytics/README.md`.
6. **Run the real upload** (to do by hand): see `validation.md`.
7. **Later** (planned): create the Delta tables in Databricks from the uploaded files; scheduling; a real trade date (roadmap Phase 1, item 2); a failure-rate measure in gold if wanted; a quantity per trade so gold can hold traded value; automated tests.
