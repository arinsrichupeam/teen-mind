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
