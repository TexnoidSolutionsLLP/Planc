import { describe, it, expect } from "vitest";
import { normalizeThemeConfig, DEFAULT_SECTIONS } from "./index";

describe("normalizeThemeConfig", () => {
  it("returns the default sections when config is empty", () => {
    expect(normalizeThemeConfig(undefined)).toEqual({ sections: DEFAULT_SECTIONS, colors: undefined });
    expect(normalizeThemeConfig({ sections: [] })).toEqual({ sections: DEFAULT_SECTIONS, colors: undefined });
  });

  it("preserves a store's existing section order and visibility", () => {
    const stored = {
      sections: [
        { id: "hero", type: "hero" as const, visible: false, content: { title: "Custom headline" } },
        { id: "product_grid", type: "product_grid" as const, visible: true, content: {} },
      ],
    };

    const result = normalizeThemeConfig(stored);
    const heroIndex = result.sections.findIndex((s) => s.id === "hero");
    const gridIndex = result.sections.findIndex((s) => s.id === "product_grid");

    expect(heroIndex).toBeLessThan(gridIndex);
    expect(result.sections[heroIndex].visible).toBe(false);
    expect(result.sections[heroIndex].content?.title).toBe("Custom headline");
  });

  it("backfills section types missing from an older stored config", () => {
    const stored = { sections: [{ id: "hero", type: "hero" as const, visible: true, content: {} }] };
    const result = normalizeThemeConfig(stored);

    const ids = result.sections.map((s) => s.id);
    expect(ids).toContain("hero");
    for (const defaultSection of DEFAULT_SECTIONS) {
      expect(ids).toContain(defaultSection.id);
    }
  });

  it("preserves custom accent color", () => {
    const result = normalizeThemeConfig({ sections: DEFAULT_SECTIONS, colors: { accent: "#FF0000" } });
    expect(result.colors?.accent).toBe("#FF0000");
  });
});

describe("templates", () => {
  it("ships 10 online-store and 5 portfolio templates with unique ids", async () => {
    const { TEMPLATES } = await import("./templates");
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
    expect(TEMPLATES.filter((t) => t.category === "ecommerce")).toHaveLength(10);
    expect(TEMPLATES.filter((t) => t.category === "portfolio")).toHaveLength(5);
  });

  it("resolves legacy theme names and falls back to minimal", async () => {
    const { getTemplate } = await import("./templates");
    expect(getTemplate("Luxury").id).toBe("luxury");
    expect(getTemplate("bold").id).toBe("bold");
    expect(getTemplate("nope").id).toBe("minimal");
    expect(getTemplate(undefined).id).toBe("minimal");
  });

  it("builds a Google Fonts url and css with the merchant accent override", async () => {
    const { getTemplate, templateCss, templateFontsUrl } = await import("./templates");
    const t = getTemplate("editorial");
    expect(templateFontsUrl(t)).toContain("family=Playfair+Display:wght@400;500;600;700");
    expect(templateCss(t, "#FF0000")).toContain("--color-primary:255 0 0");
    expect(templateCss(t)).toContain("--color-primary:154 52 18");
  });
});
