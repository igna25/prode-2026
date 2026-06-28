import { useState } from "react";
import { isPushSupported, requestPushSubscription } from "../../lib/notifications";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase";
import { useParticipantContext } from "../../context/ParticipantContext";

const DISMISSED_KEY = "prode2026.notifications_dismissed";

function isDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {}
}

export default function NotificationBanner() {
  const { participant } = useParticipantContext();
  const [visible, setVisible] = useState(() => !isDismissed());

  if (!visible || !participant || !isPushSupported()) return null;

  if (Notification.permission !== "default") return null;

  async function handleAccept() {
    try {
      const subscription = await requestPushSubscription();
      if (subscription && isSupabaseConfigured) {
        const client = getSupabaseClient();
        const { error } = await client
          .from("participants")
          .update({ push_subscription: subscription })
          .eq("id", participant.id);
        if (error) console.error("Error guardando suscripción:", error.message);
      } else if (!subscription) {
        console.warn("No se obtuvo suscripción push");
      }
    } catch (err) {
      console.error("Error en handleAccept:", err);
    }
    dismiss();
    setVisible(false);
  }

  function handleDismiss() {
    dismiss();
    setVisible(false);
  }

  return (
    <div className="notif-banner" role="status">
      <img src="/icons/icon.svg" alt="" className="notif-banner-icon" />
      <div className="notif-banner-text">
        <strong>Activá las notificaciones</strong>
        <span>Te avisamos antes de cada partido para que revises tu predicción.</span>
      </div>
      <div className="notif-banner-actions">
        <button type="button" className="notif-banner-btn" onClick={handleAccept}>
          Activar
        </button>
        <button
          type="button"
          className="notif-banner-dismiss"
          onClick={handleDismiss}
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
