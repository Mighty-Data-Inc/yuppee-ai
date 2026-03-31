import { SearchProvider } from "../services/searchProvider";

describe("SearchProvider cleanRefinements", () => {
  function makeBaseRaw() {
    return {
      disambiguation: {
        was_disambiguation_necessary: false,
        assumption_statement: "",
        query_rephrased_with_assumption: "",
        other_alternative_potential_meanings: [],
      },
      widgets: [] as any[],
    };
  }

  it("converts single-choice dropdown into switch", () => {
    const provider = new SearchProvider({ useMock: true });
    const raw = makeBaseRaw();
    raw.widgets = [
      {
        widget_type: "dropdown",
        widget_variable_name: "topic",
        widget_label: "Topic",
        widget_descriptive_title: {
          teleological: "Limit to one topic",
          provides_examples: "",
          direct: "",
        },
        widget_params: {
          choices: [
            {
              choice_variable_value: "menendez",
              choice_ui_label: "Menendez Brothers",
            },
          ],
        },
      },
    ];

    const cleaned = (provider as any).cleanRefinements(raw);
    expect(cleaned.widgets[0]).toEqual({
      type: "switch",
      variable_name: "topic",
      label: "Show only results about: Topic",
      tooltip: "Limit to one topic",
    });
    expect(cleaned.widgets[0]).not.toHaveProperty("params");
  });

  it("keeps multi-choice dropdown and normalizes choices", () => {
    const provider = new SearchProvider({ useMock: true });
    const raw = makeBaseRaw();
    raw.widgets = [
      {
        widget_type: "dropdown",
        widget_variable_name: "category",
        widget_label: "Category",
        widget_descriptive_title: {
          teleological: "Filter by category",
          provides_examples: "",
          direct: "",
        },
        widget_params: {
          choices: [
            { choice_variable_value: "trial", choice_ui_label: "Trial" },
            { choice_variable_value: "appeal", choice_ui_label: "Appeal" },
          ],
        },
      },
    ];

    const cleaned = (provider as any).cleanRefinements(raw);
    expect(cleaned.widgets[0]).toEqual({
      type: "dropdown",
      variable_name: "category",
      label: "Category",
      tooltip: "Filter by category",
      params: {
        choices: [
          { value: "trial", label: "Trial" },
          { value: "appeal", label: "Appeal" },
        ],
      },
    });
  });

  it("renames checkboxes type to chipgroup", () => {
    const provider = new SearchProvider({ useMock: true });
    const raw = makeBaseRaw();
    raw.widgets = [
      {
        widget_type: "checkboxes",
        widget_variable_name: "topics",
        widget_label: "Topics",
        widget_descriptive_title: {
          teleological: "Filter topics",
          provides_examples: "",
          direct: "",
        },
        widget_params: {
          choices: [
            { choice_variable_value: "trial", choice_ui_label: "Trial" },
            { choice_variable_value: "appeal", choice_ui_label: "Appeal" },
          ],
        },
      },
    ];

    const cleaned = (provider as any).cleanRefinements(raw);
    expect(cleaned.widgets[0].type).toBe("chipgroup");
  });

  it("uses label_for_switch_on as label for native switch widgets", () => {
    const provider = new SearchProvider({ useMock: true });
    const raw = makeBaseRaw();
    raw.widgets = [
      {
        widget_type: "switch",
        widget_variable_name: "in_stock",
        widget_label: "In Stock",
        widget_descriptive_title: {
          teleological: "Only show available items",
          provides_examples: "",
          direct: "",
        },
        widget_params: {
          label_for_switch_on: "Show only in-stock items",
          label_for_switch_off: "Show all items regardless of stock status",
        },
      },
    ];

    const cleaned = (provider as any).cleanRefinements(raw);
    expect(cleaned.widgets[0]).toEqual({
      type: "switch",
      variable_name: "in_stock",
      label: "Show only in-stock items",
      tooltip: "Only show available items",
    });
    expect(cleaned.widgets[0]).not.toHaveProperty("params");
  });
});
