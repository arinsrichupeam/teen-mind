export const ASSESSMENT_RESULT_COLORS: Record<string, string> = {
  Green: "#22c55e",
  "Green-Low": "#86efac",
  Yellow: "#eab308",
  Orange: "#f97316",
  Red: "#ef4444",
};

export const ASSESSMENT_RESULT_LABELS: Record<string, string> = {
  Green: "ไม่พบความเสี่ยง",
  "Green-Low": "ความเสี่ยงเล็กน้อย",
  Yellow: "ความเสี่ยงปานกลาง",
  Orange: "ความเสี่ยงมาก",
  Red: "ความเสี่ยงรุนแรง",
};

export function getAssessmentResultColor(result: string): string {
  return ASSESSMENT_RESULT_COLORS[result] ?? "#94a3b8";
}

export function getAssessmentResultLabel(result: string): string {
  return ASSESSMENT_RESULT_LABELS[result] ?? result;
}
