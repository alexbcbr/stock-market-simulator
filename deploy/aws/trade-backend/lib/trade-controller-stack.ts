import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

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
          },
          {
            statusCode: '500',
            responseTemplates: {
              'application/json': '{"error": "Internal Server Error"}',
            },
            selectionPattern: '5\\d{2}',
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
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
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
          },
          {
            statusCode: '400',
            responseTemplates: {
              'application/json': '{"error": "Bad Request - customer_name is required"}',
            },
            selectionPattern: '4\\d{2}',
          },
          {
            statusCode: '500',
            responseTemplates: {
              'application/json': '{"error": "Internal Server Error"}',
            },
            selectionPattern: '5\\d{2}',
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
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
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
  }
}