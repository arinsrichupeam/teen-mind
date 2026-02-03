"use client";

import { Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { CardSchoolStats } from "./components/home/card-school-stats";
import { PieChartsSection } from "./components/home/pie-charts-section";
import { ConsultTelemedCharts } from "./components/home/consult-telemed-charts";

import Loading from "@/app/loading";
import { QuestionsData } from "@/types";
import { calculateAge } from "@/utils/helper";

const fetchQuestions = async () => {
  const res = await fetch("/api/question");
  const data = await res.json();

  return data.questionsList;
};

const filterLatestQuestions = (questions: QuestionsData[]) => {
  const latestQuestions: { [key: string]: QuestionsData } = {};

  questions.forEach((question) => {
    const profileId = question.profile.id;

    if (
      !latestQuestions[profileId] ||
      new Date(question.createdAt) >
        new Date(latestQuestions[profileId].createdAt)
    ) {
      latestQuestions[profileId] = question;
    }
  });

  return Object.values(latestQuestions);
};

// ฟังก์ชันกรองข้อมูลตามอายุ 12-18 ปี สำหรับสถิติ
const filterByAge = (
  data: any[],
  ageRange: { min: number; max: number } = { min: 12, max: 18 }
) => {
  return data.filter((item) => {
    if (!item.profile?.birthday) return false;

    const age = calculateAge(
      item.profile.birthday,
      item.profile.school?.screeningDate
    );

    return age >= ageRange.min && age <= ageRange.max;
  });
};

export default function AdminHome() {
  const { data: rawQuestions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["questions"],
    queryFn: fetchQuestions,
  });

  type SchoolStat = {
    schoolName: string;
    total: number;
    green: number;
    greenLow: number;
    yellow: number;
    orange: number;
    red: number;
  };

  // useMemo ลดการคำนวณซ้ำเมื่อ rawQuestions ไม่เปลี่ยน (rerender-memo)
  const filteredQuestions = useMemo(
    () => filterByAge(rawQuestions),
    [rawQuestions]
  );

  const filteredLatestQuestions = useMemo(
    () => filterLatestQuestions(filteredQuestions),
    [filteredQuestions]
  );

  const schoolStats = useMemo(
    () =>
      Object.values(
        filteredLatestQuestions.reduce((acc: Record<string, SchoolStat>, q) => {
          let schoolName: string;

          if (
            typeof q.profile.school === "object" &&
            q.profile.school !== null
          ) {
            schoolName =
              (q.profile.school as { name?: string }).name || "ไม่ระบุโรงเรียน";
          } else {
            schoolName = (q.profile.school as string) || "ไม่ระบุโรงเรียน";
          }

          if (!acc[schoolName]) {
            acc[schoolName] = {
              schoolName,
              total: 0,
              green: 0,
              greenLow: 0,
              yellow: 0,
              orange: 0,
              red: 0,
            };
          }
          acc[schoolName].total++;
          if (q.result === "Green") acc[schoolName].green++;
          if (q.result === "Green-Low") acc[schoolName].greenLow++;
          if (q.result === "Yellow") acc[schoolName].yellow++;
          if (q.result === "Orange") acc[schoolName].orange++;
          if (q.result === "Red") acc[schoolName].red++;

          return acc;
        }, {})
      ),
    [filteredLatestQuestions]
  );

  const schoolStatsSummary = useMemo(
    () =>
      schoolStats.reduce(
        (acc, school) => {
          acc.total += school.total;
          acc.green += school.green;
          acc.greenLow += school.greenLow;
          acc.yellow += school.yellow;
          acc.orange += school.orange;
          acc.red += school.red;

          return acc;
        },
        {
          schoolName: "Total",
          total: 0,
          green: 0,
          greenLow: 0,
          yellow: 0,
          orange: 0,
          red: 0,
        } as SchoolStat
      ),
    [schoolStats]
  );

  if (isLoadingQuestions) {
    return <></>;
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="h-full lg:px-6">
        <div className="flex flex-col gap-6 pt-3 px-4 lg:px-0 sm:pt-10 max-w-[90rem] mx-auto w-full">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">
                ผลการพบนักจิตวิทยา (อายุ 12-18 ปี)
              </h3>
              <ConsultTelemedCharts questions={filteredLatestQuestions} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">
                กราฟแสดงผลการประเมิน (อายุ 12-18 ปี)
              </h3>
              <PieChartsSection data={filteredLatestQuestions} />
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">ตารางสถิติรายโรงเรียน</h3>
              <CardSchoolStats
                data={schoolStats}
                summary={schoolStatsSummary}
              />
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
