import OpenAI from "openai";
import { SearchProvider } from "../services/searchProvider";

vi.mock("openai", () => ({
  __esModule: true,
  default: vi.fn(),
}));

describe("SearchProvider", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("strips utm_source=openai from returned result URLs", async () => {
    const createMock = vi
      .fn<() => Promise<any>>()
      .mockResolvedValueOnce({ id: "reasoning-1", output_text: "reasoning" })
      .mockResolvedValueOnce({
        output_text: JSON.stringify({
          summary: "summary",
          results: [
            {
              title: "No query string",
              url: "https://example.com/path?utm_source=openai",
              snippet: "snippet",
              summary: "summary",
            },
            {
              title: "Keep other query params",
              url: "https://example.com/path?foo=1&utm_source=openai&bar=2",
              snippet: "snippet",
              summary: "summary",
            },
            {
              title: "Keep non-openai source",
              url: "https://example.com/path?utm_source=openai&utm_source=newsletter",
              snippet: "snippet",
              summary: "summary",
            },
          ],
        }),
      });

    (
      vi.mocked(OpenAI) as unknown as {
        mockImplementation: (impl: new (...args: any[]) => unknown) => void;
      }
    ).mockImplementation(
      class {
        responses = {
          create: createMock,
        };
      } as unknown as new (...args: any[]) => unknown,
    );

    const provider = new SearchProvider({ openaiApiKey: "test-key" });
    const result = await provider.getSearchResults({ query: "test" });

    expect(result.results[0]?.url).toBe("https://example.com/path");
    expect(result.results[1]?.url).toBe("https://example.com/path?foo=1&bar=2");
    expect(result.results[2]?.url).toBe(
      "https://example.com/path?utm_source=newsletter",
    );
  });
});
