#!/opt/homebrew/opt/node/bin/node

import * as cdk from 'aws-cdk-lib/core';
import * as fs from 'fs';
import * as path from 'path';

// Load local settings (e.g. BUCKET_NAME) from trade-backend/.env if present. Not tracked by git.
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

import { TradeUiStack } from '../lib/trade-ui-stack';
import { TradeDbStack } from '../lib/trade-db-stack';
import { TradeControllerStack } from '../lib/trade-controller-stack';

const app = new cdk.App();
    new TradeDbStack(app, 'TradeDbStack', {});
    new TradeUiStack(app, 'TradeUiStack', {});
    new TradeControllerStack(app, 'TradeControllerStack', {});
