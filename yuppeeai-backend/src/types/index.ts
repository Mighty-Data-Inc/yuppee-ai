// TODO: For Firebase Cloud Functions v2 deployment, each handler entry point
// should be exported via onRequest() from firebase-functions/v2/https, e.g.:
//   import { onRequest } from "firebase-functions/v2/https";
//   export const search = onRequest(searchHandler);
//
// The HttpRequest/HttpResponse interfaces below are intentionally compatible
// with the Express-based req/res that Firebase Cloud Functions v2 provides,
// making the future wrap straightforward.

export interface HttpRequest {
  body: string | null;
  headers: Record<string, string | undefined>;
  httpMethod?: string;
}

export interface HttpResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export type HttpHandler = (request: HttpRequest) => Promise<HttpResponse>;

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
