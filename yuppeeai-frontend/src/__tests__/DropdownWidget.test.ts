import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import DropdownWidget from "@/components/widgets/DropdownWidget.vue";

describe("DropdownWidget", () => {
  it("renders custom placeholder from dropdownPlaceholder", () => {
    const wrapper = mount(DropdownWidget, {
      props: {
        widget: {
          id: "novel_type",
          type: "dropdown",
          label: "Type of Novel",
          dropdownPlaceholder: "Classics/Modern",
          options: [
            { label: "Classics", value: "classics" },
            { label: "Modern", value: "modern" },
          ],
          value: "",
        },
        modelValue: "",
      },
    });

    const placeholderOption = wrapper.find('option[value=""]');
    expect(placeholderOption.exists()).toBe(true);
    expect(placeholderOption.text()).toBe("Classics/Modern");
  });

  it("falls back to default placeholder when custom placeholder is blank", () => {
    const wrapper = mount(DropdownWidget, {
      props: {
        widget: {
          id: "novel_type",
          type: "dropdown",
          label: "Type of Novel",
          dropdownPlaceholder: "   ",
          options: [
            { label: "Classics", value: "classics" },
            { label: "Modern", value: "modern" },
          ],
          value: "",
        },
        modelValue: "",
      },
    });

    const placeholderOption = wrapper.find('option[value=""]');
    expect(placeholderOption.exists()).toBe(true);
    expect(placeholderOption.text()).toBe("Select an option");
  });
});
