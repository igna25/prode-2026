import { useEffect, useMemo, useState } from "react";
import {
  getParticipants,
  getPredictions,
  subscribeLocalStore
} from "../lib/localStore";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

const PREDICTIONS_CHANGE = "prode-predictions-change";

export function useStandings() {
  const [participants, setParticipants] = useState(() => getParticipants());
  const [predictions, setPredictions] = useState(() => getPredictions());
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!isSupabaseConfigured) {
        setParticipants(getParticipants());
        setPredictions(getPredictions());
        setLoading(false);
        return;
      }

      const client = getSupabaseClient();
      const [participantsResult, predictionsResult] = await Promise.all([
        client.from("participants").select("*"),
        client.from("predictions").select("*")
      ]);

      if (!active) return;
      if (!participantsResult.error) setParticipants(participantsResult.data ?? []);
      if (!predictionsResult.error) setPredictions(predictionsResult.data ?? []);
      setLoading(false);
    }

    load();
    const unsubscribe = subscribeLocalStore(() => {
      setParticipants(getParticipants());
      setPredictions(getPredictions());
    });
    const onPredictionsChange = () => load();
    window.addEventListener(PREDICTIONS_CHANGE, onPredictionsChange);

    const pollTimer = setInterval(() => {
      if (active) load();
    }, 30000);

    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener(PREDICTIONS_CHANGE, onPredictionsChange);
      clearInterval(pollTimer);
    };
  }, []);

  const standings = useMemo(() => {
    const rows = participants.map((participant) => {
      const points = predictions
        .filter((prediction) => prediction.participant_id === participant.id)
        .reduce((sum, prediction) => sum + (prediction.points_earned ?? 0), 0);
      return {
        ...participant,
        points,
        predictionsCount: predictions.filter(
          (prediction) => prediction.participant_id === participant.id
        ).length
      };
    });

    rows.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

    let previousPoints = null;
    let previousRank = 0;
    return rows.map((row, index) => {
      const rank = row.points === previousPoints ? previousRank : index + 1;
      previousPoints = row.points;
      previousRank = rank;
      return { ...row, rank };
    });
  }, [participants, predictions]);

  return { standings, loading };
}
