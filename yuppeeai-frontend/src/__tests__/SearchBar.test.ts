import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import SearchBar from "@/components/SearchBar.vue";

const pushMock = vi.fn();
const replaceMock = vi.fn();
const searchMock = vi.fn();
const resetMock = vi.fn();
const routeMock = {
  name: "home",
  query: {},
};

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  useRoute: () => routeMock,
}));

vi.mock("@/stores/searchStore", () => ({
  useSearchStore: () => ({
    query: "",
    search: searchMock,
    reset: resetMock,
  }),
}));

describe("SearchBar", () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    searchMock.mockReset();
    resetMock.mockReset();
    routeMock.name = "home";
    routeMock.query = {};
  });

  it("renders correctly", () => {
    const wrapper = mount(SearchBar);
    expect(wrapper.find("input").exists()).toBe(true);
    expect(wrapper.find("button.search-bar__btn").exists()).toBe(true);
  });

  it("navigates to search route when Search button is clicked", async () => {
    const wrapper = mount(SearchBar);
    const input = wrapper.find("input");
    await input.setValue("books about history");
    await wrapper.find("button.search-bar__btn").trigger("click");

    expect(pushMock).toHaveBeenCalledWith({
      name: "search",
      query: { q: "books about history" },
    });
  });

  it("navigates to search route when Enter is pressed", async () => {
    const wrapper = mount(SearchBar);
    const input = wrapper.find("input");
    await input.setValue("crimean war fiction");
    await input.trigger("keydown", { key: "Enter" });

    expect(pushMock).toHaveBeenCalledWith({
      name: "search",
      query: { q: "crimean war fiction" },
    });
  });

  it("does not navigate for empty query", async () => {
    const wrapper = mount(SearchBar);
    await wrapper.find("button.search-bar__btn").trigger("click");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does not navigate for whitespace-only query", async () => {
    const wrapper = mount(SearchBar);
    const input = wrapper.find("input");
    await input.setValue("   ");
    await wrapper.find("button.search-bar__btn").trigger("click");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("clears local input without navigating when not on search page", async () => {
    const wrapper = mount(SearchBar);
    const input = wrapper.find("input");
    await input.setValue("temporary query");
    await wrapper.find("button.search-bar__clear").trigger("click");

    expect((input.element as HTMLInputElement).value).toBe("");
    expect(resetMock).toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("clears route query when on search page", async () => {
    routeMock.name = "search";
    routeMock.query = { q: "initial query", page: "2" };

    const wrapper = mount(SearchBar);
    const input = wrapper.find("input");
    await input.setValue("initial query");
    await wrapper.find("button.search-bar__clear").trigger("click");

    expect(resetMock).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith({
      name: "search",
      query: { page: "2" },
    });
  });

  it("searches directly when already on same search route", async () => {
    const wrapper = mount(SearchBar, {
      props: { compact: true },
    });
    routeMock.name = "search";
    routeMock.query = { q: "initial query" };

    const input = wrapper.find("input");
    await input.setValue("initial query");
    await wrapper.find("button.search-bar__btn").trigger("click");

    expect(searchMock).toHaveBeenCalledWith("initial query");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("applies compact class when compact prop is true", () => {
    const wrapper = mount(SearchBar, {
      props: { compact: true },
    });
    expect(wrapper.find(".search-bar--compact").exists()).toBe(true);
  });
});
