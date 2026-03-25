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

function mockFetch(results = MOCK_RESULTS) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ results, totalCount: results.length, query: "test" }),
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
  it("returns book widgets for book queries", async () => {
    const widgets = await generateWidgets("Books about Crimean War");
    const types = widgets.map((w) => w.type);
    expect(types).toContain("radio");
    expect(types).toContain("range-slider");
    expect(types).toContain("checkbox");
    expect(types).toContain("dropdown");
  });

  it("returns movie widgets for movie queries", async () => {
    const widgets = await generateWidgets("best sci-fi movies");
    const types = widgets.map((w) => w.type);
    expect(types).toContain("checkbox");
    expect(types).toContain("range-slider");
    expect(types).toContain("dropdown");
    expect(types).toContain("radio");
  });

  it("returns default widgets for generic queries", async () => {
    const widgets = await generateWidgets("artificial intelligence");
    expect(widgets.length).toBeGreaterThan(0);
    const types = widgets.map((w) => w.type);
    expect(types).toContain("dropdown");
  });

  it("adds scholarly-level widget when fiction-type is nonfiction", async () => {
    const widgets = await generateWidgets("books", {
      "fiction-type": "nonfiction",
    });
    const ids = widgets.map((w) => w.id);
    expect(ids).toContain("scholarly-level");
  });

  it("adds fiction-genres widget when fiction-type is fiction", async () => {
    const widgets = await generateWidgets("books", {
      "fiction-type": "fiction",
    });
    const ids = widgets.map((w) => w.id);
    expect(ids).toContain("fiction-genres");
  });
});
