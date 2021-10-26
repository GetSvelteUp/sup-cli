import * as cdk from 'aws-cdk-lib'
import { aws_codeartifact as ca } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export interface CodeArtifactStackProps extends cdk.StackProps {}

export class CodeArtifactStack extends cdk.Stack {
  readonly domain: ca.CfnDomain
  readonly repository: ca.CfnRepository
  constructor(scope: Construct, id: string, props: CodeArtifactStackProps) {
    super(scope, id, props)

    this.domain = new ca.CfnDomain(this, 'CodeArtifactDomain', {
      domainName: 'svelteup',
    })

    this.repository = new ca.CfnRepository(this, 'PublicRepository', {
      repositoryName: 'public-npm-store',
      externalConnections: ['public:npmjs'],
      domainName: this.domain.domainName,
    })

    this.repository.addDependsOn(this.domain)
  }
}
