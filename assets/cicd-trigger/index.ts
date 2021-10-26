import {
  CodeBuildStateEventDetail,
  EventBridgeEvent,
  CodeBuildCloudWatchStateHandler,
} from 'aws-lambda'

export const handler: CodeBuildCloudWatchStateHandler = async (event) => {
  console.log(JSON.stringify(event))
}
