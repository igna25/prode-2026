import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Score = {
  homeGoals: number | null;
  awayGoals: number | null;
  winnerPenalty?: "HOME" | "AWAY" | null;
};

function resultType(home: number, away: number) {
  if (home > away) return "HOME";
  if (away > home) return "AWAY";
  return "DRAW";
}

function advancingTeam(score: Score) {
  if (score.homeGoals == null || score.awayGoals == null) return null;
  const result = resultType(score.homeGoals, score.awayGoals);
  return result === "DRAW" ? score.winnerPenalty : result;
}

function calculatePoints(pred: Score, real: Score) {
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
    if (pred.winnerPenalty === advancingTeam(real)) {
      let points = 3;
      if (pred.homeGoals === real.homeGoals) points += 1;
      if (pred.awayGoals === real.awayGoals) points += 1;
      return points;
    }
    return 0;
  }

  if (predictedResult !== "DRAW" && realResult === "DRAW") {
    if (advancingTeam(pred) === real.winnerPenalty) {
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

Deno.serve(async (req) => {
  const { match_id } = await req.json();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", match_id)
    .single();

  if (matchError) {
    return Response.json({ error: matchError.message }, { status: 400 });
  }

  const { data: predictions, error: predictionError } = await supabase
    .from("predictions")
    .select("*")
    .eq("match_id", match_id);

  if (predictionError) {
    return Response.json({ error: predictionError.message }, { status: 400 });
  }

  const real = {
    homeGoals: match.goals_home,
    awayGoals: match.goals_away,
    winnerPenalty: match.winner_penalty
  };

  const updates = await Promise.all(
    (predictions ?? []).map((prediction) =>
      supabase
        .from("predictions")
        .update({
          is_locked: true,
          points_earned: calculatePoints(
            {
              homeGoals: prediction.predicted_home_goals,
              awayGoals: prediction.predicted_away_goals,
              winnerPenalty: prediction.predicted_winner
            },
            real
          )
        })
        .eq("id", prediction.id)
    )
  );

  const errors = updates.map((item) => item.error).filter(Boolean);
  if (errors.length) {
    return Response.json({ error: errors[0]?.message }, { status: 400 });
  }

  return Response.json({ ok: true, updated: updates.length });
});
