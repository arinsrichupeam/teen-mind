"use client";

import type { QuestionsData } from "@/types";

import { Chip } from "@heroui/react";

import { questionStatusOptions } from "../../data/optionData";

import { getFollowUpRoundStatuses } from "@/lib/question-followup-rounds";

function statusChipColor(
  status: number
): "default" | "primary" | "warning" | "success" {
  if (status === 0) return "default";
  if (status === 1) return "primary";
  if (status === 2) return "warning";

  return "success";
}

/** คอลัมน์สถานะ: สถานะหลัก + สถานะติดตามครั้งที่ 1–3 */
export function QuestionTableStatusCell({ row }: { row: QuestionsData }) {
  const mainLabel =
    questionStatusOptions[row.status]?.name ?? `สถานะ ${row.status}`;
  const rounds = getFollowUpRoundStatuses(row);

  return (
    <div className="flex flex-col items-center gap-1.5 py-0.5 max-w-[200px]">
      <Chip
        className="h-auto min-h-7 w-fit max-w-full whitespace-normal text-center"
        color={statusChipColor(row.status)}
        size="sm"
        variant="flat"
      >
        <span className="text-xs font-semibold leading-snug">{mainLabel}</span>
      </Chip>
      <div className="flex flex-row gap-1 justify-center items-center whitespace-nowrap">
        {rounds.map((r) => (
          <Chip
            key={r.round}
            className="h-6 min-w-0 px-1.5 whitespace-nowrap"
            color={r.complete ? "success" : "default"}
            size="sm"
            title={`${r.title}: ${r.statusLabel}`}
            variant="flat"
          >
            <span className="text-[11px] font-medium">{r.round}</span>
          </Chip>
        ))}
      </div>
    </div>
  );
}
