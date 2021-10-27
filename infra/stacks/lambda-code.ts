import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  aws_iam as iam,
  aws_s3 as s3,
  aws_lambda as lambda,
  aws_s3_assets as assets,
  aws_s3_deployment as s3deploy,
  pipelines,
  aws_secretsmanager as secrets,
  aws_kms as kms,
} from 'aws-cdk-lib'
import { join } from 'path'
import * as fs from 'fs-jetpack'
import * as apigateway from '@aws-cdk/aws-apigatewayv2-alpha'
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha'

export interface LambdaCodeAssetConfig {
  lambdaName: string
  lambdaPath: string
  lambdaPrefix: string
}

export interface LambdaAssetMapEntry {
  type: 'lambda'
  config: LambdaCodeAssetConfig
  asset: lambda.S3Code
  deployment: s3deploy.BucketDeployment
  bucket: s3.IBucket
}

export interface LambadAssetStackProps extends cdk.StackProps {
  assetRootDirectory: string
}

export class LambdaAssetStack extends cdk.Stack {
  readonly workingBucket: s3.IBucket
  readonly assetBucket: s3.IBucket
  readonly assetMap = new Map<string, LambdaAssetMapEntry>()
  readonly assetDirs: string[] = []

  constructor(
    scope: Construct,
    id: string,
    protected readonly props: LambadAssetStackProps,
  ) {
    super(scope, id, props)

    this.assetDirs = this.collectAssetDirectories()

    this.workingBucket = new s3.Bucket(this, 'WorkingBucket', {})

    this.assetBucket = new s3.Bucket(this, 'AssetBucket', {
      versioned: true,
    })

    this.bootstrapAssets()
  }

  private bootstrapAssets() {
    for (const assetDir of this.assetDirs) {
      const config: LambdaAssetMapEntry['config'] = {
        lambdaName: assetDir,
        lambdaPrefix: `lambda/${assetDir}`,
        lambdaPath: join(this.props.assetRootDirectory, assetDir),
      }

      const deployment = new s3deploy.BucketDeployment(
        this,
        `${assetDir}-Deployment`,
        {
          sources: [s3deploy.Source.asset(config.lambdaPath)],
          destinationBucket: this.assetBucket,
          destinationKeyPrefix: config.lambdaPrefix,
          retainOnDelete: true,
        },
      )
      const asset = lambda.AssetCode.fromBucket(
        this.assetBucket,
        config.lambdaPrefix,
      )

      const handlerEntry: LambdaAssetMapEntry = {
        config,
        deployment,
        asset,
        type: 'lambda',
        bucket: this.assetBucket,
      }

      this.assetMap.set(config.lambdaName, handlerEntry)
    }
  }

  private collectAssetDirectories() {
    const assetDirs = fs.list(this.props.assetRootDirectory)

    if (!assetDirs) {
      throw new Error(
        `Could not locate any assets at ${this.props.assetRootDirectory}`,
      )
    }
    return assetDirs
  }

  getAsset(name: string): LambdaAssetMapEntry {
    const asset = this.assetMap.get(name)
    if (!asset) {
      throw new Error(`Could not locate asset for name: ${name}`)
    }
    return asset
  }
}
