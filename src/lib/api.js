const BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

const KNOCKOUT_DATE_RANGE = "20260628-20260719";

export function canFetchFromESPN() {
  return true;
}

export async function fetchWorldCupGames() {
  const url = `${BASE_URL}?dates=${KNOCKOUT_DATE_RANGE}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`ESPN API respondió con ${response.status}`);
  }

  const data = await response.json();
  return data;
}

const ROUND_PATTERNS = [
  ["3rd", "3RD"],
  ["third", "3RD"],
  ["semi", "SF"],
  ["quarter", "QF"],
  ["32", "R32"],
  ["16", "R16"],
  ["8th", "R16"],
  ["final", "FINAL"]
];

export function normalizeRound(slug) {
  if (!slug) return null;
  const lower = slug.toLowerCase();

  if (lower.includes("group")) return null;

  for (const [pattern, roundId] of ROUND_PATTERNS) {
    if (lower.includes(pattern)) return roundId;
  }

  return null;
}

function normalizeStatus(state) {
  if (state === "post") return "FINISHED";
  if (state === "in") return "LIVE";
  return "SCHEDULED";
}

function getPenaltyWinner(details, homeTeamId) {
  if (!details || !Array.isArray(details) || !homeTeamId) return null;
  const shootoutGoals = details.filter(d => d.shootout && d.scoringPlay);
  if (shootoutGoals.length === 0) return null;

  let homePens = 0;
  let awayPens = 0;

  for (const goal of shootoutGoals) {
    if (goal.team?.id === homeTeamId) {
      homePens++;
    } else {
      awayPens++;
    }
  }

  if (homePens > awayPens) return "HOME";
  if (awayPens > homePens) return "AWAY";
  return null;
}

export function normalizeExternalMatches(payload) {
  const events = payload?.events ?? [];
  return events
    .map((event) => {
      const competition = event.competitions?.[0];
      if (!competition) return null;

      const seasonSlug = event.season?.slug;
      const round = normalizeRound(seasonSlug);
      if (!round) return null;

      const homeCompetitor = competition.competitors?.find(c => c.homeAway === "home");
      const awayCompetitor = competition.competitors?.find(c => c.homeAway === "away");

      const statusState = event.status?.type?.state;
      const status = normalizeStatus(statusState);
      const hasScore = status === "LIVE" || status === "FINISHED";

      const goalsHome = hasScore && homeCompetitor?.score != null ? Number(homeCompetitor.score) : null;
      const goalsAway = hasScore && awayCompetitor?.score != null ? Number(awayCompetitor.score) : null;

      return {
        id: `external-${event.id}`,
        external_id: String(event.id),
        round,
        team_home: homeCompetitor?.team?.displayName || "Por definir",
        team_away: awayCompetitor?.team?.displayName || "Por definir",
        team_home_code: homeCompetitor?.team?.logo || null,
        team_away_code: awayCompetitor?.team?.logo || null,
        goals_home: goalsHome,
        goals_away: goalsAway,
        winner_penalty: getPenaltyWinner(competition.details, homeCompetitor?.team?.id),
        status: normalizeStatus(statusState),
        match_datetime: event.date || competition.date,
        stadium: competition.venue?.fullName || null,
        bracket_position: new Date(event.date || competition.date).getTime()
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.match_datetime) - new Date(b.match_datetime));
}

export function assertKnockoutMatches(payload, matches) {
  const totalEvents = payload?.events?.length ?? 0;
  if (matches.length > 0) return;

  if (totalEvents === 0) {
    throw new Error("La API no devolvió partidos para el Mundial 2026.");
  }

  throw new Error(
    `La API devolvió ${totalEvents} partidos, pero ninguno es de fase eliminatoria todavía.`
  );
}
