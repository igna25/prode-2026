import { useParticipantContext } from "../../context/ParticipantContext";

export default function ParticipantRow({ row }) {
  const { participant } = useParticipantContext();
  const isCurrent = participant?.id === row.id;

  return (
    <tr className={isCurrent ? "is-current-user" : ""}>
      <td>{row.rank}</td>
      <td>{row.name}</td>
      <td>{row.predictionsCount}</td>
      <td className="points-cell">{row.points}</td>
    </tr>
  );
}
