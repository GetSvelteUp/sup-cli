import * as cdk from 'aws-cdk-lib'
import {
  aws_codepipeline as cp,
  aws_s3 as s3,
  aws_codepipeline_actions as cpa,
  aws_kms as kms,
  aws_codebuild as cb,
  aws_secretsmanager as sm,
  aws_ssm as ssm,
  pipelines,
} from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as Stages from '../stages'

export interface InfraPipelineStackProps extends cdk.StackProps {}

export class InfraPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfraPipelineStackProps) {
    super(scope, id, props)

    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      selfMutation: false,
      crossAccountKeys: true,
      synth: new pipelines.ShellStep('Synth', {
        input: pipelines.CodePipelineSource.connection(
          'GetSvelteUp/sup-cli',
          'main',
          {
            connectionArn: this.node.tryGetContext('githubConnectionArn'),
          },
        ),
        installCommands: ['npm i -g pnpm', 'pnpm install'],
        commands: ['pnpm exec cdk synth'],
      }),
    })

    pipeline.addStage(
      new Stages.ArtifactsStage(this, 'ArtifactsProd', {
        env: {
          region: 'us-east-1',
          account: this.node.tryGetContext('artifactsAccountId'),
        },
      }),
    )

    pipeline.addStage(
      new Stages.CICDStage(this, 'CICDProd', {
        env: {
          region: 'us-east-1',
          account: this.node.tryGetContext('opsAccountId'),
        },
      }),
    )
  }
}
