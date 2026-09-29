"use client";

import { useEffect, useState } from "react";
import {
  Chip,
  Radio,
  RadioGroup,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
} from "@heroui/react";

import { consultationRoundTabClassNames } from "./consultation-ui";

import {
  q2,
  q8,
  q8Addon,
  q9,
  qPhqa,
  phqaAddon,
  teenMindProblems,
} from "@/app/data";
import { getAssessmentResultLabel } from "@/lib/assessment-result-colors";
import { calculateMainAssessmentResult } from "@/lib/assessment-scale";
import { sum8Q } from "@/lib/assessment-scoring";
import { isTwoQPositive } from "@/lib/depression-flow";
import { getEightQRiskLabel } from "@/lib/liff-assessment-history";
import {
  filterQuestionByAssessmentRound,
  listAssessmentRoundsFromQuestion,
} from "@/lib/question-assessment-rounds";
import {
  Addon,
  Phqa,
  ProblemPayload,
  Q8Data,
  Questions2Q,
  QuestionsData,
} from "@/types";
import { formatThaiDateTime } from "@/utils/helper";

/** หัวข้อส่วนแบบประเมิน — ให้ใกล้ขนาดเนื้อหา (ไม่ใช้ subtitle หน้า landing) */
const sectionTitleClass =
  "mb-1 block w-full text-base font-semibold text-foreground";
const sectionMetaClass = "text-sm text-default-600";
const answerOptionClass =
  "inline-flex max-w-full cursor-pointer items-center justify-between pr-3 text-sm";
const tableTextClassNames = {
  base: "w-full max-w-full min-w-0",
  wrapper: "w-full max-w-full min-w-0 overflow-x-auto",
  table: "min-w-full table-fixed",
  th: "text-sm font-medium text-default-600",
  td: "text-sm text-foreground",
};

type ResultChipColor = "default" | "success" | "warning" | "danger";

function legacyResultChipColor(result: string): ResultChipColor {
  if (result === "Green" || result === "Green-Low") return "success";
  if (result === "Yellow" || result === "Orange") return "warning";
  if (result === "Red") return "danger";

  return "default";
}

function eightQChipColor(sum: number): ResultChipColor {
  if (sum === 0) return "success";
  if (sum <= 16) return "warning";

  return "danger";
}

function ScoreResultMeta({
  scoreLabel,
  score,
  chipLabel,
  chipColor,
}: {
  scoreLabel?: string;
  score: number;
  chipLabel: string;
  chipColor: ResultChipColor;
}) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <p className={sectionMetaClass}>
        {scoreLabel ?? "คะแนนที่ทำได้"}: {score}
      </p>
      <Chip color={chipColor} size="sm" variant="flat">
        {chipLabel}
      </Chip>
    </div>
  );
}

function rowCreatedAt(row: unknown): string | null {
  if (!row || typeof row !== "object") return null;
  const value = (row as { createdAt?: string | Date }).createdAt;

  if (value == null || value === "") return null;

  return String(value);
}

/** เวลาทำรอบ — ใช้แถวแรกที่มี createdAt (ลำดับ 2Q → หลัก → addon → 8Q → ปัญหา) */
function pickRoundCompletedAt(
  data: QuestionsData | undefined | null
): string | null {
  if (!data) return null;

  return (
    rowCreatedAt(data.q2?.[0]) ??
    rowCreatedAt(data.phqa?.[0]) ??
    rowCreatedAt(data.q9?.[0]) ??
    rowCreatedAt(data.addon?.[0]) ??
    rowCreatedAt(data.q8?.[0]) ??
    rowCreatedAt(data.problem?.[0]) ??
    (data.createdAt ? String(data.createdAt) : null)
  );
}

/** คะแนนรวม 8Q สอดคล้อง sum8Q ใน lib/assessment-scoring */
function sumQ8Payload(row: Q8Data): number {
  return sum8Q(row);
}

/** อ่านค่าข้อที่ n (1-based) จากแถวแบบประเมิน — ห้ามใช้ Object.entries (ลำดับฟิลด์ไม่คงที่หลัง migrate) */
function getAnswerValue(
  item: Record<string, unknown> | null | undefined,
  questionIndex: number
): string | undefined {
  if (!item) return undefined;

  const raw = item[`q${questionIndex + 1}`];

  if (raw == null || raw === "") return undefined;

  return String(raw);
}

