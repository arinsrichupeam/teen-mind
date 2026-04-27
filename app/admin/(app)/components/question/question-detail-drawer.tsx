import {
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";

import { subtitle } from "@/components/primitives";
import {
  q2,
  q8,
  q8Addon,
  q9,
  qPhqa,
  phqaAddon,
  teenMindProblems,
} from "@/app/data";
import {
  Addon,
  Phqa,
  ProblemPayload,
  Q8Data,
  Questions2Q,
  QuestionsData,
} from "@/types";

/** คะแนนรวม 8Q สอดคล้อง SumValue8Q ใน API */
function sumQ8Payload(row: Q8Data): number {
  return (
    Number(row.q1 ?? 0) +
    Number(row.q2 ?? 0) +
    Number(row.q3 ?? 0) +
    Number(row.q4 ?? 0) +
    Number(row.q5 ?? 0) +
    Number(row.q6 ?? 0) +
    Number(row.q7 ?? 0) +
    Number(row.q8 ?? 0) +
    Number(row.q8Addon ?? 0)
  );
}

interface Props {
  data: QuestionsData | undefined;
  mode?: string;
  onQuestionChange?: (
    field: string,
    value: string | number | Questions2Q[] | Phqa[] | Addon[] | Q8Data[]
  ) => void;
}

export const QuestionDetailDrawer = ({
  data,
  mode,
  onQuestionChange,
}: Props) => {
  const hasQ9Data = Boolean(data?.q9 && data.q9.length > 0);
  const hasQ8Data = Boolean(data?.q8 && data.q8.length > 0);

  const getQ9Value = (questionIndex: number): string | undefined => {
    const item = data?.q9?.[0];

    if (!item) return undefined;

    return String(
      (item as unknown as Record<string, number>)[`q${questionIndex + 1}`]
    );
  };

  const getQ8Value = (questionIndex: number): string | undefined => {
    const item = data?.q8?.[0];

    if (!item) return undefined;

    return String(
      (item as unknown as Record<string, number>)[`q${questionIndex + 1}`]
    );
  };

  const getQ8AddonValue = (): string | undefined => {
    const item = data?.q8?.[0];

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

  const q2Row = data?.q2?.[0];
  const q2TotalScore =
    q2Row != null ? Number(q2Row.q1 ?? 0) + Number(q2Row.q2 ?? 0) : null;

  const phqaOrQ9Row = hasQ9Data ? data?.q9?.[0] : data?.phqa?.[0];
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

  const q8Row = data?.q8?.[0];
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

  const addonPhqaRow = data?.addon?.[0];
  const addonPhqaTotalScore =
    addonPhqaRow != null
      ? Number(addonPhqaRow.q1 ?? 0) + Number(addonPhqaRow.q2 ?? 0)
      : null;
  const problemRow = data?.problem?.[0];
  const problemTotalScore =
    problemRow != null ? Number(problemRow.sum ?? 0) : null;

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
    <div>
      <div>
        <h2 className={subtitle()}>แบบประเมิน 2Q</h2>
        {q2TotalScore !== null && (
          <p className="text-small text-default-600 mb-2">
            คะแนนที่ทำได้: {q2TotalScore}
          </p>
        )}
        <Table aria-label="Question Anwser 2Q">
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
                  <TableCell className="min-w-[250px]">
                    {index + 1}. {val}
                  </TableCell>
                  <TableCell className="min-w-[250px]">
                    <div className="flex flex-row flex-nowrap items-center justify-center gap-1">
                      {(data?.q2 && data.q2.length > 0
                        ? data.q2
                        : [undefined]
                      ).map((item, i) => {
                        return (
                          <RadioGroup
                            key={i}
                            className="items-center"
                            isDisabled={mode !== "edit-questionnaire"}
                            name={(index + 1).toString()}
                            orientation="horizontal"
                            value={
                              item
                                ? Object.entries(item)
                                    [index + 2]?.toString()
                                    .substring(3)
                                : undefined
                            }
                            onValueChange={(value) =>
                              handleQ2Change(index, value)
                            }
                          >
                            <Radio
                              className="inline-flex items-center justify-between max-w-full cursor-pointer pr-5"
                              value="1"
                            >
                              ใช่
                            </Radio>
                            <Radio
                              className="inline-flex items-center justify-between max-w-full cursor-pointer pr-5"
                              value="0"
                            >
                              ไม่ใช่
                            </Radio>
                          </RadioGroup>
                        );
                      })}
                      {q2ScoreParen != null && (
                        <span className="text-small text-default-600 shrink-0 whitespace-nowrap">
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
        <h2 className={subtitle()}>
          {hasQ9Data ? "แบบประเมิน 9Q" : "แบบประเมิน PHQ-A"}
        </h2>
        {phqaQ9TotalScore !== null && (
          <p className="text-small text-default-600 mb-2">
            คะแนนที่ทำได้: {phqaQ9TotalScore}
          </p>
        )}
        <div className="flex flex-col gap-4">
          <Table
            aria-label={
              hasQ9Data ? "Question Answer 9Q" : "Question Answer PHQ-A"
            }
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
                    <TableCell className="min-w-[250px]">
                      {index + 1}. {val}
                    </TableCell>
                    <TableCell className="min-w-[250px]">
                      <div className="flex flex-row flex-nowrap items-center justify-center gap-1">
                        {!hasQ9Data &&
                          (data?.phqa && data.phqa.length > 0
                            ? data.phqa
                            : [undefined]
                          ).map((item, i) => {
                            return (
                              <RadioGroup
                                key={i}
                                className="items-center"
                                isDisabled={mode !== "edit-questionnaire"}
                                name={(index + 1).toString()}
                                orientation="horizontal"
                                value={
                                  item
                                    ? Object.entries(item)
                                        [index + 2]?.toString()
                                        .substring(3)
                                    : undefined
                                }
                                onValueChange={(value) =>
                                  handlePhqaChange(index, value)
                                }
                              >
                                <Radio
                                  className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                                  value="0"
                                >
                                  0
                                </Radio>
                                <Radio
                                  className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                                  value="1"
                                >
                                  1
                                </Radio>
                                <Radio
                                  className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                                  value="2"
                                >
                                  2
                                </Radio>
                                <Radio
                                  className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                                  value="3"
                                >
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
                            <Radio
                              className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                              value="0"
                            >
                              0
                            </Radio>
                            <Radio
                              className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                              value="1"
                            >
                              1
                            </Radio>
                            <Radio
                              className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                              value="2"
                            >
                              2
                            </Radio>
                            <Radio
                              className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                              value="3"
                            >
                              3
                            </Radio>
                          </RadioGroup>
                        )}
                        {phqaScoreParen != null && (
                          <span className="text-small text-default-600 shrink-0 whitespace-nowrap">
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
          <h2 className={subtitle()}>แบบประเมิน 8Q</h2>
          {q8TotalScore !== null && (
            <p className="text-small text-default-600 mb-2">
              คะแนนที่ทำได้: {q8TotalScore}
            </p>
          )}
          <Table aria-label="Question Answer 8Q">
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
                    <TableCell className="min-w-[250px]">
                      {index + 1}. {val}
                    </TableCell>
                    <TableCell className="min-w-[250px]">
                      <div className="flex flex-row flex-nowrap items-center justify-center gap-1">
                        <RadioGroup
                          className="items-center shrink-0"
                          isDisabled={mode !== "edit-questionnaire"}
                          name={`8q-${index + 1}`}
                          orientation="horizontal"
                          value={getQ8Value(index)}
                          onValueChange={(v) => handleQ8Change(index, v)}
                        >
                          <Radio
                            className="inline-flex items-center justify-between max-w-full cursor-pointer pr-5"
                            value="0"
                          >
                            ไม่ใช่
                          </Radio>
                          <Radio
                            className="inline-flex items-center justify-between max-w-full cursor-pointer pr-5"
                            value={yesValue}
                          >
                            ใช่
                          </Radio>
                        </RadioGroup>
                        {q8ScoreParen != null && (
                          <span className="text-small text-default-600 shrink-0 whitespace-nowrap">
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
          <Table aria-label="Question Answer 8Q Addon">
            <TableHeader>
              <TableColumn>คำถาม</TableColumn>
              <TableColumn align="center">คำตอบ</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="min-w-[250px]">
                  addon. {q8Addon[0]}
                </TableCell>
                <TableCell className="min-w-[250px]">
                  <div className="flex flex-row flex-nowrap items-center justify-center gap-1">
                    <RadioGroup
                      className="items-center shrink-0"
                      isDisabled={
                        mode !== "edit-questionnaire" ||
                        (data?.q8?.[0]?.q3 ?? 0) !== 6
                      }
                      name="8q-addon"
                      orientation="horizontal"
                      value={getQ8AddonValue()}
                      onValueChange={handleQ8AddonChange}
                    >
                      <Radio
                        className="inline-flex items-center justify-between max-w-full cursor-pointer pr-5"
                        value="0"
                      >
                        ได้
                      </Radio>
                      <Radio
                        className="inline-flex items-center justify-between max-w-full cursor-pointer pr-5"
                        value="8"
                      >
                        ไม่ได้
                      </Radio>
                    </RadioGroup>
                    {q8AddonScoreParen != null && (
                      <span className="text-small text-default-600 shrink-0 whitespace-nowrap">
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
          <h2 className={subtitle()}>แบบประเมิน PHQ-A Addon</h2>
          {addonPhqaTotalScore !== null && (
            <p className="text-small text-default-600 mb-2">
              คะแนนที่ทำได้: {addonPhqaTotalScore}
            </p>
          )}
          <Table aria-label="Question Anwser PHQ-A-Addon">
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
                    <TableCell className="min-w-[250px]">
                      {index + 1}. {val}
                    </TableCell>
                    <TableCell className="min-w-[250px]">
                      <div className="flex flex-row flex-nowrap items-center justify-center gap-1">
                        {(data?.addon && data.addon.length > 0
                          ? data.addon
                          : [undefined]
                        ).map((item, i) => {
                          return (
                            <RadioGroup
                              key={i}
                              className="items-center"
                              isDisabled={mode !== "edit-questionnaire"}
                              name={(index + 1).toString()}
                              orientation="horizontal"
                              value={
                                item
                                  ? Object.entries(item)
                                      [index + 2]?.toString()
                                      .substring(3)
                                  : undefined
                              }
                              onValueChange={(value) =>
                                handleAddonChange(index, value)
                              }
                            >
                              <Radio
                                className="inline-flex items-center justify-between max-w-full cursor-pointer pr-5"
                                value="1"
                              >
                                ใช่
                              </Radio>
                              <Radio
                                className="inline-flex items-center justify-between max-w-full cursor-pointer pr-5"
                                value="0"
                              >
                                ไม่ใช่
                              </Radio>
                            </RadioGroup>
                          );
                        })}
                        {addonScoreParen != null && (
                          <span className="text-small text-default-600 shrink-0 whitespace-nowrap">
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
        <h2 className={subtitle()}>แบบประเมินปัญหา</h2>
        {problemTotalScore !== null && (
          <p className="text-small text-default-600 mb-2">
            จำนวนหัวข้อที่เลือก: {problemTotalScore}
          </p>
        )}
        <Table aria-label="Question Answer Problem">
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
                  <TableCell className="min-w-[220px]">
                    {section.category}
                  </TableCell>
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
