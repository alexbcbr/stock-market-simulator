#!/opt/homebrew/opt/node/bin/node

import * as cdk from 'aws-cdk-lib/core';

import { TradeUiStack } from '../lib/trade-ui-stack';
import { TradeDbStack } from '../lib/trade-db-stack';
import { TradeControllerStack } from '../lib/trade-controller-stack';

const app = new cdk.App();
    new TradeDbStack(app, 'TradeDbStack', {});
    new TradeUiStack(app, 'TradeUiStack', {});
    new TradeControllerStack(app, 'TradeControllerStack', {});
