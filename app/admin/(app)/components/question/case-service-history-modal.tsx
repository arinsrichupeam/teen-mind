"use client";

import type { ProfileCaseHistorySummary } from "@/lib/profile-case-history";

import { useEffect, useState } from "react";
import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
} from "@heroui/react";

import { QuestionDetailDrawer } from "./question-detail-drawer";
import { ConsultationRoundsPanel } from "./consultation-rounds-panel";

import {
  caseStatusChipColor,
  caseStatusLabel,
} from "@/lib/case-status-mapping";
import { QuestionsData } from "@/types";
import { formatThaiDateTime } from "@/utils/helper";
import { prefix as prefixOptions } from "@/utils/data";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  currentCaseId: string;
};

type View = "list" | "detail";

export function CaseServiceHistoryModal({
  isOpen,
  onClose,
  profileId,
  currentCaseId,
}: Props) {
  const [view, setView] = useState<View>("list");
  const [rows, setRows] = useState<ProfileCaseHistorySummary[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<QuestionsData | null>(null);
  const [selectedSummary, setSelectedSummary] =
    useState<ProfileCaseHistorySummary | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setView("list");
      setRows([]);
      setListError(null);
      setDetail(null);
      setDetailError(null);
      setSelectedSummary(null);

      return;
    }

    let cancelled = false;

    setListLoading(true);
    setListError(null);

    const params = new URLSearchParams({
      excludeCaseId: currentCaseId,
      status: "CLOSED",
    });

    void fetch(`/api/profile/${profileId}/cases?${params.toString()}`)
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as {
          data?: ProfileCaseHistorySummary[];
          error?: string;
        };

        if (!res.ok) {
          throw new Error(body.error || "โหลดประวัติไม่สำเร็จ");
        }

        if (!cancelled) {
          setRows(Array.isArray(body.data) ? body.data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setListError(
            err instanceof Error ? err.message : "โหลดประวัติไม่สำเร็จ"
          );
          setRows([]);
        }
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, profileId, currentCaseId]);

  const openDetail = async (summary: ProfileCaseHistorySummary) => {
    setSelectedSummary(summary);
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    setView("detail");

    try {
      const res = await fetch(`/api/question/${summary.id}`);
      const body = (await res.json().catch(() => null)) as unknown;

      if (!res.ok || body == null) {
        const errMsg =
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof (body as { error?: unknown }).error === "string"
            ? (body as { error: string }).error
            : "โหลดรายละเอียดเคสไม่สำเร็จ";

        throw new Error(errMsg);
      }

      if (Array.isArray(body)) {
        setDetail((body[0] as QuestionsData) ?? null);
      } else if (typeof body === "object" && body !== null && "error" in body) {
        throw new Error(
          typeof (body as { error?: unknown }).error === "string"
            ? (body as { error: string }).error
            : "โหลดรายละเอียดเคสไม่สำเร็จ"
        );
      } else {
        setDetail(body as QuestionsData);
      }
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : "โหลดรายละเอียดเคสไม่สำเร็จ"
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const backToList = () => {
    setView("list");
    setDetail(null);
    setDetailError(null);
    setSelectedSummary(null);
  };

  const profile = detail?.profile;
  const fullName = profile
    ? `${
        prefixOptions.find((val) => val.key == profile.prefixId)?.label ?? ""
      }${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
    : "";

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-2">
          {view === "list" ? (
            <>
              <span>ประวัติการรับบริการ</span>
              <span className="text-sm font-normal text-default-500">
                เคสที่ปิดแล้วของผู้นี้ (ไม่รวมเคสที่เปิดอยู่)
              </span>
            </>
          ) : (
            <>
              <span>รายละเอียดเคสเก่า{fullName ? ` — ${fullName}` : ""}</span>
              <div className="flex flex-wrap items-center gap-2 text-sm font-normal text-default-500">
                {selectedSummary && (
                  <span>
                    สร้างเมื่อ {formatThaiDateTime(selectedSummary.createdAt)}
                  </span>
                )}
                {selectedSummary && (
                  <Chip
                    color={caseStatusChipColor(selectedSummary.status)}
                    size="sm"
                    variant="flat"
                  >
                    {caseStatusLabel(selectedSummary.status)}
                  </Chip>
                )}
                {selectedSummary?.resultLabel && (
                  <Chip size="sm" variant="flat">
                    {selectedSummary.resultLabel}
                  </Chip>
                )}
              </div>
            </>
          )}
        </ModalHeader>
        <ModalBody className="gap-4 pb-4">
          {view === "list" && (
            <>
              {listLoading && (
                <div className="flex justify-center py-10">
                  <Spinner label="กำลังโหลดประวัติ..." />
                </div>
              )}
              {!listLoading && listError && (
                <p className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  {listError}
                </p>
              )}
              {!listLoading && !listError && (
                <Table aria-label="ประวัติเคสที่ปิดแล้ว" selectionMode="none">
                  <TableHeader>
                    <TableColumn>วันที่สร้าง</TableColumn>
                    <TableColumn>สถานะ</TableColumn>
                    <TableColumn>ผลประเมิน</TableColumn>
                    <TableColumn>รอบประเมิน</TableColumn>
                    <TableColumn>รอบคำปรึกษา</TableColumn>
                    <TableColumn align="center">ดู</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="ไม่พบเคสเก่าที่ปิดแล้ว" items={rows}>
                    {(row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {formatThaiDateTime(row.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={caseStatusChipColor(row.status)}
                            size="sm"
                            variant="flat"
                          >
                            {caseStatusLabel(row.status)}
                          </Chip>
                        </TableCell>
                        <TableCell>{row.resultLabel || "—"}</TableCell>
                        <TableCell>{row.assessmentRoundCount} รอบ</TableCell>
                        <TableCell>{row.consultRoundCount} รอบ</TableCell>
                        <TableCell>
                          <Button
                            color="primary"
                            size="sm"
                            variant="flat"
                            onPress={() => void openDetail(row)}
                          >
                            เปิดดู
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </>
          )}

          {view === "detail" && (
            <>
              {detailLoading && (
                <div className="flex justify-center py-10">
                  <Spinner label="กำลังโหลดรายละเอียด..." />
                </div>
              )}
              {!detailLoading && detailError && (
                <p className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  {detailError}
                </p>
              )}
              {!detailLoading && detail && (
                <Tabs
                  aria-label="รายละเอียดเคสเก่า"
                  classNames={{
                    tabList: "w-full",
                  }}
                >
                  <Tab key="assessment" title="แบบประเมิน">
                    <div className="pt-3">
                      <QuestionDetailDrawer data={detail} />
                    </div>
                  </Tab>
                  <Tab key="consultation" title="คำปรึกษา">
                    <div className="pt-3">
                      <ConsultationRoundsPanel
                        readOnly
                        caseId={detail.id}
                        consultants={[]}
                        notes={
                          detail.treatmentNotes as
                            | Parameters<
                                typeof ConsultationRoundsPanel
                              >[0]["notes"]
                            | undefined
                        }
                      />
                    </div>
                  </Tab>
                </Tabs>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {view === "detail" ? (
            <Button variant="bordered" onPress={backToList}>
              กลับไปรายการประวัติ
            </Button>
          ) : (
            <Button variant="light" onPress={onClose}>
              ปิด
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/** Prefetch whether the profile has prior CLOSED cases (for showing the button). */
export async function fetchHasPriorClosedCases(
  profileId: string,
  currentCaseId: string
): Promise<boolean> {
  const params = new URLSearchParams({
    excludeCaseId: currentCaseId,
    status: "CLOSED",
  });
  const res = await fetch(`/api/profile/${profileId}/cases?${params}`);

  if (!res.ok) return false;
  const body = (await res.json().catch(() => ({}))) as {
    data?: ProfileCaseHistorySummary[];
  };

  return Array.isArray(body.data) && body.data.length > 0;
}
