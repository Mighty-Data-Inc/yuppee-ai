import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useYuppeeStore } from "@/stores/yuppeeStore";
import type { RefinementWidget } from "@yuppee-ai/contracts";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const MOCK_SEARCH_RESULTS = [
  {
    id: "1",
    title: "Result One",
    url: "https://example.com/1",
    snippet: "First result.",
  },
  {
    id: "2",
    title: "Result Two",
    url: "https://example.com/2",
    snippet: "Second result.",
  },
];

const MOCK_WIDGETS: RefinementWidget[] = [
  {
    id: "date-range",
    type: "slider",
    label: "Date Range",
    min: 2000,
    max: 2024,
    step: 1,
    value: [2010, 2024],
  },
];

beforeEach(() => {
  setActivePinia(createPinia());
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/refine")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ widgets: MOCK_WIDGETS, disambiguation: "" }),
        });
      }

      if (url.endsWith("/inflightmsg")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              query: "test",
              message: "Searching for books about history.",
            }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            results: MOCK_SEARCH_RESULTS,
            query: "test",
            summary: "Store test summary",
          }),
      });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("yuppeeStore", () => {
  it("initializes with empty state", () => {
    const store = useYuppeeStore();
    expect(store.query).toBe("");
    expect(store.serpResults).toEqual([]);
    expect(store.serpSummary).toBe("");
    expect(store.widgets).toEqual([]);
    expect(store.inflightMessage).toBeNull();
    expect(store.isLoadingSERP).toBe(false);
    expect(store.isLoadingWidgets).toBe(false);
    expect(store.additionalInstructionPoints).toEqual([]);
  });

  it("stores inflight message from inflight endpoint", async () => {
    const store = useYuppeeStore();
    await store.search("books about history");
    expect(store.inflightMessage).toBe("Searching for books about history.");
  });

  it("sets and clears loading flags around search", async () => {
    const store = useYuppeeStore();
    const pending = store.search("books about history");

    expect(store.isLoadingSERP).toBe(true);
    expect(store.isLoadingWidgets).toBe(true);

    await pending;

    expect(store.isLoadingSERP).toBe(false);
    expect(store.isLoadingWidgets).toBe(false);
  });

  it("updates results and refinements independently as each request resolves", async () => {
    const searchDeferred = deferred<{
      results: typeof MOCK_SEARCH_RESULTS;
      summary: string;
    }>();
    const refinementDeferred = deferred<{
      widgets: typeof MOCK_WIDGETS;
      disambiguation: string;
    }>();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/refine")) {
          return Promise.resolve({
            ok: true,
            json: () => refinementDeferred.promise,
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => searchDeferred.promise,
        });
      }),
    );

    const store = useYuppeeStore();
    const pendingSearch = store.search("books about history");

    searchDeferred.resolve({
      results: MOCK_SEARCH_RESULTS,
      summary: "Deferred summary",
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(store.serpResults.length).toBeGreaterThan(0);
    expect(store.serpSummary).toBe("Deferred summary");
    expect(store.isLoadingSERP).toBe(false);
    expect(store.isLoadingWidgets).toBe(true);

    refinementDeferred.resolve({ widgets: MOCK_WIDGETS, disambiguation: "" });
    await pendingSearch;

    expect(store.widgets.length).toBeGreaterThan(0);
    expect(store.isLoadingSERP).toBe(false);
    expect(store.isLoadingWidgets).toBe(false);
  });

  it("resets previous state when searching a new query", async () => {
    const store = useYuppeeStore();
    store.query = "crimean war books";
    store.serpResults = [...MOCK_SEARCH_RESULTS];
    store.serpSummary = "Existing summary";
    store.widgets = [...MOCK_WIDGETS];
    store.additionalInstructionPoints = ["written by a British author"];

    const pendingSearch = store.search("new science books");

    expect(store.query).toBe("new science books");
    expect(store.serpResults).toEqual([]);
    expect(store.serpSummary).toBe("");
    expect(store.widgets).toEqual([]);
    expect(store.additionalInstructionPoints).toEqual([]);

    await pendingSearch;
  });

  it("submits no widgets and includes described changes in instructions", async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/refine")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ widgets: MOCK_WIDGETS, disambiguation: "" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ results: MOCK_SEARCH_RESULTS, summary: "" }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const store = useYuppeeStore();
    const unchangedWidget: RefinementWidget = {
      id: "date-range",
      type: "slider",
      label: "Date Range",
      min: 2000,
      max: 2024,
      step: 1,
      value: [2010, 2024],
    };
    const changedWidget: RefinementWidget = {
      id: "format",
      type: "dropdown",
      label: "Format",
      options: [{ label: "Hardcover", value: "hardcover" }],
      value: "paperback",
    };
    store.query = "books about history";
    store.widgets = [unchangedWidget, changedWidget];
    store.widgetsFromLastSubmit = [
      unchangedWidget,
      { ...changedWidget, value: "hardcover" },
    ];
    store.newAdditionalInstruction = "published after 2000";

    await store.search("books about history");

    expect(store.newAdditionalInstruction).toBe("");
    expect(store.additionalInstructionPoints).toContain(
      'Format: Specifically interested in "paperback"',
    );

    const calls = fetchMock.mock.calls as [string, { body: string }][];
    for (const [, options] of calls) {
      const body = JSON.parse(options.body) as {
        instructions: string[];
      };
      expect(body).not.toHaveProperty("widgets");
      expect(body.instructions).toContain(
        'Additional instruction: "published after 2000"',
      );
      expect(body.instructions).toContain(
        'Format: Specifically interested in "paperback"',
      );
    }
  });

  it("clears disambiguation when a search is submitted", () => {
    const store = useYuppeeStore();
    store.disambiguation = {
      presumed: {
        doYouMean: "books about history",
        query: "books about history",
      },
      alternatives: [],
    };
    store.search("books about history");
    expect(store.disambiguation).toBeNull();
  });

  it("clears disambiguation at the start of a repeated search", async () => {
    const refinementDeferred = deferred<{
      widgets: typeof MOCK_WIDGETS;
      disambiguation: null;
    }>();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/refine")) {
          return Promise.resolve({
            ok: true,
            json: () => refinementDeferred.promise,
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ results: MOCK_SEARCH_RESULTS, summary: "" }),
        });
      }),
    );

    const store = useYuppeeStore();
    store.disambiguation = {
      presumed: {
        doYouMean: "books about history",
        query: "books about history",
      },
      alternatives: [],
    };
    const pendingSearch = store.search("books about history");

    expect(store.disambiguation).toBeNull();

    refinementDeferred.resolve({ widgets: MOCK_WIDGETS, disambiguation: null });
    await pendingSearch;
  });

  it("computes haveAnyValuesChanged from current values vs last submit", () => {
    const store = useYuppeeStore();
    store.widgets = [
      {
        id: "format",
        type: "dropdown",
        label: "Format",
        options: [{ label: "Hardcover", value: "hardcover" }],
        value: "paperback",
      },
    ];
    store.widgetsFromLastSubmit = [
      {
        id: "format",
        type: "dropdown",
        label: "Format",
        options: [{ label: "Hardcover", value: "hardcover" }],
        value: "hardcover",
      },
    ];

    expect(store.haveAnyValuesChanged).toBe(true);
  });

  it("computes widgetsWithChangedValues as only the changed widgets", () => {
    const store = useYuppeeStore();
    store.widgets = [
      {
        id: "format",
        type: "dropdown",
        label: "Format",
        options: [{ label: "Hardcover", value: "hardcover" }],
        value: "paperback",
      },
      {
        id: "date-range",
        type: "slider",
        label: "Date Range",
        min: 2000,
        max: 2024,
        step: 1,
        value: [2010, 2024],
      },
    ];
    store.widgetsFromLastSubmit = [
      {
        id: "format",
        type: "dropdown",
        label: "Format",
        options: [{ label: "Hardcover", value: "hardcover" }],
        value: "hardcover",
      },
      {
        id: "date-range",
        type: "slider",
        label: "Date Range",
        min: 2000,
        max: 2024,
        step: 1,
        value: [2010, 2024],
      },
    ];

    expect(store.widgetsWithChangedValues).toHaveLength(1);
    expect(store.widgetsWithChangedValues[0].id).toBe("format");
  });

  it("widgetsWithChangedValues is empty when no values have changed", () => {
    const store = useYuppeeStore();
    store.widgets = [...MOCK_WIDGETS];
    store.widgetsFromLastSubmit = [...MOCK_WIDGETS];

    expect(store.widgetsWithChangedValues).toHaveLength(0);
    expect(store.haveAnyValuesChanged).toBe(false);
  });

  it("describes changed widget values using only new values", () => {
    const store = useYuppeeStore();
    store.widgets = [
      {
        id: "format",
        type: "dropdown",
        label: "Format",
        options: [{ label: "Paperback", value: "paperback" }],
        value: "paperback",
      },
      {
        id: "date-range",
        type: "slider",
        label: "Date Range",
        min: 2000,
        max: 2024,
        step: 1,
        value: [2015, 2020],
      },
    ];
    store.widgetsFromLastSubmit = [
      {
        id: "format",
        type: "dropdown",
        label: "Format",
        options: [{ label: "Paperback", value: "paperback" }],
        value: "hardcover",
      },
      {
        id: "date-range",
        type: "slider",
        label: "Date Range",
        min: 2000,
        max: 2024,
        step: 1,
        value: [2010, 2024],
      },
    ];
    store.newAdditionalInstruction = "include peer-reviewed only";

    expect(store.describeChangedWidgetValues).toEqual([
      'Format: Specifically interested in "Paperback"',
      "Date Range: Looking for values in the range 2015-2020",
      'Additional instruction: "include peer-reviewed only"',
    ]);
  });

  it("describeChangedWidgetValues is empty when there are no changes", () => {
    const store = useYuppeeStore();
    store.widgets = [...MOCK_WIDGETS];
    store.widgetsFromLastSubmit = [...MOCK_WIDGETS];

    expect(store.describeChangedWidgetValues).toEqual([]);
  });

  it("clears state with reset", async () => {
    const store = useYuppeeStore();
    await store.search("books");
    store.reset();

    expect(store.query).toBe("");
    expect(store.serpResults).toEqual([]);
    expect(store.serpSummary).toBe("");
    expect(store.widgets).toEqual([]);
    expect(store.additionalInstructionPoints).toEqual([]);
    expect(store.newAdditionalInstruction).toBe("");
  });
});
