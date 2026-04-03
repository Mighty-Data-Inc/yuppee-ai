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
    type: "range-slider",
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
    expect(store.isLoadingSERP).toBe(false);
    expect(store.isLoadingWidgets).toBe(false);
    expect(store.additionalInstructionPoints).toEqual([]);
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

  it("computes hasWidgetChanges from current values vs last submit", () => {
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

    expect(store.hasWidgetChanges).toBe(true);
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
