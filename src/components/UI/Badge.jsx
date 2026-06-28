const toneClass = {
  success: "badge-success",
  danger: "badge-danger",
  warning: "badge-warning",
  info: "badge-info",
  neutral: "badge-neutral"
};

export default function Badge({ children, tone = "neutral" }) {
  return <span className={`badge ${toneClass[tone] ?? toneClass.neutral}`}>{children}</span>;
}
