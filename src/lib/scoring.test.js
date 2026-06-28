import { describe, expect, it } from "vitest";
import { calculatePoints } from "./scoring";

const pred = (homeGoals, awayGoals, winnerPenalty) => ({
  homeGoals,
  awayGoals,
  winnerPenalty
});

const real = (homeGoals, awayGoals, winnerPenalty) => ({
  homeGoals,
  awayGoals,
  winnerPenalty
});

describe("calculatePoints", () => {
  it.each([
    [pred(2, 1), real(2, 1), 6],
    [pred(2, 1), real(3, 1), 4],
    [pred(2, 1), real(1, 0), 3],
    [pred(2, 1), real(0, 1), 1],
    [pred(0, 0, "HOME"), real(0, 0, "HOME"), 6],
    [pred(0, 0, "HOME"), real(1, 1, "AWAY"), 3],
    [pred(0, 0, "HOME"), real(0, 0, "AWAY"), 4],
    [pred(0, 0, "HOME"), real(2, 0), 4],
    [pred(1, 1, "AWAY"), real(0, 0, "AWAY"), 4],
    [pred(0, 0, "HOME"), real(1, 1, "HOME"), 4],
    [pred(1, 0), real(1, 1, "HOME"), 4],
    [pred(1, 0), real(1, 1, "AWAY"), 0],
    [pred(1, 2), real(2, 1), 0]
  ])("scores %#", (prediction, result, expected) => {
    expect(calculatePoints(prediction, result)).toBe(expected);
  });

  it("returns null for pending matches", () => {
    expect(calculatePoints(pred(1, 0), real(null, null))).toBeNull();
  });
});
