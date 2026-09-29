"use client";

import type { QuestionsData } from "@/types";

import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@heroui/react";

import { formatThaiDateTime } from "@/utils/helper";

type TransferRole = "source" | "destination" | "viewer";

type TransferRow = NonNullable<QuestionsData["transfers"]>[number];

function transferStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "รอตอบรับ";
    case "ACCEPTED":
      return "รับแล้ว";
    case "REJECTED":
      return "ปฏิเสธ";
    case "CANCELLED":
      return "ยกเลิก";
    default:
      return status;
  }
}

function transferStatusColor(
  status: string
): "warning" | "success" | "danger" | "default" {
  switch (status) {
    case "PENDING":
      return "warning";
    case "ACCEPTED":
      return "success";
    case "REJECTED":
      return "danger";
    case "CANCELLED":
    default:
      return "default";
  }
}

function TransferHistoryItem({ transfer: t }: { transfer: TransferRow }) {
  return (
    <li className="relative border-b border-default-100 pb-3 last:border-b-0 last:pb-0">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip color={transferStatusColor(t.status)} size="sm" variant="flat">
            {transferStatusLabel(t.status)}
          </Chip>
          <p className="min-w-0 text-sm text-default-700">
            <span className="font-medium text-foreground">
              {t.fromFacility?.name ?? "—"}
            </span>
            <span aria-hidden className="mx-1.5 text-default-400">
              →
            </span>
            <span className="font-medium text-foreground">
              {t.toFacility?.name ?? "—"}
            </span>
          </p>
        </div>
        <p className="text-xs text-default-500">
          ขอเมื่อ {formatThaiDateTime(String(t.requestedAt))}
          {t.respondedAt
            ? ` · ตอบเมื่อ ${formatThaiDateTime(String(t.respondedAt))}`
            : ""}
        </p>
        {t.requestNote ? (
          <p className="text-sm text-default-600">
            <span className="text-default-500">หมายเหตุขอ:</span>{" "}
            {t.requestNote}
          </p>
        ) : null}
        {t.responseNote ? (
          <p className="text-sm text-default-600">
            <span className="text-default-500">หมายเหตุตอบ:</span>{" "}
            {t.responseNote}
          </p>
        ) : null}
      </div>
    </li>
  );
}

type Props = {
  data: QuestionsData;
  viewerFacilityId?: string | null;
  onAccept: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onCancel: (reason: string) => Promise<void>;
  busy?: boolean;
  /** pending = banner + actions; history = ประวัติพับได้; all = ทั้งคู่ */
  section?: "pending" | "history" | "all";
};

