import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { reactive, nextTick } from "vue";
import SearchView from "../views/SearchView.vue";

const mockSearch = vi.fn().mockResolvedValue(undefined);
const mockReset = vi.fn();
const mockWaitForInitialAuthState = vi.fn().mockResolvedValue(undefined);
let mockIsAuthenticated = true;

const routeState = reactive<{ query: Record<string, unknown> }>({
  query: {},
});

const mockStore = {
  query: "",
  search: mockSearch,
  reset: mockReset,
  authRequired: false,
};

vi.mock("@/stores/yuppeeStore", () => ({
  useYuppeeStore: () => mockStore,
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({
    waitForInitialAuthState: mockWaitForInitialAuthState,
    get isAuthenticated() {
      return mockIsAuthenticated;
    },
  }),
}));

vi.mock("@/components/SearchBar.vue", () => ({
  default: {
    name: "SearchBar",
    template: "<div />",
  },
}));

vi.mock("vue-router", () => ({
  useRoute: () => routeState,
}));

describe("SearchView query handling", () => {
  beforeEach(() => {
    routeState.query = {};
    mockIsAuthenticated = true;
    mockSearch.mockClear();
    mockReset.mockClear();
    mockWaitForInitialAuthState.mockClear();
    mockStore.query = "";
    mockStore.authRequired = false;
  });

  it("submits search on mount when q is present", async () => {
    routeState.query = { q: "crimean war books" };

    mount(SearchView, {
      global: {
        stubs: {
          SearchBar: true,
          SearchResults: true,
          WidgetPanel: true,
          UserProfile: true,
          "router-link": { template: "<a><slot /></a>" },
        },
      },
    });

    await nextTick();

    expect(mockWaitForInitialAuthState.mock.calls.length).toBeGreaterThan(0);
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
          UserProfile: true,
          "router-link": { template: "<a><slot /></a>" },
        },
      },
    });

    await nextTick();

    expect(mockReset.mock.calls.length).toBeGreaterThan(0);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("shows auth-required state on search page when user is signed out", async () => {
    routeState.query = { q: "Books about Crimean War" };
    mockIsAuthenticated = false;

    mount(SearchView, {
      global: {
        stubs: {
          SearchBar: true,
          SearchResults: true,
          WidgetPanel: true,
          UserProfile: true,
          "router-link": { template: "<a><slot /></a>" },
        },
      },
    });

    await nextTick();

    expect(mockWaitForInitialAuthState.mock.calls.length).toBeGreaterThan(0);
    expect(mockReset.mock.calls.length).toBeGreaterThan(0);
    expect(mockStore.query).toBe("Books about Crimean War");
    expect(mockStore.authRequired).toBe(true);
    expect(mockSearch).not.toHaveBeenCalled();
  });
});
