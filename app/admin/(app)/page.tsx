"use client";

import { Suspense } from "react";
import { Profile_Admin } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

import { CardGreen } from "./components/home/card-green";
import { CardYellow } from "./components/home/card-yellow";
import { CardRed } from "./components/home/card-red";
import { CardAgents } from "./components/home/card-agents";
import { CardCaseTotal } from "./components/home/card-case-total";
import { CardTotal } from "./components/home/card-total";

import Loading from "@/app/loading";
import { QuestionsData } from "@/types";

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

export default function AdminHome() {
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["questions"],
    queryFn: fetchQuestions,
  });

  const { data: newMembers = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["newMembers"],
    queryFn: fetchNewMembers,
  });

  const greenQuestions = questions.filter(
    (q: QuestionsData) => q.result === "Green"
  );
  const yellowQuestions = questions.filter(
    (q: QuestionsData) => q.result === "Yellow"
  );
  const redQuestions = questions.filter(
    (q: QuestionsData) => q.result === "Red"
  );

  if (isLoadingQuestions || isLoadingMembers) {
    return <></>;
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="h-full lg:px-6">
        <div className="flex justify-center gap-4 xl:gap-6 pt-3 px-4 lg:px-0  flex-wrap xl:flex-nowrap sm:pt-10 max-w-[90rem] mx-auto w-full">
          <div className="mt-6 gap-6 flex flex-col w-full">
            {/* Card Section Top */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">สถิติผู้รับบริการ</h3>
              <div className="grid md:grid-cols-2 grid-cols-1 2xl:grid-cols-4 gap-2  justify-center w-full">
                <CardCaseTotal data={questions} />
                <CardTotal data={questions} />
              </div>
            </div>

            {/* Card Section Top */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">ผู้รับบริการตามระดับ</h3>
              <div className="grid md:grid-cols-2 grid-cols-1 2xl:grid-cols-3 gap-2  justify-center w-full">
                <CardGreen data={greenQuestions} />
                <CardYellow data={yellowQuestions} />
                <CardRed data={redQuestions} />
              </div>
            </div>
          </div>

          {/* Left Section */}
          <div className="mt-4 gap-2 flex flex-col xl:max-w-md w-full">
            <h3 className="text-xl font-semibold">ผู้ใช้งานใหม่</h3>
            <div className="flex flex-col justify-center gap-4 flex-wrap md:flex-nowrap md:flex-col">
              <CardAgents data={newMembers} />
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
