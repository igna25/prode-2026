import { useEffect, useState } from "react";
import {
  assertKnockoutMatches,
  canFetchFromESPN,
  fetchWorldCupGames,
  normalizeExternalMatches
} from "../lib/api";
import { getMatches, saveMatches, subscribeLocalStore } from "../lib/localStore";
import { rounds } from "../lib/rounds";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

function applyCachedMatches(setMatches, setError) {
  const cached = getMatches();
  if (cached.length > 0) {
    setMatches(cached);
    return true;
  }
  setMatches([]);
  return false;
}

export function useMatches() {
  const [matches, setMatches] = useState(() => getMatches());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadFromSupabase() {
      const client = getSupabaseClient();
      const { data, error: supabaseError } = await client
        .from("matches")
        .select("*")
        .order("match_datetime", { ascending: true });

      if (!active) return false;

      if (!supabaseError && data?.length) {
        setMatches(data);
        saveMatches(data);
        setError(null);
        return true;
      }

      if (applyCachedMatches(setMatches, setError)) {
        setError("No se pudieron cargar partidos actualizados. Mostrando datos guardados.");
        return true;
      }

      setError("No se pudieron cargar los partidos reales.");
      return false;
    }

    async function load() {
      setLoading(true);
      setError(null);

      if (canFetchFromESPN()) {
        try {
          const payload = await fetchWorldCupGames();
          const externalMatches = normalizeExternalMatches(payload);
          assertKnockoutMatches(payload, externalMatches);

          if (!active) return;
          setMatches(externalMatches);
          saveMatches(externalMatches);
          setError(null);
          setLoading(false);
          return;
        } catch (externalError) {
          if (isSupabaseConfigured) {
            const loaded = await loadFromSupabase();
            if (!active) return;
            if (loaded) {
              setError(`No se pudo actualizar desde ESPN: ${externalError.message}`);
            }
            setLoading(false);
            return;
          }

          if (!active) return;
          if (applyCachedMatches(setMatches, setError)) {
            setError(`No se pudo actualizar desde ESPN: ${externalError.message}`);
          } else {
            setMatches([]);
            setError(
              externalError.message ||
                "No se pudieron cargar los partidos desde ESPN."
            );
          }
          setLoading(false);
          return;
        }
      }

      if (isSupabaseConfigured) {
        await loadFromSupabase();
        if (!active) return;
        setLoading(false);
        return;
      }

      if (!active) return;
      if (!applyCachedMatches(setMatches, setError)) {
        setError(
          "No se pudieron cargar los partidos del Mundial."
        );
      }
      setLoading(false);
    }

    load();
    const unsubscribeLocal = subscribeLocalStore(() => setMatches(getMatches()));

    let pollTimer = null;
    function startPollingIfLive(currentMatches) {
      clearInterval(pollTimer);
      const hasLive = currentMatches.some((m) => m.status === "LIVE");
      if (hasLive && canFetchFromESPN()) {
        pollTimer = setInterval(() => {
          if (!active) return;
          fetchWorldCupGames()
            .then((payload) => {
              if (!active) return;
              const updated = normalizeExternalMatches(payload);
              setMatches(updated);
              saveMatches(updated);
              startPollingIfLive(updated);
            })
            .catch(() => {});
        }, 30000);
      }
    }

    setTimeout(() => {
      if (active) startPollingIfLive(getMatches());
    }, 2000);

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
      clearInterval(pollTimer);
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

  const totalMatches = matchesByRound.reduce((count, round) => count + round.matches.length, 0);

  return { matches, matchesByRound, totalMatches, loading, error };
}
