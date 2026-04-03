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
  value: any;
}

export interface SERPRequest {
  query: string;
  filters?: {
    widgets?: Record<string, RefinementWidget>;
    additionalInstructionPoints?: string[];
  };
}

export interface SERPResponse {
  query: string;
  summary?: string;
  results: SERPResult[];
}

export interface RefinementResponse {
  query: string;
  disambiguation: string;
  widgets: RefinementWidget[];
}
