import { describe, expect, it, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import WidgetPanel from "@/components/WidgetPanel.vue";
import { useYuppeeStore } from "@/stores/yuppeeStore";

const mockRouterPush = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

const globalStubs = {
  RangeSliderWidget: {
    template: "<div class='slider-stub'>Range Slider</div>",
  },
  ChipGroupWidget: true,
  SwitchWidget: true,
  DropdownWidget: true,
  FreeformTextWidget: {
    props: ["modelValue"],
    template:
      "<input class='freeform-stub' :value='modelValue' @input=\"$emit('update:modelValue', $event.target.value)\" />",
  },
};

describe("WidgetPanel loading behavior", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouterPush.mockReset();
  });

  it("hides existing widgets while loading", () => {
    const store = useYuppeeStore();
    store.widgets = [
      {
        id: "date-range",
        type: "slider",
        label: "Date Range",
        min: 2000,
        max: 2024,
        step: 1,
        value: [2010, 2024],
      },
    ];
    store.isLoadingWidgets = true;

    const wrapper = mount(WidgetPanel, {
      global: { stubs: globalStubs },
    });

    expect(wrapper.find(".slider-stub").exists()).toBe(false);
    expect(wrapper.find(".widget-skeleton").exists()).toBe(false);
  });

  it("clears unsubmitted additional instruction when query changes", async () => {
    const store = useYuppeeStore();
    store.widgets = [
      {
        id: "date-range",
        type: "slider",
        label: "Date Range",
        min: 2000,
        max: 2024,
        step: 1,
        value: [2010, 2024],
      },
    ];
    store.query = "crimean war books";

    const wrapper = mount(WidgetPanel, {
      global: { stubs: globalStubs },
    });

    await wrapper
      .find(".freeform-stub")
      .setValue("written by a British author");
    expect(store.newAdditionalInstruction).toBe("written by a British author");

    store.query = "astronomy books";
    await nextTick();

    expect(store.newAdditionalInstruction).toBe("");
  });

  it("delegates typed instruction handling to store.search", async () => {
    const store = useYuppeeStore();
    store.query = "crimean war books";
    store.widgets = [
      {
        id: "date-range",
        type: "slider",
        label: "Date Range",
        min: 2000,
        max: 2024,
        step: 1,
        value: [2010, 2024],
      },
    ];

    const searchSpy = vi.spyOn(store, "search").mockResolvedValue(undefined);

    const wrapper = mount(WidgetPanel, {
      global: { stubs: globalStubs },
    });

    await wrapper.find(".freeform-stub").setValue("published after 2000");
    await wrapper.find(".widget-panel__btn").trigger("click");

    expect(store.additionalInstructionPoints).toEqual([]);
    expect(store.newAdditionalInstruction).toBe("published after 2000");
    expect(searchSpy).toHaveBeenCalledWith("crimean war books");
  });

  it("removes an instruction card when the close button is clicked", async () => {
    const store = useYuppeeStore();
    store.widgets = [
      {
        id: "date-range",
        type: "slider",
        label: "Date Range",
        min: 2000,
        max: 2024,
        step: 1,
        value: [2010, 2024],
      },
    ];
    store.additionalInstructionPoints = ["written by a British author"];

    const wrapper = mount(WidgetPanel, {
      global: { stubs: globalStubs },
    });

    expect(wrapper.findAll(".widget-panel__instruction-card")).toHaveLength(1);

    await wrapper.find(".widget-panel__instruction-remove").trigger("click");

    expect(store.additionalInstructionPoints).toEqual([]);
    expect(wrapper.findAll(".widget-panel__instruction-card")).toHaveLength(0);
  });

  it("updates the URL query when selecting a disambiguation alternative", async () => {
    const store = useYuppeeStore();
    store.disambiguation = {
      presumed: {
        doYouMean: "I assumed a history overview",
        query: "books about the crimean war history overview",
      },
      alternatives: [
        {
          doYouMean: "Personal accounts",
          query: "books about the crimean war personal accounts",
        },
      ],
    };

    const wrapper = mount(WidgetPanel, {
      global: { stubs: globalStubs },
    });

    await wrapper.find(".widget-panel__disambiguation-alt").trigger("click");

    expect(mockRouterPush).toHaveBeenCalledWith({
      name: "search",
      query: { q: "books about the crimean war personal accounts" },
    });
  });
});
