export default function PenaltyPicker({ homeTeam, awayTeam, value, onChange }) {
  return (
    <fieldset className="penalty-picker">
      <legend>Pasa por penales</legend>
      <label>
        <input
          type="radio"
          name="winnerPenalty"
          value="HOME"
          checked={value === "HOME"}
          onChange={(event) => onChange(event.target.value)}
        />
        <span>{homeTeam}</span>
      </label>
      <label>
        <input
          type="radio"
          name="winnerPenalty"
          value="AWAY"
          checked={value === "AWAY"}
          onChange={(event) => onChange(event.target.value)}
        />
        <span>{awayTeam}</span>
      </label>
    </fieldset>
  );
}
