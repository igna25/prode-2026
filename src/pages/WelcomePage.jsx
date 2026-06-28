import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useParticipantContext } from "../context/ParticipantContext";

export default function WelcomePage() {
  const { participant, joinTournament, loginParticipant } = useParticipantContext();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("register");
  const navigate = useNavigate();

  if (participant) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSaving(true);
    try {
      if (mode === "register") {
        await joinTournament(name);
      } else {
        await loginParticipant(name);
      }
      navigate("/", { replace: true });
    } catch (joinError) {
      setError(joinError.message || "No se pudo completar la operación.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="welcome-screen">
      <section className="welcome-panel">
        <div className="welcome-mark">
          <img src="/icons/icon.svg" alt="" />
        </div>
        <p className="eyebrow">Prode Mundialista</p>
        <h1>2026</h1>
        <p className="welcome-copy">
          Armá tus predicciones para la fase eliminatoria y seguí la tabla en vivo.
        </p>
        <div className="welcome-tabs">
          <button
            type="button"
            className={`welcome-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Nuevo
          </button>
          <button
            type="button"
            className={`welcome-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Ya tengo cuenta
          </button>
        </div>
        <form onSubmit={handleSubmit} className="welcome-form">
          <label>
            <span>Tu nombre</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={32}
              autoComplete="name"
              autoFocus
              placeholder="Ej: Ignacio"
            />
          </label>
          <button className="primary-button" disabled={!name.trim() || saving}>
            {saving
              ? "Entrando..."
              : mode === "register"
                ? "Unirse al torneo"
                : "Entrar"}
          </button>
          {error && <p className="form-error">{error}</p>}
        </form>
      </section>
    </main>
  );
}
