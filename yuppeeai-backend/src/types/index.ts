import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

export interface SearchRequest {
  query: string;
  filters?: Record<string, unknown>;
}

export interface SearchResult {
  id?: string;
  title: string;
  url?: string;
  snippet?: string;
  summary?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}

export interface SearchRefinementsResponse {
  query: string;
  disambiguation: string;
  describe_current_query: string;
  widgets: unknown;
}

export interface PreferencesRequest {
  userId: string;
  queryCategory?: string;
  preferences?: Record<string, unknown>;
}

export interface PreferencesResponse {
  userId: string;
  preferences: Record<string, Record<string, unknown>>;
}

export type LambdaHandler = (
  event: APIGatewayProxyEvent,
  context: Context,
) => Promise<APIGatewayProxyResult>;
