const values = Array.from({ length: 16 }, (_, index) => index);

export default function GoalSelector({ label, value, onChange }) {
  return (
    <label className="goal-selector">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {values.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
