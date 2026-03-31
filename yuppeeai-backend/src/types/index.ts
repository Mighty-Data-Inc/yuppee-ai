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
  id: string;
  title: string;
  url: string;
  snippet?: string;
  summary?: string;
  thumbnail_url?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  query: string;
}

export interface SearchRefinementsResponse {
  report: string;
  refinements: unknown;
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
