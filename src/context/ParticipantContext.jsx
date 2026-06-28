import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearCurrentParticipant,
  createParticipantDraft,
  getCurrentParticipant,
  normalizeParticipantName,
  saveParticipant,
  subscribeLocalStore
} from "../lib/localStore";
import { requestPushSubscription } from "../lib/notifications";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

const ParticipantContext = createContext(null);

export function ParticipantProvider({ children }) {
  const [participant, setParticipant] = useState(() => getCurrentParticipant());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return subscribeLocalStore(() => setParticipant(getCurrentParticipant()));
  }, []);

  async function joinTournament(name) {
    const draft = createParticipantDraft(name);

    let pushSubscription = null;
    try {
      pushSubscription = await requestPushSubscription();
    } catch {
      pushSubscription = null;
    }

    if (isSupabaseConfigured) {
      const client = getSupabaseClient();
      const normalizedName = normalizeParticipantName(draft.name);
      const { data: existing, error: existingError } = await client
        .from("participants")
        .select("id, name")
        .eq("name_normalized", normalizedName)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing) {
        const error = new Error("Ese nombre ya está en uso. Usá \"Ya tengo cuenta\" para acceder.");
        error.code = "DUPLICATE_PARTICIPANT_NAME";
        throw error;
      }

      const { data, error } = await client.from("participants").upsert(
        {
          id: draft.id,
          name: draft.name,
          device_id: draft.device_id,
          push_subscription: pushSubscription
        },
        { onConflict: "device_id" }
      ).select().single();

      if (error) {
        if (error.code === "23505") {
          const duplicateNameError = new Error("Ese nombre ya está en uso. Usá \"Ya tengo cuenta\" para acceder.");
          duplicateNameError.code = "DUPLICATE_PARTICIPANT_NAME";
          throw duplicateNameError;
        }
        throw error;
      }

      const saved = saveParticipant({
        ...draft,
        id: data?.id ?? draft.id,
        name: data?.name ?? draft.name
      });
      setParticipant(saved);
      return saved;
    }

    const saved = saveParticipant(draft);
    setParticipant(saved);
    return saved;
  }

  async function loginParticipant(name) {
    if (!isSupabaseConfigured) {
      const current = getCurrentParticipant();
      if (current && normalizeParticipantName(current.name) === normalizeParticipantName(name)) {
        return current;
      }
      throw new Error("No se encontró un participante con ese nombre.");
    }

    const client = getSupabaseClient();
    const normalizedName = normalizeParticipantName(name);
    const { data, error } = await client
      .from("participants")
      .select("id, name")
      .eq("name_normalized", normalizedName)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error("No se encontró un participante con ese nombre.");
    }

    const saved = saveParticipant({
      id: data.id,
      name: data.name,
      device_id: getCurrentParticipant()?.device_id || createParticipantDraft(data.name).device_id,
      created_at: new Date().toISOString()
    });
    setParticipant(saved);
    return saved;
  }

  function leaveTournament() {
    clearCurrentParticipant();
    setParticipant(null);
  }

  const value = useMemo(
    () => ({
      participant,
      loading,
      joinTournament,
      loginParticipant,
      leaveTournament
    }),
    [participant, loading]
  );

  return (
    <ParticipantContext.Provider value={value}>
      {children}
    </ParticipantContext.Provider>
  );
}

export function useParticipantContext() {
  const context = useContext(ParticipantContext);
  if (!context) {
    throw new Error("useParticipantContext must be used inside ParticipantProvider");
  }
  return context;
}
