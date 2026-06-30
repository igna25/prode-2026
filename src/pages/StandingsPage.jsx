import StandingsTable from "../components/Standings/StandingsTable";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import { useStandings } from "../hooks/useStandings";

export default function StandingsPage() {
  const { standings, loading } = useStandings();
  const leaders = standings.filter((s) => s.rank === 1);

  if (loading) return <LoadingSpinner label="Cargando posiciones" />;

  function joinNames(names) {
    if (names.length <= 1) return names.join("");
    const last = names[names.length - 1];
    const sep = /^i/i.test(last) ? " e " : " y ";
    return names.slice(0, -1).join(", ") + sep + last;
  }

  function leaderLabel() {
    if (leaders.length === 0) return null;
    if (leaders.length === 1) return `Líder: ${leaders[0].name}`;
    return `Líderes: ${joinNames(leaders.map((l) => l.name))}`;
  }

  return (
    <section className="page-section">
      <div className="section-title">
        <div>
          <p className="eyebrow">Ranking</p>
          <h2>Posiciones</h2>
        </div>
        {leaders.length > 0 && <span className="section-chip">{leaderLabel()}</span>}
      </div>
      <StandingsTable standings={standings} />
    </section>
  );
}
