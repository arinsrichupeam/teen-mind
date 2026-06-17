export type OverviewConsultStats = {
  total: number;
  gender: { male: number; female: number; other: number };
  consult: {
    completed: number;
    awaitingSummary: number;
    awaitingConsult: number;
    awaitingHn: number;
  };
};

export type OverviewRisk = {
  green: number;
  greenLow: number;
  yellow: number;
  orange: number;
  red: number;
  totalUsers: number;
};

export type OverviewAgeGroup = {
  stats: OverviewConsultStats;
  risk: OverviewRisk;
};

export type OverviewResponse = {
  under18: OverviewAgeGroup;
  age18AndOver: OverviewAgeGroup;
  unclassifiedCount: number;
};

export const emptyConsultStats = (): OverviewConsultStats => ({
  total: 0,
  gender: { male: 0, female: 0, other: 0 },
  consult: {
    completed: 0,
    awaitingSummary: 0,
    awaitingConsult: 0,
    awaitingHn: 0,
  },
});

export const emptyRisk = (): OverviewRisk => ({
  green: 0,
  greenLow: 0,
  yellow: 0,
  orange: 0,
  red: 0,
  totalUsers: 0,
});

export const emptyOverviewAgeGroup = (): OverviewAgeGroup => ({
  stats: emptyConsultStats(),
  risk: emptyRisk(),
});

export const emptyOverviewResponse = (): OverviewResponse => ({
  under18: emptyOverviewAgeGroup(),
  age18AndOver: emptyOverviewAgeGroup(),
  unclassifiedCount: 0,
});
