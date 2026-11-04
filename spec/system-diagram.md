# System Diagram

How the projects in this monorepo connect. Two interchangeable backends serve the same domain (trades, market prices); the UIs, console client and AI agents talk to one of them.

```mermaid
flowchart LR
    subgraph Data["Market data"]
        YF["yahoo-finance-stocks/<br/>import scripts (Python)"]
        CSV[("CSV files<br/>prod-data / test-data")]
        DDL["ddl/<br/>market_price.sql, trade.sql, seed.sql"]
    end

    subgraph Clients["Clients"]
        UI["trade-ui<br/>Vue 3 + Vite"]
        UIB["trade-ui-basic<br/>Vue 3 + Toast/notifications"]
        CON["trade-console<br/>Python terminal client"]
    end

    subgraph AWS["trade-backend-aws (CDK, 3 stacks)"]
        CF["TradeUiStack<br/>S3 + CloudFront"]
        APIGW["TradeControllerStack<br/>API Gateway /prod + Lambda"]
        DDB[("TradeDbStack<br/>DynamoDB: market_price,<br/>market_symbol, trade")]
    end

    subgraph K8S["trade-backend-k8s"]
        API["FastAPI :8000<br/>docker / Kubernetes"]
        SQLITE[("SQLite<br/>data/market_stock.db")]
    end

    subgraph AI["AI financial assistant"]
        MCP["MCP stocks server :8001<br/>trade-ai/stock_mcp_server.py"]
        AG1["trade-ai<br/>LangChain / LangGraph"]
        AG2["trade-ai-claude-agent-sdk"]
        AG3["trade-ai-microsoft-agent-framework"]
        BED["AWS Bedrock<br/>(LLM models)"]
    end

    subgraph Obs["Evaluation & observability"]
        ARIZE["Arize<br/>traces, datasets, experiments"]
        EVALS["evals/<br/>infer.py + judge.py"]
    end

    %% data loading
    YF -->|reads| CSV
    YF -->|import_to_dynamodb.py| DDB
    DDL -->|make create-db / seed| SQLITE

    %% UI delivery + calls
    CF -.->|serves built bundle| UI
    UI -->|REST, raw DynamoDB JSON| APIGW
    UIB -->|REST| APIGW
    UIB -.->|alternative target| API
    APIGW --> DDB
    CON -->|HTTP| API
    API --> SQLITE

    %% AI path
    AG1 & AG2 & AG3 -->|tool calls| MCP
    MCP -->|check_user, buy_stock, list_market_prices,<br/>list_trades, create_trade| API
    AG1 & AG2 & AG3 -->|inference| BED
    AG1 & AG2 & AG3 -.->|OTLP traces| ARIZE
    ARIZE -->|dataset export| EVALS
    EVALS -->|runs agent| AG1
    EVALS -->|experiment + annotations| ARIZE
```

## Notes

- **Two backends, one domain.** AWS (DynamoDB + Lambda) and FastAPI (SQLite) implement the same domain separately; trade-execution logic may differ, so check each one.
- **The AI agents only use the FastAPI backend**, through the MCP server (`:8001`) which calls FastAPI (`:8000`). Start order: FastAPI → MCP server → agent.
- **UI data shape.** Against the AWS backend the UI parses raw DynamoDB JSON in its Pinia stores.
- **Market data** is loaded into DynamoDB by `yahoo-finance-stocks/` and into SQLite from `ddl/`.
- Dashed lines are optional/alternative or non-request paths (static hosting, tracing).
