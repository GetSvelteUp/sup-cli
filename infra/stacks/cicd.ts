import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  aws_codepipeline as cp,
  aws_s3 as s3,
  aws_codepipeline_actions as cpa,
  aws_kms as kms,
  aws_codebuild as cb,
  aws_secretsmanager as sm,
  aws_ssm as ssm,
  pipelines,
  aws_lambda as lambda,
  aws_events_targets as targets,
} from 'aws-cdk-lib'

import { ChildPipeline } from '../constructs'

export interface CICDStackProps extends cdk.StackProps {
  githubOwner?: string
  githubRepo: string
  triggerPath: string
  triggerRuntime?: lambda.Runtime
  triggerArch?: lambda.Architecture
}

export class CICDStack extends cdk.Stack {
  readonly project: cb.Project
  readonly source: cb.ISource
  readonly trigger: lambda.Function
  readonly githubOwner: string
  readonly githubRepo: string
  readonly triggerPath: string
  readonly triggerRuntime: lambda.Runtime
  readonly triggerArch: lambda.Architecture
  constructor(scope: Construct, id: string, props: CICDStackProps) {
    super(scope, id, props)

    this.githubRepo = props.githubRepo
    this.triggerPath = props.triggerPath
    this.githubOwner = props.githubOwner ?? 'GetSvelteUp'
    this.triggerRuntime = props.triggerRuntime ?? lambda.Runtime.NODEJS_14_X
    this.triggerArch = props.triggerArch ?? lambda.Architecture.ARM_64

    this.source = cb.Source.gitHub({
      owner: this.githubOwner,
      repo: this.githubRepo,
      webhook: true,
    })

    this.project = new cb.Project(this, 'CodeBuildProject', {
      source: this.source,
    })

    this.trigger = new lambda.Function(this, 'TriggerFunction', {
      code: lambda.Code.fromAsset(this.triggerPath),
      handler: 'index.handler',
      runtime: this.triggerRuntime,
      architecture: this.triggerArch,
    })

    this.project.onStateChange('RootProjectBuildStateChange', {
      target: new targets.LambdaFunction(this.trigger),
    })

    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket')
    const sourceBucket = new s3.Bucket(this, 'SourceBucket')

    const child = new ChildPipeline(this, 'TestChildPipe', {
      pipelineName: 'test-child-pipeline',
      pipelinePrefix: 'test-child-pipeline',
      artifactBucket: artifactBucket,
      sourceBucket: sourceBucket,
    })
  }
}
