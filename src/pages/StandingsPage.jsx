import StandingsTable from "../components/Standings/StandingsTable";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import { useStandings } from "../hooks/useStandings";

export default function StandingsPage() {
  const { standings, loading } = useStandings();
  const leader = standings[0];

  if (loading) return <LoadingSpinner label="Cargando posiciones" />;

  return (
    <section className="page-section">
      <div className="section-title">
        <div>
          <p className="eyebrow">Ranking</p>
          <h2>Posiciones</h2>
        </div>
        {leader && <span className="section-chip">Líder: {leader.name}</span>}
      </div>
      <StandingsTable standings={standings} />
    </section>
  );
}
