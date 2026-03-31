import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSearchStore } from "@/stores/searchStore";

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
  {
    id: "3",
    title: "Result Three",
    url: "https://example.com/3",
    snippet: "Third result.",
  },
];

const MOCK_WIDGETS = [
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
      if (url.endsWith("/search/refinements")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ widgets: MOCK_WIDGETS }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            results: MOCK_SEARCH_RESULTS,
            totalCount: MOCK_SEARCH_RESULTS.length,
            query: "test",
          }),
      });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchStore", () => {
  it("initializes with empty state", () => {
    const store = useSearchStore();
    expect(store.query).toBe("");
    expect(store.results).toHaveLength(0);
    expect(store.widgets).toHaveLength(0);
    expect(store.isLoadingResults).toBe(false);
    expect(store.isLoadingWidgets).toBe(false);
    expect(store.isLoading).toBe(false);
  });

  it("sets loading state during performSearch", async () => {
    const store = useSearchStore();
    const loadingStates: boolean[] = [];

    const promise = store.performSearch("books about history");
    loadingStates.push(store.isLoading); // Should be true at start

    await promise;
    loadingStates.push(store.isLoading); // Should be false after

    expect(loadingStates[0]).toBe(true);
    expect(loadingStates[1]).toBe(false);
  });

  it("updates results and refinements independently as each request resolves", async () => {
    const searchDeferred = deferred<{
      results: typeof MOCK_SEARCH_RESULTS;
      totalCount: number;
      query: string;
    }>();
    const refinementDeferred = deferred<{ widgets: typeof MOCK_WIDGETS }>();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/search/refinements")) {
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

    const store = useSearchStore();
    const pendingSearch = store.performSearch("books about history");

    expect(store.isLoadingResults).toBe(true);
    expect(store.isLoadingWidgets).toBe(true);

    searchDeferred.resolve({
      results: MOCK_SEARCH_RESULTS,
      totalCount: MOCK_SEARCH_RESULTS.length,
      query: "test",
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(store.results.length).toBeGreaterThan(0);
    expect(store.isLoadingResults).toBe(false);
    expect(store.isLoadingWidgets).toBe(true);

    refinementDeferred.resolve({ widgets: MOCK_WIDGETS });
    await pendingSearch;

    expect(store.widgets.length).toBeGreaterThan(0);
    expect(store.isLoadingResults).toBe(false);
    expect(store.isLoadingWidgets).toBe(false);
  });

  it("populates results after performSearch", async () => {
    const store = useSearchStore();
    await store.performSearch("books about Crimean War");
    expect(store.results.length).toBeGreaterThan(0);
    expect(store.query).toBe("books about Crimean War");
  });

  it("populates widgets after performSearch", async () => {
    const store = useSearchStore();
    await store.performSearch("books about history");
    expect(store.widgets.length).toBeGreaterThan(0);
  });

  it("updates widget value with updateWidgetValue", async () => {
    const store = useSearchStore();
    await store.performSearch("books about history");

    const firstWidget = store.widgets[0];
    const newValue = "nonfiction";
    store.updateWidgetValue(firstWidget.id, newValue);

    const updated = store.widgets.find((w) => w.id === firstWidget.id);
    expect(updated?.value).toBe(newValue);
  });

  it("clears state with clearSearch", async () => {
    const store = useSearchStore();
    await store.performSearch("books");
    store.clearSearch();

    expect(store.query).toBe("");
    expect(store.results).toHaveLength(0);
    expect(store.widgets).toHaveLength(0);
    expect(store.isLoading).toBe(false);
  });
});
