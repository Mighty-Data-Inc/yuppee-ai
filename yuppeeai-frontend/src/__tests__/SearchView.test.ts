import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import SearchView from "../views/SearchView.vue";

const searchResultsStub = {
  props: [
    "results",
    "isLoading",
    "query",
    "resultSummary",
    "refinementChanges",
  ],
  template: "<div class='search-results-stub' />",
};

const mockPerformSearch = vi.fn().mockResolvedValue(undefined);
const mockLoadPreferences = vi.fn();
const mockPush = vi.fn();

const routeState: { query: Record<string, unknown> } = {
  query: {},
};

const mockStore = {
  query: "crimean war books",
  results: [],
  resultSummary: "",
  widgets: [],
  refinement: [] as string[],
  isLoadingResults: false,
  isLoadingWidgets: false,
  performSearch: mockPerformSearch,
  loadPreferences: mockLoadPreferences,
};

vi.mock("@/stores/yuppeeStore", () => ({
  useYuppeeStore: () => mockStore,
}));

vi.mock("vue-router", () => ({
  useRoute: () => routeState,
  useRouter: () => ({ push: mockPush }),
}));

describe("SearchView refine behavior", () => {
  beforeEach(() => {
    routeState.query = {};
    mockStore.query = "crimean war books";
    mockStore.refinement = [];
    mockPerformSearch.mockClear();
    mockLoadPreferences.mockClear();
    mockPush.mockClear();
  });

  it("submits additional instructions list without changing query", async () => {
    const wrapper = mount(SearchView, {
      global: {
        stubs: {
          SearchBar: true,
          SearchResults: searchResultsStub,
          "router-link": { template: "<a><slot /></a>" },
          WidgetPanel: {
            template:
              "<button class='refine-trigger' @click=\"$emit('refine', { genre: 'history' }, ['written by a British author', 'published after 2000'])\">Refine</button>",
          },
        },
      },
    });

    await wrapper.find(".refine-trigger").trigger("click");

    expect(mockStore.refinement).toEqual([
      "written by a British author",
      "published after 2000",
    ]);
    expect(mockPerformSearch).toHaveBeenCalledTimes(1);
    expect(mockPerformSearch).toHaveBeenCalledWith("crimean war books", {
      genre: "history",
      additionalInstructions: [
        "written by a British author",
        "published after 2000",
      ],
    });
  });

  it("omits additionalInstructions when instruction list is empty", async () => {
    const wrapper = mount(SearchView, {
      global: {
        stubs: {
          SearchBar: true,
          SearchResults: searchResultsStub,
          "router-link": { template: "<a><slot /></a>" },
          WidgetPanel: {
            template:
              "<button class='refine-trigger' @click=\"$emit('refine', { genre: 'history' }, [])\">Refine</button>",
          },
        },
      },
    });

    await wrapper.find(".refine-trigger").trigger("click");

    expect(mockPerformSearch).toHaveBeenCalledTimes(1);
    expect(mockPerformSearch).toHaveBeenCalledWith("crimean war books", {
      genre: "history",
    });
  });
});
