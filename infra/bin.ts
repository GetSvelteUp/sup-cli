#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import * as stacks from './stacks'

const app = new cdk.App()

const pipeline = new stacks.InfraPipelineStack(app, 'PipelineStack', {
  env: { account: app.node.tryGetContext('opsAccountId'), region: 'us-east-1' },
})
