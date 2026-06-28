import { useEffect, useMemo, useState } from "react";
import { isMatchLocked, usePredictions } from "../../hooks/usePredictions";
import CountdownTimer from "../UI/CountdownTimer";
import Modal from "../UI/Modal";
import Toast from "../UI/Toast";
import GoalSelector from "./GoalSelector";
import PenaltyPicker from "./PenaltyPicker";

export default function PredictionModal({ match, open, prediction, onClose }) {
  const { savePrediction, saving } = usePredictions(match?.id);
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [winnerPenalty, setWinnerPenalty] = useState("HOME");
  const [message, setMessage] = useState("");
  const locked = isMatchLocked(match);

  useEffect(() => {
    if (!open) return;
    setHomeGoals(prediction?.predicted_home_goals ?? 0);
    setAwayGoals(prediction?.predicted_away_goals ?? 0);
    setWinnerPenalty(prediction?.predicted_winner ?? "HOME");
    setMessage("");
  }, [open, prediction]);

  const isDraw = homeGoals === awayGoals;

  const title = useMemo(() => {
    if (!match) return "Predicción";
    return `${match.team_home} vs ${match.team_away}`;
  }, [match]);

  async function handleSubmit(event) {
    event.preventDefault();
    await savePrediction(match, {
      homeGoals,
      awayGoals,
      winnerPenalty: isDraw ? winnerPenalty : null
    });
    setMessage("Predicción guardada");
    window.setTimeout(onClose, 650);
  }

  if (!match) return null;

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form className="prediction-form" onSubmit={handleSubmit}>
        <div className="prediction-score">
          <GoalSelector label={match.team_home} value={homeGoals} onChange={setHomeGoals} />
          <span className="score-divider">-</span>
          <GoalSelector label={match.team_away} value={awayGoals} onChange={setAwayGoals} />
        </div>

        {isDraw && (
          <PenaltyPicker
            homeTeam={match.team_home}
            awayTeam={match.team_away}
            value={winnerPenalty}
            onChange={setWinnerPenalty}
          />
        )}

        <div className="prediction-meta">
          <span>Bloqueo en</span>
          <CountdownTimer date={match.match_datetime} />
        </div>

        <button className="primary-button" type="submit" disabled={locked || saving}>
          {locked ? "Partido bloqueado" : saving ? "Guardando..." : "Guardar predicción"}
        </button>
        <Toast message={message} />
      </form>
    </Modal>
  );
}
