import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

export type {
  RefinementResponse,
  SERPRequest,
  SERPResponse,
  SERPResult,
  RefinementWidget,
  RefinementWidgetOption,
  RefinementWidgetType,
} from "@yuppee-ai/contracts";

export type LambdaHandler = (
  event: APIGatewayProxyEvent,
  context: Context,
) => Promise<APIGatewayProxyResult>;
