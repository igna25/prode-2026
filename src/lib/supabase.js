import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getStoredDeviceId() {
  try {
    const participant = JSON.parse(localStorage.getItem("prode2026.participant"));
    return participant?.device_id ?? "";
  } catch {
    return "";
  }
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          "x-device-id": getStoredDeviceId()
        }
      }
    })
  : null;

export function getSupabaseClient() {
  if (!isSupabaseConfigured) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        "x-device-id": getStoredDeviceId()
      }
    }
  });
}
