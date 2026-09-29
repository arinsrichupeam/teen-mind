"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/react";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { LiffPageBg } from "@/components/liff-page-bg";
import { subtitle, title } from "@/components/primitives";
import Loading from "@/app/loading";
import {
  buildCaseCentricHistory,
  type CaseHistoryGroup,
  type CaseHistorySource,
} from "@/lib/liff-assessment-history";
import { mapScreeningResultToLegacyColor } from "@/lib/legacy-value-mapping";
import { formatThaiDate } from "@/utils/helper";

function resultChipColor(
  result: string
): "default" | "success" | "warning" | "danger" {
  if (String(result) === "INCOMPLETE") return "default";

  const legacy = mapScreeningResultToLegacyColor(result);

  if (legacy === "Green" || legacy === "Green-Low") return "success";
  if (legacy === "Yellow") return "warning";

  return "danger";
}

function setStatusChipColor(
  status: string
): "primary" | "warning" | "secondary" | "success" | "default" {
  switch (status) {
    case "IN_PROGRESS":
      return "primary";
    case "PENDING":
      return "warning";
    case "TRANSFER_PENDING":
      return "secondary";
    case "CLOSED":
      return "success";
    default:
      return "default";
  }
}

function AssessmentSetCard({
  group,
  groupIndex,
  expanded,
  onToggle,
}: {
  group: CaseHistoryGroup;
  groupIndex: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tipColor = resultChipColor(String(group.tipResult));
  const panelId = `assessment-set-${group.caseId}`;

  return (
    <Card
      className={
        group.isOpen
          ? "border-2 border-primary/35 shadow-sm"
          : "shadow-none border border-default-200"
      }
    >
      <CardBody className="gap-0 p-0">
        <button
          aria-controls={panelId}
          aria-expanded={expanded}
          className="w-full text-left px-4 py-3.5 flex flex-col gap-1.5 hover:bg-default-50/80 transition-colors rounded-lg"
          type="button"
          onClick={onToggle}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <p className="font-semibold text-base">
                ชุดประเมินที่ {group.caseNumber}
              </p>
              {groupIndex === 0 ? (
                <Chip color="primary" size="sm" variant="flat">
                  ล่าสุด
                </Chip>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-default-500">สถานะ</span>
              <Chip
                color={setStatusChipColor(group.status)}
                size="sm"
                variant="flat"
              >
                {group.statusLabel}
              </Chip>
              <ChevronDownIcon
                aria-hidden
                className={`w-5 h-5 text-default-400 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap pr-6">
            <p className="text-sm text-default-500">
              เปิดเมื่อ {formatThaiDate(group.createdAt)}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-default-500">ผลล่าสุด</span>
              <Chip color={tipColor} size="sm" variant="flat">
                {group.tipLabel}
              </Chip>
            </div>
          </div>

          <p className="text-xs text-primary mt-0.5">
            {expanded
              ? "ซ่อนรายละเอียดรอบประเมิน"
              : `กดเพื่อดู ${group.rounds.length} รอบประเมิน`}
          </p>
        </button>

        {expanded ? (
          <div
            className="flex flex-col gap-3 px-4 pb-4 pt-1 border-t border-default-100"
            id={panelId}
          >
            {group.rounds.map((round) => {
              const roundColor = resultChipColor(String(round.overallResult));

              return (
                <div
                  key={`${group.caseId}-${round.round}`}
                  className="rounded-lg bg-default-50 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold">
                        รอบที่ {round.round}
                      </p>
                      <p className="text-xs text-default-500">
                        {formatThaiDate(round.createdAt)}
                      </p>
                    </div>
                    <Chip color={roundColor} size="sm" variant="dot">
                      {round.overallLabel}
                    </Chip>
                  </div>

                  <ul className="flex flex-col gap-1.5">
                    {round.instruments.map((line) => (
                      <li
                        key={`${group.caseId}-${round.round}-${line.name}`}
                        className="flex gap-2 text-sm leading-snug"
                      >
                        <span className="shrink-0 w-[4.5rem] font-medium text-default-700">
                          {line.name}
                        </span>
                        <span
                          className={
                            line.skipped
                              ? "text-default-400"
                              : "text-default-700"
                          }
                        >
                          {line.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

export default function QuestionListPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [questionList, setQuestionList] = useState<CaseHistorySource[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated") {
      setLoadingList(false);

      return;
    }

    const userId = session?.user?.id;

    fetch(`/api/profile/user/${userId}`)
      .then((res) => res.json())
      .then((val) => {
        const cases =
          val.profile?.[0]?.questions ??
          val.profile?.[0]?.cases ??
          val.questions ??
          [];

        if (Array.isArray(cases) && cases.length > 0) {
          setQuestionList(cases);
        }
      })
      .finally(() => setLoadingList(false));
  }, [session, status]);

  const caseGroups = useMemo(
    () => buildCaseCentricHistory(questionList),
    [questionList]
  );

  const hasIncompleteOpen = questionList.some(
    (c) =>
      ["PENDING", "IN_PROGRESS", "TRANSFER_PENDING"].includes(
        String(c.status)
      ) && String(c.result) === "INCOMPLETE"
  );
  const hasTransferPending = questionList.some(
    (c) => String(c.status) === "TRANSFER_PENDING"
  );
  const hasOpenCase = questionList.some((c) =>
    ["PENDING", "IN_PROGRESS", "TRANSFER_PENDING"].includes(String(c.status))
  );
  const isNewAssessmentDisabled = hasIncompleteOpen || hasTransferPending;
  const newAssessmentLabel = hasIncompleteOpen
    ? "มีรอบประเมินที่ยังทำไม่ครบ"
    : hasTransferPending
      ? "อยู่ระหว่างส่งต่อ — ยังประเมินรอบใหม่ไม่ได้"
      : hasOpenCase
        ? "ประเมินรอบใหม่"
        : "ทำแบบประเมิน";

  const toggleExpanded = (caseId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);

      if (next.has(caseId)) next.delete(caseId);
      else next.add(caseId);

      return next;
    });
  };

  return (
    <section className="relative isolate flex flex-col px-6 py-8 pb-14 w-[calc(100vw)] min-h-screen items-center gap-4 overflow-hidden">
      <LiffPageBg blur />
      <Suspense fallback={<Loading />}>
        <div className="w-full max-w-lg flex flex-col gap-3 shrink-0">
          <h1 className={title({ size: "sm" })}>ผลประเมินภาวะซึมเศร้า</h1>
          <h2 className={subtitle()}>
            สำรวจตัวเองว่าคุณกำลังเศร้ามากแค่ไหน
            โดยทำแบบประเมินซึ่งใช้เวลาประมาณ 4-5 นาที
          </h2>
          <Button
            className="w-full"
            color="primary"
            isDisabled={isNewAssessmentDisabled}
            radius="full"
            size="lg"
            variant="solid"
            onPress={() => router.push("/liff/question")}
          >
            {newAssessmentLabel}
          </Button>

          <div className="flex flex-col gap-1 pt-1">
            <h2 className={title({ size: "xs" })}>ประวัติการประเมิน</h2>
            <p className="text-sm text-default-600">
              กดที่ชุดประเมินเพื่อดูรายละเอียดแต่ละรอบ
            </p>
          </div>
        </div>

        <ScrollShadow className="w-full max-w-lg flex-1 min-h-0 px-1 pb-4">
          <div className="flex flex-col gap-3">
            {loadingList ? (
              <p className="text-center text-default-500 py-6">กำลังโหลด...</p>
            ) : caseGroups.length === 0 ? (
              <p className="text-center text-default-500 py-6">
                ยังไม่มีประวัติการทำแบบประเมิน
              </p>
            ) : (
              caseGroups.map((group, groupIndex) => (
                <AssessmentSetCard
                  key={group.caseId}
                  expanded={expandedIds.has(group.caseId)}
                  group={group}
                  groupIndex={groupIndex}
                  onToggle={() => toggleExpanded(group.caseId)}
                />
              ))
            )}
          </div>
        </ScrollShadow>
      </Suspense>
    </section>
  );
}
