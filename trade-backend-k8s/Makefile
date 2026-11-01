all: run-local

run-local:
	uv run uvicorn app.main:app --reload

test:
	uv run pytest

create-db:
	rm -f ../data/market_stock.db
	sqlite3 ../data/market_stock.db < ../ddl/market_price.sql
	sqlite3 ../data/market_stock.db < ../ddl/trade.sql

seed:
	sqlite3 ../data/market_stock.db < ../ddl/seed.sql