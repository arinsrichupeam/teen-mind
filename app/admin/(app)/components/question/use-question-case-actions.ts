"use client";

import { useCallback, useState } from "react";
import { addToast } from "@heroui/react";

import { claimCaseIfPending } from "@/lib/claim-case";
import { QuestionsData } from "@/types";

type UseQuestionCaseActionsArgs = {
  caseId?: string;
  caseStatus?: string | null;
  canClaimCase: boolean;
  profileId?: string;
  citizenId?: string;
  hn?: string | null;
  nhsoRights?: {
    mainInsclCode?: string | null;
    mainInsclName?: string | null;
    subInsclCode?: string | null;
    subInsclName?: string | null;
    hmainCode?: string | null;
    hmainName?: string | null;
    hsubCode?: string | null;
    hsubName?: string | null;
    nhsoVerifiedAt?: string | Date | null;
  };
  onData: (updater: (prev: QuestionsData) => QuestionsData) => void;
  setQuestionDataDirect: (data: QuestionsData) => void;
  fallbackData: QuestionsData;
};

export function useQuestionCaseActions({
  caseId,
  caseStatus,
  canClaimCase,
  profileId,
  citizenId,
  hn,
  nhsoRights,
  onData,
  setQuestionDataDirect,
  fallbackData,
}: UseQuestionCaseActionsArgs) {
  const [hnLoading, setHnLoading] = useState(false);
  const [nhsoLoading, setNhsoLoading] = useState(false);
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [closeCaseLoading, setCloseCaseLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      if (!caseId) return;

      const response = await fetch(`/api/question/${caseId}`);

      if (response.ok) {
        const updatedData = await response.json();

        if (updatedData) {
          setQuestionDataDirect(
            Array.isArray(updatedData) ? updatedData[0] : updatedData
          );
        }
      } else {
        setQuestionDataDirect(fallbackData);
      }
    } catch (err) {
      setQuestionDataDirect(fallbackData);
      addToast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการดึงข้อมูลล่าสุด",
        color: "danger",
      });
    }
  }, [caseId, fallbackData, setQuestionDataDirect]);

  const runClaim = useCallback(async (): Promise<boolean> => {
    if (!caseId) return false;
    if (caseStatus !== "PENDING") return true;
    if (!canClaimCase) {
      addToast({
        color: "warning",
        title: "รับเคสได้เฉพาะ Consult",
        description: "บัญชี Admin ไม่สามารถรับเคสได้",
        timeout: 4000,
      });

      return false;
    }

    setClaimLoading(true);
    try {
      const result = await claimCaseIfPending(caseId, caseStatus);

      if (!result.ok) {
        addToast({
          color: "danger",
          title: "รับเคสไม่สำเร็จ",
          description: result.error ?? "เกิดข้อผิดพลาด",
          timeout: 4000,
        });

        return false;
      }

      if (result.claimed) {
        onData((prev) => ({
          ...prev,
          caseStatus: "IN_PROGRESS",
        }));
        await refresh();
        addToast({
          color: "success",
          title: "รับเคสแล้ว",
          description: "เริ่มบันทึกการให้คำปรึกษาได้เลย",
          timeout: 3000,
        });
      }

      return true;
    } finally {
      setClaimLoading(false);
    }
  }, [caseId, caseStatus, canClaimCase, onData, refresh]);

  const changeHn = useCallback(async () => {
    if (!profileId) {
      addToast({
        title: "Error",
        description: "ไม่พบโปรไฟล์สำหรับบันทึก HN",
        color: "danger",
      });

      return;
    }

    setHnLoading(true);
    try {
      const response = await fetch("/api/profile/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: profileId, hn }),
      });

      if (!response.ok) {
        throw new Error("เกิดข้อผิดพลาดในการบันทึก HN");
      }

      await refresh();
      addToast({
        title: "สำเร็จ",
        description: "บันทึก HN สำเร็จ",
        color: "success",
      });
    } catch (err) {
      addToast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก HN",
        color: "danger",
      });
    } finally {
      setHnLoading(false);
    }
  }, [profileId, hn, refresh]);

  const applyNhsoDraft = useCallback(
    (
      prev: QuestionsData,
      rights: {
        mainInsclCode?: string | null;
        mainInsclName?: string | null;
        subInsclCode?: string | null;
        subInsclName?: string | null;
        hmainCode?: string | null;
        hmainName?: string | null;
        hsubCode?: string | null;
        hsubName?: string | null;
        nhsoVerifiedAt?: string | Date | null;
      }
    ): QuestionsData => ({
      ...prev,
      nhsoDraft: {
        mainInsclCode: rights.mainInsclCode ?? null,
        mainInsclName: rights.mainInsclName ?? null,
        subInsclCode: rights.subInsclCode ?? null,
        subInsclName: rights.subInsclName ?? null,
        hmainCode: rights.hmainCode ?? null,
        hmainName: rights.hmainName ?? null,
        hsubCode: rights.hsubCode ?? null,
        hsubName: rights.hsubName ?? null,
        nhsoVerifiedAt: rights.nhsoVerifiedAt ?? null,
      },
    }),
    []
  );

  const changeNhsoRights = useCallback(async () => {
    if (!profileId) {
      addToast({
        title: "Error",
        description: "ไม่พบโปรไฟล์สำหรับบันทึกสิทธิ",
        color: "danger",
      });

      return;
    }

    if (!nhsoRights?.mainInsclCode && !nhsoRights?.mainInsclName) {
      addToast({
        title: "แจ้งเตือน",
        description: "กรุณาค้นหาสิทธิจาก สปสช. ก่อนบันทึก",
        color: "warning",
      });

      return;
    }

    setNhsoLoading(true);
    try {
      const response = await fetch("/api/profile/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: profileId,
          mainInsclCode: nhsoRights.mainInsclCode ?? null,
          mainInsclName: nhsoRights.mainInsclName ?? null,
          subInsclCode: nhsoRights.subInsclCode ?? null,
          subInsclName: nhsoRights.subInsclName ?? null,
          hmainCode: nhsoRights.hmainCode ?? null,
          hmainName: nhsoRights.hmainName ?? null,
          hsubCode: nhsoRights.hsubCode ?? null,
          hsubName: nhsoRights.hsubName ?? null,
          nhsoVerifiedAt: nhsoRights.nhsoVerifiedAt
            ? new Date(nhsoRights.nhsoVerifiedAt).toISOString()
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error("เกิดข้อผิดพลาดในการบันทึกสิทธิ");
      }

      await refresh();
      addToast({
        title: "สำเร็จ",
        description: "บันทึกสิทธิสำเร็จ",
        color: "success",
      });
    } catch (err) {
      addToast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกสิทธิ",
        color: "danger",
      });
    } finally {
      setNhsoLoading(false);
    }
  }, [profileId, nhsoRights, refresh]);

  type LookupOutcome =
    | { status: "ok"; label: string }
    | { status: "not_found"; message: string }
    | { status: "error"; message: string };

  /** ค้นหา + บันทึก HN / สิทธิ กดครั้งเดียว (รันคู่ขนาน) */
  const searchAndSaveLookups = useCallback(
    async (opts: { hn?: boolean; nhso?: boolean }) => {
      const doHn = Boolean(opts.hn);
      const doNhso = Boolean(opts.nhso);

      if (!doHn && !doNhso) return;

      const card = (citizenId || "").trim();

      if (!card) {
        addToast({
          title: "ไม่พบเลขบัตรประชาชน",
          description: "กรุณาตรวจสอบข้อมูลเลขบัตรประชาชนก่อนค้นหา",
          color: "warning",
        });

        return;
      }

      if (doHn) setHnLoading(true);
      if (doNhso) setNhsoLoading(true);

      try {
        const runHn = async (): Promise<LookupOutcome> => {
          const response = await fetch("/api/his/patient", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cardno: card }),
          });
          const payload = (await response.json()) as {
            error?: string;
            hn?: string;
          };

          if (!response.ok) {
            return {
              status: "error",
              message: payload.error || "เกิดข้อผิดพลาดในการค้นหา HN",
            };
          }

          const foundHn = payload.hn?.trim();

          if (!foundHn) {
            return {
              status: "not_found",
              message: `ไม่พบ HN จากเลขบัตร ${card}`,
            };
          }

          onData((prev) => ({ ...prev, hn: foundHn }));

          if (profileId) {
            const saveResponse = await fetch("/api/profile/user", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: profileId, hn: foundHn }),
            });

            if (!saveResponse.ok) {
              return {
                status: "error",
                message: "พบ HN แล้ว แต่บันทึกลงโปรไฟล์ไม่สำเร็จ",
              };
            }
          }

          return { status: "ok", label: foundHn };
        };

        const runNhso = async (): Promise<LookupOutcome> => {
          const response = await fetch("/api/profile/nhso", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              profileId ? { profileId } : { citizenId: card }
            ),
          });
          const payload = (await response.json()) as {
            error?: string;
            nhsoResult?: {
              mainInsclCode?: string;
              mainInsclName?: string;
              subInsclCode?: string;
              subInsclName?: string;
              hmainCode?: string;
              hmainName?: string;
              hsubCode?: string;
              hsubName?: string;
              verifiedAt?: string;
            };
          };

          if (!response.ok || !payload.nhsoResult) {
            const message =
              payload.error || "เกิดข้อผิดพลาดในการค้นหาสิทธิจาก สปสช.";

            if (response.status === 404) {
              return { status: "not_found", message };
            }

            return { status: "error", message };
          }

          const result = payload.nhsoResult;
          const rightsLabel =
            result.mainInsclName?.trim() ||
            result.mainInsclCode?.trim() ||
            "พบข้อมูลสิทธิ";

          onData((prev) =>
            applyNhsoDraft(prev, {
              mainInsclCode: result.mainInsclCode ?? null,
              mainInsclName: result.mainInsclName ?? null,
              subInsclCode: result.subInsclCode ?? null,
              subInsclName: result.subInsclName ?? null,
              hmainCode: result.hmainCode ?? null,
              hmainName: result.hmainName ?? null,
              hsubCode: result.hsubCode ?? null,
              hsubName: result.hsubName ?? null,
              nhsoVerifiedAt: result.verifiedAt ?? null,
            })
          );

          return { status: "ok", label: rightsLabel };
        };

        const [hnOutcome, nhsoOutcome] = await Promise.all([
          doHn ? runHn() : Promise.resolve(null),
          doNhso ? runNhso() : Promise.resolve(null),
        ]);

        const anyOk =
          hnOutcome?.status === "ok" || nhsoOutcome?.status === "ok";

        if (profileId && anyOk) {
          await refresh();
        }

        const parts: string[] = [];

        if (hnOutcome?.status === "ok") {
          parts.push(`HN: ${hnOutcome.label}`);
        }
        if (nhsoOutcome?.status === "ok") {
          parts.push(`สิทธิ: ${nhsoOutcome.label}`);
        }

        if (anyOk) {
          addToast({
            title: profileId ? "ค้นหาและบันทึกสำเร็จ" : "ค้นหาสำเร็จ",
            description: parts.join(" · "),
            color: "success",
          });
        }

        const failures = [hnOutcome, nhsoOutcome].filter(
          (o): o is Extract<LookupOutcome, { status: "error" | "not_found" }> =>
            o != null && (o.status === "error" || o.status === "not_found")
        );

        for (const failure of failures) {
          addToast({
            title: failure.status === "not_found" ? "ไม่พบข้อมูล" : "Error",
            description: failure.message,
            color: failure.status === "not_found" ? "warning" : "danger",
          });
        }
      } catch (err) {
        addToast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการค้นหา",
          color: "danger",
        });
      } finally {
        if (doHn) setHnLoading(false);
        if (doNhso) setNhsoLoading(false);
      }
    },
    [citizenId, profileId, onData, applyNhsoDraft, refresh]
  );

  const searchHn = useCallback(
    () => searchAndSaveLookups({ hn: true }),
    [searchAndSaveLookups]
  );

  const searchNhsoRights = useCallback(
    () => searchAndSaveLookups({ nhso: true }),
    [searchAndSaveLookups]
  );
  const sendConsultMessage = useCallback(async () => {
    if (!caseId) {
      addToast({
        title: "Error",
        description: "ไม่พบรหัสเคสสำหรับส่งข้อความ",
        color: "danger",
      });

      return;
    }

    setSendMessageLoading(true);
    try {
      const res = await fetch("/api/question/send-consult-message", {
        method: "POST",
        body: JSON.stringify({ questionId: caseId }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof result?.error === "string"
            ? result.error
            : "ไม่สามารถส่งข้อความ LINE ได้"
        );
      }

      addToast({
        title: "สำเร็จ",
        description: "ส่งข้อความรับคำปรึกษาไปยังผู้ใช้แล้ว",
        color: "success",
      });
    } catch (err) {
      addToast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งข้อความ",
        color: "danger",
      });
    } finally {
      setSendMessageLoading(false);
    }
  }, [caseId]);

  const closeCase = useCallback(
    async (reason: string): Promise<boolean> => {
      if (!caseId) {
        addToast({
          title: "Error",
          description: "ไม่พบข้อมูลคำถาม",
          color: "danger",
        });

        return false;
      }

      const trimmed = reason.trim();

      if (!trimmed) {
        addToast({
          title: "แจ้งเตือน",
          description: "กรุณาระบุเหตุผลการปิดเคสก่อนยืนยัน",
          color: "warning",
        });

        return false;
      }

      setCloseCaseLoading(true);
      try {
        const closeResponse = await fetch(`/api/case/${caseId}/close`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: trimmed }),
        });
        const closeResult = await closeResponse.json().catch(() => ({}));

        if (!closeResponse.ok || closeResult?.success === false) {
          throw new Error(closeResult?.error || "ไม่สามารถปิดเคสได้");
        }

        await refresh();
        onData((prev) => ({
          ...prev,
          status: 3,
          caseStatus: "CLOSED",
          close_case_reason: trimmed,
        }));

        addToast({
          title: "ปิดเคสสำเร็จ",
          description: "เคสถูกปิดแล้ว",
          color: "success",
        });

        return true;
      } catch (err) {
        addToast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการปิดเคส",
          color: "danger",
        });

        return false;
      } finally {
        setCloseCaseLoading(false);
      }
    },
    [caseId, onData, refresh]
  );

  const requestTransfer = useCallback(
    async (toFacilityId: string, note: string): Promise<boolean> => {
      if (!caseId) {
        addToast({
          title: "Error",
          description: "ไม่พบรหัสเคส",
          color: "danger",
        });

        return false;
      }

      const trimmedNote = note.trim();

      if (!toFacilityId) {
        addToast({
          title: "แจ้งเตือน",
          description: "เลือกหน่วยงานปลายทางก่อนส่งต่อ",
          color: "warning",
        });

        return false;
      }

      if (!trimmedNote) {
        addToast({
          title: "แจ้งเตือน",
          description: "กรุณาระบุหมายเหตุการส่งต่อ",
          color: "warning",
        });

        return false;
      }

      setTransferLoading(true);
      try {
        const res = await fetch(`/api/case/${caseId}/transfer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toFacilityId, note: trimmedNote }),
        });
        const result = await res.json().catch(() => ({}));

        if (!res.ok || result?.success === false) {
          throw new Error(result?.error || "ส่งต่อเคสไม่สำเร็จ");
        }

        await refresh();
        addToast({
          title: "ส่งต่อแล้ว",
          description: "รอหน่วยงานปลายทางตอบรับ",
          color: "success",
        });

        return true;
      } catch (err) {
        addToast({
          title: "ส่งต่อไม่สำเร็จ",
          description: err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
          color: "danger",
        });

        return false;
      } finally {
        setTransferLoading(false);
      }
    },
    [caseId, refresh]
  );

  const acceptTransfer = useCallback(async (): Promise<boolean> => {
    if (!caseId) return false;

    setTransferLoading(true);
    try {
      const res = await fetch(`/api/case/${caseId}/transfer/accept`, {
        method: "POST",
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok || result?.success === false) {
        throw new Error(result?.error || "รับส่งต่อไม่สำเร็จ");
      }

      await refresh();
      addToast({
        title: "รับส่งต่อแล้ว",
        description: "กรุณาเคลมเคสก่อนดำเนินการ",
        color: "success",
        timeout: 5000,
      });

      return true;
    } catch (err) {
      addToast({
        title: "รับส่งต่อไม่สำเร็จ",
        description: err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
        color: "danger",
      });

      return false;
    } finally {
      setTransferLoading(false);
    }
  }, [caseId, refresh]);

  const rejectTransfer = useCallback(
    async (responseNote: string): Promise<boolean> => {
      if (!caseId) return false;

      const trimmed = responseNote.trim();

      if (!trimmed) {
        addToast({
          title: "แจ้งเตือน",
          description: "กรุณาระบุเหตุผลการปฏิเสธ",
          color: "warning",
        });

        return false;
      }

      setTransferLoading(true);
      try {
        const res = await fetch(`/api/case/${caseId}/transfer/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ responseNote: trimmed }),
        });
        const result = await res.json().catch(() => ({}));

        if (!res.ok || result?.success === false) {
          throw new Error(result?.error || "ปฏิเสธการส่งต่อไม่สำเร็จ");
        }

        await refresh();
        addToast({
          title: "ปฏิเสธการส่งต่อแล้ว",
          description: "เคสกลับไปที่หน่วยงานต้นทาง",
          color: "success",
        });

        return true;
      } catch (err) {
        addToast({
          title: "ปฏิเสธไม่สำเร็จ",
          description: err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
          color: "danger",
        });

        return false;
      } finally {
        setTransferLoading(false);
      }
    },
    [caseId, refresh]
  );

  const cancelTransfer = useCallback(
    async (responseNote: string): Promise<boolean> => {
      if (!caseId) return false;

      const trimmed = responseNote.trim();

      if (!trimmed) {
        addToast({
          title: "แจ้งเตือน",
          description: "กรุณาระบุเหตุผลการยกเลิก",
          color: "warning",
        });

        return false;
      }

      setTransferLoading(true);
      try {
        const res = await fetch(`/api/case/${caseId}/transfer/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ responseNote: trimmed }),
        });
        const result = await res.json().catch(() => ({}));

        if (!res.ok || result?.success === false) {
          throw new Error(result?.error || "ยกเลิกการส่งต่อไม่สำเร็จ");
        }

        await refresh();
        addToast({
          title: "ยกเลิกคำขอส่งต่อแล้ว",
          description: "เคสกลับสู่สถานะกำลังดูแล",
          color: "success",
        });

        return true;
      } catch (err) {
        addToast({
          title: "ยกเลิกไม่สำเร็จ",
          description: err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
          color: "danger",
        });

        return false;
      } finally {
        setTransferLoading(false);
      }
    },
    [caseId, refresh]
  );

  return {
    hnLoading,
    nhsoLoading,
    sendMessageLoading,
    claimLoading,
    closeCaseLoading,
    transferLoading,
    refresh,
    runClaim,
    changeHn,
    searchHn,
    changeNhsoRights,
    searchNhsoRights,
    searchAndSaveLookups,
    sendConsultMessage,
    closeCase,
    requestTransfer,
    acceptTransfer,
    rejectTransfer,
    cancelTransfer,
  };
}
