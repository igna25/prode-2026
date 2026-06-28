const BASE_URL = "https://worldcup26.ir";
const ROUND_BY_TYPE = {
  r32: "R32",
  r16: "R16",
  qf: "QF",
  sf: "SF",
  third: "3RD",
  final: "FINAL"
};

const KNOCKOUT_ROUNDS = new Set(["R32", "R16", "QF", "SF", "3RD", "FINAL"]);

async function request(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`WorldCup26.ir responded with ${response.status}`);
  }
  return response.json();
}

export function getWorldCupGames() {
  return request("/get/games");
}

export function getWorldCupTeams() {
  return request("/get/teams");
}

export function getWorldCupGroups() {
  return request("/get/groups");
}

export function getWorldCupStadiums() {
  return request("/get/stadiums");
}

function parseNullableScore(value) {
  if (value == null || value === "" || value === "null") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRound(game) {
  const fromType = ROUND_BY_TYPE[String(game.type ?? "").toLowerCase()];
  const fromGroup = String(game.group ?? "").toUpperCase();
  if (fromType) return fromType;
  if (fromGroup === "3RD") return "3RD";
  if (KNOCKOUT_ROUNDS.has(fromGroup)) return fromGroup;
  return null;
}

function parseExternalDate(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) return new Date(value).toISOString();
  const [, month, day, year, hour, minute] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:00-03:00`;
}

function normalizeStatus(game) {
  const elapsed = String(game.time_elapsed ?? "").toLowerCase();
  const finished = String(game.finished ?? "").toUpperCase() === "TRUE";
  if (finished || elapsed === "finished") return "FINISHED";
  if (elapsed === "live") return "LIVE";
  return "SCHEDULED";
}

function teamName(game, side) {
  const name = game[`${side}_team_name_en`];
  const label = game[`${side}_team_label`];
  return name || label || "Por definir";
}

const TEAM_CODES = {
  "Algeria": "dz",
  "Argentina": "ar",
  "Australia": "au",
  "Austria": "at",
  "Belgium": "be",
  "Bosnia and Herzegovina": "ba",
  "Brazil": "br",
  "Canada": "ca",
  "Cape Verde": "cv",
  "Colombia": "co",
  "Croatia": "hr",
  "Curaçao": "cw",
  "Czech Republic": "cz",
  "Democratic Republic of the Congo": "cd",
  "Ecuador": "ec",
  "Egypt": "eg",
  "England": "gb-eng",
  "France": "fr",
  "Germany": "de",
  "Ghana": "gh",
  "Haiti": "ht",
  "Iran": "ir",
  "Iraq": "iq",
  "Ivory Coast": "ci",
  "Japan": "jp",
  "Jordan": "jo",
  "Mexico": "mx",
  "Morocco": "ma",
  "Netherlands": "nl",
  "New Zealand": "nz",
  "Norway": "no",
  "Panama": "pa",
  "Paraguay": "py",
  "Portugal": "pt",
  "Qatar": "qa",
  "Saudi Arabia": "sa",
  "Scotland": "gb-sct",
  "Senegal": "sn",
  "South Africa": "za",
  "South Korea": "kr",
  "Spain": "es",
  "Sweden": "se",
  "Switzerland": "ch",
  "Tunisia": "tn",
  "Turkey": "tr",
  "United States": "us",
  "Uruguay": "uy",
  "Uzbekistan": "uz"
};

export function normalizeExternalMatch(game, index = 0) {
  const round = normalizeRound(game);
  if (!round) return null;

  const homeName = teamName(game, "home");
  const awayName = teamName(game, "away");

  return {
    id: `external-${game.id ?? game._id ?? index}`,
    external_id: String(game.id ?? game._id ?? index),
    round,
    team_home: homeName,
    team_away: awayName,
    team_home_code: TEAM_CODES[game.home_team_name_en] ?? game.home_code?.toLowerCase?.() ?? null,
    team_away_code: TEAM_CODES[game.away_team_name_en] ?? game.away_code?.toLowerCase?.() ?? null,
    goals_home: parseNullableScore(game.home_score),
    goals_away: parseNullableScore(game.away_score),
    winner_penalty: game.penalty_winner ?? null,
    status: normalizeStatus(game),
    match_datetime: parseExternalDate(game.local_date ?? game.date ?? game.datetime),
    stadium: game.stadium ?? null,
    bracket_position: Number(game.id ?? index)
  };
}

export function normalizeExternalMatches(payload) {
  const games = Array.isArray(payload) ? payload : payload.games ?? payload.data ?? [];
  return games
    .map((game, index) => normalizeExternalMatch(game, index + 1))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.round === b.round) return a.bracket_position - b.bracket_position;
      return new Date(a.match_datetime) - new Date(b.match_datetime);
    });
}
