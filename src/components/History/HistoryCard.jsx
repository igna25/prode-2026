import Badge from "../UI/Badge";

function formatPrediction(prediction) {
  if (!prediction) return "Sin predicción";
  const base = `${prediction.predicted_home_goals}-${prediction.predicted_away_goals}`;
  if (prediction.predicted_home_goals === prediction.predicted_away_goals) {
    return `${base}, pasa ${prediction.predicted_winner === "HOME" ? "local" : "visitante"}`;
  }
  return base;
}

function formatResult(match) {
  if (match.goals_home == null || match.goals_away == null) return "Pendiente";
  const base = `${match.goals_home}-${match.goals_away}`;
  if (match.goals_home === match.goals_away && match.winner_penalty) {
    return `${base}, pasa ${match.winner_penalty === "HOME" ? "local" : "visitante"}`;
  }
  return base;
}

export default function HistoryCard({ match, prediction }) {
  const points = prediction?.points_earned;
  const tone = points == null ? "neutral" : points > 0 ? "success" : "danger";

  return (
    <article className="history-card">
      <div>
        <h3>{match.team_home} vs {match.team_away}</h3>
        <p>{match.round}</p>
      </div>
      <div className="history-grid">
        <span>Tu predicción</span>
        <strong>{formatPrediction(prediction)}</strong>
        <span>Resultado</span>
        <strong>{formatResult(match)}</strong>
      </div>
      <Badge tone={tone}>{points == null ? "Pendiente" : `${points} pts`}</Badge>
    </article>
  );
}
