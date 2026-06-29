import { useState, useEffect } from "react";
import { LogOut, BellOn, BellOff } from "./Icons";
import { useParticipantContext } from "../../context/ParticipantContext";
import { isPushSupported, requestPushSubscription } from "../../lib/notifications";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase";

export default function Header() {
  const { participant, leaveTournament } = useParticipantContext();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!participant || !isSupabaseConfigured) return;
    const client = getSupabaseClient();
    client
      .from("participants")
      .select("push_subscription")
      .eq("id", participant.id)
      .maybeSingle()
      .then(({ data }) => {
        setHasSubscription(!!data?.push_subscription);
      });
  }, [participant]);

  async function toggleNotifications() {
    if (toggling) return;
    setToggling(true);
    try {
      if (!isSupabaseConfigured || !participant) return;

      const client = getSupabaseClient();

      if (hasSubscription) {
        await client
          .from("participants")
          .update({ push_subscription: null })
          .eq("id", participant.id);
        setHasSubscription(false);
      } else {
        const subscription = await requestPushSubscription();
        if (subscription) {
          await client
            .from("participants")
            .update({ push_subscription: subscription })
            .eq("id", participant.id);
          setHasSubscription(true);
        }
      }
    } catch (err) {
      console.error("Error toggling notifications:", err);
    } finally {
      setToggling(false);
    }
  }

  if (!isPushSupported()) return null;

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Prode Mundialista</p>
        <h1>2026</h1>
        <span className="header-version">Ver. {import.meta.env.VITE_APP_VERSION}</span>
      </div>
      <div className="header-user">
        <span>{participant?.name}</span>
        <button
          className="icon-button"
          onClick={toggleNotifications}
          title={hasSubscription ? "Desactivar notificaciones" : "Activar notificaciones"}
          disabled={toggling}
        >
          {hasSubscription ? <BellOn /> : <BellOff />}
        </button>
        <button className="icon-button" onClick={leaveTournament} title="Salir">
          <LogOut />
        </button>
      </div>
    </header>
  );
}
