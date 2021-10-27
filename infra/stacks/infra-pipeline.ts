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
      codeBuildDefaults: {
        buildEnvironment: {
          buildImage: cb.LinuxBuildImage.AMAZON_LINUX_2_ARM_2,
          computeType: cb.ComputeType.LARGE,
        },
      },
      synthCodeBuildDefaults: {
        buildEnvironment: {
          buildImage: cb.LinuxBuildImage.AMAZON_LINUX_2_ARM_2,
          computeType: cb.ComputeType.LARGE,
        },
      },
      synth: new pipelines.ShellStep('Synth', {
        input: pipelines.CodePipelineSource.connection(
          'GetSvelteUp/sup-cli',
          'main',
          {
            connectionArn: this.node.tryGetContext('githubConnectionArn'),
          },
        ),
        installCommands: ['npm i -g pnpm', 'pnpm install'],
        commands: ['pnpm run synth'],
      }),
    })

    const wave = pipeline.addWave('InfraStages', {
      pre: [],
      post: [],
    })

    wave.addStage(new Stages.ControlPlane(this, 'ControlPlane', {}))
  }
}
