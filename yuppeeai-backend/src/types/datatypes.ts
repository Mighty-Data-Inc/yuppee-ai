export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
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

export interface SearchState {
  query: string;
  results: SearchResult[];
  resultSummary: string;
  widgets: Widget[];
  refinement: string[];
  isLoading: boolean;
  preferences: Record<string, any>;
}
