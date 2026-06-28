import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const KNOCKOUT_DATE_RANGE = "20260628-20260719";

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

function normalizeStatus(typeDetail: string | null | undefined) {
  if (!typeDetail) return "SCHEDULED";
  const d = typeDetail.toUpperCase();
  if (["FT", "FINAL"].includes(d)) return "FINISHED";
  if (d.includes("PEN") || d.includes("AET")) return "FINISHED";
  if (d.includes("'")) return "LIVE";
  if (["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "IN"].some(s => d.includes(s))) {
    return "LIVE";
  }
  return "SCHEDULED";
}

function getPenaltyWinner(details: Record<string, unknown>[] | null | undefined) {
  if (!details || !Array.isArray(details)) return null;
  const shootoutGoals = details.filter((d: Record<string, unknown>) => d.shootout && d.scoringPlay);
  if (shootoutGoals.length === 0) return null;

  const homeTeam = details[0]?.team?.id as string | undefined;
  let homePens = 0;
  let awayPens = 0;

  for (const goal of shootoutGoals) {
    if ((goal.team as Record<string, unknown>)?.id === homeTeam) {
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

  const goalsHome = homeCompetitor?.score != null ? Number(homeCompetitor.score) : null;
  const goalsAway = awayCompetitor?.score != null ? Number(awayCompetitor.score) : null;

  const eventStatus = event.status as Record<string, Record<string, unknown>> | undefined;
  const compStatus = competition.status as Record<string, Record<string, unknown>> | undefined;
  const statusDetail = (eventStatus?.type as Record<string, unknown>)?.detail
    ?? (compStatus?.type as Record<string, unknown>)?.detail;

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
    winner_penalty: getPenaltyWinner(details),
    status: normalizeStatus(String(statusDetail ?? "")),
    match_datetime: String(event.date ?? competition.date ?? ""),
    stadium: typeof venue?.fullName === "string" ? venue.fullName : null,
    bracket_position: new Date(String(event.date ?? competition.date ?? "")).getTime()
  };
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

  const { error } = await supabase
    .from("matches")
    .upsert(rows, { onConflict: "external_id" });

  if (error) return Response.json({ error: error.message }, { status: 400 });

  const finished = rows.filter((row) => row?.status === "FINISHED");
  return Response.json({ ok: true, synced: rows.length, finished: finished.length });
});
