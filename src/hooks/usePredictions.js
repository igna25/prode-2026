import { useEffect, useMemo, useState } from "react";
import { useParticipantContext } from "../context/ParticipantContext";
import {
  getPredictions,
  subscribeLocalStore,
  upsertPrediction
} from "../lib/localStore";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

export function isMatchLocked(match) {
  if (!match?.match_datetime) return false;
  return new Date(match.match_datetime).getTime() <= Date.now() || match.status !== "SCHEDULED";
}

export function usePredictions(matchId) {
  const { participant } = useParticipantContext();
  const [predictions, setPredictions] = useState(() => getPredictions());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!participant) return;
      if (!isSupabaseConfigured) {
        setPredictions(getPredictions());
        return;
      }

      const { data, error } = await getSupabaseClient()
        .from("predictions")
        .select("*")
        .eq("participant_id", participant.id);

      if (active && !error) setPredictions(data ?? []);
    }

    load();
    const unsubscribe = subscribeLocalStore(() => setPredictions(getPredictions()));
    return () => {
      active = false;
      unsubscribe();
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
    myPredictions.forEach((prediction) => map.set(prediction.match_id, prediction));
    return map;
  }, [myPredictions]);

  async function savePrediction(match, values) {
    if (!participant) throw new Error("No hay participante activo.");
    if (isMatchLocked(match)) throw new Error("El partido ya esta bloqueado.");

    setSaving(true);
    try {
      let saved;
      if (isSupabaseConfigured) {
        const client = getSupabaseClient();
        const payload = {
          participant_id: participant.id,
          match_id: match.id,
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
