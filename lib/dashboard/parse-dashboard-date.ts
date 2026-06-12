export const TH_OFFSET_MS = 7 * 60 * 60 * 1000;

const THAI_MONTH_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

/** คืน YYYY-MM ตามเวลาไทย (UTC+7) */
export function toThailandMonthKey(date: Date): string {
  const th = new Date(date.getTime() + TH_OFFSET_MS);
  const year = th.getUTCFullYear();
  const month = String(th.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

/** แปลง monthKey (YYYY-MM ค.ศ.) เป็นป้ายกำกับเดือนไทย พ.ศ. เช่น "มิ.ย. 2569" */
export function formatThaiMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const monthIndex = Number(monthStr) - 1;
  const year = Number(yearStr);

  if (monthIndex < 0 || monthIndex > 11 || !Number.isFinite(year)) {
    return monthKey;
  }

  return `${THAI_MONTH_SHORT[monthIndex]} ${year + 543}`;
}

export type ParsedDateParts = {
  year: number;
  monthIndex: number;
  day: number;
};

export function parseDateParam(
  dateParam: string | null
): ParsedDateParts | null {
  if (!dateParam) return null;

  const m = dateParam.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!m) return null;

  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthIndex) ||
    !Number.isFinite(day)
  ) {
    return null;
  }
  if (monthIndex < 0 || monthIndex > 11) return null;
  if (day < 1 || day > 31) return null;

  return { year, monthIndex, day };
}

export function thaiDateRangeToUtc(
  from: ParsedDateParts,
  to: ParsedDateParts
): { startUtc: Date; endUtc: Date } {
  const fromUtcMidnight = Date.UTC(
    from.year,
    from.monthIndex,
    from.day,
    0,
    0,
    0
  );
  const toUtcNextMidnight = Date.UTC(
    to.year,
    to.monthIndex,
    to.day + 1,
    0,
    0,
    0
  );

  return {
    startUtc: new Date(fromUtcMidnight - TH_OFFSET_MS),
    endUtc: new Date(toUtcNextMidnight - TH_OFFSET_MS),
  };
}

export function todayInThailandParts(): ParsedDateParts {
  const thNow = new Date(Date.now() + TH_OFFSET_MS);

  return {
    year: thNow.getUTCFullYear(),
    monthIndex: thNow.getUTCMonth(),
    day: thNow.getUTCDate(),
  };
}

export function formatThaiDateLabel(parts: ParsedDateParts): string {
  const d = new Date(Date.UTC(parts.year, parts.monthIndex, parts.day));

  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
