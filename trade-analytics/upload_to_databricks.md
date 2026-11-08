databricks catalogs list

databricks schemas create trade workspace
databricks volumes create workspace trade trade_raw MANAGED
databricks volumes list workspace trade

databricks fs cp -r trade.bronze dbfs:/Volumes/workspace/trade/trade_raw/bronze
databricks fs cp -r trade.silver dbfs:/Volumes/workspace/trade/trade_raw/silver
databricks fs cp -r trade.gold dbfs:/Volumes/workspace/trade/trade_raw/gold