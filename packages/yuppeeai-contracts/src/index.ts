export interface SearchResult {
  id?: string;
  title: string;
  url?: string;
  snippet?: string;
  summary?: string;
}

export type WidgetType =
  | "range-slider"
  | "chipgroup"
  | "switch"
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
  tooltip?: string;
  dropdownPlaceholder?: string;
  options?: WidgetOption[];
  min?: number;
  max?: number;
  step?: number;
  sliderMode?: "exact" | "lte" | "gte" | "range";
  value: any;
}

export interface SearchRequest {
  query: string;
  filters?: {
    widgets?: Record<string, Widget>;
    additionalInstructionPoints?: string[];
  };
}

export interface SearchResponse {
  query: string;
  summary?: string;
  results: SearchResult[];
}

export interface SearchRefinementsResponse {
  query: string;
  disambiguation: string;
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
