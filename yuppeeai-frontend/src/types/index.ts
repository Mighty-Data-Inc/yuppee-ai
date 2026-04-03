export type {
  SearchResult,
  Widget,
  WidgetOption,
  WidgetType,
} from "@yuppee-ai/contracts";

import type { SearchResult, Widget } from "@yuppee-ai/contracts";

export interface SearchState {
  query: string;
  results: SearchResult[];
  resultSummary: string;
  widgets: Widget[];
  refinement: string[];
  isLoading: boolean;
  preferences: Record<string, any>;
}
