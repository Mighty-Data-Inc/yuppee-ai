import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  submitSERPQuery,
  submitSearchRefinement,
} from "@/services/searchService";

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
            query: "test",
            summary: "Summary for test query",
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
    const response = await submitSERPQuery("Books about Crimean War");
    expect(response.results.length).toBeGreaterThan(0);
    expect(response.results[0]).toHaveProperty("title");
    expect(response.results[0]).toHaveProperty("url");
    expect(response.results[0]).toHaveProperty("snippet");
    expect(response.summary).toBe("Summary for test query");
  });

  it("returns results for movie-related queries", async () => {
    const response = await submitSERPQuery("best sci-fi movies");
    expect(response.results.length).toBeGreaterThan(0);
  });

  it("returns default results for generic queries", async () => {
    const response = await submitSERPQuery("artificial intelligence search");
    expect(response.results.length).toBeGreaterThan(0);
  });

  it("returns 6 results", async () => {
    const response = await submitSERPQuery("books about history");
    expect(response.results).toHaveLength(6);
  });

  it("returns duplicate results unchanged when backend includes them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                title: "First title",
                url: "https://example.com/duplicate",
                snippet: "First snippet",
              },
              {
                title: "Second title",
                url: "https://example.com/duplicate",
                snippet: "Second snippet",
              },
              {
                title: "Unique title",
                url: "https://example.com/unique",
                snippet: "Unique snippet",
              },
            ],
          }),
      }),
    );

    const response = await submitSERPQuery("duplicate test");

    expect(response.results).toHaveLength(3);
    expect(response.results[0]).toMatchObject({
      title: "First title",
      url: "https://example.com/duplicate",
      snippet: "First snippet",
    });
    expect(response.results[1]).toMatchObject({
      title: "Second title",
      url: "https://example.com/duplicate",
      snippet: "Second snippet",
    });
    expect(response.results[2]).toMatchObject({
      title: "Unique title",
      url: "https://example.com/unique",
      snippet: "Unique snippet",
    });
  });

  it("preserves both snippet and summary when backend provides both", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                title: "Dual text result",
                url: "https://example.com/dual",
                snippet: "Short snippet",
                summary: "Longer detailed summary",
              },
            ],
          }),
      }),
    );

    const response = await submitSERPQuery("dual text test");

    expect(response.results).toHaveLength(1);
    expect(response.results[0]).toMatchObject({
      title: "Dual text result",
      url: "https://example.com/dual",
      snippet: "Short snippet",
      summary: "Longer detailed summary",
    });
  });

  it("does not inject missing snippet values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                title: "Summary-only result",
                url: "https://example.com/summary-only",
                summary: "This should stay in summary only",
              },
            ],
          }),
      }),
    );

    const response = await submitSERPQuery("summary only test");

    expect(response.results).toHaveLength(1);
    expect(response.results[0]).toMatchObject({
      title: "Summary-only result",
      url: "https://example.com/summary-only",
      summary: "This should stay in summary only",
    });
    expect(response.results[0]).not.toHaveProperty("snippet");
  });

  it("sends a POST request with query, widgets, and instructions to /search", async () => {
    const widgets = [
      {
        id: "test-widget",
        type: "dropdown",
        label: "Genre",
        value: "history",
      },
    ];
    const instructions = ["written by a British author"];
    await submitSERPQuery("books about history", widgets, instructions);
    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0]!;
    const [url, init] = call as [string, RequestInit];
    expect(url).toMatch(/\/search$/);
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.query).toBe("books about history");
    expect(body.widgets).toEqual(widgets);
    expect(body.instructions).toEqual(instructions);
  });

  it("sends instructions array in request body", async () => {
    const instructions = [
      "written by a British author",
      "published after 2020",
    ];

    await submitSERPQuery("books about history", undefined, instructions);

    const fetchMock = vi.mocked(fetch);
    const call = fetchMock.mock.calls[0]!;
    const [, init] = call as [string, RequestInit];
    const body = JSON.parse(init.body as string);

    expect(body.instructions).toEqual(instructions);
  });

  it("throws when the backend returns a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    await expect(submitSERPQuery("test query")).rejects.toThrow(
      "Search request failed: 500",
    );
  });
});

