import { describe, expect, it } from "vitest";
import { coverCrop } from "@/lib/photo-resize";

describe("coverCrop", () => {
  it("crops the sides of a landscape photo", () => {
    expect(coverCrop(4000, 3000)).toEqual({ sx: 800, sy: 0, sw: 2400, sh: 3000 });
  });
  it("crops top and bottom of a tall phone photo", () => {
    expect(coverCrop(1080, 2400)).toEqual({ sx: 0, sy: 525, sw: 1080, sh: 1350 });
  });
  it("keeps an exact 4:5 photo whole", () => {
    expect(coverCrop(480, 600)).toEqual({ sx: 0, sy: 0, sw: 480, sh: 600 });
  });
});
