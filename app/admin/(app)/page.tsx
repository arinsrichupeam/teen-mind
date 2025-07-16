"use client";

import { Suspense, useEffect, useState } from "react";
import { Profile_Admin } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { CardAgents } from "./components/home/card-agents";
import { CardCaseTotal } from "./components/home/card-case-total";
import { CardTotal } from "./components/home/card-total";
import { CardTotalUser } from "./components/home/card-total-user";
import { CardTotalManual } from "./components/home/card-total-manual";
import { CardSchoolStats } from "./components/home/card-school-stats";
import { CardScoreCriteria } from "./components/home/card-score-criteria";
import { PieChartsSection } from "./components/home/pie-charts-section";

import Loading from "@/app/loading";
import { QuestionsData } from "@/types";

// Temporary Profile type with userId
interface ProfileWithUserId {
  id: string;
  firstname: string;
  lastname: string;
  prefixId: string;
  sex: string;
  birthday: string;
  ethnicity: string;
  nationality: string;
  citizenId: string;
  tel: string;
  school: any; // Keeping it simple for now
  hn: string;
  userId?: string | null;
}

const fetchQuestions = async () => {
  const res = await fetch("/api/question");
  const data = await res.json();

  return data.questionsList;
};

const fetchNewMembers = async () => {
  const res = await fetch("/api/profile/admin");
  const data = await res.json();

  return data.filter((val: Profile_Admin) => val.status === 3);
};

const fetchUsers = async () => {
  const res = await fetch("/api/profile/user");
  const data: ProfileWithUserId[] = await res.json();

  return data;
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

export default function AdminHome() {
  const router = useRouter();
  const [showScoreModal, setShowScoreModal] = useState(false);

  // เพิ่มการตรวจสอบ roleId และ redirect
  useEffect(() => {
    const adminProfile = sessionStorage.getItem("adminProfile");

    if (adminProfile) {
      const profile = JSON.parse(adminProfile);

      if (profile.roleId === 2) {
        router.replace("/admin/user");
      } else if (profile.roleId === 3) {
        router.replace("/admin/question");
      }
    }
  }, [router]);

  const { data: rawQuestions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["questions"],
    queryFn: fetchQuestions,
  });

  const { data: newMembers = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["newMembers"],
    queryFn: fetchNewMembers,
  });

  const { data: allProfiles = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const questions = filterLatestQuestions(rawQuestions);

  const appUsers = allProfiles.filter((p) => p.userId);
  const manualUsers = allProfiles.filter((p) => !p.userId);

  type SchoolStat = {
    schoolName: string;
    total: number;
    green: number;
    greenLow: number;
    yellow: number;
    orange: number;
    red: number;
  };

  const schoolStats = Object.values(
    questions.reduce((acc: Record<string, SchoolStat>, q) => {
      let schoolName: string;

      if (typeof q.profile.school === "object" && q.profile.school !== null) {
        schoolName = (q.profile.school as any).name || "ไม่ระบุโรงเรียน";
      } else {
        schoolName = q.profile.school || "ไม่ระบุโรงเรียน";
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
  );

  const schoolStatsSummary = schoolStats.reduce(
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
    }
  );

  if (isLoadingQuestions || isLoadingMembers || isLoadingUsers) {
    return <></>;
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="h-full lg:px-6">
        <div className="flex flex-col gap-6 pt-3 px-4 lg:px-0 sm:pt-10 max-w-[90rem] mx-auto w-full">
          {/* ผู้ใช้งานใหม่ - ย้ายไปบนสุด */}
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* สถิติผู้รับบริการ */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold">สถิติผู้รับบริการ</h3>
                <div className="grid md:grid-cols-2 grid-cols-1 2xl:grid-cols-4 gap-2 justify-center w-full">
                  <CardCaseTotal data={rawQuestions} />
                  <CardTotal data={allProfiles} />
                  <CardTotalUser data={appUsers} />
                  <CardTotalManual data={manualUsers} />
                </div>
              </div>

              {/* ผู้ใช้งานใหม่ */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold">ผู้ใช้งานใหม่</h3>
                <CardAgents data={newMembers} />
              </div>
            </div>
          </div>

          {/* กราฟวงกลมแสดงผลการประเมิน */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">
                กราฟวงกลมแสดงผลการประเมิน
              </h3>
              <PieChartsSection
                data={rawQuestions}
                onShowScoreModal={() => setShowScoreModal(true)}
              />
            </div>
          </div>

          {/* ตารางสถิติรายโรงเรียน */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">ตารางสถิติรายโรงเรียน</h3>
              <CardSchoolStats
                data={schoolStats}
                summary={schoolStatsSummary}
              />
            </div>
          </div>
        </div>

        {/* Modal สำหรับเกณฑ์คะแนน */}
        {showScoreModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">เกณฑ์คะแนน PHQA</h2>
                <button
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  onClick={() => setShowScoreModal(false)}
                >
                  ×
                </button>
              </div>
              <CardScoreCriteria />
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
}
