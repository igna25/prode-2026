import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const KNOCKOUT_ROUNDS = new Set(["R32", "R16", "QF", "SF", "3RD", "FINAL"]);

function normalizeRound(value: string) {
  const text = String(value ?? "").toUpperCase();
  if (text.includes("32")) return "R32";
  if (text.includes("16")) return "R16";
  if (text.includes("QUARTER") || text.includes("QF")) return "QF";
  if (text.includes("SEMI") || text.includes("SF")) return "SF";
  if (text.includes("THIRD") || text.includes("3")) return "3RD";
  if (text.includes("FINAL")) return "FINAL";
  return text;
}

function normalizeGame(game: Record<string, unknown>, index: number) {
  const round = normalizeRound(String(game.round ?? game.stage ?? ""));
  if (!KNOCKOUT_ROUNDS.has(round)) return null;

  return {
    external_id: String(game.id ?? game.game_id ?? `${round}-${index}`),
    round,
    team_home: String(game.home_team ?? game.homeTeam ?? "Por definir"),
    team_away: String(game.away_team ?? game.awayTeam ?? "Por definir"),
    team_home_code: typeof game.home_code === "string" ? game.home_code.toLowerCase() : null,
    team_away_code: typeof game.away_code === "string" ? game.away_code.toLowerCase() : null,
    goals_home: game.home_score ?? null,
    goals_away: game.away_score ?? null,
    winner_penalty: game.penalty_winner ?? null,
    status: game.status ?? "SCHEDULED",
    match_datetime: game.date ?? game.datetime,
    stadium: game.stadium ?? null,
    bracket_position: Number(game.bracket_position ?? index)
  };
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const response = await fetch("https://worldcup26.ir/get/games");
  if (!response.ok) {
    return Response.json({ error: `WorldCup26.ir ${response.status}` }, { status: 502 });
  }

  const payload = await response.json();
  const games = Array.isArray(payload) ? payload : payload.data ?? payload.games ?? [];
  const rows = games
    .map((game: Record<string, unknown>, index: number) => normalizeGame(game, index + 1))
    .filter(Boolean);

  const { error } = await supabase
    .from("matches")
    .upsert(rows, { onConflict: "external_id" });

  if (error) return Response.json({ error: error.message }, { status: 400 });

  const finished = rows.filter((row) => row?.status === "FINISHED");
  return Response.json({ ok: true, synced: rows.length, finished: finished.length });
});
