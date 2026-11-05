# Local settings (S3_BUCKET, API_URL) live in .env — copy .env.example to .env
-include .env

deploy-ui:
	cd trade-ui && bun run build && aws s3 sync dist $(S3_BUCKET) --delete

create-db-sqlite3:
	sqlite3 data/market_stock.db ".tables" && sqlite3 data/market_stock.db ".schema"

# CDK commands
deploy-ui:
	cd trade-backend && bun install && bun run build && bun run cdk deploy TradeUiStack

deploy-db:
	cd trade-backend && bun install && bun run build && bun run cdk deploy TradeDbStack

deploy-controller:
	cd trade-backend && bun install && bun run build && bun run cdk deploy TradeControllerStack

deploy-all:
	cd trade-backend && bun install && bun run build && bun run cdk deploy --all

diff-controller:
	cd trade-backend && bun run cdk diff TradeControllerStack

deploy:
	cdk deploy TradeDbStack
	cdk deploy TradeControllerStack

test-api:
	curl $(API_URL)/listAllTrades
	curl -X POST $(API_URL)/listTradesByCustomerName \
  		-H "Content-Type: application/json" \
  		-d '{"customer_name": "alex"}'


# Run once per clone: enables the tracked git hooks in .githooks/
setup-hooks:
	git config core.hooksPath .githooks
