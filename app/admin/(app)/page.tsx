"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Profile_Admin } from "@prisma/client";

import { CardGreen } from "./components/home/card-green";
import { CardYellow } from "./components/home/card-yellow";
import { CardRed } from "./components/home/card-red";
import { CardAgents } from "./components/home/card-agents";
import { CardCaseTotal } from "./components/home/card-case-total";
import { CardTotal } from "./components/home/card-total";

// import { QuestionsList } from "@/types";
import Loading from "@/app/loading";
import { QuestionsData } from "@/types";

export default function AdminHome() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [totalQuestions, setTotalQuestions] = useState<QuestionsData[]>([]);
  const [greenQuestions, setGreenQuestions] = useState<QuestionsData[]>([]);
  const [yellowQuestions, setYellowQuestions] = useState<QuestionsData[]>([]);
  const [redQuestions, setRedQuestions] = useState<QuestionsData[]>([]);
  const [newMemberList, setNewMemberList] = useState<Profile_Admin[]>([]);

  const GetQuestionList = useCallback(async () => {
    await fetch("/api/question")
      .then((res) => res.json())
      .then((val) => {
        setTotalQuestions(val.questionsList);
        setGreenQuestions(
          val.questionsList.filter((f: QuestionsData) => f.result === "Green")
        );
        setYellowQuestions(
          val.questionsList.filter((f: QuestionsData) => f.result === "Yellow")
        );
        setRedQuestions(
          val.questionsList.filter((f: QuestionsData) => f.result === "Red")
        );
      });
  }, [totalQuestions, greenQuestions, yellowQuestions, redQuestions]);

  const GetNewMember = useCallback(async () => {
    await fetch("/api/profile/admin")
      .then((res) => res.json())
      .then((val) => {
        // console.log(val);
        setNewMemberList(val.filter((val: Profile_Admin) => val.status === 3));
      });
  }, [newMemberList]);

  useEffect(() => {
    if (status !== "loading") {
      if (status === "unauthenticated") {
        router.push("/admin/login");
      } else {
        GetQuestionList();
        GetNewMember();
      }
    }
  }, [session, router]);

  return (
    <Suspense fallback={<Loading />}>
      <div className="h-full lg:px-6">
        <div className="flex justify-center gap-4 xl:gap-6 pt-3 px-4 lg:px-0  flex-wrap xl:flex-nowrap sm:pt-10 max-w-[90rem] mx-auto w-full">
          <div className="mt-6 gap-6 flex flex-col w-full">
            {/* Card Section Top */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">สถิติผู้รับบริการ</h3>
              <div className="grid md:grid-cols-2 grid-cols-1 2xl:grid-cols-4 gap-2  justify-center w-full">
                <CardCaseTotal data={totalQuestions} />
                <CardTotal data={totalQuestions} />
                {/* <CardYellow data={yellowQuestions} /> */}
                {/* <CardRed data={redQuestions} /> */}
              </div>
            </div>

            {/* Card Section Top */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">ผู้รับบริการตามระดับ</h3>
              <div className="grid md:grid-cols-2 grid-cols-1 2xl:grid-cols-3 gap-2  justify-center w-full">
                {/* <CardTotal data={totalQuestions} /> */}
                <CardGreen data={greenQuestions} />
                <CardYellow data={yellowQuestions} />
                <CardRed data={redQuestions} />
              </div>
            </div>

            {/* Chart */}
            {/* <div className="h-full flex flex-col gap-2">
            <h3 className="text-xl font-semibold">Statistics</h3>
            <div className="w-full rounded-2xl p-6 flex flex-row gap-2 justify-center">
              <CardTotal data={totalQuestions} />
              <CardTotal data={totalQuestions} />
            </div>
          </div> */}
          </div>

          {/* Left Section */}
          <div className="mt-4 gap-2 flex flex-col xl:max-w-md w-full">
            <h3 className="text-xl font-semibold">ผู้ใช้งานใหม่</h3>
            <div className="flex flex-col justify-center gap-4 flex-wrap md:flex-nowrap md:flex-col">
              <CardAgents data={newMemberList} />
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
