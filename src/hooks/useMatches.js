import { useEffect, useState } from "react";
import { getWorldCupGames, normalizeExternalMatches } from "../lib/api";
import { getMatches, saveMatches, subscribeLocalStore } from "../lib/localStore";
import { rounds } from "../lib/rounds";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

export function useMatches() {
  const [matches, setMatches] = useState(() => getMatches());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const payload = await getWorldCupGames();
        const externalMatches = normalizeExternalMatches(payload);
        if (!active) return;
        setMatches(externalMatches);
        saveMatches(externalMatches);
        setLoading(false);
        return;
      } catch (externalError) {
        if (!isSupabaseConfigured) {
          if (!active) return;
          setMatches([]);
          setError("No se pudieron cargar los partidos reales desde WorldCup26.ir.");
          setLoading(false);
          return;
        }
      }

      const client = getSupabaseClient();
      const { data, error } = await client
        .from("matches")
        .select("*")
        .order("match_datetime", { ascending: true });

      if (!active) return;
      if (!error && data?.length) setMatches(data);
      if (error || !data?.length) {
        setError("No se pudieron cargar los partidos reales.");
      }
      setLoading(false);
    }

    load();
    const unsubscribeLocal = subscribeLocalStore(() => setMatches(getMatches()));

    const realtimeClient = isSupabaseConfigured ? getSupabaseClient() : null;
    const channel = realtimeClient
      ? realtimeClient
          .channel("matches-realtime")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "matches" },
            load
          )
          .subscribe()
      : null;

    return () => {
      active = false;
      unsubscribeLocal();
      if (channel) realtimeClient.removeChannel(channel);
    };
  }, []);

  const matchesByRound = rounds.map((round) => ({
    ...round,
    matches: matches
      .filter((match) => match.round === round.id)
      .sort((a, b) => a.bracket_position - b.bracket_position)
  }));

  return { matches, matchesByRound, loading, error };
}
