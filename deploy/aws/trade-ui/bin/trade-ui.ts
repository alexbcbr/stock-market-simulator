#!/opt/homebrew/opt/node/bin/node
import * as cdk from 'aws-cdk-lib/core';
import { TradeUiStack } from '../lib/trade-ui-stack';

const app = new cdk.App();
new TradeUiStack(app, 'TradeUiStack', {
});
