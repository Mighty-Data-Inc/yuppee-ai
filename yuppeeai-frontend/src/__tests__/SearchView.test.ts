import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { reactive, nextTick } from "vue";
import SearchView from "../views/SearchView.vue";

const mockSearch = vi.fn().mockResolvedValue(undefined);
const mockReset = vi.fn();

const routeState = reactive<{ query: Record<string, unknown> }>({
  query: {},
});

const mockStore = {
  search: mockSearch,
  reset: mockReset,
};

vi.mock("@/stores/yuppeeStore", () => ({
  useYuppeeStore: () => mockStore,
}));

vi.mock("vue-router", () => ({
  useRoute: () => routeState,
}));

describe("SearchView query handling", () => {
  beforeEach(() => {
    routeState.query = {};
    mockSearch.mockClear();
    mockReset.mockClear();
  });

  it("submits search on mount when q is present", async () => {
    routeState.query = { q: "crimean war books" };

    mount(SearchView, {
      global: {
        stubs: {
          SearchBar: true,
          SearchResults: true,
          WidgetPanel: true,
          "router-link": { template: "<a><slot /></a>" },
        },
      },
    });

    await nextTick();

    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch).toHaveBeenCalledWith("crimean war books");
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("resets store on mount when q is missing or blank", async () => {
    routeState.query = { q: "   " };

    mount(SearchView, {
      global: {
        stubs: {
          SearchBar: true,
          SearchResults: true,
          WidgetPanel: true,
          "router-link": { template: "<a><slot /></a>" },
        },
      },
    });

    await nextTick();

    expect(mockReset.mock.calls.length).toBeGreaterThan(0);
    expect(mockSearch).not.toHaveBeenCalled();
  });
});
