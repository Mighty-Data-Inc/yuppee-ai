export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
}

export type WidgetType =
  | "radio"
  | "range-slider"
  | "checkbox"
  | "chipgroup"
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
  value: any;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  widgets: Widget[];
  refinement: string;
  isLoading: boolean;
  preferences: Record<string, any>;
}
