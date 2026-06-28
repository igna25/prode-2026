import { format } from "date-fns";
import { es } from "date-fns/locale";
import { isMatchLocked } from "../../hooks/usePredictions";
import Badge from "../UI/Badge";
import CountdownTimer from "../UI/CountdownTimer";

const statusTone = {
  SCHEDULED: "info",
  LIVE: "danger",
  FINISHED: "success"
};

const statusLabel = {
  SCHEDULED: "Programado",
  LIVE: "En vivo",
  FINISHED: "Terminado"
};

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

function TeamLine({ code, name, goals }) {
  return (
    <div className="team-line">
      <Flag code={code} name={name} />
      <span>{name || "Por definir"}</span>
      <strong>{goals ?? ""}</strong>
    </div>
  );
}

export default function MatchCard({ match, prediction, onSelect }) {
  const locked = isMatchLocked(match);
  const date = match.match_datetime
    ? format(new Date(match.match_datetime), "d MMM HH:mm", { locale: es })
    : "Fecha a confirmar";

  return (
    <button className="match-card" type="button" onClick={() => onSelect(match)}>
      <div className="match-card-top">
        <Badge tone={statusTone[match.status]}>{statusLabel[match.status] ?? match.status}</Badge>
        {prediction ? (
          <span className="prediction-dot is-done">Predicha</span>
        ) : (
          <span className="prediction-dot">Pendiente</span>
        )}
      </div>
      <TeamLine code={match.team_home_code} name={match.team_home} goals={match.goals_home} />
      <TeamLine code={match.team_away_code} name={match.team_away} goals={match.goals_away} />
      {prediction && (
        <p className="match-prediction-line">
          Tu predicción: {prediction.predicted_home_goals}-{prediction.predicted_away_goals}
          {prediction.predicted_home_goals === prediction.predicted_away_goals && prediction.predicted_winner
            ? ` (pasa ${prediction.predicted_winner === "HOME" ? match.team_home : match.team_away})`
            : ""}
        </p>
      )}
      <div className="match-card-bottom">
        <span>{date} ART</span>
        <span>{locked ? "Bloqueado" : <CountdownTimer date={match.match_datetime} />}</span>
      </div>
      {match.stadium && <small>{match.stadium}</small>}
    </button>
  );
}
