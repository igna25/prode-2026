import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const KNOCKOUT_DATE_RANGE = "20260628-20260719";

type Score = {
  homeGoals: number | null;
  awayGoals: number | null;
  winnerPenalty?: "HOME" | "AWAY" | null;
};

const ROUND_PATTERNS: Array<[string, string]> = [
  ["3rd", "3RD"],
  ["third", "3RD"],
  ["semi", "SF"],
  ["quarter", "QF"],
  ["32", "R32"],
  ["16", "R16"],
  ["8th", "R16"],
  ["final", "FINAL"]
];

function normalizeRound(slug: string | null | undefined) {
  if (!slug) return null;
  const lower = slug.toLowerCase();
  if (lower.includes("group")) return null;

  for (const [pattern, roundId] of ROUND_PATTERNS) {
    if (lower.includes(pattern)) return roundId;
  }

  return null;
}

function normalizeStatus(state: string | null | undefined) {
  if (state === "post") return "FINISHED";
  if (state === "in") return "LIVE";
  return "SCHEDULED";
}

function getPenaltyWinner(details: Record<string, unknown>[] | null | undefined, homeTeamId: string | undefined) {
  if (!details || !Array.isArray(details) || !homeTeamId) return null;
  const shootoutGoals = details.filter((d: Record<string, unknown>) => d.shootout && d.scoringPlay);
  if (shootoutGoals.length === 0) return null;

  let homePens = 0;
  let awayPens = 0;

  for (const goal of shootoutGoals) {
    if ((goal.team as Record<string, unknown>)?.id === homeTeamId) {
      homePens++;
    } else {
      awayPens++;
    }
  }

  if (homePens > awayPens) return "HOME";
  if (awayPens > homePens) return "AWAY";
  return null;
}

function normalizeEvent(event: Record<string, unknown>) {
  const competitions = event.competitions as Record<string, unknown>[] | undefined;
  const competition = competitions?.[0];
  if (!competition) return null;

  const season = event.season as Record<string, unknown> | undefined;
  const round = normalizeRound(String(season?.slug ?? ""));
  if (!round) return null;

  const competitors = competition.competitors as Record<string, Record<string, unknown>>[] | undefined;
  const homeCompetitor = competitors?.find(c => c.homeAway === "home");
  const awayCompetitor = competitors?.find(c => c.homeAway === "away");

  const eventStatus = event.status as Record<string, Record<string, unknown>> | undefined;
  const statusState = (eventStatus?.type as Record<string, unknown>)?.state;
  const status = normalizeStatus(String(statusState ?? ""));

  const hasScore = status === "LIVE" || status === "FINISHED";
  const goalsHome = hasScore && homeCompetitor?.score != null ? Number(homeCompetitor.score) : null;
  const goalsAway = hasScore && awayCompetitor?.score != null ? Number(awayCompetitor.score) : null;

  const venue = competition.venue as Record<string, unknown> | undefined;
  const details = competition.details as Record<string, unknown>[] | undefined;

  return {
    external_id: String(event.id),
    round,
    team_home: String((homeCompetitor?.team as Record<string, unknown>)?.displayName ?? "Por definir"),
    team_away: String((awayCompetitor?.team as Record<string, unknown>)?.displayName ?? "Por definir"),
    team_home_code: typeof (homeCompetitor?.team as Record<string, unknown>)?.logo === "string"
      ? (homeCompetitor?.team as Record<string, unknown>).logo as string
      : null,
    team_away_code: typeof (awayCompetitor?.team as Record<string, unknown>)?.logo === "string"
      ? (awayCompetitor?.team as Record<string, unknown>).logo as string
      : null,
    goals_home: goalsHome,
    goals_away: goalsAway,
    winner_penalty: getPenaltyWinner(details, (homeCompetitor?.team as Record<string, unknown>)?.id as string | undefined),
    status,
    match_datetime: String(event.date ?? competition.date ?? ""),
    stadium: typeof venue?.fullName === "string" ? venue.fullName : null,
    bracket_position: new Date(String(event.date ?? competition.date ?? "")).getTime()
  };
}

function resultType(home: number, away: number) {
  if (home > away) return "HOME";
  if (away > home) return "AWAY";
  return "DRAW";
}

