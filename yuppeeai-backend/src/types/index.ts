import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

export type {
  RefinementResponse,
  SearchRequest,
  SearchResponse,
  SERPResult,
  Widget,
  WidgetOption,
  WidgetType,
} from "@yuppee-ai/contracts";

export type LambdaHandler = (
  event: APIGatewayProxyEvent,
  context: Context,
) => Promise<APIGatewayProxyResult>;
