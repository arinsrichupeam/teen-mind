export type SchoolScreeningPeriod = {
  round: number;
  startDate: Date | string;
  endDate?: Date | string | null;
};

function toTime(value: Date | string): number {
  return new Date(value).getTime();
}

function periodEnd(period: SchoolScreeningPeriod): number {
  return toTime(period.endDate ?? period.startDate);
}

/**
 * Resolve the school screening reference date for age calculation.
 * - If assessment falls within a period → use that period's startDate
 * - Else → nearest period by startDate
 * - Else → null (caller should fall back to assessment createdAt)
 */
export function resolveSchoolScreeningDate(
  screenings: SchoolScreeningPeriod[] | null | undefined,
  assessmentCreatedAt?: Date | string | null,
  legacyScreeningDate?: Date | string | null
): Date | null {
  const periods = [...(screenings ?? [])].filter(
    (p) => p?.startDate != null && !Number.isNaN(toTime(p.startDate))
  );

  if (periods.length === 0) {
    if (legacyScreeningDate == null) return null;
    const t = toTime(legacyScreeningDate);

    return Number.isNaN(t) ? null : new Date(legacyScreeningDate);
  }

  if (assessmentCreatedAt != null) {
    const assessTime = toTime(assessmentCreatedAt);

    if (!Number.isNaN(assessTime)) {
      const containing = periods.find((p) => {
        const start = toTime(p.startDate);
        const end = periodEnd(p);

        return (
          assessTime >= start && assessTime <= end + 24 * 60 * 60 * 1000 - 1
        );
      });

      if (containing) {
        return new Date(containing.startDate);
      }

      const nearest = periods.reduce((best, p) => {
        const bestDiff = Math.abs(toTime(best.startDate) - assessTime);
        const diff = Math.abs(toTime(p.startDate) - assessTime);

        return diff < bestDiff ? p : best;
      });

      return new Date(nearest.startDate);
    }
  }

  const byRound = [...periods].sort((a, b) => a.round - b.round);

  return new Date(byRound[0].startDate);
}

export function getScreeningStartByRound(
  screenings: SchoolScreeningPeriod[] | null | undefined,
  round: number,
  legacyScreeningDate?: Date | string | null
): Date | null {
  const match = (screenings ?? []).find((p) => p.round === round);

  if (match?.startDate != null) {
    const t = toTime(match.startDate);

    return Number.isNaN(t) ? null : new Date(match.startDate);
  }

  if (round === 1 && legacyScreeningDate != null) {
    const t = toTime(legacyScreeningDate);

    return Number.isNaN(t) ? null : new Date(legacyScreeningDate);
  }

  return null;
}

export function formatScreeningPeriodSummary(
  screenings: SchoolScreeningPeriod[] | null | undefined,
  formatDate: (d: Date | string) => string,
  legacyScreeningDate?: Date | string | null
): string {
  const periods = [...(screenings ?? [])]
    .filter((p) => p?.startDate != null)
    .sort((a, b) => a.round - b.round);

  if (periods.length === 0) {
    return legacyScreeningDate ? formatDate(legacyScreeningDate) : "-";
  }

  return periods
    .map((p) => {
      const start = formatDate(p.startDate);
      const endRaw = p.endDate ?? p.startDate;
      const end = formatDate(endRaw);

      return start === end ? start : `${start}–${end}`;
    })
    .join(" / ");
}
