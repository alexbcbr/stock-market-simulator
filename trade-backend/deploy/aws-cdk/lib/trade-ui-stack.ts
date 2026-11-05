import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';

export class TradeUiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Bucket name comes from trade-backend/.env (git-ignored); see .env.example
    const BUCKET_NAME = process.env.BUCKET_NAME;
    if (!BUCKET_NAME) {
      throw new Error('BUCKET_NAME is not set. Copy .env.example to .env and set BUCKET_NAME.');
    }

    // Pass --context bucketExists=true when the bucket already exists outside this stack
    // (e.g. after cdk destroy with RETAIN policy, then redeploying)
    const bucketExists = this.node.tryGetContext('bucketExists') === 'true';

    const bucket: s3.IBucket = bucketExists
      ? s3.Bucket.fromBucketName(this, 'TradeAppDeploy', BUCKET_NAME)
      : new s3.Bucket(this, 'TradeAppDeploy', {
          bucketName: BUCKET_NAME,
          removalPolicy: cdk.RemovalPolicy.RETAIN,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        });

    // CloudFront distribution in front of the S3 bucket using Origin Access Control
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
    });

    // fromBucketName sets autoCreatePolicy=false, so addToResourcePolicy is a no-op.
    // BucketPolicy creates the AWS::S3::BucketPolicy resource directly, which works on imported buckets.
    if (bucketExists) {
      const bucketPolicy = new s3.BucketPolicy(this, 'BucketPolicy', { bucket });
      bucketPolicy.document.addStatements(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [`${bucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
          },
        },
      }));
    }

    // Deploy local website files to the S3 bucket and invalidate CloudFront
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '..', 'website'))],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
      retainOnDelete: false,
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'S3 bucket name (private)',
    });
  }
}
