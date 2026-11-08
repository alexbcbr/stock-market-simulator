.PHONY: bronze silver gold pipeline upload

bronze:
	uv run bronze_pipeline.py

silver:
	uv run silver_pipeline.py

gold:
	uv run gold_pipeline.py

# Full daily run, in order
pipeline: bronze silver gold

# Sync to Databricks (use DRY=--dry-run to only export and print the commands)
upload:
	uv run upload_to_databricks.py $(DRY)
