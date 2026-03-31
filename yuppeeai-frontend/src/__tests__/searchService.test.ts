import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { search, generateWidgets } from "@/services/searchService";

const MOCK_RESULTS = [
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
  {
    id: "4",
    title: "Result Four",
    url: "https://example.com/4",
    snippet: "Fourth result.",
  },
  {
    id: "5",
    title: "Result Five",
    url: "https://example.com/5",
    snippet: "Fifth result.",
  },
  {
    id: "6",
    title: "Result Six",
    url: "https://example.com/6",
    snippet: "Sixth result.",
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
  {
    id: "sort-by",
    type: "dropdown",
    label: "Sort By",
    options: [
      { label: "Most relevant", value: "relevance" },
      { label: "Most recent", value: "recent" },
    ],
    value: "relevance",
  },
];

function mockFetch(results = MOCK_RESULTS, widgets = MOCK_WIDGETS) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/refine")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ widgets }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            results,
            totalCount: results.length,
            query: "test",
          }),
      });
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchService.search", () => {
  beforeEach(() => {
    mockFetch();
  });

  it("returns results for book-related queries", async () => {
    const results = await search("Books about Crimean War");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("id");
    expect(results[0]).toHaveProperty("title");
    expect(results[0]).toHaveProperty("url");
    expect(results[0]).toHaveProperty("snippet");
  });

  it("returns results for movie-related queries", async () => {
    const results = await search("best sci-fi movies");
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns default results for generic queries", async () => {
    const results = await search("artificial intelligence search");
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns 6 results", async () => {
    const results = await search("books about history");
    expect(results).toHaveLength(6);
  });

  it("sends a POST request with query and filters to /search", async () => {
    const filters = { genre: "history" };
    await search("books about history", filters);
    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0]!;
    const [url, init] = call as [string, RequestInit];
    expect(url).toMatch(/\/search$/);
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.query).toBe("books about history");
    expect(body.filters).toEqual(filters);
  });

  it("throws when the backend returns a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    await expect(search("test query")).rejects.toThrow(
      "Search request failed: 500",
    );
  });
});

describe("searchService.generateWidgets", () => {
  beforeEach(() => {
    mockFetch();
  });

  it("normalizes backend refinement widget schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/refine")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                widgets: [
                  {
                    type: "dropdown",
                    variable_name: "novel_type",
                    label: "Type of Novel",
                    params: {
                      choices: [
                        { value: "classics", label: "Classics" },
                        { value: "modern", label: "Modern" },
                      ],
                    },
                  },
                  {
                    type: "chipgroup",
                    variable_name: "recognition",
                    label: "Recognition",
                    params: {
                      choices: [
                        { value: "award_winning", label: "Award-winning" },
                      ],
                    },
                  },
                  {
                    type: "slider",
                    variable_name: "rating",
                    label: "Rating",
                    params: {
                      value_min: 1,
                      value_max: 5,
                    },
                  },
                  {
                    type: "switch",
                    variable_name: "in_stock",
                    label: "In Stock Only",
                    value: true,
                  },
                ],
              }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: MOCK_RESULTS }),
        });
      }),
    );

    const widgets = await generateWidgets("best novels");

    expect(widgets).toHaveLength(4);
    expect(widgets[0]).toMatchObject({
      id: "novel_type",
      type: "dropdown",
      label: "Type of Novel",
      value: "",
    });
    expect(widgets[1]).toMatchObject({
      id: "recognition",
      type: "chipgroup",
      label: "Recognition",
      value: [],
    });
    expect(widgets[2]).toMatchObject({
      id: "rating",
      type: "range-slider",
      min: 1,
      max: 5,
      sliderMode: "range",
      value: [1, 5],
    });
    expect(widgets[3]).toMatchObject({
      id: "in_stock",
      type: "switch",
      label: "In Stock Only",
      value: true,
    });
  });

  it("returns widgets from /refine", async () => {
    const widgets = await generateWidgets("artificial intelligence");
    expect(widgets).toHaveLength(2);
    expect(widgets[0]?.id).toBe("date-range");
  });

  it("maps slider mode semantics from backend range flags", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/refine")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                widgets: [
                  {
                    type: "slider",
                    variable_name: "exact_price",
                    label: "Exact Price",
                    params: {
                      value_min: 0,
                      value_max: 100,
                      user_selects_lowest_value_of_range: false,
                      user_selects_highest_value_of_range: false,
                    },
                  },
                  {
                    type: "slider",
                    variable_name: "max_price",
                    label: "Max Price",
                    params: {
                      value_min: 0,
                      value_max: 100,
                      user_selects_lowest_value_of_range: false,
                      user_selects_highest_value_of_range: true,
                    },
                  },
                  {
                    type: "slider",
                    variable_name: "min_price",
                    label: "Min Price",
                    params: {
                      value_min: 0,
                      value_max: 100,
                      user_selects_lowest_value_of_range: true,
                      user_selects_highest_value_of_range: false,
                    },
                  },
                  {
                    type: "slider",
                    variable_name: "between_price",
                    label: "Between Price",
                    params: {
                      value_min: 0,
                      value_max: 100,
                      user_selects_lowest_value_of_range: true,
                      user_selects_highest_value_of_range: true,
                    },
                  },
                ],
              }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: MOCK_RESULTS }),
        });
      }),
    );

    const widgets = await generateWidgets("prices");

    expect(widgets[0]).toMatchObject({ sliderMode: "exact", value: 0 });
    expect(widgets[1]).toMatchObject({ sliderMode: "lte", value: 100 });
    expect(widgets[2]).toMatchObject({ sliderMode: "gte", value: 0 });
    expect(widgets[3]).toMatchObject({
      sliderMode: "range",
      value: [0, 100],
    });
  });

  it("sends a POST request with query and filters to /refine", async () => {
    const filters = { genre: "history" };
    await generateWidgets("books about history", filters);

    const fetchMock = vi.mocked(fetch);
    const refinementCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).endsWith("/refine"),
    );

    expect(refinementCall).toBeDefined();
    const [url, init] = refinementCall as [string, RequestInit];
    expect(url).toMatch(/\/refine$/);
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.query).toBe("books about history");
    expect(body.filters).toEqual(filters);
  });

  it("throws when refinements endpoint returns a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/refine")) {
          return Promise.resolve({ ok: false, status: 500 });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: MOCK_RESULTS }),
        });
      }),
    );

    await expect(generateWidgets("test query")).rejects.toThrow(
      "Refinements request failed: 500",
    );
  });
});
