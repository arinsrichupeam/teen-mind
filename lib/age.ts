import { formatDateForDisplay } from "@/lib/thai-datetime";

export function getDaysInMonth(month: number, year: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (month === 2) {
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
      return 29;
    }

    return 28;
  }

  return daysInMonth[month - 1];
}

export function validateBirthday(
  birthDate: string,
  minAge: number = 4,
  maxAge: number = 100
): string {
  if (!birthDate || birthDate === "") {
    return "กรุณาระบุวันเกิด";
  }

  if (!birthDate.includes("/")) {
    return "รูปแบบวันเกิดไม่ถูกต้อง กรุณากรอกในรูปแบบ dd/mm/yyyy";
  }

  const parts = birthDate.split("/");

  if (parts.length !== 3) {
    return "รูปแบบวันเกิดไม่ถูกต้อง กรุณากรอกในรูปแบบ dd/mm/yyyy";
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const thaiYear = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(thaiYear)) {
    return "รูปแบบวันเกิดไม่ถูกต้อง กรุณากรอกในรูปแบบ dd/mm/yyyy";
  }

  if (month < 1 || month > 12) {
    return "เดือนไม่ถูกต้อง (1-12)";
  }

  const christianYear = thaiYear - 543;

  if (christianYear < 1900 || christianYear > 2100) {
    return "ปีไม่ถูกต้อง";
  }

  const maxDays = getDaysInMonth(month, christianYear);

  if (day < 1 || day > maxDays) {
    if (month === 2) {
      return `เดือนกุมภาพันธ์มีได้ไม่เกิน ${maxDays} วัน`;
    }

    return `เดือน ${month} มีได้ไม่เกิน ${maxDays} วัน`;
  }

  try {
    const date = new Date(Date.UTC(christianYear, month - 1, day));

    if (isNaN(date.getTime())) {
      return "วันที่ไม่ถูกต้อง";
    }

    const today = new Date();

    if (date > today) {
      return "วันเกิดไม่สามารถเป็นวันอนาคตได้";
    }

    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      age--;
    }

    if (age < minAge) {
      return "วันที่ไม่ถูกต้อง";
    }

    if (age > maxAge) {
      return "วันที่ไม่ถูกต้อง";
    }

    return "";
  } catch {
    return "วันที่ไม่ถูกต้อง";
  }
}

export function validateBirthdayValue(
  value: string | Date | null | undefined,
  minAge: number = 4,
  maxAge: number = 100
): string {
  if (value == null || String(value).trim() === "") {
    return "กรุณาระบุวันเกิด";
  }

  if (typeof value === "string" && value.includes("/")) {
    return validateBirthday(value, minAge, maxAge);
  }

  let thaiDate: string;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return "รูปแบบวันเกิดไม่ถูกต้อง";
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    thaiDate = `${day}/${month}/${year + 543}`;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");

    thaiDate = `${day}/${month}/${String(parseInt(year, 10) + 543)}`;
  } else {
    thaiDate = formatDateForDisplay(value);

    if (!thaiDate) {
      return "รูปแบบวันเกิดไม่ถูกต้อง";
    }
  }

  return validateBirthday(thaiDate, minAge, maxAge);
}

export type AgeParts = {
  years: number;
  months: number;
  days: number;
};

/** คำนวณอายุเป็นปี เดือน วัน จากวันเกิดถึงวันที่กำหนด */
export function calculateAgeParts(
  birthDate: string,
  targetDate?: string | Date | null
): AgeParts {
  if (!birthDate) return { years: 0, months: 0, days: 0 };

  const birth = new Date(birthDate);
  const target = targetDate ? new Date(targetDate) : new Date();

  if (Number.isNaN(birth.getTime()) || Number.isNaN(target.getTime())) {
    return { years: 0, months: 0, days: 0 };
  }

  let years = target.getFullYear() - birth.getFullYear();
  let months = target.getMonth() - birth.getMonth();
  let days = target.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const daysInPrevMonth = new Date(
      target.getFullYear(),
      target.getMonth(),
      0
    ).getDate();

    days += daysInPrevMonth;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) {
    return { years: 0, months: 0, days: 0 };
  }

  return { years, months, days };
}

export function formatAgeYMD(
  birthDate: string,
  targetDate?: string | Date | null
): string {
  const { years, months, days } = calculateAgeParts(birthDate, targetDate);

  return `${years} ปี ${months} เดือน ${days} วัน`;
}

/** คำนวณอายุเต็มปีจากวันเกิดถึงวันที่กำหนด (คำนึงถึงเดือนและวัน) */
export function calculateAge(
  birthDate: string,
  targetDate?: string | Date | null
): number {
  return calculateAgeParts(birthDate, targetDate).years;
}