describe("searchService.submitSearchRefinement", () => {
  beforeEach(() => {
    mockFetch();
  });

  it("returns backend refinement widget schema unchanged", async () => {
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
                    tooltip:
                      "Shows the style and era focus of each recommendation",
                    params: {
                      choices: [
                        { value: "classics", label: "Classics" },
                        { value: "modern", label: "Modern" },
                      ],
                      choices_concat_abbrev: "Classics/Modern",
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

    const widgets = (await submitSearchRefinement("best novels")).widgets;

    expect(widgets).toHaveLength(4);
    expect(widgets[0]).toMatchObject({
      type: "dropdown",
      variable_name: "novel_type",
      label: "Type of Novel",
    });
    expect(widgets[1]).toMatchObject({
      type: "chipgroup",
      variable_name: "recognition",
      label: "Recognition",
    });
    expect(widgets[2]).toMatchObject({
      type: "slider",
      variable_name: "rating",
      label: "Rating",
    });
    expect(widgets[3]).toMatchObject({
      type: "switch",
      variable_name: "in_stock",
      label: "In Stock Only",
      value: true,
    });
  });

  it("returns widgets from /refine", async () => {
    const widgets = (await submitSearchRefinement("artificial intelligence"))
      .widgets;
    expect(widgets).toHaveLength(2);
    expect(widgets[0]?.id).toBe("date-range");
  });

  it("preserves slider range flags from backend", async () => {
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

    const widgets = (await submitSearchRefinement("prices")).widgets;

    expect(widgets[0]).toMatchObject({
      variable_name: "exact_price",
      params: {
        user_selects_lowest_value_of_range: false,
        user_selects_highest_value_of_range: false,
      },
    });
    expect(widgets[1]).toMatchObject({
      variable_name: "max_price",
      params: {
        user_selects_lowest_value_of_range: false,
        user_selects_highest_value_of_range: true,
      },
    });
    expect(widgets[2]).toMatchObject({
      variable_name: "min_price",
      params: {
        user_selects_lowest_value_of_range: true,
        user_selects_highest_value_of_range: false,
      },
    });
    expect(widgets[3]).toMatchObject({
      variable_name: "between_price",
      params: {
        user_selects_lowest_value_of_range: true,
        user_selects_highest_value_of_range: true,
      },
    });
  });

  it("ignores blank choices_concat_abbrev for dropdown placeholders", async () => {
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
                    variable_name: "format",
                    label: "Format",
                    params: {
                      choices: [{ value: "ebook", label: "Ebook" }],
                      choices_concat_abbrev: "   ",
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

    const widgets = (await submitSearchRefinement("formats")).widgets;
    expect(widgets).toHaveLength(1);
    expect(widgets[0]).toMatchObject({
      type: "dropdown",
      variable_name: "format",
    });
  });

  it("sends a POST request with query, widgets, instructions, and known results to /refine", async () => {
    const widgets = [
      {
        id: "genre",
        type: "dropdown",
        label: "Genre",
        value: "history",
      },
    ];
    const instructions = ["published after 2010"];
    const knownResults = [
      {
        id: "10",
        title: "Known Result",
        url: "https://example.com/known",
        snippet: "Known snippet",
      },
    ];
    await submitSearchRefinement(
      "books about history",
      widgets,
      instructions,
      knownResults,
    );

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
    expect(body.widgets).toEqual(widgets);
    expect(body.instructions).toEqual(instructions);
    expect(body.results).toEqual(knownResults);
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

    await expect(submitSearchRefinement("test query")).rejects.toThrow(
      "Refinements request failed: 500",
    );
  });
});
