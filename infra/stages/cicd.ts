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
import { CICDStack } from '../stacks'
import { join } from 'path'

export interface CICDStageProps extends cdk.StageProps {}

export class CICDStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: CICDStageProps) {
    super(scope, id, props)

    new CICDStack(this, 'CICDStack', {
      githubRepo: 'sup-cli',
      triggerPath: join(process.cwd(), 'build/assets/cicd-trigger'),
    })
  }
}
