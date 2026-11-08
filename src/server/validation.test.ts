import { describe, expect, it } from "vitest";
import { cleanSearchTerm, registerQuerySchema, studentSchema } from "./validation";

const student = {
  fullName: "Bontu Hailu",
  gender: "f",
  studentNo: "",
  classId: "7f3b2a10-5c4d-4e6f-8a9b-0c1d2e3f4a5b",
  guardianName: "Hailu Tadesse",
  guardianPhone: "0911 234-567",
  relation: "father",
};

describe("studentSchema", () => {
  it("accepts a valid student and normalises the phone", () => {
    expect(studentSchema.parse(student).guardianPhone).toBe("0911234567");
  });
  it("rejects a foreign phone number, a bad class id and an unknown relation", () => {
    expect(studentSchema.safeParse({ ...student, guardianPhone: "12345" }).success).toBe(false);
    expect(studentSchema.safeParse({ ...student, classId: "1" }).success).toBe(false);
    expect(studentSchema.safeParse({ ...student, relation: "uncle" }).success).toBe(false);
  });
});

describe("register query", () => {
  it("drops an invalid class id rather than failing the page", () => {
    expect(registerQuerySchema.parse({ class: "nope", q: "abdi" })).toEqual({ class: undefined, q: "abdi" });
  });
  it("removes filter syntax from the search term and keeps Ethiopic", () => {
    expect(cleanSearchTerm('a,full_name.eq.(x)"*')).toBe("a full_name.eq. x");
    expect(cleanSearchTerm("  ቦንቱ   ኃይሉ ")).toBe("ቦንቱ ኃይሉ");
  });
});
