export const RESULT = {
  HOME: "HOME",
  AWAY: "AWAY",
  DRAW: "DRAW"
};

export function getResultType(homeGoals, awayGoals) {
  if (homeGoals > awayGoals) return RESULT.HOME;
  if (awayGoals > homeGoals) return RESULT.AWAY;
  return RESULT.DRAW;
}

function normalizeWinner(value) {
  if (value === "LOCAL") return RESULT.HOME;
  if (value === "VISITANTE") return RESULT.AWAY;
  return value;
}

function getAdvancingTeam(score) {
  const result = getResultType(score.homeGoals, score.awayGoals);
  if (result !== RESULT.DRAW) return result;
  return normalizeWinner(score.winnerPenalty);
}

export function calculatePoints(prediction, matchResult) {
  if (!prediction || !matchResult) return 0;
  if (matchResult.homeGoals == null || matchResult.awayGoals == null) return null;

  const pred = {
    homeGoals: Number(prediction.homeGoals),
    awayGoals: Number(prediction.awayGoals),
    winnerPenalty: normalizeWinner(prediction.winnerPenalty)
  };
  const real = {
    homeGoals: Number(matchResult.homeGoals),
    awayGoals: Number(matchResult.awayGoals),
    winnerPenalty: normalizeWinner(matchResult.winnerPenalty)
  };

  const predictedResult = getResultType(pred.homeGoals, pred.awayGoals);
  const realResult = getResultType(real.homeGoals, real.awayGoals);

  if (predictedResult === realResult) {
    if (realResult !== RESULT.DRAW) {
      if (pred.homeGoals === real.homeGoals && pred.awayGoals === real.awayGoals) {
        return 6;
      }

      let points = 3;
      if (pred.homeGoals === real.homeGoals) points += 1;
      if (pred.awayGoals === real.awayGoals) points += 1;
      return points;
    }

    const gotGoals = pred.homeGoals === real.homeGoals;
    const gotPenaltyWinner = pred.winnerPenalty === real.winnerPenalty;

    if (gotGoals && gotPenaltyWinner) return 6;
    if (gotGoals) return 4;
    if (gotPenaltyWinner) return 4;
    return 3;
  }

  if (predictedResult === RESULT.DRAW && realResult !== RESULT.DRAW) {
    const realAdvancingTeam = getAdvancingTeam(real);
    if (pred.winnerPenalty === realAdvancingTeam) {
      let points = 3;
      if (pred.homeGoals === real.homeGoals) points += 1;
      if (pred.awayGoals === real.awayGoals) points += 1;
      return points;
    }
    return 0;
  }

  if (predictedResult !== RESULT.DRAW && realResult === RESULT.DRAW) {
    const predictedAdvancingTeam = getAdvancingTeam(pred);
    if (predictedAdvancingTeam === real.winnerPenalty) {
      let points = 3;
      if (pred.homeGoals === real.homeGoals) points += 1;
      if (pred.awayGoals === real.awayGoals) points += 1;
      return points;
    }
    return 0;
  }

  let individualGoalPoints = 0;
  if (pred.homeGoals === real.homeGoals) individualGoalPoints += 1;
  if (pred.awayGoals === real.awayGoals) individualGoalPoints += 1;
  return individualGoalPoints;
}

export function toScoringPrediction(prediction) {
  return {
    homeGoals: prediction.predicted_home_goals ?? prediction.homeGoals,
    awayGoals: prediction.predicted_away_goals ?? prediction.awayGoals,
    winnerPenalty: prediction.predicted_winner ?? prediction.winnerPenalty
  };
}

export function toScoringResult(match) {
  return {
    homeGoals: match.goals_home ?? match.homeGoals,
    awayGoals: match.goals_away ?? match.awayGoals,
    winnerPenalty: match.winner_penalty ?? match.winnerPenalty
  };
}
