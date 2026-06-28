import { useState } from "react";
import BracketView from "../components/Bracket/BracketView";
import PredictionModal from "../components/Prediction/PredictionModal";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import { useMatches } from "../hooks/useMatches";
import { usePredictions } from "../hooks/usePredictions";

export default function BracketPage() {
  const { matchesByRound, loading } = useMatches();
  const { predictionByMatch } = usePredictions();
  const [selectedMatch, setSelectedMatch] = useState(null);

  if (loading) return <LoadingSpinner label="Cargando cuadro" />;

  return (
    <section className="page-section">
      <div className="section-title">
        <div>
          <p className="eyebrow">Eliminatorias</p>
          <h2>Cuadro</h2>
        </div>
      </div>
      <BracketView
        rounds={matchesByRound}
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
