import { useMatchPredictions } from "../../hooks/useMatchPredictions";
import { useParticipantContext } from "../../context/ParticipantContext";
import Modal from "./Modal";

function formatPred(prediction) {
  const base = `${prediction.predicted_home_goals}-${prediction.predicted_away_goals}`;
  if (prediction.predicted_home_goals === prediction.predicted_away_goals && prediction.predicted_winner) {
    return `${base} (pasa ${prediction.predicted_winner === "HOME" ? "Local" : "Visitante"})`;
  }
  return base;
}

export default function MatchPredictionsSheet({ match, open, onClose }) {
  const { participant } = useParticipantContext();
  const { predictions, loading } = useMatchPredictions(open ? match : null);

  if (!match) return null;

  return (
    <Modal open={open} title={`Predicciones — ${match.team_home} vs ${match.team_away}`} onClose={onClose}>
      <div className="match-preds-sheet">
        {loading ? (
          <p className="match-preds-empty">Cargando...</p>
        ) : predictions.length === 0 ? (
          <p className="match-preds-empty">Nadie predijo este partido todavía.</p>
        ) : (
          <ul className="match-preds-list">
            {predictions.map((p) => (
              <li
                key={p.id}
                className={`match-preds-row${p.participant_id === participant?.id ? " is-current" : ""}`}
              >
                <span className="match-preds-name">
                  {p.participant_name}
                  {p.participant_id === participant?.id && <span className="match-preds-you"> (vos)</span>}
                </span>
                <span className="match-preds-score">{formatPred(p)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
