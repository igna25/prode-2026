import MatchCard from "./MatchCard";

export default function RoundColumn({ round, predictionByMatch, onSelectMatch }) {
  return (
    <section className="round-column" aria-label={round.label}>
      <div className="round-heading">
        <h2>{round.label}</h2>
        <span>{round.matches.length}</span>
      </div>
      <div className="round-matches">
        {round.matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={predictionByMatch.get(match.id)}
            onSelect={onSelectMatch}
          />
        ))}
      </div>
    </section>
  );
}
