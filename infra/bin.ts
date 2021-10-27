#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import * as stacks from './stacks'
import { join } from 'path'

const app = new cdk.App()

const pipeline = new stacks.InfraPipelineStack(app, 'PipelineStack', {
  env: { account: app.node.tryGetContext('opsAccountId'), region: 'us-east-1' },
})

// const assets = new stacks.LambdaAssetStack(app, 'AssetStack', {
//   assetRootDirectory: join(process.cwd(), 'build/assets/rs'),
//   env: { account: app.node.tryGetContext('opsAccountId'), region: 'us-east-1' },
// })
