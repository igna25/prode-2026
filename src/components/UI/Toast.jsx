export default function Toast({ message, tone = "success" }) {
  if (!message) return null;
  return <div className={`toast toast-${tone}`}>{message}</div>;
}
