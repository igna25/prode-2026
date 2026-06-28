import { useEffect, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

async function resolveMatchId(client, match) {
  if (match.id) return match.id;
  if (!match.external_id) return null;
  const { data } = await client
    .from("matches")
    .select("id")
    .eq("external_id", match.external_id)
    .maybeSingle();
  return data?.id ?? null;
}

export function useMatchPredictions(match) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!match || !isSupabaseConfigured) {
      setPredictions([]);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      const client = getSupabaseClient();

      const matchId = await resolveMatchId(client, match);
      if (!matchId || !active) {
        if (active) setPredictions([]);
        if (active) setLoading(false);
        return;
      }

      const { data, error } = await client
        .from("predictions")
        .select("id, predicted_home_goals, predicted_away_goals, predicted_winner, points_earned, participant_id, participants(name)")
        .eq("match_id", matchId);

      if (active && !error) {
        setPredictions(
          (data ?? []).map((p) => ({
            ...p,
            participant_name: p.participants?.name ?? "Anonimo"
          }))
        );
      }
      if (active) setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [match?.id, match?.external_id]);

  return { predictions, loading };
}
