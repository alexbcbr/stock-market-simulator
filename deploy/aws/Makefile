S3_BUCKET := s3://com.trade.web

deploy:
	cd ../../trade-ui && npm run build && aws s3 sync dist $(S3_BUCKET) --delete

create-db:
	sqlite3 data/market_stock.db ".tables" && sqlite3 data/market_stock.db ".schema"