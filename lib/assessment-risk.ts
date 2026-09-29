export function CheckPHQAStatus(val: number) {
  switch (true) {
    case val >= 0 && val <= 4:
      return "ไม่พบความเสี่ยง";
    case val >= 5 && val <= 9:
      return "พบความเสี่ยงเล็กน้อย";
    case val >= 10 && val <= 14:
      return "พบความเสี่ยงปานกลาง";
    case val >= 15 && val <= 19:
      return "พบความเสี่ยงมาก";
    case val >= 20 && val <= 27:
      return "พบความเสี่ยงรุนแรง";
  }
}

export function getPhqaRiskLevel(sum: number): string {
  if (sum >= 0 && sum <= 4) return "Green";
  if (sum >= 5 && sum <= 9) return "Green-Low";
  if (sum >= 10 && sum <= 14) return "Yellow";
  if (sum >= 15 && sum <= 19) return "Orange";
  if (sum >= 20 && sum <= 27) return "Red";

  return "";
}

export function getPhqaRiskText(sum: number): string {
  if (sum >= 0 && sum <= 4) return "ไม่พบความเสี่ยง";
  if (sum >= 5 && sum <= 9) return "พบความเสี่ยงเล็กน้อย";
  if (sum >= 10 && sum <= 14) return "พบความเสี่ยงปานกลาง";
  if (sum >= 15 && sum <= 19) return "พบความเสี่ยงมาก";
  if (sum >= 20 && sum <= 27) return "พบความเสี่ยงรุนแรง";

  return "";
}

export function getNineQRiskLevel(sum: number): string {
  if (sum < 7) return "Green";
  if (sum <= 12) return "Yellow";
  if (sum <= 18) return "Orange";

  return "Red";
}

export function getNineQRiskText(sum: number): string {
  if (sum < 7) {
    return "ไม่มีอาการของโรคซึมเศร้าหรือมีอาการของโรคซึมเศร้าระดับน้อยมาก";
  }
  if (sum <= 12) return "มีอาการของโรคซึมเศร้า ระดับน้อย";
  if (sum <= 18) return "มีอาการของโรคซึมเศร้า ระดับปานกลาง";

  return "มีอาการของโรคซึมเศร้า ระดับรุนแรง";
}

export interface ItemWithPhqa {
  phqa?: Array<{ sum: number }>;
}

export function calculatePhqaRiskLevel(item: ItemWithPhqa): string {
  if (Array.isArray(item.phqa) && item.phqa.length > 0) {
    const sum = item.phqa[0].sum;

    return getPhqaRiskLevel(sum);
  }

  return "";
}
