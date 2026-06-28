const scoringRows = [
  ["Ganador correcto", "+3"],
  ["Goles exactos de un equipo", "+1"],
  ["Resultado exacto con ganador", "+6"],
  ["Empate correcto", "+3"],
  ["Goles exactos en empate", "+1"],
  ["Clasificado por penales correcto", "+1"]
];

const examples = [
  ["2-1 gana A", "2-1 gana A", "6"],
  ["2-1 gana A", "3-1 gana A", "4"],
  ["0-0 pasa A", "0-0 pasa B", "4"],
  ["0-0 pasa A", "2-0 gana A", "4"]
];

export default function RulesPage() {
  return (
    <section className="page-section rules-page">
      <div className="section-title">
        <div>
          <p className="eyebrow">Sistema</p>
          <h2>Reglas</h2>
        </div>
      </div>

      <div className="rules-grid">
        <section className="info-panel">
          <h3>Puntuación</h3>
          <div className="rules-list">
            {scoringRows.map(([label, points]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{points}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="info-panel">
          <h3>Ejemplos</h3>
          <div className="examples-table">
            {examples.map(([prediction, result, points]) => (
              <div key={`${prediction}-${result}`}>
                <span>{prediction}</span>
                <span>{result}</span>
                <strong>{points} pts</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="info-panel">
        <h3>Bloqueos</h3>
        <p>
          Cada partido se puede editar hasta el minuto de inicio. Al comenzar, la
          predicción queda cerrada y se vuelve visible para el resto de participantes.
        </p>
      </section>
    </section>
  );
}
