import ParticipantRow from "./ParticipantRow";

export default function StandingsTable({ standings }) {
  return (
    <div className="table-wrap">
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Puntos</th>
            <th>Predicciones</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <ParticipantRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
