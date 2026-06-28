import { useMemo, useState } from "react";
import HistoryList from "../components/History/HistoryList";
import PredictionModal from "../components/Prediction/PredictionModal";
import { useMatches } from "../hooks/useMatches";
import { usePredictions } from "../hooks/usePredictions";
import { rounds } from "../lib/rounds";

export default function HistoryPage() {
  const { matches } = useMatches();
  const { myPredictions, predictionByMatch } = usePredictions();
  const [round, setRound] = useState("ALL");
  const [selectedMatch, setSelectedMatch] = useState(null);

  const filteredMatches = useMemo(
    () => (round === "ALL" ? matches : matches.filter((match) => match.round === round)),
    [matches, round]
  );

  return (
    <section className="page-section">
      <div className="section-title">
        <div>
          <p className="eyebrow">Predicciones</p>
          <h2>Historial</h2>
        </div>
      </div>
      <div className="segmented-control">
        <button className={round === "ALL" ? "active" : ""} onClick={() => setRound("ALL")}>
          Todas
        </button>
        {rounds.map((item) => (
          <button
            key={item.id}
            className={round === item.id ? "active" : ""}
            onClick={() => setRound(item.id)}
          >
            {item.short}
          </button>
        ))}
      </div>
      <HistoryList
        matches={filteredMatches}
        predictionByMatch={predictionByMatch}
        onSelectMatch={setSelectedMatch}
      />
      <PredictionModal
        match={selectedMatch}
        open={Boolean(selectedMatch)}
        prediction={selectedMatch ? predictionByMatch.get(selectedMatch.id) : null}
        onClose={() => setSelectedMatch(null)}
      />
    </section>
  );
}
