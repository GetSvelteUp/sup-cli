import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as Stacks from '../stacks'

export interface ArtifactsStageProps extends cdk.StageProps {}

export class ArtifactsStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: ArtifactsStageProps) {
    super(scope, id, props)

    new Stacks.CodeArtifactStack(this, 'ArtifactsStack', {})
  }
}
