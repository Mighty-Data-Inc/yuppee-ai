export interface SERPResult {
  id?: string;
  title: string;
  url?: string;
  snippet?: string;
  summary?: string;
}

export type RefinementWidgetType =
  | "slider"
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
  instructions?: string[];
}

export interface SERPResponse {
  query: string;
  summary?: string;
  results: SERPResult[];
}

export interface DisambiguationOption {
  doYouMean: string;
  query: string;
}

export interface Disambiguation {
  presumed: DisambiguationOption;
  alternatives: DisambiguationOption[];
}

export interface RefinementRequest {
  query: string;
  instructions?: string[];
}

export interface RefinementResponse {
  query: string;
  widgets: RefinementWidget[];
  disambiguation?: Disambiguation;
}
