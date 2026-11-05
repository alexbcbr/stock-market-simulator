# Trade Backend CDK Stacks

This CDK project contains three stacks for the stock market simulator:

## Stacks

### TradeDbStack
Creates DynamoDB tables:
- `market_price` table (partition key: `symbol`)
- `trade` table (partition key: `trade_id`, GSI: `idx_trade_customer_name`)

### TradeUiStack
Creates frontend infrastructure:
- S3 bucket for static website hosting
- CloudFront distribution
- Bucket deployment

### TradeControllerStack
Creates API Gateway with REST API for trade operations:

#### Endpoints

**GET /listAllTrades**
- Lists all trades from the DynamoDB table
- No parameters required
- Returns array of trade records

**POST /listTradesByCustomerName**
- Filters trades by customer name
- Body: `{"customer_name": "customer_name_value"}`
- Returns array of trade records for the specified customer

#### Features
- Direct DynamoDB integration (no Lambda functions)
- Public API (no authentication required)
- Uses DynamoDB Scan for listAllTrades
- Uses DynamoDB Query with GSI for listTradesByCustomerName

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy all stacks to your default AWS account/region
* `npx cdk deploy TradeDbStack`  deploy only database stack
* `npx cdk deploy TradeUiStack`  deploy only UI stack
* `npx cdk deploy TradeControllerStack`  deploy only API stack
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
