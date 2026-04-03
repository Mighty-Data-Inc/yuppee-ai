export interface SERPResult {
  id?: string;
  title: string;
  url?: string;
  snippet?: string;
  summary?: string;
}

export type RefinementWidgetType =
  | "range-slider"
  | "chipgroup"
  | "switch"
  | "dropdown";

export type RefinementWidgetValue = 
  | string 
  | number 
  | boolean 
  | string[] 
  | [number, number];

export interface RefinementWidgetOption {
  label: string;
  value: string;
}

export interface RefinementWidget {
  id: string;
  type: RefinementWidgetType;
  label: string;
  tooltip?: string;
  dropdownPlaceholder?: string;
  options?: RefinementWidgetOption[];
  min?: number;
  max?: number;
  step?: number;
  sliderMode?: "exact" | "lte" | "gte" | "range";
  value: RefinementWidgetValue;
}

export interface SERPRequest {
  query: string;
  widgets?: RefinementWidget[];
  instructions?: string[];
}

export interface SERPResponse {
  query: string;
  summary?: string;
  results: SERPResult[];
}

export interface RefinementRequest {
  query: string;
  widgets?: RefinementWidget[];
  instructions?: string[];
}

export interface RefinementResponse {
  query: string;
  disambiguation: string;
  widgets: RefinementWidget[];
}
