import { describe, expect, it } from "vitest";
import { calculateMastery } from "@/services/mastery.service";

describe("mastery calculation", () => {
  it("returns 0 when there are no answers", () => {
    expect(calculateMastery(0, 0)).toBe(0);
  });

  it("calculates correct percentage for 2/3 correct", () => {
    expect(calculateMastery(2, 1)).toBe(67);
  });

  it("calculates 100% when all correct", () => {
    expect(calculateMastery(5, 0)).toBe(100);
  });

  it("calculates 0% when all incorrect", () => {
    expect(calculateMastery(0, 5)).toBe(0);
  });
});
