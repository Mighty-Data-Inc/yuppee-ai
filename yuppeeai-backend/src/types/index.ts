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
  snippet: string;
  score?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  query: string;
}

export type WidgetType =
  | "radio"
  | "range-slider"
  | "checkbox"
  | "dropdown"
  | "freeform";

export interface WidgetOption {
  label: string;
  value: string;
}

export interface Widget {
  id: string;
  type: WidgetType;
  label: string;
  options?: WidgetOption[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: unknown;
}

export interface WidgetsRequest {
  query: string;
  currentFilters?: Record<string, unknown>;
}

export interface WidgetsResponse {
  widgets: Widget[];
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
