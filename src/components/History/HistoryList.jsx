import HistoryCard from "./HistoryCard";

export default function HistoryList({ matches, predictionByMatch, onSelectMatch }) {
  const ordered = [...matches].sort(
    (a, b) => new Date(a.match_datetime) - new Date(b.match_datetime)
  );

  if (!ordered.length) {
    return <p className="empty-state">Todavía no hay partidos para mostrar.</p>;
  }

  return (
    <div className="history-list">
      {ordered.map((match) => (
        <HistoryCard
          key={match.id}
          match={match}
          prediction={predictionByMatch.get(match.id)}
          onSelect={() => onSelectMatch(match)}
        />
      ))}
    </div>
  );
}
