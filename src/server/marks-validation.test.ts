import { describe, expect, it } from "vitest";
import { marksEntriesSchema, marksQuerySchema, subjectSchema } from "./validation";

const id = "6f1d2c1e-8a3b-4c5d-9e0f-1a2b3c4d5e6f";

describe("subjectSchema", () => {
  it("accepts a subject for all grades with a decimal maximum", () => {
    expect(subjectSchema.parse({ name: " Mathematics ", grade: "", maxMark: "50.5" })).toEqual({
      name: "Mathematics",
      grade: "",
      maxMark: 50.5,
    });
  });

  it("refuses a zero or missing maximum and a one-letter name", () => {
    expect(subjectSchema.safeParse({ name: "Maths", grade: "", maxMark: "0" }).success).toBe(false);
    expect(subjectSchema.safeParse({ name: "Maths", grade: "", maxMark: "" }).success).toBe(false);
    expect(subjectSchema.safeParse({ name: "M", grade: "", maxMark: "100" }).success).toBe(false);
  });
});

describe("marksEntriesSchema", () => {
  it("turns typed marks into numbers", () => {
    expect(marksEntriesSchema.parse([{ enrollmentId: id, mark: "87.5" }])).toEqual([{ enrollmentId: id, mark: 87.5 }]);
  });

  it("refuses negative, non-numeric and three-decimal marks", () => {
    for (const mark of ["-1", "abc", "1.234", "1e3"]) {
      expect(marksEntriesSchema.safeParse([{ enrollmentId: id, mark }]).success).toBe(false);
    }
  });

  it("refuses a field that is not an enrolment id", () => {
    expect(marksEntriesSchema.safeParse([{ enrollmentId: "x", mark: "5" }]).success).toBe(false);
  });
});

describe("marksQuerySchema", () => {
  it("falls back to unset for a bad term or class", () => {
    expect(marksQuerySchema.parse({ class: "nope", term: "9" })).toEqual({ class: undefined, subject: undefined, term: undefined });
    expect(marksQuerySchema.parse({ term: "3" }).term).toBe(3);
  });
});
