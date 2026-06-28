export const rounds = [
  { id: "R32", label: "16avos", short: "R32" },
  { id: "R16", label: "Octavos", short: "R16" },
  { id: "QF", label: "Cuartos", short: "QF" },
  { id: "SF", label: "Semis", short: "SF" },
  { id: "3RD", label: "3er puesto", short: "3P" },
  { id: "FINAL", label: "Final", short: "FIN" }
];

export const knockoutRoundIds = rounds.map((round) => round.id);
