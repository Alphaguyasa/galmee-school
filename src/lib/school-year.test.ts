import { describe, expect, it } from "vitest";
import { addisToday, currentSchoolYear, shiftDay } from "./school-year";

describe("currentSchoolYear", () => {
  it("uses the Ethiopian year", () => {
    expect(currentSchoolYear(new Date("2026-11-08T12:00:00Z"))).toBe(2019);
  });
  it("turns over on Meskerem 1, not on 1 January", () => {
    expect(currentSchoolYear(new Date("2027-01-15T12:00:00Z"))).toBe(2019);
    expect(currentSchoolYear(new Date("2026-09-10T12:00:00Z"))).toBe(2018);
    expect(currentSchoolYear(new Date("2026-09-11T12:00:00Z"))).toBe(2019);
  });
  it("counts the day in Addis Ababa, three hours ahead of UTC", () => {
    expect(currentSchoolYear(new Date("2026-09-10T21:30:00Z"))).toBe(2019);
  });
});

describe("attendance days", () => {
  it("gives the Addis Ababa date", () => {
    expect(addisToday(new Date("2026-11-08T22:00:00Z"))).toBe("2026-11-09");
  });
  it("moves across month ends", () => {
    expect(shiftDay("2026-11-01", -1)).toBe("2026-10-31");
    expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01");
  });
});