export function CaseTransferPanel({
  data,
  viewerFacilityId,
  onAccept,
  onReject,
  onCancel,
  busy = false,
  section = "all",
}: Props) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const isPending = data.caseStatus === "TRANSFER_PENDING";
  const transfers = data.transfers ?? [];
  const showPending = section === "pending" || section === "all";
  const showHistory = section === "history" || section === "all";
  const showModals = showPending;

  let role: TransferRole = "viewer";

  if (
    viewerFacilityId &&
    data.transferToFacilityId &&
    viewerFacilityId === data.transferToFacilityId
  ) {
    role = "destination";
  } else if (
    viewerFacilityId &&
    data.healthcareFacilityId &&
    viewerFacilityId === data.healthcareFacilityId
  ) {
    role = "source";
  }

  const targetName =
    data.transferToFacility?.name ?? data.transferToFacilityId ?? "—";
  const ownerName =
    data.healthcareFacility?.name ?? data.healthcareFacilityId ?? "—";

  const hasMoreTransfers = transfers.length > 1;
  const listedTransfers = historyOpen ? transfers : transfers.slice(0, 1);

  return (
    <div className="flex flex-col gap-3">
      {showPending && isPending && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 px-3 py-3 dark:border-warning-400/40 dark:bg-warning-400/10">
          <p className="text-sm font-semibold text-warning-700 dark:text-warning-300">
            อยู่ระหว่างส่งต่อ
          </p>
          <p className="mt-1 text-sm text-default-700">
            {role === "destination"
              ? `รับคำขอจาก「${ownerName}」`
              : `กำลังส่งต่อไปยัง「${targetName}」`}
          </p>
          {data.transferNote ? (
            <p className="mt-1 text-sm text-default-600">
              หมายเหตุ: {data.transferNote}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {role === "destination" && (
              <>
                <Button
                  color="success"
                  isDisabled={busy}
                  isLoading={busy}
                  size="md"
                  variant="solid"
                  onPress={() => void onAccept()}
                >
                  รับส่งต่อ
                </Button>
                <Button
                  color="danger"
                  isDisabled={busy}
                  size="md"
                  variant="bordered"
                  onPress={() => {
                    setReason("");
                    setRejectOpen(true);
                  }}
                >
                  ปฏิเสธ
                </Button>
              </>
            )}
            {role === "source" && (
              <Button
                color="warning"
                isDisabled={busy}
                size="md"
                variant="bordered"
                onPress={() => {
                  setReason("");
                  setCancelOpen(true);
                }}
              >
                ยกเลิกคำขอส่งต่อ
              </Button>
            )}
          </div>
        </div>
      )}

      {showHistory && transfers.length > 0 && (
        <div className="rounded-lg border border-default-200 px-3 py-3">
          {hasMoreTransfers ? (
            <button
              aria-expanded={historyOpen}
              className="flex w-full items-center justify-between gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
            >
              <div className="flex min-w-0 items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  ประวัติการส่งต่อ
                </p>
                <Chip size="sm" variant="flat">
                  {transfers.length}
                </Chip>
              </div>
              <ChevronDownIcon
                className={`h-4 w-4 shrink-0 text-default-400 transition-transform ${
                  historyOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                ประวัติการส่งต่อ
              </p>
              <Chip size="sm" variant="flat">
                {transfers.length}
              </Chip>
            </div>
          )}

          <ul className="mt-2 flex flex-col gap-3">
            {listedTransfers.map((t) => (
              <TransferHistoryItem key={t.id} transfer={t} />
            ))}
          </ul>

          {!historyOpen && hasMoreTransfers && (
            <button
              className="mt-2 text-xs text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary"
              type="button"
              onClick={() => setHistoryOpen(true)}
            >
              ดูทั้งหมด ({transfers.length})
            </button>
          )}
        </div>
      )}

      {showModals && (
        <>
          <Modal
            isOpen={rejectOpen}
            placement="center"
            onClose={() => setRejectOpen(false)}
          >
            <ModalContent>
              <ModalHeader>ปฏิเสธการส่งต่อ</ModalHeader>
              <ModalBody>
                <Textarea
                  isRequired
                  label="เหตุผลการปฏิเสธ"
                  labelPlacement="outside"
                  minRows={3}
                  placeholder="กรุณาระบุเหตุผล"
                  value={reason}
                  variant="bordered"
                  onChange={(e) => setReason(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => setRejectOpen(false)}>
                  ปิด
                </Button>
                <Button
                  color="danger"
                  isDisabled={busy || !reason.trim()}
                  isLoading={busy}
                  onPress={() => {
                    void (async () => {
                      await onReject(reason.trim());
                      setRejectOpen(false);
                    })();
                  }}
                >
                  ยืนยันปฏิเสธ
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal
            isOpen={cancelOpen}
            placement="center"
            onClose={() => setCancelOpen(false)}
          >
            <ModalContent>
              <ModalHeader>ยกเลิกคำขอส่งต่อ</ModalHeader>
              <ModalBody>
                <Textarea
                  isRequired
                  label="เหตุผลการยกเลิก"
                  labelPlacement="outside"
                  minRows={3}
                  placeholder="กรุณาระบุเหตุผล"
                  value={reason}
                  variant="bordered"
                  onChange={(e) => setReason(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => setCancelOpen(false)}>
                  ปิด
                </Button>
                <Button
                  color="warning"
                  isDisabled={busy || !reason.trim()}
                  isLoading={busy}
                  onPress={() => {
                    void (async () => {
                      await onCancel(reason.trim());
                      setCancelOpen(false);
                    })();
                  }}
                >
                  ยืนยันยกเลิก
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      )}
    </div>
  );
}
