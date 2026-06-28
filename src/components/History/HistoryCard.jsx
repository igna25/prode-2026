import { isMatchLocked } from "../../hooks/usePredictions";
import Badge from "../UI/Badge";

function Flag({ code, name }) {
  if (!code) return <span className="flag-placeholder" aria-hidden="true" />;
  const isUrl = String(code).startsWith("http");
  const src = isUrl ? code : `https://flagcdn.com/w80/${String(code).toLowerCase()}.png`;
  return (
    <img
      className="flag"
      src={src}
      alt={`Escudo/Bandera de ${name}`}
      loading="lazy"
    />
  );
}

function formatPrediction(prediction, match) {
  if (!prediction) return "Sin predicción";
  const base = `${prediction.predicted_home_goals}-${prediction.predicted_away_goals}`;
  if (prediction.predicted_home_goals === prediction.predicted_away_goals) {
    const winner = prediction.predicted_winner === "HOME" ? match.team_home : match.team_away;
    return `${base}, pasa ${winner}`;
  }
  return base;
}

function formatResult(match) {
  if (match.goals_home == null || match.goals_away == null) return "Pendiente";
  const base = `${match.goals_home}-${match.goals_away}`;
  if (match.goals_home === match.goals_away && match.winner_penalty) {
    const winner = match.winner_penalty === "HOME" ? match.team_home : match.team_away;
    return `${base}, pasa ${winner}`;
  }
  return base;
}

export default function HistoryCard({ match, prediction, onSelect }) {
  const points = prediction?.points_earned;
  const tone = points == null ? "neutral" : points > 0 ? "success" : "danger";
  const locked = isMatchLocked(match);

  return (
    <article className="history-card">
      <div className="history-card-header">
        <div>
          <h3 className="history-card-teams">
            <Flag code={match.team_home_code} name={match.team_home} />
            <span>{match.team_home}</span>
            <span className="history-vs">vs</span>
            <Flag code={match.team_away_code} name={match.team_away} />
            <span>{match.team_away}</span>
          </h3>
          <p>{match.round}</p>
        </div>
        <button
          type="button"
          className="history-edit-btn"
          onClick={onSelect}
          disabled={locked}
          title={locked ? "Partido bloqueado" : "Editar predicción"}
        >
          {locked ? "Bloqueado" : "Editar"}
        </button>
      </div>
      <div className="history-grid">
        <span>Tu predicción</span>
        <strong>{formatPrediction(prediction, match)}</strong>
        <span>Resultado</span>
        <strong>{formatResult(match)}</strong>
      </div>
      <Badge tone={tone}>{points == null ? "Pendiente" : `${points} pts`}</Badge>
    </article>
  );
}
