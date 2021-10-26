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
  aws_events as events,
} from 'aws-cdk-lib'

export interface ChildPipelineProps {
  pipelineName: string
  pipelinePrefix: string
  artifactBucket: s3.IBucket
  sourceBucket: s3.IBucket
}

export class ChildPipeline extends Construct {
  readonly pipeline: cp.Pipeline
  readonly pipelineArnParam: ssm.StringParameter
  readonly pipelineTriggerParam: ssm.StringParameter
  constructor(scope: Construct, id: string, props: ChildPipelineProps) {
    super(scope, id)

    const project = new cb.Project(this, 'CodeBuildProject', {
      buildSpec: cb.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['echo "Hello from install"'],
          },
          pre_build: {
            commands: ['echo "Hello from pre-build"'],
          },
          build: {
            commands: ['echo "Hello from build"'],
          },
        },
      }),
    })

    const sourceOutput = new cp.Artifact()
    const artifactOutput = new cp.Artifact()

    const sourceAction = new cpa.CodeStarConnectionsSourceAction({
      connectionArn: this.node.tryGetContext('githubConnectionArn'),
      triggerOnPush: false,
      owner: 'GetSvelteUp',
      repo: 'sup-cli',
      output: sourceOutput,
      actionName: 'CloneRepo',
    })

    const buildAction = new cpa.CodeBuildAction({
      actionName: 'CodeBuild',
      project: project,
      outputs: [artifactOutput],
      input: sourceOutput,
    })

    this.pipeline = new cp.Pipeline(this, 'ChildPipeline', {
      artifactBucket: props.artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Build',
          actions: [buildAction],
        },
      ],
    })

    this.pipelineTriggerParam = new ssm.StringParameter(
      this,
      'ParameterTrigger',
      {
        // allowedPattern: '*',
        description: `${props.pipelineName} Trigger `,
        parameterName: `/pipelines/${props.pipelinePrefix}/trigger`,
        stringValue: `${props.pipelineName}`,
      },
    )

    this.pipelineArnParam = new ssm.StringParameter(this, 'ParameterArn', {
      //   allowedPattern: '*',
      description: `${props.pipelineName} Arn`,
      parameterName: `/pipelines/${props.pipelinePrefix}/arn`,
      stringValue: this.pipeline.pipelineArn,
    })

    const rule = new events.Rule(this, 'Trigger', {
      eventPattern: {
        detail: {
          action: 'INVOKE',
          pipeline: this.pipelineTriggerParam.stringValue,
        },
      },
    })

    rule.addTarget(new targets.CodePipeline(this.pipeline))
  }
}
