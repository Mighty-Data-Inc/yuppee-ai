import type { SearchResult, Widget } from "@/types";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

type BackendWidgetChoice = {
  value: string;
  label: string;
};

type BackendWidget = {
  type: string;
  id?: string;
  variable_name?: string;
  label?: string;
  options?: BackendWidgetChoice[];
  min?: number;
  max?: number;
  step?: number;
  params?: {
    choices?: BackendWidgetChoice[];
    value_min?: number;
    value_max?: number;
  };
  value?: any;
};

function normalizeWidgetType(type: string): Widget["type"] | null {
  if (type === "dropdown") return "dropdown";
  if (type === "chipgroup" || type === "checkboxes") return "chipgroup";
  if (type === "checkbox") return "checkbox";
  if (type === "switch") return "switch";
  if (type === "slider" || type === "range-slider") return "range-slider";
  if (type === "radio") return "radio";
  if (type === "freeform") return "freeform";
  return null;
}

function normalizeWidgets(
  rawWidgets: unknown,
  currentFilters?: Record<string, any>,
): Widget[] {
  if (!Array.isArray(rawWidgets)) {
    return [];
  }

  return rawWidgets
    .map((rawWidget): Widget | null => {
      const widget = rawWidget as BackendWidget;
      const type = normalizeWidgetType(widget.type);
      if (!type) {
        return null;
      }

      const id = widget.id ?? widget.variable_name ?? widget.label ?? "widget";
      const options = widget.options ?? widget.params?.choices;

      if (type === "range-slider") {
        const min = widget.min ?? widget.params?.value_min ?? 0;
        const max = widget.max ?? widget.params?.value_max ?? 100;
        const filterValue = currentFilters?.[id];
        const value = Array.isArray(filterValue)
          ? filterValue
          : [typeof filterValue === "number" ? filterValue : min, max];

        return {
          id,
          type,
          label: widget.label ?? id,
          min,
          max,
          step: widget.step ?? 1,
          value,
        };
      }

      if (type === "checkbox" || type === "chipgroup") {
        return {
          id,
          type,
          label: widget.label ?? id,
          options,
          value: currentFilters?.[id] ?? widget.value ?? [],
        };
      }

      if (type === "dropdown" || type === "radio") {
        return {
          id,
          type,
          label: widget.label ?? id,
          options,
          value:
            currentFilters?.[id] ?? widget.value ?? options?.[0]?.value ?? "",
        };
      }

      if (type === "switch") {
        return {
          id,
          type,
          label: widget.label ?? id,
          value: Boolean(currentFilters?.[id] ?? widget.value ?? false),
        };
      }

      return {
        id,
        type,
        label: widget.label ?? id,
        value: currentFilters?.[id] ?? widget.value ?? "",
      };
    })
    .filter((widget): widget is Widget => widget !== null);
}

export async function search(
  query: string,
  filters?: Record<string, any>,
): Promise<SearchResult[]> {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, filters }),
  });
  if (!response.ok) {
    throw new Error(`Search request failed: ${response.status}`);
  }
  const data = await response.json();
  return data.results as SearchResult[];
}

export async function generateWidgets(
  query: string,
  currentFilters?: Record<string, any>,
): Promise<Widget[]> {
  const response = await fetch(`${API_BASE_URL}/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, filters: currentFilters }),
  });
  if (!response.ok) {
    throw new Error(`Refinements request failed: ${response.status}`);
  }

  const data = await response.json();
  return normalizeWidgets(
    Array.isArray(data) ? data : data.widgets,
    currentFilters,
  );
}
