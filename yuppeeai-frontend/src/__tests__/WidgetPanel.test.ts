import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import WidgetPanel from "@/components/WidgetPanel.vue";

describe("WidgetPanel loading behavior", () => {
  it("keeps existing widgets visible while loading", () => {
    const wrapper = mount(WidgetPanel, {
      props: {
        isLoading: true,
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
});
