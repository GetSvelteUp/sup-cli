import * as cdk from 'aws-cdk-lib'
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as Stacks from '../stacks'
import { join } from 'path'
import * as apigateway from '@aws-cdk/aws-apigatewayv2-alpha'
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha'

export interface ControlPlaneProps extends cdk.StageProps {}

export class ControlPlaneDataLayer extends cdk.Stack {
  readonly table: dynamodb.Table

  constructor(scope: Construct, id: string, props: any) {
    super(scope, id, props)
    this.table = new dynamodb.Table(this, 'ControlPlaneData', {})
  }
}

export class ControlPlaneApiLayer extends cdk.Stack {
  readonly api: apigateway.HttpApi
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id, props)
    this.api = new apigateway.HttpApi(this, 'HttpApi')
  }
}

export class ControlPlane extends cdk.Stage {
  readonly dataLayer: ControlPlaneDataLayer
  readonly lambdaAssets: Stacks.LambdaAssetStack
  readonly apiLayer: ControlPlaneApiLayer

  constructor(scope: Construct, id: string, props: ControlPlaneProps) {
    super(scope, id, props)

    this.dataLayer = new ControlPlaneDataLayer(this, 'DataLayer', {})

    this.lambdaAssets = new Stacks.LambdaAssetStack(this, 'LambdaAssetCode', {
      assetRootDirectory: join(process.cwd(), 'build/assets/rs'),
    })

    this.apiLayer = new ControlPlaneApiLayer(this, 'ApiLayer', {})
  }
}
