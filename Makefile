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


# Python API docs: runs pydoc and writes the HTML pages into docs/<project>/, one folder per project
# (same convention as docs/trade-backend from `make typedoc`).
# pydoc IMPORTS every module it documents, so modules that run work on import are left out on purpose
# (for example trade-ai/stock_mcp_server.py starts a server).
pydoc:
	mkdir -p docs/trade-backend-python docs/trade-ai docs/trade-ai-claude-agent-sdk
	rm -f docs/trade-backend-python/*.html docs/trade-ai/*.html docs/trade-ai-claude-agent-sdk/*.html
	cd trade-backend-python && PYTHONPATH=. uv run python -m pydoc -w $$(find app -name '*.py' ! -name '__init__.py' | sed 's#/#.#g; s#\.py$$##' | sort) && mv *.html ../docs/trade-backend-python/
	cd trade-ai && uv run python -m pydoc -w ./01fin_assistant.py ./02fin_assistant_with_tools.py ./03fin_assistant_async.py ./stock_mcp_client.py && mv *.html ../docs/trade-ai/
	cd trade-ai-claude-agent-sdk && uv run python -m pydoc -w ./finance_advisor_app.py ./finance_evaluators.py ./finance_support_app.py && mv *.html ../docs/trade-ai-claude-agent-sdk/

# TypeScript API docs: TypeDoc reads the TSDoc comments in trade-backend/src and writes an HTML site to
# docs/trade-backend/ (config: trade-backend/typedoc.json). It only reads the source and runs none of it.
# `make pydoc` only deletes the *.html files inside its own folders, so it leaves this one alone.
typedoc:
	cd trade-backend && bun install && bunx typedoc

# Run once per clone: enables the tracked git hooks in .githooks/
setup-hooks:
	git config core.hooksPath .githooks