function calcAdvancingTeam(score: Score) {
  if (score.homeGoals == null || score.awayGoals == null) return null;
  const result = resultType(score.homeGoals, score.awayGoals);
  return result === "DRAW" ? score.winnerPenalty : result;
}

function calcPoints(pred: Score, real: Score) {
  if (real.homeGoals == null || real.awayGoals == null) return null;
  if (pred.homeGoals == null || pred.awayGoals == null) return 0;

  const predictedResult = resultType(pred.homeGoals, pred.awayGoals);
  const realResult = resultType(real.homeGoals, real.awayGoals);

  if (predictedResult === realResult) {
    if (realResult !== "DRAW") {
      if (pred.homeGoals === real.homeGoals && pred.awayGoals === real.awayGoals) return 6;
      let points = 3;
      if (pred.homeGoals === real.homeGoals) points += 1;
      if (pred.awayGoals === real.awayGoals) points += 1;
      return points;
    }
    const gotGoals = pred.homeGoals === real.homeGoals;
    const gotWinner = pred.winnerPenalty === real.winnerPenalty;
    if (gotGoals && gotWinner) return 6;
    if (gotGoals || gotWinner) return 4;
    return 3;
  }

  if (predictedResult === "DRAW" && realResult !== "DRAW") {
    if (pred.winnerPenalty === calcAdvancingTeam(real)) {
      let points = 3;
      if (pred.homeGoals === real.homeGoals) points += 1;
      if (pred.awayGoals === real.awayGoals) points += 1;
      return points;
    }
    return 0;
  }

  if (predictedResult !== "DRAW" && realResult === "DRAW") {
    if (calcAdvancingTeam(pred) === real.winnerPenalty) {
      let points = 3;
      if (pred.homeGoals === real.homeGoals) points += 1;
      if (pred.awayGoals === real.awayGoals) points += 1;
      return points;
    }
    return 0;
  }

  let individualGoalPoints = 0;
  if (pred.homeGoals === real.homeGoals) individualGoalPoints += 1;
  if (pred.awayGoals === real.awayGoals) individualGoalPoints += 1;
  return individualGoalPoints;
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const response = await fetch(`${ESPN_BASE_URL}?dates=${KNOCKOUT_DATE_RANGE}`);

  if (!response.ok) {
    return Response.json({ error: `ESPN API ${response.status}` }, { status: 502 });
  }

  const payload = await response.json();
  const events = Array.isArray(payload.events) ? payload.events : [];

  const rows = events
    .map((event: Record<string, unknown>) => normalizeEvent(event))
    .filter(Boolean);

  const debugInfo = rows.map((r) => ({
    eid: r?.external_id,
    status: r?.status,
    goals: `${r?.goals_home}-${r?.goals_away}`,
    teams: `${r?.team_home} vs ${r?.team_away}`
  }));

  const { error } = await supabase
    .from("matches")
    .upsert(rows, { onConflict: "external_id" });

  if (error) return Response.json({ error: error.message, debug: debugInfo }, { status: 400 });

  const finishedRows = rows.filter((row) => row?.status === "FINISHED");

  let pointsUpdated = 0;
  for (const row of finishedRows) {
    const { data: dbMatch } = await supabase
      .from("matches")
      .select("id")
      .eq("external_id", row!.external_id)
      .single();

    if (!dbMatch) continue;

    const real: Score = {
      homeGoals: row!.goals_home,
      awayGoals: row!.goals_away,
      winnerPenalty: row!.winner_penalty as "HOME" | "AWAY" | null
    };

    const { data: predictions } = await supabase
      .from("predictions")
      .select("id, predicted_home_goals, predicted_away_goals, predicted_winner")
      .eq("match_id", dbMatch.id);

    if (!predictions?.length) continue;

    const updates = await Promise.all(
      predictions.map((pred) =>
        supabase
          .from("predictions")
          .update({
            is_locked: true,
            points_earned: calcPoints(
              {
                homeGoals: pred.predicted_home_goals,
                awayGoals: pred.predicted_away_goals,
                winnerPenalty: pred.predicted_winner as "HOME" | "AWAY" | null
              },
              real
            )
          })
          .eq("id", pred.id)
      )
    );

    const errors = updates.map((u) => u.error).filter(Boolean);
    if (!errors.length) pointsUpdated += predictions.length;
  }

  return Response.json({ ok: true, synced: rows.length, finished: finishedRows.length, pointsUpdated, debug: debugInfo });
});
