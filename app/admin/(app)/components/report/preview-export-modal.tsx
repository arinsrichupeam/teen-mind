"use client";

import { useState } from "react";
import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import moment from "moment";

import {
  getProfileAge,
  HistoryEntry,
  IndividualProfile,
  RESULT_COLOR_MAP,
} from "./individual-types";

export function PreviewExportModal({
  isOpen,
  onClose,
  profiles,
  isLoading,
  page1,
  onPage1Change,
  onDownload,
  prefixMap,
}: {
  isOpen: boolean;
  onClose: () => void;
  profiles: IndividualProfile[];
  isLoading: boolean;
  page1: number;
  onPage1Change: (p: number) => void;
  onDownload: () => void;
  prefixMap: Map<string, string>;
}) {
  const [blindNames, setBlindNames] = useState(true);
  const maskName = (name: string) => {
    const parts = name.split(" ");

    if (parts.length <= 1) return parts[0][0] + "xxx";
    const last = parts[parts.length - 1];

    return [...parts.slice(0, -1), last[0] + "xxx"].join(" ");
  };
  const PER_PAGE = 10;
  const MAX_PREVIEW_YEARS = 4;

  const fmtDate = (d: string) =>
    `${moment(d).format("DD/MM/")}${moment(d).year() + 543}`;

  // Collect all unique Thai Buddhist years across all loaded profiles, sorted asc
  const allYears: number[] = Array.from(
    new Set(
      profiles.flatMap((p) => p.history.map((h) => moment(h.date).year() + 543))
    )
  ).sort((a, b) => a - b);

  const previewYears = allYears.slice(-MAX_PREVIEW_YEARS);

  const latestInYear = (
    history: HistoryEntry[],
    year: number
  ): HistoryEntry | null => {
    const inYear = history.filter((h) => moment(h.date).year() + 543 === year);

    return inYear.length > 0 ? inYear[inYear.length - 1] : null;
  };

  const summaryRows = profiles.map((p, i) => {
    const name =
      `${prefixMap.get(String(p.prefixId)) ?? ""} ${p.firstName} ${p.lastName}`.trim();
    const school =
      typeof p.school === "object" && p.school ? p.school.name : "-";
    const age = getProfileAge(
      p.birthDate,
      typeof p.school === "object" ? p.school : null,
      p.latestDate
    );

    return {
      idx: i + 1,
      name,
      citizenId: p.citizenId ?? "-",
      age,
      school,
      count: p.assessmentCount,
      history: p.history,
    };
  });

  const total1 = Math.max(1, Math.ceil(summaryRows.length / PER_PAGE));
  const visibleSummary = summaryRows.slice(
    (page1 - 1) * PER_PAGE,
    page1 * PER_PAGE
  );

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-0.5 pb-2">
          <div className="flex items-center justify-between">
            <span>ตัวอย่างข้อมูลก่อน Export</span>
            <Button
              color={blindNames ? "warning" : "default"}
              size="sm"
              variant="flat"
              onPress={() => setBlindNames((v) => !v)}
            >
              {blindNames ? "แสดงชื่อ" : "ซ่อนชื่อ"}
            </Button>
          </div>
          <span className="text-sm font-normal text-default-500">
            {isLoading
              ? "กำลังโหลด..."
              : `${profiles.length} คน${allYears.length > MAX_PREVIEW_YEARS ? ` · แสดง ${MAX_PREVIEW_YEARS} ปีล่าสุด (จาก ${allYears.length} ปี)` : ""}`}
          </span>
        </ModalHeader>
        <ModalBody className="px-4 pb-2">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner label="กำลังโหลดข้อมูล..." />
            </div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <Table
                isStriped
                removeWrapper
                aria-label="สรุปรายบุคคล"
                className="min-w-full text-nowrap"
              >
                <TableHeader>
                  <TableColumn className="text-xs">ลำดับ</TableColumn>
                  <TableColumn className="text-xs">ชื่อ-สกุล</TableColumn>
                  <TableColumn align="center" className="text-xs">
                    อายุ
                  </TableColumn>
                  <TableColumn className="text-xs">โรงเรียน</TableColumn>
                  {
                    previewYears.flatMap((year, i) => [
                      <TableColumn
                        key={`d${year}`}
                        align="center"
                        className="text-xs"
                      >
                        วันที่คัดกรอง ครั้งที่ {i + 1}
                      </TableColumn>,
                      <TableColumn
                        key={`r${year}`}
                        align="center"
                        className="text-xs"
                      >
                        ผล ครั้งที่ {i + 1}
                      </TableColumn>,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ]) as any
                  }
                </TableHeader>
                <TableBody emptyContent="ไม่พบข้อมูล" items={visibleSummary}>
                  {(row) => (
                    <TableRow key={row.idx}>
                      <TableCell className="text-xs text-center">
                        {row.idx}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        <div>{blindNames ? maskName(row.name) : row.name}</div>
                        <div className="text-default-400">
                          {blindNames && row.citizenId !== "-"
                            ? row.citizenId.slice(0, 3) +
                              "xxxxxx" +
                              row.citizenId.slice(-4)
                            : row.citizenId}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-center whitespace-nowrap">
                        {row.age !== null ? `${row.age} ปี` : "-"}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {row.school}
                      </TableCell>
                      {
                        previewYears.flatMap((year) => {
                          const h = latestInYear(row.history, year);

                          return [
                            <TableCell
                              key={`d${year}`}
                              className="text-xs text-center"
                            >
                              {h ? fmtDate(h.date) : ""}
                            </TableCell>,
                            <TableCell
                              key={`r${year}`}
                              className="text-xs text-center"
                            >
                              {h?.result ? (
                                <Chip
                                  color={
                                    RESULT_COLOR_MAP[h.result] ?? "default"
                                  }
                                  size="sm"
                                  variant="flat"
                                >
                                  {h.result_text || h.result}
                                </Chip>
                              ) : (
                                ""
                              )}
                            </TableCell>,
                          ];
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        }) as any
                      }
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          {summaryRows.length > PER_PAGE && (
            <div className="flex justify-center mt-3">
              <Pagination
                isCompact
                showControls
                color="primary"
                page={page1}
                total={total1}
                onChange={onPage1Change}
              />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            ปิด
          </Button>
          <Button
            color="success"
            isDisabled={isLoading || profiles.length === 0}
            startContent={<ArrowDownTrayIcon className="size-4" />}
            variant="flat"
            onPress={onDownload}
          >
            ดาวน์โหลด Excel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
