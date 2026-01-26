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

    // Outputs
    new cdk.CfnOutput(this, 'MarketPriceTableName', {
      value: marketPriceTable.tableName,
      description: 'Market Price DynamoDB Table',
    });

    new cdk.CfnOutput(this, 'TradeTableName', {
      value: tradeTable.tableName,
      description: 'Trade DynamoDB Table',
    });
  }
}