const TH_OFFSET_MS = 7 * 60 * 60 * 1000;

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
