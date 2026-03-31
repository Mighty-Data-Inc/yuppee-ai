import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import SearchView from "../views/SearchView.vue";

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
  refinement: "",
  isLoadingResults: false,
  isLoadingWidgets: false,
  performSearch: mockPerformSearch,
  loadPreferences: mockLoadPreferences,
};

vi.mock("@/stores/searchStore", () => ({
  useSearchStore: () => mockStore,
}));

vi.mock("vue-router", () => ({
  useRoute: () => routeState,
  useRouter: () => ({ push: mockPush }),
}));

describe("SearchView refine behavior", () => {
  beforeEach(() => {
    routeState.query = {};
    mockStore.query = "crimean war books";
    mockStore.refinement = "";
    mockPerformSearch.mockClear();
    mockLoadPreferences.mockClear();
    mockPush.mockClear();
  });

  it("submits refinementText as additionalInstructions filter without changing query", async () => {
    const wrapper = mount(SearchView, {
      global: {
        stubs: {
          SearchBar: true,
          SearchResults: true,
          "router-link": { template: "<a><slot /></a>" },
          WidgetPanel: {
            template:
              "<button class='refine-trigger' @click=\"$emit('refine', { genre: 'history' }, 'written by a British author')\">Refine</button>",
          },
        },
      },
    });

    await wrapper.find(".refine-trigger").trigger("click");

    expect(mockStore.refinement).toBe("written by a British author");
    expect(mockPerformSearch).toHaveBeenCalledTimes(1);
    expect(mockPerformSearch).toHaveBeenCalledWith("crimean war books", {
      genre: "history",
      additionalInstructions: "written by a British author",
    });
  });

  it("omits additionalInstructions when refinementText is blank", async () => {
    const wrapper = mount(SearchView, {
      global: {
        stubs: {
          SearchBar: true,
          SearchResults: true,
          "router-link": { template: "<a><slot /></a>" },
          WidgetPanel: {
            template:
              "<button class='refine-trigger' @click=\"$emit('refine', { genre: 'history' }, '   ')\">Refine</button>",
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
