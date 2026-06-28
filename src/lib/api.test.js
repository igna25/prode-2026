import { describe, expect, it } from "vitest";
import {
  assertKnockoutMatches,
  normalizeExternalMatches,
  normalizeRound
} from "./api";

function buildEvent(slug, id = "1") {
  return {
    id,
    date: "2026-07-01T18:00:00Z",
    season: { slug },
    competitions: [
      {
        competitors: [
          {
            homeAway: "home",
            score: null,
            team: { displayName: "Argentina", logo: "https://a.espncdn.com/i/teamlogos/countries/500/arg.png" }
          },
          {
            homeAway: "away",
            score: null,
            team: { displayName: "Brazil", logo: "https://a.espncdn.com/i/teamlogos/countries/500/bra.png" }
          }
        ],
        venue: { fullName: "MetLife Stadium" },
        status: { type: { detail: "Scheduled" } },
        details: []
      }
    ]
  };
}

describe("normalizeRound", () => {
  it.each([
    ["group-stage", null],
    ["round-of-32", "R32"],
    ["round-of-16", "R16"],
    ["quarterfinals", "QF"],
    ["semifinals", "SF"],
    ["third-place", "3RD"],
    ["final", "FINAL"]
  ])("maps %s to %s", (slug, expected) => {
    expect(normalizeRound(slug)).toBe(expected);
  });
});

describe("normalizeExternalMatches", () => {
  it("keeps only knockout fixtures", () => {
    const payload = {
      events: [
        buildEvent("group-stage", "10"),
        buildEvent("round-of-32", "11"),
        buildEvent("quarterfinals", "12")
      ]
    };

    const matches = normalizeExternalMatches(payload);
    expect(matches).toHaveLength(2);
    expect(matches.map((match) => match.round)).toEqual(["R32", "QF"]);
    expect(matches[0].team_home_code).toContain("espncdn.com");
  });
});

describe("assertKnockoutMatches", () => {
  it("throws when only group stage fixtures exist", () => {
    const payload = { events: [buildEvent("group-stage", "20")] };
    expect(() => assertKnockoutMatches(payload, [])).toThrow(/fase eliminatoria/);
  });
});
