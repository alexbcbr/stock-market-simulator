import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';

export class TradeControllerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create IAM role for API Gateway to access DynamoDB
    const apiGatewayRole = new iam.Role(this, 'ApiGatewayDynamoDBRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBReadOnlyAccess'),
      ],
    });

    // Create REST API
    const api = new apigateway.RestApi(this, 'TradeApi', {
      restApiName: 'trade-api',
      description: 'Trade API for listing trades',
      deployOptions: {
        stageName: 'prod',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Create resource for listAllTrades
    const listAllTradesResource = api.root.addResource('listAllTrades');

    // Integration for listing all trades (Scan operation)
    const listAllTradesIntegration = new apigateway.AwsIntegration({
      service: 'dynamodb',
      action: 'Scan',
      options: {
        credentialsRole: apiGatewayRole,
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
        requestTemplates: {
          'application/json': JSON.stringify({
            TableName: 'trade',
          }),
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': '$input.path(\'$.Items\')',
            },
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '500',
            responseTemplates: {
              'application/json': '{"error": "Internal Server Error"}',
            },
            selectionPattern: '5\\d{2}',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
        ],
      },
    });

    // Add GET method for listAllTrades
    listAllTradesResource.addMethod('GET', listAllTradesIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // Create resource for listTradesByCustomerName
    const listTradesByCustomerResource = api.root.addResource('listTradesByCustomerName');

    // Integration for listing trades by customer name (Query operation using GSI)
    const listTradesByCustomerIntegration = new apigateway.AwsIntegration({
      service: 'dynamodb',
      action: 'Query',
      options: {
        credentialsRole: apiGatewayRole,
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
        requestTemplates: {
          'application/json': JSON.stringify({
            TableName: 'trade',
            IndexName: 'idx_trade_customer_name',
            KeyConditionExpression: 'customer_name = :customer_name',
            ExpressionAttributeValues: {
              ':customer_name': {
                S: '$input.path(\'$.customer_name\')',
              },
            },
          }),
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': '$input.path(\'$.Items\')',
            },
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '400',
            responseTemplates: {
              'application/json': '{"error": "Bad Request - customer_name is required"}',
            },
            selectionPattern: '4\\d{2}',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '500',
            responseTemplates: {
              'application/json': '{"error": "Internal Server Error"}',
            },
            selectionPattern: '5\\d{2}',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
        ],
      },
    });

    // Add POST method for listTradesByCustomerName (using POST to pass customer_name in body)
    listTradesByCustomerResource.addMethod('POST', listTradesByCustomerIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // Create resource for listMarketPrices
    const listMarketPricesResource = api.root.addResource('listMarketPrices');

    // Integration for listing all market prices (Scan operation)
    const listMarketPricesIntegration = new apigateway.AwsIntegration({
      service: 'dynamodb',
      action: 'Scan',
      options: {
        credentialsRole: apiGatewayRole,
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
        requestTemplates: {
          'application/json': JSON.stringify({
            TableName: 'market_price',
          }),
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': '$input.path(\'$.Items\')',
            },
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '500',
            responseTemplates: {
              'application/json': '{"error": "Internal Server Error"}',
            },
            selectionPattern: '5\\d{2}',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
        ],
      },
    });

    // Add GET method for listMarketPrices
    listMarketPricesResource.addMethod('GET', listMarketPricesIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // Reference existing DynamoDB tables
    const tradeTable = dynamodb.Table.fromTableName(this, 'TradeTable', 'trade');
    const marketPriceTable = dynamodb.Table.fromTableName(this, 'MarketPriceTable', 'market_price');

    // Create Lambda function for buyStock
    const buyStockFunction = new NodejsFunction(this, 'BuyStockFunction', {
      entry: path.join(__dirname, '../src/handlers/buyStock.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      environment: {
        TRADE_TABLE: tradeTable.tableName,
      },
      bundling: {
        externalModules: [],
      },
    });

    // Grant Lambda permission to write to DynamoDB
    tradeTable.grantWriteData(buyStockFunction);

    // Create resource for buyStock
    const buyStockResource = api.root.addResource('buyStock');

    // Add POST method for buyStock with Lambda integration
    buyStockResource.addMethod('POST', new apigateway.LambdaIntegration(buyStockFunction), {
      methodResponses: [
        {
          statusCode: '201',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // Create Lambda function for getMarketPrice
    const getMarketPriceFunction = new NodejsFunction(this, 'GetMarketPriceFunction', {
      entry: path.join(__dirname, '../src/handlers/getMarketPrice.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      environment: {
        MARKET_PRICE_TABLE: marketPriceTable.tableName,
      },
      bundling: {
        externalModules: [],
      },
    });

    // Grant Lambda permission to read from market_price table
    marketPriceTable.grantReadData(getMarketPriceFunction);

    // Create resource for getMarketPrice
    const getMarketPriceResource = api.root.addResource('getMarketPrice');

    // Add GET method for getMarketPrice with Lambda integration
    getMarketPriceResource.addMethod('GET', new apigateway.LambdaIntegration(getMarketPriceFunction), {
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '404',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ListAllTradesEndpoint', {
      value: `${api.url}listAllTrades`,
      description: 'List All Trades Endpoint',
    });

    new cdk.CfnOutput(this, 'ListTradesByCustomerEndpoint', {
      value: `${api.url}listTradesByCustomerName`,
      description: 'List Trades by Customer Name Endpoint',
    });

    new cdk.CfnOutput(this, 'BuyStockEndpoint', {
      value: `${api.url}buyStock`,
      description: 'Buy Stock Endpoint',
    });

    new cdk.CfnOutput(this, 'ListMarketPricesEndpoint', {
      value: `${api.url}listMarketPrices`,
      description: 'List Market Prices Endpoint',
    });

    new cdk.CfnOutput(this, 'GetMarketPriceEndpoint', {
      value: `${api.url}getMarketPrice`,
      description: 'Get Market Price by Symbol Endpoint',
    });
  }
}