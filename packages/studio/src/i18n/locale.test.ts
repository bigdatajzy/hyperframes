// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { getStudioLocale, translateLabel } from "./locale";
describe("Studio localization", () => {
  it("defaults to Chinese and preserves unknown authored text", () => {
    localStorage.removeItem("hyperframes.studio.locale");
    expect(getStudioLocale()).toBe("zh-CN");
    expect(translateLabel("Export", "zh-CN")).toBe("导出");
    expect(translateLabel("我的分镜 / scene-01.html", "zh-CN")).toBe("我的分镜 / scene-01.html");
  });
  it("respects an explicit English preference and falls back to source text", () => {
    localStorage.setItem("hyperframes.studio.locale", "en");
    expect(getStudioLocale()).toBe("en");
    expect(translateLabel("Export", "en")).toBe("Export");
    expect(translateLabel("Untranslated diagnostic", "zh-CN")).toBe("Untranslated diagnostic");
    localStorage.removeItem("hyperframes.studio.locale");
  });
});
