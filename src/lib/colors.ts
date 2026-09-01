/** Distinct palette so each participant keeps the same color across both answers. */
export const PARTICIPANT_COLORS = [
  "#C45C26",
  "#1F6F6B",
  "#8B3A62",
  "#3D5A80",
  "#6B8F3C",
  "#B85C38",
  "#4A6FA5",
  "#7D5A3C",
  "#2E7D6F",
  "#9A4068",
  "#D97706",
  "#0F766E",
  "#A16207",
  "#BE123C",
  "#0369A1",
] as const;

export function pickColor(usedColors: string[]): string {
  const available = PARTICIPANT_COLORS.filter(
    (color) => !usedColors.includes(color),
  );
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return PARTICIPANT_COLORS[
    Math.floor(Math.random() * PARTICIPANT_COLORS.length)
  ];
}
