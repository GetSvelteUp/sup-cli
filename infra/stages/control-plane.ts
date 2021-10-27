import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as Stacks from '../stacks'
import { join } from 'path'

export interface ControlPlaneProps extends cdk.StageProps {}

export class ControlPlane extends cdk.Stage {
  constructor(scope: Construct, id: string, props: ControlPlaneProps) {
    super(scope, id, props)

    new Stacks.LambdaAssetStack(this, 'LambdaAssetCode', {
      assetRootDirectory: join(process.cwd(), 'build/assets/rs'),
    })
  }
}
