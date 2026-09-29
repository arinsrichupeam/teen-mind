import { getAgeAtAssessment } from "@/lib/assessment-scale";
import { resolveSchoolScreeningDate } from "@/lib/school-screening";

export type SchoolScreening = {
  round: number;
  startDate: string;
  endDate?: string | null;
};

export type HistoryEntry = {
  id: string;
  date: string;
  scale: string;
  score: number | null;
  result: string | null;
  result_text: string | null;
  q2Risk: boolean | null;
  q8Score: number | null;
};

export type IndividualProfile = {
  profileId: string;
  prefixId: number;
  firstName: string;
  lastName: string;
  citizenId: string | null;
  birthDate: string;
  userId: string | null;
  school: {
    id: number;
    name: string;
    screeningDate?: string | null;
    screenings?: SchoolScreening[];
  } | null;
  assessmentCount: number;
  latestResult: string | null;
  latestResultText: string | null;
  latestScore: number | null;
  latestDate: string | null;
  history: HistoryEntry[];
};

export function getProfileAge(
  birthDate: string | null | undefined,
  school: IndividualProfile["school"],
  assessmentDate?: string | null
) {
  const resolved = resolveSchoolScreeningDate(
    school?.screenings,
    assessmentDate,
    school?.screeningDate
  );

  return getAgeAtAssessment(birthDate, resolved, assessmentDate ?? undefined);
}

export const RESULT_COLOR_MAP: Record<
  string,
  "success" | "warning" | "danger" | "default"
> = {
  Green: "success",
  "Green-Low": "success",
  Yellow: "warning",
  Orange: "warning",
  Red: "danger",
};

export const CHART_DOT_COLORS: Record<string, string> = {
  Green: "#17c964",
  "Green-Low": "#06b6d4",
  Yellow: "#f5a524",
  Orange: "#f97316",
  Red: "#f31260",
};
