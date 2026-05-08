S3_BUCKET := s3://com.trade.web

deploy-ui:
	cd ../../trade-ui && npm run build && aws s3 sync dist $(S3_BUCKET) --delete

create-db-sqlite3:
	sqlite3 data/market_stock.db ".tables" && sqlite3 data/market_stock.db ".schema"

# CDK commands
deploy-ui:
	cd trade-backend && npm install && npm run build && npx cdk deploy TradeUiStack

deploy-db:
	cd trade-backend && npm install && npm run build && npx cdk deploy TradeDbStack

deploy-controller:
	cd trade-backend && npm install && npm run build && npx cdk deploy TradeControllerStack

deploy-all:
	cd trade-backend && npm install && npm run build && npx cdk deploy

diff-controller:
	cd trade-backend && npx cdk diff TradeControllerStack

deploy:
	cdk deploy TradeDbStack
	cdk deploy TradeControllerStack

test-api:
	curl https://qwppyg6xa5.execute-api.us-east-2.amazonaws.com/prod/listAllTrades
	curl -X POST https://qwppyg6xa5.execute-api.us-east-2.amazonaws.com/prod/listTradesByCustomerName \
  		-H "Content-Type: application/json" \
  		-d '{"customer_name": "alex"}'

