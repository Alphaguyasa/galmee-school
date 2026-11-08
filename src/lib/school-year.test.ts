import { describe, expect, it } from "vitest";
import { currentSchoolYear } from "./school-year";

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
