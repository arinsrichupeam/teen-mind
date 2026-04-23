"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
} from "@heroui/react";

import { QuestionsData } from "@/types";
import { calculateAge } from "@/utils/helper";

interface ConsultTelemedChartsProps {
  questions: QuestionsData[];
}

type ResultKey = "green" | "greenLow" | "yellow" | "orange" | "red";

type ByResultStats = {
  total: number;
  /** ให้คำปรึกษาแล้ว — status === 3 */
  completed: number;
  /** อยู่ระหว่างติดตาม — status === 2 */
  inFollowUp: number;
  /** รอดำเนินการ — status === 1 หรือ 0 */
  awaiting: number;
};

type ConsultTelemedStats = {
  total: number;
  consult: {
    /** ให้คำปรึกษาแล้ว — status === 3 */
    completed: number;
    /** อยู่ระหว่างติดตาม — status === 2 */
    inFollowUp: number;
    /** รอดำเนินการ — status === 1 หรือ 0 */
    awaiting: number;
  };
  telemed: {
    scheduled: number;
    notScheduled: number;
  };
  byResult: Record<ResultKey, ByResultStats>;
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

function getScreeningDateForAge(q: QuestionsData): string | Date | undefined {
  const school = q.profile?.school;

  if (typeof school === "object" && school !== null) {
    return school.screeningDate ?? undefined;
  }

  return undefined;
}

function getAgeYearsForQuestion(q: QuestionsData): number | null {
  if (!q.profile?.birthday) return null;

  const age = calculateAge(q.profile.birthday, getScreeningDateForAge(q));

  return age;
}

function isAge12to18(q: QuestionsData): boolean {
  const age = getAgeYearsForQuestion(q);

  return age !== null && age >= 12 && age <= 18;
}

function isAgeOver18(q: QuestionsData): boolean {
  const age = getAgeYearsForQuestion(q);

  return age !== null && age > 18;
}

function buildConsultTelemedStats(
  filteredQuestions: QuestionsData[]
): ConsultTelemedStats {
  return {
    total: filteredQuestions.length,
    consult: {
      completed: filteredQuestions.filter((q) => q.status === 3).length,
      inFollowUp: filteredQuestions.filter((q) => q.status === 2).length,
      awaiting: filteredQuestions.filter(
        (q) => q.status === 1 || q.status === 0
      ).length,
    },
    telemed: {
      scheduled: filteredQuestions.filter((q) => q.schedule_telemed !== null)
        .length,
      notScheduled: filteredQuestions.filter((q) => q.schedule_telemed === null)
        .length,
    },
    byResult: buildByResultStats(filteredQuestions),
  };
}

const resultDotClass: Record<ResultKey, string> = {
  green: "bg-success-500",
  greenLow: "bg-success-400",
  yellow: "bg-warning-500",
  orange: "bg-orange-500",
  red: "bg-danger-500",
};

const teenResultLabels: Record<ResultKey, string> = {
  green: "ไม่พบความเสี่ยง",
  greenLow: "พบความเสี่ยงเล็กน้อย",
  yellow: "พบความเสี่ยงปานกลาง",
  orange: "พบความเสี่ยงมาก",
  red: "พบความเสี่ยงรุนแรง",
};

const TEEN_RESULT_ORDER: ResultKey[] = [
  "green",
  "greenLow",
  "yellow",
  "orange",
  "red",
];

const ADULT_RESULT_ORDER: ResultKey[] = ["green", "yellow", "orange", "red"];

const adultResultLabels: Record<Exclude<ResultKey, "greenLow">, string> = {
  green: "ไม่มีอาการของโรคซึมเศร้าหรือมีอาการของโรคซึมเศร้าระดับน้อยมาก",
  yellow: "มีอาการของโรคซึมเศร้า ระดับน้อย",
  orange: "มีอาการของโรคซึมเศร้า ระดับปานกลาง",
  red: "มีอาการของโรคซึมเศร้า ระดับรุนแรง",
};

/** ค่า result ใน QuestionsData ต่อคีย์แถวตาราง */
const RESULT_VALUE: Record<ResultKey, string> = {
  green: "Green",
  greenLow: "Green-Low",
  yellow: "Yellow",
  orange: "Orange",
  red: "Red",
};

function buildByResultStats(
  filteredQuestions: QuestionsData[]
): Record<ResultKey, ByResultStats> {
  return TEEN_RESULT_ORDER.reduce(
    (acc, key) => {
      const result = RESULT_VALUE[key];

      acc[key] = {
        total: filteredQuestions.filter((q) => q.result === result).length,
        completed: filteredQuestions.filter(
          (q) => q.result === result && q.status === 3
        ).length,
        inFollowUp: filteredQuestions.filter(
          (q) => q.result === result && q.status === 2
        ).length,
        awaiting: filteredQuestions.filter(
          (q) => q.result === result && (q.status === 1 || q.status === 0)
        ).length,
      };

      return acc;
    },
    {} as Record<ResultKey, ByResultStats>
  );
}

type CohortKey = "teen" | "adult";

function CohortAtAGlanceCard({
  isSelected,
  onSelect,
  stats,
  subtitle,
  title,
  variant,
}: {
  isSelected: boolean;
  onSelect: () => void;
  stats: ConsultTelemedStats;
  subtitle: string;
  title: string;
  variant: "teen" | "adult";
}) {
  const borderClass =
    variant === "teen"
      ? "border-sky-200/80 bg-sky-50/40"
      : "border-violet-200/80 bg-violet-50/40";

  const selectedRing = isSelected
    ? "ring-2 ring-primary-400 ring-offset-2 ring-offset-white dark:ring-offset-default-100"
    : "";

  const metrics = [
    {
      label: "ให้คำปรึกษาแล้ว",
      value: stats.consult.completed,
      valueClass: "text-success-600",
    },
    {
      label: "อยู่ระหว่างติดตาม",
      value: stats.consult.inFollowUp,
      valueClass: "text-warning-600",
    },
    {
      label: "รอดำเนินการ",
      value: stats.consult.awaiting,
      valueClass: "text-primary-600",
    },
  ] as const;

  return (
    <div
      aria-label={`${title} — คลิกเพื่อดูตารางแยกตามผลการประเมิน`}
      aria-pressed={isSelected}
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm transition-shadow ${borderClass} ${selectedRing} cursor-pointer hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-default-700">{title}</p>
          <p className="text-xs text-default-500">{subtitle}</p>
        </div>
        <div className="mt-2 text-right sm:mt-0">
          <p className="text-xs text-default-500">ผู้ประเมินทั้งหมด</p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-default-900">
            {formatNumber(stats.total)}
          </p>
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {metrics.map((m) => (
          <li
            key={m.label}
            className="flex flex-col rounded-xl border border-white/80 bg-white/90 px-3 py-2.5 shadow-sm"
          >
            <span className="text-xs leading-snug text-default-600">
              {m.label}
            </span>
            <span
              className={`mt-1 text-xl font-semibold tabular-nums ${m.valueClass}`}
            >
              {formatNumber(m.value)}
              <span className="ml-1 text-xs font-normal text-default-500">
                ราย
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RiskBreakdownTable({
  stats,
  cohort,
}: {
  stats: ConsultTelemedStats;
  cohort: CohortKey;
}) {
  const resultOrder =
    cohort === "adult" ? ADULT_RESULT_ORDER : TEEN_RESULT_ORDER;

  const getResultLabel = (key: ResultKey) => {
    if (cohort === "adult" && key !== "greenLow") {
      return adultResultLabels[key];
    }

    return teenResultLabels[key];
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-default-200">
      <Table
        removeWrapper
        aria-label="สถิติการเข้าพบแยกตามผลการประเมิน"
        classNames={{
          th: "text-default-600 font-semibold text-xs tracking-wide whitespace-normal",
          td: "text-sm",
        }}
      >
        <TableHeader>
          <TableColumn className="min-w-[10rem]">ผลการประเมิน</TableColumn>
          <TableColumn className="text-end w-24">ทั้งหมด</TableColumn>
          <TableColumn className="text-end min-w-[7rem]">
            ให้คำปรึกษาแล้ว
          </TableColumn>
          <TableColumn className="text-end min-w-[7rem]">
            อยู่ระหว่างติดตาม
          </TableColumn>
          <TableColumn className="text-end min-w-[7rem]">
            รอดำเนินการ
          </TableColumn>
        </TableHeader>
        <TableBody>
          {resultOrder.map((key) => {
            const row = stats.byResult[key];
            const dot = resultDotClass[key];

            return (
              <TableRow key={key} className="border-b border-default-100">
                <TableCell>
                  <div className="flex items-start gap-2 py-0.5">
                    <span
                      aria-hidden
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`}
                    />
                    <span className="font-medium text-default-800 leading-snug">
                      {getResultLabel(key)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-end font-medium tabular-nums">
                  {formatNumber(row.total)}
                </TableCell>
                <TableCell className="text-end tabular-nums font-medium text-success-600">
                  {formatNumber(row.completed)}
                </TableCell>
                <TableCell className="text-end tabular-nums font-medium text-warning-600">
                  {formatNumber(row.inFollowUp)}
                </TableCell>
                <TableCell className="text-end tabular-nums text-primary-600">
                  {formatNumber(row.awaiting)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function ConsultTelemedCharts({ questions }: ConsultTelemedChartsProps) {
  const [cohortTab, setCohortTab] = useState<CohortKey>("teen");

  const { teenQuestions, over18Questions, unclassifiedCount } = useMemo(() => {
    const teen: QuestionsData[] = [];
    const over18: QuestionsData[] = [];
    let other = 0;

    for (const q of questions) {
      if (isAge12to18(q)) teen.push(q);
      else if (isAgeOver18(q)) over18.push(q);
      else other++;
    }

    return {
      teenQuestions: teen,
      over18Questions: over18,
      unclassifiedCount: other,
    };
  }, [questions]);

  const teenStats = useMemo(
    () => buildConsultTelemedStats(teenQuestions),
    [teenQuestions]
  );
  const over18Stats = useMemo(
    () => buildConsultTelemedStats(over18Questions),
    [over18Questions]
  );

  const activeStats = cohortTab === "teen" ? teenStats : over18Stats;

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center text-gray-500">
        ไม่มีข้อมูลการเข้าพบนักจิตวิทยา
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {unclassifiedCount > 0 && (
        <p className="rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-center text-xs text-default-600">
          {`หมายเหตุ: มี ${formatNumber(unclassifiedCount)} รายที่ไม่อยู่ในช่วงอายุ 12–18 หรือมากกว่า 18 ปี (เช่น ต่ำกว่า 12 ปีหรือไม่มีวันเกิด) จึงไม่รวมในสรุปด้านล่าง`}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CohortAtAGlanceCard
          isSelected={cohortTab === "teen"}
          stats={teenStats}
          subtitle="สรุปจากผู้ประเมินล่าสุดต่อคน"
          title="อายุ 12–18 ปี"
          variant="teen"
          onSelect={() => setCohortTab("teen")}
        />
        <CohortAtAGlanceCard
          isSelected={cohortTab === "adult"}
          stats={over18Stats}
          subtitle="สรุปจากผู้ประเมินล่าสุดต่อคน"
          title="มากกว่า 18 ปี"
          variant="adult"
          onSelect={() => setCohortTab("adult")}
        />
      </div>

      <Card className="border border-default-200 shadow-sm">
        <CardHeader className="flex flex-col items-stretch gap-1 pb-0 pt-4 px-4 sm:px-6">
          <h3 className="text-base font-semibold text-default-900">
            รายละเอียดตามผลการประเมิน
          </h3>
          <p className="text-xs text-default-500">
            เลือกช่วงอายุที่แท็บเพื่อดูตาราง
          </p>
        </CardHeader>
        <CardBody className="gap-4 pt-2 px-4 pb-5 sm:px-6">
          <Tabs
            fullWidth
            classNames={{
              tabList:
                "bg-default-100/80 p-1 rounded-xl gap-1 w-full sm:w-auto sm:inline-flex",
              cursor: "bg-white shadow-sm rounded-lg",
              tab: "h-10 px-3 sm:px-4",
              tabContent: "group-data-[selected=true]:text-default-900",
            }}
            selectedKey={cohortTab}
            size="md"
            onSelectionChange={(key) => setCohortTab(String(key) as CohortKey)}
          >
            <Tab
              key="teen"
              title={`อายุ 12–18 ปี (${formatNumber(teenStats.total)})`}
            />
            <Tab
              key="adult"
              title={`มากกว่า 18 ปี (${formatNumber(over18Stats.total)})`}
            />
          </Tabs>

          <RiskBreakdownTable cohort={cohortTab} stats={activeStats} />
        </CardBody>
      </Card>
    </div>
  );
}
