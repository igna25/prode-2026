import { useState } from "react";
import BracketView from "../components/Bracket/BracketView";
import PredictionModal from "../components/Prediction/PredictionModal";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import { useMatches } from "../hooks/useMatches";
import { usePredictions } from "../hooks/usePredictions";

export default function BracketPage() {
  const { matchesByRound, totalMatches, loading, error } = useMatches();
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
      {error && <p className="form-error bracket-alert">{error}</p>}
      {totalMatches === 0 ? (
        <p className="empty-state">
          Todavía no hay partidos de fase eliminatoria para mostrar.
        </p>
      ) : (
        <BracketView
          rounds={matchesByRound}
          predictionByMatch={predictionByMatch}
          onSelectMatch={setSelectedMatch}
        />
      )}
      <PredictionModal
        match={selectedMatch}
        open={Boolean(selectedMatch)}
        prediction={selectedMatch ? predictionByMatch.get(selectedMatch.id) : null}
        onClose={() => setSelectedMatch(null)}
      />
    </section>
  );
}
