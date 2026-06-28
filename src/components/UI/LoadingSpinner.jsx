export default function LoadingSpinner({ label = "Cargando" }) {
  return (
    <div className="loading-inline" role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
