import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import am from "../../messages/am.json";
import en from "../../messages/en.json";
import om from "../../messages/om.json";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("messages", () => {
  it("am and om have exactly the same keys as en", () => {
    const base = keys(en).sort();
    expect(keys(am).sort()).toEqual(base);
    expect(keys(om).sort()).toEqual(base);
  });

  it("Amharic counts of one are singular", () => {
    const t = createTranslator({ locale: "am", messages: am });
    expect(t("students.count", { count: 1 })).toBe("1 ተማሪ");
    expect(t("students.count", { count: 12 })).toBe("12 ተማሪዎች");
    expect(t("students.parentCount", { count: 1 })).toBe("1 ወላጅ");
    expect(t("students.searchResults", { count: 1, q: "ab" })).toBe('ለ"ab" 1 ውጤት');
    expect(t("marks.notifyNoContact", { count: 1 })).toBe("1 ተማሪ የወላጅ ስልክ ወይም ቴሌግራም የለውም።");
    expect(t("marks.notifyAlready", { count: 3 })).toContain("3 ወላጆች");
  });
});
