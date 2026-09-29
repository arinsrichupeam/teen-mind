"use client";

import type { QuestionsData } from "@/types";

import { Chip } from "@heroui/react";

import { questionStatusOptions } from "../../data/optionData";

import {
  countAssessmentRounds,
  countConsultRounds,
} from "@/lib/case-round-counts";
import {
  caseStatusChipColor,
  caseStatusLabel,
} from "@/lib/case-status-mapping";

function followUpChipColor(
  status: number
): "default" | "primary" | "warning" | "success" {
  if (status === 0) return "default";
  if (status === 1) return "primary";
  if (status === 2) return "warning";

  return "success";
}

function hasHn(row: QuestionsData): boolean {
  const hn = (row.hn ?? row.profile?.hn ?? "").toString().trim();

  return hn.length > 0;
}

/** คอลัมน์สถานะเคส: CaseStatus หลัก + จำนวนรอบประเมิน / รอบคำปรึกษา */
export function QuestionTableStatusCell({ row }: { row: QuestionsData }) {
  const caseStatus = row.caseStatus;
  const mainLabel = caseStatus
    ? caseStatusLabel(caseStatus)
    : (questionStatusOptions[row.status]?.name ?? `สถานะ ${row.status}`);
  const mainColor = caseStatus
    ? caseStatusChipColor(caseStatus)
    : followUpChipColor(row.status);
  const missingHn = !hasHn(row) && caseStatus !== "CLOSED";
  const assessmentRounds = countAssessmentRounds(row);
  const consultRounds = countConsultRounds(row);

  return (
    <div className="flex flex-col items-center gap-1.5 py-0.5 max-w-[220px]">
      <Chip
        className="h-auto min-h-7 w-fit max-w-full whitespace-normal text-center"
        color={mainColor}
        size="sm"
        variant="flat"
      >
        <span className="text-xs font-semibold leading-snug">{mainLabel}</span>
      </Chip>
      {missingHn && (
        <Chip
          className="h-auto min-h-6 w-fit max-w-full"
          color="default"
          size="sm"
          variant="bordered"
        >
          <span className="text-[11px]">รอระบุ HN</span>
        </Chip>
      )}
      <div className="flex flex-col items-center gap-0.5 text-[11px] leading-tight text-default-600">
        <span title="จำนวนรอบที่ประเมิน">
          ประเมิน{" "}
          <span className="font-semibold text-foreground">
            {assessmentRounds}
          </span>{" "}
          รอบ
        </span>
        <span title="จำนวนรอบบันทึกการให้คำปรึกษา">
          คำปรึกษา{" "}
          <span className="font-semibold text-foreground">{consultRounds}</span>{" "}
          รอบ
        </span>
      </div>
    </div>
  );
}
