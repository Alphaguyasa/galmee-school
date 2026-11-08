import { describe, expect, it } from "vitest";
import { currentPeriodKey, periodLabel, periodOptions } from "./fee-period";
import { sumMoney } from "./money";

const term = (n: number) => `Term ${n}`;

describe("fee periods", () => {
  it("names the current Ethiopian month", () => {
    expect(currentPeriodKey(new Date("2026-11-08T12:00:00Z"))).toBe("2019-02");
  });
  it("labels months, terms and years", () => {
    expect(periodLabel("2019-03", "en", term)).toBe("Hidar 2019");
    expect(periodLabel("2019-T2", "en", term)).toBe("Term 2 2019");
    expect(periodLabel("2019", "en", term)).toBe("2019");
  });
  it("offers 12 months, 4 terms and the year", () => {
    const options = periodOptions(2019, "en", term);
    expect(options).toHaveLength(17);
    expect(options[0].value).toBe("monthly:2019-01");
    expect(options[16].value).toBe("annual:2019");
  });
});

describe("sumMoney", () => {
  it("adds in cents so totals have no float drift", () => {
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
    expect(sumMoney([1000.1, 2000.2, 300.03])).toBe(3300.33);
  });
});
