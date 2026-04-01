import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import WidgetPanel from "@/components/WidgetPanel.vue";

const baseProps = {
  isLoading: false,
  query: "crimean war books",
  widgets: [
    {
      id: "genre",
      type: "radio",
      label: "Genre",
      options: [
        { label: "History", value: "history" },
        { label: "Fiction", value: "fiction" },
      ],
      value: "history",
    },
  ],
};

const globalStubs = {
  RadioWidget: {
    template: "<div class='radio-widget-stub'>Radio Widget</div>",
  },
  RangeSliderWidget: true,
  CheckboxWidget: true,
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
  it("keeps existing widgets visible while loading", () => {
    const wrapper = mount(WidgetPanel, {
      props: {
        isLoading: true,
        query: "crimean war books",
        widgets: [
          {
            id: "genre",
            type: "radio",
            label: "Genre",
            options: [
              { label: "History", value: "history" },
              { label: "Fiction", value: "fiction" },
            ],
            value: "history",
          },
        ],
      },
      global: {
        stubs: {
          RadioWidget: {
            template: "<div class='radio-widget-stub'>Radio Widget</div>",
          },
          RangeSliderWidget: true,
          CheckboxWidget: true,
          ChipGroupWidget: true,
          SwitchWidget: true,
          DropdownWidget: true,
          FreeformTextWidget: true,
        },
      },
    });

    expect(wrapper.find(".radio-widget-stub").exists()).toBe(true);
    expect(wrapper.find(".widget-skeleton").exists()).toBe(false);
  });

  it("clears additional instructions when the query changes", async () => {
    const wrapper = mount(WidgetPanel, {
      props: baseProps,
      global: { stubs: globalStubs },
    });

    await wrapper
      .find(".freeform-stub")
      .setValue("written by a British author");
    expect(
      wrapper.find(".widget-panel__btn").attributes("disabled"),
    ).toBeUndefined();

    await wrapper.setProps({ query: "astronomy books", widgets: [] });

    expect(wrapper.find(".freeform-stub").exists()).toBe(false);
    expect(wrapper.find(".widget-panel__btn").exists()).toBe(false);
  });

  it("appends typed instruction on Search Again and clears input", async () => {
    const wrapper = mount(WidgetPanel, {
      props: baseProps,
      global: { stubs: globalStubs },
    });

    await wrapper.find(".freeform-stub").setValue("published after 2000");
    await wrapper.find(".widget-panel__btn").trigger("click");

    const refineEvents = wrapper.emitted("refine") ?? [];
    expect(refineEvents).toHaveLength(1);
    expect(refineEvents[0]?.[1]).toEqual(["published after 2000"]);
    expect(
      (wrapper.find(".freeform-stub").element as HTMLInputElement).value,
    ).toBe("");
    expect(wrapper.find(".widget-panel__instruction-card").text()).toContain(
      "published after 2000",
    );
  });

  it("removes an instruction card when the close button is clicked", async () => {
    const wrapper = mount(WidgetPanel, {
      props: baseProps,
      global: { stubs: globalStubs },
    });

    await wrapper
      .find(".freeform-stub")
      .setValue("written by a British author");
    await wrapper.find(".widget-panel__btn").trigger("click");

    expect(wrapper.findAll(".widget-panel__instruction-card")).toHaveLength(1);

    await wrapper.find(".widget-panel__instruction-remove").trigger("click");

    expect(wrapper.findAll(".widget-panel__instruction-card")).toHaveLength(0);
  });
});
