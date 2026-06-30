import { useEffect, useMemo, useState } from "react";
import { useParticipantContext } from "../context/ParticipantContext";
import {
  getPredictions,
  subscribeLocalStore,
  upsertPrediction
} from "../lib/localStore";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

const PREDICTIONS_CHANGE = "prode-predictions-change";

export function isMatchLocked(match) {
  if (!match?.match_datetime) return false;
  return new Date(match.match_datetime).getTime() <= Date.now() || match.status !== "SCHEDULED";
}

export function usePredictions(matchId) {
  const { participant } = useParticipantContext();
  const [predictions, setPredictions] = useState(() => getPredictions());
  const [matchIdMap, setMatchIdMap] = useState(new Map());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!participant) return;
      if (!isSupabaseConfigured) {
        setPredictions(getPredictions());
        return;
      }

      const client = getSupabaseClient();

      const { data, error } = await client
        .from("predictions")
        .select("*")
        .eq("participant_id", participant.id);

      if (active && !error) setPredictions(data ?? []);

      const { data: matches } = await client
        .from("matches")
        .select("id, external_id");

      if (active && matches) {
        const map = new Map();
        matches.forEach((m) => {
          if (m.external_id) map.set(m.id, `external-${m.external_id}`);
        });
        setMatchIdMap(map);
      }
    }

    load();
    const unsubscribeLocal = subscribeLocalStore("prode2026.predictions", () => setPredictions(getPredictions()));
    const onPredictionsChange = () => load();
    window.addEventListener(PREDICTIONS_CHANGE, onPredictionsChange);

    return () => {
      active = false;
      unsubscribeLocal();
      window.removeEventListener(PREDICTIONS_CHANGE, onPredictionsChange);
    };
  }, [participant]);

  const myPredictions = useMemo(
    () =>
      predictions.filter(
        (prediction) => prediction.participant_id === participant?.id
      ),
    [participant, predictions]
  );

  const predictionByMatch = useMemo(() => {
    const map = new Map();
    myPredictions.forEach((prediction) => {
      map.set(prediction.match_id, prediction);
      const externalKey = matchIdMap.get(prediction.match_id);
      if (externalKey) map.set(externalKey, prediction);
    });
    return map;
  }, [myPredictions, matchIdMap]);

  async function savePrediction(match, values) {
    if (!participant) throw new Error("No hay participante activo.");
    if (isMatchLocked(match)) throw new Error("El partido ya esta bloqueado.");

    setSaving(true);
    try {
      let saved;
      if (isSupabaseConfigured) {
        const client = getSupabaseClient();

        const { data: existingMatch } = await client
          .from("matches")
          .select("id")
          .eq("external_id", match.external_id)
          .maybeSingle();

        let matchId;
        if (existingMatch) {
          matchId = existingMatch.id;
        } else {
          const { data: newMatch, error: insertError } = await client
            .from("matches")
            .insert({
              external_id: match.external_id,
              round: match.round,
              team_home: match.team_home,
              team_away: match.team_away,
              team_home_code: match.team_home_code,
              team_away_code: match.team_away_code,
              goals_home: match.goals_home,
              goals_away: match.goals_away,
              winner_penalty: match.winner_penalty,
              status: match.status,
              match_datetime: match.match_datetime,
              stadium: match.stadium,
              bracket_position: match.bracket_position
            })
            .select("id")
            .single();
          if (insertError) throw insertError;
          matchId = newMatch.id;
        }

        const payload = {
          participant_id: participant.id,
          match_id: matchId,
          predicted_home_goals: Number(values.homeGoals),
          predicted_away_goals: Number(values.awayGoals),
          predicted_winner: values.winnerPenalty,
          is_locked: false
        };
        const { data, error } = await client
          .from("predictions")
          .upsert(payload, { onConflict: "participant_id,match_id" })
          .select()
          .single();
        if (error) throw error;
        saved = data;
      } else {
        saved = upsertPrediction(participant.id, match.id, values);
      }

      setPredictions((current) => [
        ...current.filter((item) => item.id !== saved.id),
        saved
      ]);
      window.dispatchEvent(new CustomEvent(PREDICTIONS_CHANGE));
      return saved;
    } finally {
      setSaving(false);
    }
  }

  return {
    predictions,
    myPredictions,
    prediction: matchId ? predictionByMatch.get(matchId) : null,
    predictionByMatch,
    savePrediction,
    saving
  };
}