interface Props {
  data: QuestionsData | undefined;
  mode?: string;
  /** เปิดแท็บรอบประเมินนี้เมื่อดูผล (เช่น จากตารางสถานะเคส) */
  initialAssessmentRound?: number | null;
  onQuestionChange?: (
    field: string,
    value: string | number | Questions2Q[] | Phqa[] | Addon[] | Q8Data[]
  ) => void;
}

export const QuestionDetailDrawer = ({
  data,
  mode,
  initialAssessmentRound,
  onQuestionChange,
}: Props) => {
  const isEditMode = mode === "edit-questionnaire";
  const assessmentRounds = listAssessmentRoundsFromQuestion(data);
  const latestRound =
    assessmentRounds.length > 0
      ? assessmentRounds[assessmentRounds.length - 1]!
      : 1;
  const preferredRound =
    initialAssessmentRound != null &&
    assessmentRounds.includes(initialAssessmentRound)
      ? initialAssessmentRound
      : latestRound;
  const [selectedRound, setSelectedRound] = useState(String(preferredRound));

  useEffect(() => {
    setSelectedRound(String(preferredRound));
  }, [data?.id, preferredRound]);

  const viewRound = Number(selectedRound) || latestRound;
  const viewData =
    !isEditMode && data
      ? filterQuestionByAssessmentRound(data, viewRound)
      : data;

  const hasQ9Data = Boolean(viewData?.q9 && viewData.q9.length > 0);
  const hasQ8Data = Boolean(viewData?.q8 && viewData.q8.length > 0);

  const getQ9Value = (questionIndex: number): string | undefined => {
    const item = viewData?.q9?.[0];

    if (!item) return undefined;

    return String(
      (item as unknown as Record<string, number>)[`q${questionIndex + 1}`]
    );
  };

  const getQ8Value = (questionIndex: number): string | undefined => {
    const item = viewData?.q8?.[0];

    if (!item) return undefined;

    return String(
      (item as unknown as Record<string, number>)[`q${questionIndex + 1}`]
    );
  };

  const getQ8AddonValue = (): string | undefined => {
    const item = viewData?.q8?.[0];

    if (!item) return undefined;

    return String(item.q8Addon ?? 0);
  };

  /** คะแนนที่เลือก — แสดง `(n)` ต่อท้าย Radio */
  const formatScoreParen = (raw: number | undefined | null): string | null => {
    if (raw == null || Number.isNaN(Number(raw))) return null;
    if (raw === 99) return null;

    return `(${Number(raw)})`;
  };

  const sumPhqaQ9FromQs = (row: Record<string, number>) =>
    [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce((acc, n) => {
      const v = Number(row[`q${n}`] ?? 0);

      return acc + (v === 99 || Number.isNaN(v) ? 0 : v);
    }, 0);

  const sumQ8FromFields = (
    row: Record<string, number> & { q8Addon?: number }
  ) => {
    let total = 0;

    for (let n = 1; n <= 8; n++) {
      const v = Number(row[`q${n}`] ?? 0);

      total += v === 99 || Number.isNaN(v) ? 0 : v;
    }
    const addon = Number(row.q8Addon ?? 0);

    total += addon === 99 || Number.isNaN(addon) ? 0 : addon;

    return total;
  };

  const q2Row = viewData?.q2?.[0];
  const q2TotalScore =
    q2Row != null ? Number(q2Row.q1 ?? 0) + Number(q2Row.q2 ?? 0) : null;

  const phqaOrQ9Row = hasQ9Data ? viewData?.q9?.[0] : viewData?.phqa?.[0];
  const phqaQ9TotalScore =
    phqaOrQ9Row != null
      ? (() => {
          const r = phqaOrQ9Row as unknown as Record<string, number> & {
            sum?: number;
          };
          const stored = Number(r.sum);

          return Number.isFinite(stored) ? stored : sumPhqaQ9FromQs(r);
        })()
      : null;

  const q8Row = viewData?.q8?.[0];
  const q8TotalScore =
    q8Row != null
      ? (() => {
          const r = q8Row as unknown as Record<string, number> & {
            sum?: number;
            q8Addon?: number;
          };
          const stored = Number(r.sum);

          return Number.isFinite(stored) ? stored : sumQ8FromFields(r);
        })()
      : null;
  const q8AddonScoreParen =
    q8Row != null ? formatScoreParen(Number(q8Row.q8Addon)) : null;

  const addonPhqaRow = viewData?.addon?.[0];
  const addonPhqaTotalScore =
    addonPhqaRow != null
      ? Number(addonPhqaRow.q1 ?? 0) + Number(addonPhqaRow.q2 ?? 0)
      : null;
  const problemRow = viewData?.problem?.[0];
  const problemTotalScore =
    problemRow != null ? Number(problemRow.sum ?? 0) : null;

  const roundCompletedAt = pickRoundCompletedAt(viewData);

  const q2Positive =
    q2Row != null
      ? isTwoQPositive(Number(q2Row.q1 ?? 0), Number(q2Row.q2 ?? 0))
      : false;
  const mainScale = hasQ9Data ? "9Q" : "PHQA";
  const mainResultMeta =
    phqaQ9TotalScore != null
      ? calculateMainAssessmentResult(phqaQ9TotalScore, mainScale)
      : null;

  const handleQ2Change = (questionIndex: number, value: string) => {
    if (onQuestionChange) {
      const updatedQ2 = [...(data?.q2 || [])];

      if (!updatedQ2[0]) {
        updatedQ2[0] = { q1: 0, q2: 0 };
      }
      (updatedQ2[0] as unknown as Record<string, number>)[
        `q${questionIndex + 1}`
      ] = parseInt(value, 10);
      onQuestionChange("q2", updatedQ2);
    }
  };

  const handlePhqaChange = (questionIndex: number, value: string) => {
    if (onQuestionChange) {
      const updatedPhqa = [...(data?.phqa || [])];

      if (!updatedPhqa[0]) {
        updatedPhqa[0] = {
          q1: 0,
          q2: 0,
          q3: 0,
          q4: 0,
          q5: 0,
          q6: 0,
          q7: 0,
          q8: 0,
          q9: 0,
          sum: 0,
        };
      }
      (updatedPhqa[0] as unknown as Record<string, number>)[
        `q${questionIndex + 1}`
      ] = parseInt(value, 10);

      // คำนวณ sum จากข้อมูล phqa
      const phqaData = updatedPhqa[0];
      const sum =
        phqaData.q1 +
        phqaData.q2 +
        phqaData.q3 +
        phqaData.q4 +
        phqaData.q5 +
        phqaData.q6 +
        phqaData.q7 +
        phqaData.q8 +
        phqaData.q9;

      // อัปเดต sum
      (updatedPhqa[0] as unknown as Record<string, number>).sum = sum;

      onQuestionChange("phqa", updatedPhqa);
    }
  };

  const handleAddonChange = (questionIndex: number, value: string) => {
    if (onQuestionChange) {
      const updatedAddon = [...(data?.addon || [])];

      if (!updatedAddon[0]) {
        updatedAddon[0] = { q1: 0, q2: 0 };
      }
      (updatedAddon[0] as unknown as Record<string, number>)[
        `q${questionIndex + 1}`
      ] = parseInt(value, 10);
      onQuestionChange("addon", updatedAddon);
    }
  };

  const handleQ8Change = (questionIndex: number, value: string) => {
    if (!onQuestionChange) return;

    const updatedQ8: Q8Data[] = [...(data?.q8 || [])];
    const base: Q8Data = {
      q1: 0,
      q2: 0,
      q3: 0,
      q4: 0,
      q5: 0,
      q6: 0,
      q7: 0,
      q8: 0,
      q8Addon: 0,
      sum: 0,
    };

    if (!updatedQ8[0]) {
      updatedQ8[0] = { ...base };
    } else {
      updatedQ8[0] = { ...updatedQ8[0] };
    }

    const key = `q${questionIndex + 1}` as keyof Q8Data;
    const num = parseInt(value, 10);

    (updatedQ8[0] as unknown as Record<string, number>)[key] = num;

    if (questionIndex === 2 && num !== 6) {
      updatedQ8[0].q8Addon = 0;
    }

    updatedQ8[0].sum = sumQ8Payload(updatedQ8[0]);
    onQuestionChange("q8", updatedQ8);
  };

  const handleQ8AddonChange = (value: string) => {
    if (!onQuestionChange) return;

    const current = data?.q8?.[0];

    if (!current || current.q3 !== 6) return;

    const updatedQ8: Q8Data[] = [...(data?.q8 || [])];

    updatedQ8[0] = {
      ...current,
      q8Addon: parseInt(value, 10),
    };
    updatedQ8[0].sum = sumQ8Payload(updatedQ8[0]);
    onQuestionChange("q8", updatedQ8);
  };

  return (
    <div className="box-border w-full max-w-full min-w-0 flex flex-col gap-4 overflow-x-hidden">
      {!isEditMode && assessmentRounds.length > 1 && (
        <Tabs
          aria-label="รอบแบบประเมิน"
          className="w-full max-w-full"
          classNames={consultationRoundTabClassNames}
          color="primary"
          selectedKey={selectedRound}
          size="md"
          variant="solid"
          onSelectionChange={(key) => setSelectedRound(String(key))}
        >
          {assessmentRounds.map((round) => (
            <Tab key={String(round)} title={`รอบที่ ${round}`} />
          ))}
        </Tabs>
      )}

      {roundCompletedAt ? (
        <p className="text-sm text-default-500">
          {assessmentRounds.length > 1 ? `รอบที่ ${viewRound} · ` : null}
          ทำเมื่อ {formatThaiDateTime(roundCompletedAt)}
        </p>
      ) : null}

      <div className="w-full max-w-full min-w-0">
        <h2 className={sectionTitleClass}>แบบประเมิน 2Q</h2>
        {q2TotalScore !== null && (
          <ScoreResultMeta
            chipColor={q2Positive ? "warning" : "success"}
            chipLabel={
              q2Positive ? "เข้าเกณฑ์ประเมินต่อ" : "ไม่เข้าเกณฑ์ (ปกติ)"
            }
            score={q2TotalScore}
          />
        )}
        <Table aria-label="Question Anwser 2Q" classNames={tableTextClassNames}>
          <TableHeader>
            <TableColumn>คำถาม</TableColumn>
            <TableColumn align="center">คำตอบ</TableColumn>
          </TableHeader>
          <TableBody>
            {q2.map((val, index) => {
              const q2ScoreParen = formatScoreParen(
                Number(q2Row?.[`q${index + 1}` as keyof Questions2Q] as number)
              );

              return (
                <TableRow key={index}>
                  <TableCell className="min-w-0">
                    {index + 1}. {val}
                  </TableCell>
                  <TableCell className="min-w-0">
                    <div className="flex max-w-full flex-row flex-wrap items-center justify-center gap-1">
                      {(viewData?.q2 && viewData.q2.length > 0
                        ? viewData.q2
                        : [undefined]
                      ).map((item, i) => {
                        return (
                          <RadioGroup
                            key={i}
                            className="items-center"
                            isDisabled={mode !== "edit-questionnaire"}
                            name={(index + 1).toString()}
                            orientation="horizontal"
                            value={getAnswerValue(
                              item as unknown as Record<string, unknown>,
                              index
                            )}
                            onValueChange={(value) =>
                              handleQ2Change(index, value)
                            }
                          >
                            <Radio className={answerOptionClass} value="1">
                              ใช่
                            </Radio>
                            <Radio className={answerOptionClass} value="0">
                              ไม่ใช่
                            </Radio>
                          </RadioGroup>
                        );
                      })}
                      {q2ScoreParen != null && (
                        <span className="shrink-0 whitespace-nowrap text-sm text-default-600">
                          {q2ScoreParen}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div>
        <h2 className={sectionTitleClass}>
          {hasQ9Data ? "แบบประเมิน 9Q" : "แบบประเมิน PHQ-A"}
        </h2>
        {phqaQ9TotalScore !== null && mainResultMeta && (
          <ScoreResultMeta
            chipColor={legacyResultChipColor(mainResultMeta.result)}
            chipLabel={getAssessmentResultLabel(mainResultMeta.result)}
            score={phqaQ9TotalScore}
          />
        )}
        <div className="flex flex-col gap-4">
          <Table
            aria-label={
              hasQ9Data ? "Question Answer 9Q" : "Question Answer PHQ-A"
            }
            classNames={tableTextClassNames}
          >
            <TableHeader>
              <TableColumn>คำถาม</TableColumn>
              <TableColumn align="center">คำตอบ</TableColumn>
            </TableHeader>
            <TableBody>
              {(hasQ9Data ? q9 : qPhqa).map((val, index) => {
                const phqaScoreParen =
                  phqaOrQ9Row != null
                    ? formatScoreParen(
                        Number(
                          (phqaOrQ9Row as unknown as Record<string, number>)[
                            `q${index + 1}`
                          ]
                        )
                      )
                    : null;

                return (
                  <TableRow key={index}>
                    <TableCell className="min-w-0">
                      {index + 1}. {val}
                    </TableCell>
                    <TableCell className="min-w-0">
                      <div className="flex max-w-full flex-row flex-wrap items-center justify-center gap-1">
                        {!hasQ9Data &&
                          (viewData?.phqa && viewData.phqa.length > 0
                            ? viewData.phqa
                            : [undefined]
                          ).map((item, i) => {
                            return (
                              <RadioGroup
                                key={i}
                                className="items-center"
                                isDisabled={mode !== "edit-questionnaire"}
                                name={(index + 1).toString()}
                                orientation="horizontal"
                                value={getAnswerValue(
                                  item as unknown as Record<string, unknown>,
                                  index
                                )}
                                onValueChange={(value) =>
                                  handlePhqaChange(index, value)
                                }
                              >
                                <Radio className={answerOptionClass} value="0">
                                  0
                                </Radio>
                                <Radio className={answerOptionClass} value="1">
                                  1
                                </Radio>
                                <Radio className={answerOptionClass} value="2">
                                  2
                                </Radio>
                                <Radio className={answerOptionClass} value="3">
                                  3
                                </Radio>
                              </RadioGroup>
                            );
                          })}
                        {hasQ9Data && (
                          <RadioGroup
                            className="items-center"
                            isDisabled={true}
                            name={(index + 1).toString()}
                            orientation="horizontal"
                            value={getQ9Value(index)}
                          >
                            <Radio className={answerOptionClass} value="0">
                              0
                            </Radio>
                            <Radio className={answerOptionClass} value="1">
                              1
                            </Radio>
                            <Radio className={answerOptionClass} value="2">
                              2
                            </Radio>
                            <Radio className={answerOptionClass} value="3">
                              3
                            </Radio>
                          </RadioGroup>
                        )}
                        {phqaScoreParen != null && (
                          <span className="shrink-0 whitespace-nowrap text-sm text-default-600">
                            {phqaScoreParen}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      {hasQ8Data ? (
        <div>
          <h2 className={sectionTitleClass}>แบบประเมิน 8Q</h2>
          {q8TotalScore !== null && (
            <ScoreResultMeta
              chipColor={eightQChipColor(q8TotalScore)}
              chipLabel={getEightQRiskLabel(q8TotalScore)}
              score={q8TotalScore}
            />
          )}
          <Table
            aria-label="Question Answer 8Q"
            classNames={tableTextClassNames}
          >
            <TableHeader>
              <TableColumn>คำถาม</TableColumn>
              <TableColumn align="center">คำตอบ</TableColumn>
            </TableHeader>
            <TableBody>
              {q8.map((val, index) => {
                const trueValueMap = [1, 2, 6, 8, 9, 5, 10, 4];
                const yesValue = String(trueValueMap[index] ?? 1);
                const q8ScoreParen =
                  q8Row != null
                    ? formatScoreParen(
                        Number(
                          (q8Row as unknown as Record<string, number>)[
                            `q${index + 1}`
                          ]
                        )
                      )
                    : null;

                return (
                  <TableRow key={index}>
                    <TableCell className="min-w-0">
                      {index + 1}. {val}
                    </TableCell>
                    <TableCell className="min-w-0">
                      <div className="flex max-w-full flex-row flex-wrap items-center justify-center gap-1">
                        <RadioGroup
                          className="items-center shrink-0"
                          isDisabled={mode !== "edit-questionnaire"}
                          name={`8q-${index + 1}`}
                          orientation="horizontal"
                          value={getQ8Value(index)}
                          onValueChange={(v) => handleQ8Change(index, v)}
                        >
                          <Radio className={answerOptionClass} value="0">
                            ไม่ใช่
                          </Radio>
                          <Radio className={answerOptionClass} value={yesValue}>
                            ใช่
                          </Radio>
                        </RadioGroup>
                        {q8ScoreParen != null && (
                          <span className="shrink-0 whitespace-nowrap text-sm text-default-600">
                            {q8ScoreParen}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Table
            aria-label="Question Answer 8Q Addon"
            classNames={tableTextClassNames}
          >
            <TableHeader>
              <TableColumn>คำถาม</TableColumn>
              <TableColumn align="center">คำตอบ</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="min-w-0">addon. {q8Addon[0]}</TableCell>
                <TableCell className="min-w-0">
                  <div className="flex max-w-full flex-row flex-wrap items-center justify-center gap-1">
                    <RadioGroup
                      className="items-center shrink-0"
                      isDisabled={
                        mode !== "edit-questionnaire" ||
                        (viewData?.q8?.[0]?.q3 ?? 0) !== 6
                      }
                      name="8q-addon"
                      orientation="horizontal"
                      value={getQ8AddonValue()}
                      onValueChange={handleQ8AddonChange}
                    >
                      <Radio className={answerOptionClass} value="0">
                        ได้
                      </Radio>
                      <Radio className={answerOptionClass} value="8">
                        ไม่ได้
                      </Radio>
                    </RadioGroup>
                    {q8AddonScoreParen != null && (
                      <span className="shrink-0 whitespace-nowrap text-sm text-default-600">
                        {q8AddonScoreParen}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div>
          <h2 className={sectionTitleClass}>แบบประเมิน PHQ-A Addon</h2>
          {addonPhqaTotalScore !== null && (
            <p className={`${sectionMetaClass} mb-2`}>
              คะแนนที่ทำได้: {addonPhqaTotalScore}
            </p>
          )}
          <Table
            aria-label="Question Anwser PHQ-A-Addon"
            classNames={tableTextClassNames}
          >
            <TableHeader>
              <TableColumn>คำถาม</TableColumn>
              <TableColumn align="center">คำตอบ</TableColumn>
            </TableHeader>
            <TableBody>
              {phqaAddon.map((val, index) => {
                const addonScoreParen =
                  addonPhqaRow != null
                    ? formatScoreParen(
                        Number(
                          addonPhqaRow[
                            `q${index + 1}` as keyof typeof addonPhqaRow
                          ]
                        )
                      )
                    : null;

                return (
                  <TableRow key={index}>
                    <TableCell className="min-w-0">
                      {index + 1}. {val}
                    </TableCell>
                    <TableCell className="min-w-0">
                      <div className="flex max-w-full flex-row flex-wrap items-center justify-center gap-1">
                        {(viewData?.addon && viewData.addon.length > 0
                          ? viewData.addon
                          : [undefined]
                        ).map((item, i) => {
                          return (
                            <RadioGroup
                              key={i}
                              className="items-center"
                              isDisabled={mode !== "edit-questionnaire"}
                              name={(index + 1).toString()}
                              orientation="horizontal"
                              value={getAnswerValue(
                                item as unknown as Record<string, unknown>,
                                index
                              )}
                              onValueChange={(value) =>
                                handleAddonChange(index, value)
                              }
                            >
                              <Radio className={answerOptionClass} value="1">
                                ใช่
                              </Radio>
                              <Radio className={answerOptionClass} value="0">
                                ไม่ใช่
                              </Radio>
                            </RadioGroup>
                          );
                        })}
                        {addonScoreParen != null && (
                          <span className="shrink-0 whitespace-nowrap text-sm text-default-600">
                            {addonScoreParen}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <div>
        <h2 className={sectionTitleClass}>แบบประเมินปัญหา</h2>
        {problemTotalScore !== null && (
          <p className={`${sectionMetaClass} mb-2`}>
            จำนวนหัวข้อที่เลือก: {problemTotalScore}
          </p>
        )}
        <Table
          aria-label="Question Answer Problem"
          classNames={tableTextClassNames}
        >
          <TableHeader>
            <TableColumn>หมวด</TableColumn>
            <TableColumn>หัวข้อที่เลือก</TableColumn>
          </TableHeader>
          <TableBody>
            {teenMindProblems.map((section) => {
              const selectedItems =
                problemRow == null
                  ? []
                  : section.items
                      .filter(
                        (item) =>
                          Number(
                            (problemRow as unknown as Record<string, number>)[
                              item.key as keyof ProblemPayload
                            ] ?? 0
                          ) === 1
                      )
                      .map((item) => item.label);

              return (
                <TableRow key={section.category}>
                  <TableCell className="min-w-0">{section.category}</TableCell>
                  <TableCell>
                    {selectedItems.length > 0
                      ? selectedItems.join(", ")
                      : "ไม่ได้เลือก"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
