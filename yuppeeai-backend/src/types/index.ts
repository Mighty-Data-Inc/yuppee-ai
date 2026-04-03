import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

export type {
  RefinementResponse,
  RefinementRequest,
  SERPRequest,
  SERPResponse,
  SERPResult,
  RefinementWidget,
  RefinementWidgetOption,
  RefinementWidgetType,
  Disambiguation,
  DisambiguationOption,
} from "@yuppee-ai/contracts";

export type LambdaHandler = (
  event: APIGatewayProxyEvent,
  context: Context,
) => Promise<APIGatewayProxyResult>;
