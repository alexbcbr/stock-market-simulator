import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class TradeDbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create market_price table
    const marketPriceTable = new dynamodb.Table(this, 'MarketPriceTable', {
      tableName: 'market_price',
      partitionKey: {
        name: 'symbol',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add validation for symbol (4 characters, uppercase)
    // Note: DynamoDB doesn't have CHECK constraints like SQL, but we can enforce this in application code

    // Create trade table
    const tradeTable = new dynamodb.Table(this, 'TradeTable', {
      tableName: 'trade',
      partitionKey: {
        name: 'trade_id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for customer_name (equivalent to the index in SQL)
    tradeTable.addGlobalSecondaryIndex({
      indexName: 'idx_trade_customer_name',
      partitionKey: {
        name: 'customer_name',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'trade_id',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Note: Foreign key constraint from trade.symbol to market_price.symbol
    // cannot be enforced in DynamoDB at the database level.
    // This should be handled in application logic.

    // Outputs
    new cdk.CfnOutput(this, 'MarketPriceTableName', {
      value: marketPriceTable.tableName,
      description: 'Market Price DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'TradeTableName', {
      value: tradeTable.tableName,
      description: 'Trade DynamoDB Table Name',
    });
  }
}