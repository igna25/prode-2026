import { useMemo, useState } from "react";
import { updateMatchResult, recalculateLocalPoints } from "../lib/localStore";
import { useMatches } from "../hooks/useMatches";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";
import { calculatePoints, toScoringPrediction, toScoringResult } from "../lib/scoring";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");
  const { matches } = useMatches();
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || "admin";

  const sortedMatches = useMemo(
    () => [...matches].sort((a, b) => new Date(a.match_datetime) - new Date(b.match_datetime)),
    [matches]
  );

  function handleLogin(event) {
    event.preventDefault();
    setUnlocked(password === adminPassword);
    if (password !== adminPassword) setMessage("Contraseña incorrecta");
  }

  async function handleResult(match, field, value) {
    const patch = {
      [field]: value === "" ? null : field.includes("goals") ? Number(value) : value
    };
    updateMatchResult(match.id, patch);

    if (isSupabaseConfigured && match.external_id) {
      const client = getSupabaseClient();
      await client.from("matches").update(patch).eq("external_id", match.external_id);
    }
  }

  async function finishMatch(match) {
    updateMatchResult(match.id, { status: "FINISHED" });
    recalculateLocalPoints(match.id);

    if (isSupabaseConfigured && match.external_id) {
      const client = getSupabaseClient();

      const { data: dbMatch } = await client
        .from("matches")
        .select("id")
        .eq("external_id", match.external_id)
        .maybeSingle();

      if (dbMatch) {
        await client
          .from("matches")
          .update({ status: "FINISHED" })
          .eq("id", dbMatch.id);

        const { data: predictions } = await client
          .from("predictions")
          .select("id, predicted_home_goals, predicted_away_goals, predicted_winner")
          .eq("match_id", dbMatch.id);

        if (predictions?.length) {
          const real = toScoringResult(match);
          await Promise.all(
            predictions.map((pred) =>
              client
                .from("predictions")
                .update({
                  is_locked: true,
                  points_earned: calculatePoints(toScoringPrediction(pred), real)
                })
                .eq("id", pred.id)
            )
          );
        }
      }
    }

    setMessage("Resultado guardado y puntos recalculados");
  }

  if (!unlocked) {
    return (
      <main className="admin-screen">
        <form className="admin-login" onSubmit={handleLogin}>
          <h1>Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Contraseña"
          />
          <button className="primary-button">Entrar</button>
          {message && <p className="form-error">{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="admin-screen">
      <section className="admin-panel">
        <div className="section-title">
          <div>
            <p className="eyebrow">Panel oculto</p>
            <h1>Resultados</h1>
          </div>
        </div>
        {message && <p className="form-success">{message}</p>}
        <div className="admin-match-list">
          {sortedMatches.map((match) => (
            <article className="admin-match" key={match.id}>
              <strong>{match.team_home} vs {match.team_away}</strong>
              <div className="admin-controls">
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={match.goals_home ?? ""}
                  onChange={(event) => handleResult(match, "goals_home", event.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={match.goals_away ?? ""}
                  onChange={(event) => handleResult(match, "goals_away", event.target.value)}
                />
                <select
                  value={match.winner_penalty ?? ""}
                  onChange={(event) => handleResult(match, "winner_penalty", event.target.value)}
                >
                  <option value="">Sin penales</option>
                  <option value="HOME">Pasa local</option>
                  <option value="AWAY">Pasa visitante</option>
                </select>
                <button type="button" onClick={() => finishMatch(match)}>
                  Recalcular
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
