import { calculatePoints, toScoringPrediction, toScoringResult } from "./scoring";

const KEYS = {
  participant: "prode2026.participant",
  participants: "prode2026.participants",
  matches: "prode2026.matches",
  predictions: "prode2026.predictions"
};

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("prode-store-change", { detail: { key } }));
  return value;
}

export function ensureLocalData() {
  if (!localStorage.getItem(KEYS.matches)) write(KEYS.matches, []);
  if (!localStorage.getItem(KEYS.participants)) write(KEYS.participants, []);
  if (!localStorage.getItem(KEYS.predictions)) write(KEYS.predictions, []);
}

export function createDeviceId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getCurrentParticipant() {
  ensureLocalData();
  return read(KEYS.participant, null);
}

export function normalizeParticipantName(name) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-AR");
}

export function assertLocalParticipantNameAvailable(name, currentDeviceId = null) {
  const normalized = normalizeParticipantName(name);
  const participants = getParticipants();
  const duplicate = participants.find(
    (participant) =>
      normalizeParticipantName(participant.name) === normalized &&
      participant.device_id !== currentDeviceId
  );

  if (duplicate) {
    const error = new Error("Ese nombre ya está en uso. Probá con otro.");
    error.code = "DUPLICATE_PARTICIPANT_NAME";
    throw error;
  }
}

export function createParticipantDraft(name) {
  ensureLocalData();
  const existing = getCurrentParticipant();
  const cleanedName = name.trim().replace(/\s+/g, " ");
  return existing
    ? { ...existing, name: cleanedName }
    : {
    id: crypto?.randomUUID?.() ?? `participant-${Date.now()}`,
    name: cleanedName,
    device_id: createDeviceId(),
    created_at: new Date().toISOString()
  };
}

export function saveParticipant(participant) {
  ensureLocalData();
  assertLocalParticipantNameAvailable(participant.name, participant.device_id);

  const saved = { ...participant, name: participant.name.trim().replace(/\s+/g, " ") };
  const participants = read(KEYS.participants, []);
  const nextParticipants = [
    ...participants.filter((item) => item.id !== saved.id),
    saved
  ];

  write(KEYS.participant, saved);
  write(KEYS.participants, nextParticipants);
  return saved;
}

export function saveCurrentParticipant(name) {
  return saveParticipant(createParticipantDraft(name));
}

export function clearCurrentParticipant() {
  localStorage.removeItem(KEYS.participant);
  window.dispatchEvent(new CustomEvent("prode-store-change", { detail: { key: KEYS.participant } }));
}

export function getMatches() {
  ensureLocalData();
  return read(KEYS.matches, []).sort((a, b) => {
    if (a.round === b.round) return a.bracket_position - b.bracket_position;
    return new Date(a.match_datetime) - new Date(b.match_datetime);
  });
}

export function saveMatches(matches) {
  return write(KEYS.matches, matches);
}

export function getParticipants() {
  ensureLocalData();
  return read(KEYS.participants, []);
}

export function getPredictions() {
  ensureLocalData();
  return read(KEYS.predictions, []);
}

export function upsertPrediction(participantId, matchId, values) {
  const predictions = getPredictions();
  const now = new Date().toISOString();
  const existing = predictions.find(
    (prediction) =>
      prediction.participant_id === participantId && prediction.match_id === matchId
  );
  const prediction = {
    id: existing?.id ?? crypto?.randomUUID?.() ?? `prediction-${Date.now()}`,
    participant_id: participantId,
    match_id: matchId,
    predicted_home_goals: Number(values.homeGoals),
    predicted_away_goals: Number(values.awayGoals),
    predicted_winner: values.winnerPenalty,
    points_earned: existing?.points_earned ?? null,
    is_locked: existing?.is_locked ?? false,
    created_at: existing?.created_at ?? now,
    updated_at: now
  };

  const next = [
    ...predictions.filter((item) => item.id !== prediction.id),
    prediction
  ];
  write(KEYS.predictions, next);
  return prediction;
}

export function updateMatchResult(matchId, patch) {
  const matches = getMatches();
  const next = matches.map((match) =>
    match.id === matchId
      ? {
          ...match,
          ...patch,
          updated_at: new Date().toISOString()
        }
      : match
  );
  write(KEYS.matches, next);
  return next.find((match) => match.id === matchId);
}

export function recalculateLocalPoints(matchId) {
  const matches = getMatches();
  const match = matches.find((item) => item.id === matchId);
  const predictions = getPredictions();
  const nextPredictions = predictions.map((prediction) => {
    if (prediction.match_id !== matchId) return prediction;
    const points = calculatePoints(
      toScoringPrediction(prediction),
      toScoringResult(match)
    );
    return {
      ...prediction,
      points_earned: points,
      is_locked: match?.status !== "SCHEDULED",
      updated_at: new Date().toISOString()
    };
  });
  write(KEYS.predictions, nextPredictions);
  return nextPredictions;
}

export function subscribeLocalStore(callback) {
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener("prode-store-change", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("prode-store-change", handler);
  };
}
