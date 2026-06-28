import RoundColumn from "./RoundColumn";

export default function BracketView({ rounds, predictionByMatch, onSelectMatch }) {
  return (
    <div className="bracket-scroll">
      <div className="bracket-grid">
        {rounds.map((round) => (
          <RoundColumn
            key={round.id}
            round={round}
            predictionByMatch={predictionByMatch}
            onSelectMatch={onSelectMatch}
          />
        ))}
      </div>
    </div>
  );
}
