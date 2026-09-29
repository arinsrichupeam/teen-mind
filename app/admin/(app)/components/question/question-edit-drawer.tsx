"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addToast,
  Autocomplete,
  AutocompleteItem,
  Button,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Form,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tab,
  Tabs,
  Textarea,
} from "@heroui/react";

import {
  ModalEditProfile,
  type ModalEditProfileData,
} from "../modal/modal-edit-profile";

import { ConsultationCitizenHeader } from "./consultation-citizen-header";
import {
  ConsultationRoundsPanel,
  type ConsultationRoundsHandle,
  type ConsultationSaveFooterState,
} from "./consultation-rounds-panel";
import { CaseTransferPanel } from "./case-transfer-panel";
import { consultationFooterBtnClass } from "./consultation-ui";
import { QuestionDetailDrawer } from "./question-detail-drawer";
import { QuestionnaireProfileCards } from "./questionnaire-profile-cards";
import { useQuestionCaseActions } from "./use-question-case-actions";
import { useThaiGeoLookups } from "./use-thai-geo-lookups";

import { flattenTreatmentNotes } from "@/lib/case-flat";
import { mapAdminStatusToLegacyNumber } from "@/lib/legacy-value-mapping";
import {
  caseStatusChipColor,
  caseStatusLabel,
} from "@/lib/case-status-mapping";
import { resolveDrawerCaseId } from "@/lib/question-drawer-case-id";
import {
  Addon,
  Consultant,
  Phqa,
  Q8Data,
  Questions2Q,
  QuestionsData,
} from "@/types";
import { formatThaiDateTime } from "@/utils/helper";

const DRAWER_MODE_LABEL: Record<string, string> = {
  "view-consultation": "ดูการให้คำปรึกษา",
  "edit-questionnaire": "แก้ไขแบบประเมิน",
  "edit-consultation": "บันทึกการให้คำปรึกษา",
};

function toModalEditProfileData(
  row: QuestionsData | undefined | null
): ModalEditProfileData {
  const profile = row?.profile;

  return {
    profile: profile
      ? {
          ...profile,
          prefixId:
            typeof profile.prefixId === "string"
              ? parseInt(profile.prefixId, 10) || undefined
              : profile.prefixId,
        }
      : undefined,
    caseHealthcareFacility: row?.healthcareFacility ?? null,
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: QuestionsData;
  mode: string;
  /** Consult-only claim; when false, skip claim CTA / auto-claim */
  canClaimCase?: boolean;
  /** Home facility of current admin — for transfer source/destination actions */
  viewerFacilityId?: string | null;
}

const ConsultantInitValue: Consultant[] = [{ id: "", name: "" }];

export const QuestionEditDrawer = ({
  isOpen,
  onClose,
  data,
  mode,
  canClaimCase = false,
  viewerFacilityId = null,
}: Props) => {
  const { provinces, districts, subdistricts, formatAddress } =
    useThaiGeoLookups();
  const [consultants, setConsultants] =
    useState<Consultant[]>(ConsultantInitValue);
  const [questionData, setQuestionData] = useState<QuestionsData>(data);
  const [questionnaireLoading, setQuestionnaireLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCloseCaseModalOpen, setIsCloseCaseModalOpen] = useState(false);
  const [closeCaseReason, setCloseCaseReason] = useState("");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFacilityId, setTransferFacilityId] = useState<string>("");
  const [transferNote, setTransferNote] = useState("");
  const [transferFacilities, setTransferFacilities] = useState<
    { id: string; name: string }[]
  >([]);
  const [transferFacilitiesLoading, setTransferFacilitiesLoading] =
    useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [consultationMobilePane, setConsultationMobilePane] = useState<
    "assessment" | "consultation"
  >("consultation");
  const [consultationProfileExpanded, setConsultationProfileExpanded] =
    useState(false);
  const consultationRoundsRef = useRef<ConsultationRoundsHandle>(null);
  const [consultationSaveFooter, setConsultationSaveFooter] =
    useState<ConsultationSaveFooterState>({
      visible: false,
      label: "บันทึก",
      disabled: true,
      loading: false,
      color: "primary",
      variant: "solid",
    });

  const isConsultationMode =
    mode === "edit-consultation" || mode === "view-consultation";

  // Prefer prop id — local questionData can lag one render behind when switching rows
  const caseId = resolveDrawerCaseId(data?.id, questionData?.id);
  const caseStatus = questionData?.caseStatus ?? data?.caseStatus;
  const profile = questionData?.profile ?? data?.profile;

  const actions = useQuestionCaseActions({
    caseId,
    caseStatus,
    canClaimCase,
    profileId: profile?.id,
    citizenId: profile?.citizenId,
    hn: questionData?.hn ?? profile?.hn,
    nhsoRights: questionData?.nhsoDraft ?? {
      mainInsclCode: profile?.mainInsclCode,
      mainInsclName: profile?.mainInsclName,
      subInsclCode: profile?.subInsclCode,
      subInsclName: profile?.subInsclName,
      hmainCode: profile?.hmainCode,
      hmainName: profile?.hmainName,
      hsubCode: profile?.hsubCode,
      hsubName: profile?.hsubName,
      nhsoVerifiedAt: profile?.nhsoVerifiedAt,
    },
    onData: setQuestionData,
    setQuestionDataDirect: setQuestionData,
    fallbackData: data,
  });

  const GetConsultantList = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/admin");

      if (!res.ok) throw new Error("Failed to fetch consultant list");

      const val = await res.json();
      const consult = (Array.isArray(val) ? val : []).filter(
        (x: {
          status: number | string;
          role?: { id: number };
          roleId?: number;
        }) => {
          const legacyStatus = mapAdminStatusToLegacyNumber(x.status);
          const roleId = x.role?.id ?? x.roleId;

          return legacyStatus === 1 && roleId === 3;
        }
      );

      if (consult.length > 0) {
        setConsultants(
          consult.map(
            (item: {
              id: string;
              userId?: string;
              firstName?: string;
              lastName?: string;
              firstname?: string;
              lastname?: string;
            }) => ({
              id: item.userId ?? item.id,
              name:
                [
                  item.firstName ?? item.firstname,
                  item.lastName ?? item.lastname,
                ]
                  .filter(Boolean)
                  .join(" ") || "",
            })
          )
        );
      } else {
        setConsultants([]);
      }
    } catch (err) {
      addToast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการโหลดข้อมูลที่ปรึกษา",
        color: "danger",
      });
    }
  }, []);

  const defaultConsultId =
    questionData?.assigneeUserId ??
    questionData?.assigneeAdminId ??
    data?.assigneeUserId ??
    data?.assigneeAdminId ??
    null;
  const assigneeDisplayName =
    questionData?.assigneeName ?? data?.assigneeName ?? null;
  const consultantsForPanel = useMemo(() => {
    if (!defaultConsultId) return consultants;
    if (consultants.some((c) => c.id === defaultConsultId)) return consultants;
    if (!assigneeDisplayName?.trim()) return consultants;

    return [
      ...consultants,
      { id: defaultConsultId, name: assigneeDisplayName.trim() },
    ];
  }, [consultants, defaultConsultId, assigneeDisplayName]);

  const validateQuestionnaire = useCallback(() => {
    setError(null);

    if (!questionData) {
      setError("ไม่พบข้อมูลที่จะตรวจสอบ");

      return false;
    }

    if (!questionData.q2 || questionData.q2.length === 0) {
      setError("กรุณากรอกข้อมูลแบบประเมิน 2Q");

      return false;
    }

    if (!questionData.phqa || questionData.phqa.length === 0) {
      setError("กรุณากรอกข้อมูลแบบประเมิน PHQ-A");

      return false;
    }

    if (!questionData.addon || questionData.addon.length === 0) {
      setError("กรุณากรอกข้อมูลแบบประเมิน PHQ-A Addon");

      return false;
    }

    return true;
  }, [questionData]);

  const onSubmitQuestionnaire = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateQuestionnaire()) return;

    if (!questionData?.id) {
      setError("ไม่พบข้อมูลคำถาม");

      return;
    }

    setQuestionnaireLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/question/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: questionData.id,
          q2: questionData.q2,
          phqa: questionData.phqa,
          addon: questionData.addon,
          q8: questionData.q8,
          status: questionData.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(errorData.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

      await actions.refresh();
      addToast({
        title: "Success",
        description: "บันทึกข้อมูลสำเร็จ",
        color: "success",
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
      addToast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        color: "danger",
      });
    } finally {
      setQuestionnaireLoading(false);
    }
  };

  const handleQuestionChange = (
    field: string,
    value: string | number | null | Questions2Q[] | Phqa[] | Addon[] | Q8Data[]
  ) => {
    setQuestionData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openCloseCaseModal = () => {
    setCloseCaseReason(questionData?.close_case_reason ?? "");
    setIsCloseCaseModalOpen(true);
  };

  const handleCloseCase = async () => {
    const ok = await actions.closeCase(closeCaseReason);

    if (ok) setIsCloseCaseModalOpen(false);
  };

  const openTransferModal = async () => {
    setTransferFacilityId("");
    setTransferNote("");
    setIsTransferModalOpen(true);
    setTransferFacilitiesLoading(true);
    try {
      const res = await fetch("/api/data/healthcare-facility");

      if (!res.ok) throw new Error("โหลดรายการหน่วยงานไม่สำเร็จ");
      const rows = (await res.json()) as { id: string; name: string }[];

      setTransferFacilities(Array.isArray(rows) ? rows : []);
    } catch (err) {
      addToast({
        title: "โหลดหน่วยงานไม่สำเร็จ",
        description: err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
        color: "danger",
      });
      setTransferFacilities([]);
    } finally {
      setTransferFacilitiesLoading(false);
    }
  };

  const handleTransferSubmit = async () => {
    if (!transferFacilityId) {
      addToast({
        title: "กรุณาเลือกหน่วยงาน",
        description: "เลือกหน่วยงานปลายทางก่อนส่งต่อ",
        color: "warning",
      });

      return;
    }

    if (!transferNote.trim()) {
      addToast({
        title: "กรุณาระบุหมายเหตุ",
        description: "ต้องระบุหมายเหตุการส่งต่อ",
        color: "warning",
      });

      return;
    }

    const ok = await actions.requestTransfer(
      transferFacilityId,
      transferNote.trim()
    );

    if (ok) {
      setIsTransferModalOpen(false);
      setTransferFacilityId("");
      setTransferNote("");
    }
  };

  useEffect(() => {
    void GetConsultantList();
  }, [GetConsultantList]);

  useEffect(() => {
    if (isOpen && data) {
      setModalKey((prev) => prev + 1);
    }
  }, [isOpen, data?.id]);

  useEffect(() => {
    if (!isOpen) {
      setIsCloseCaseModalOpen(false);
      setCloseCaseReason("");
      setIsTransferModalOpen(false);
      setTransferFacilityId("");
      setTransferNote("");
    } else {
      setConsultationMobilePane("consultation");
      setConsultationProfileExpanded(false);
    }
  }, [isOpen]);

  // Sync local draft immediately when the selected case changes (before refresh)
  useEffect(() => {
    if (isOpen && data) {
      setQuestionData(data);
      setError(null);
    } else if (!isOpen) {
      setError(null);
    }
  }, [isOpen, data?.id]);

  useEffect(() => {
    if (!isOpen || !data?.id) return;

    const openCaseId = data.id;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/question/${openCaseId}`);

          if (!response.ok) return;
          const updatedData = await response.json();

          if (!updatedData) return;
          const next = Array.isArray(updatedData)
            ? updatedData[0]
            : updatedData;

          // Ignore late responses from a previously opened case
          if (next?.id && next.id !== openCaseId) return;
          setQuestionData(next);
        } catch {
          // Keep prop snapshot; toast only on explicit user actions
        }
      })();
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, data?.id]);

  if (!isOpen) return null;

  const address =
    questionData?.profile?.address?.[0] ?? data?.profile?.address?.[0];
  const addressLine = formatAddress(address);
  const districtName =
    districts.find((x) => x.id == address?.districtId)?.nameInThai || "";
  const provinceName =
    provinces.find((x) => x.id == address?.provinceId)?.nameInThai || "";
  const subdistrictName =
    subdistricts.find((x) => x.id == address?.subdistrictId)?.nameInThai || "";

  const renderCloseCaseReasonBlock = (row: QuestionsData) => {
    const closeReasonText = (row.close_case_reason ?? "").trim();

    if (!closeReasonText) return null;

    return (
      <div className="mt-4 rounded-medium border border-default-200 bg-content2/40 p-4">
        <p className="mb-2 text-small font-semibold text-foreground-600">
          เหตุผลการปิดเคส
        </p>
        <p className="text-small whitespace-pre-wrap text-default-600">
          {closeReasonText}
        </p>
      </div>
    );
  };

  return (
    <>
      <Drawer
        key={`drawer-${data?.id || "default"}-${modalKey}`}
        hideCloseButton
        classNames={{
          wrapper: "z-40",
          backdrop: "z-30",
          base: isConsultationMode ? "w-full max-w-full" : undefined,
        }}
        isKeyboardDismissDisabled={true}
        isOpen={isOpen}
        placement="right"
        size={isConsultationMode ? "full" : "5xl"}
        onClose={onClose}
      >
        <DrawerContent className="flex h-full max-h-[100dvh] flex-col">
          {(drawerClose) => (
            <Form
              className="flex h-full min-h-0 flex-1 flex-col"
              onReset={drawerClose}
              onSubmit={onSubmitQuestionnaire}
            >
              <DrawerHeader className="w-full shrink-0 border-b border-default-200 px-4 py-3 sm:px-6">
                <div className="flex w-full flex-col gap-2 text-sm lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    {!isConsultationMode && (
                      <span className="font-semibold text-foreground">
                        {DRAWER_MODE_LABEL[mode] ?? mode}
                      </span>
                    )}
                    <span className="text-default-500">
                      สร้างเคส{" "}
                      <span className="font-medium text-foreground">
                        {formatThaiDateTime(
                          questionData?.createdAt || (data?.createdAt as string)
                        )}
                      </span>
                    </span>
                    {(questionData?.assigneeName ?? data?.assigneeName) && (
                      <span className="text-default-500">
                        ผู้ดูแล:{" "}
                        <span className="font-medium text-foreground">
                          {questionData?.assigneeName ?? data?.assigneeName}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip
                      color={caseStatusChipColor(
                        questionData?.caseStatus ?? data?.caseStatus
                      )}
                      size="sm"
                      variant="flat"
                    >
                      <span className="text-xs font-semibold">
                        {(() => {
                          const cs =
                            questionData?.caseStatus ?? data?.caseStatus;

                          return cs ? caseStatusLabel(cs) : "—";
                        })()}
                      </span>
                    </Chip>
                    {(() => {
                      const result =
                        questionData?.result || data?.result || null;

                      if (!result || result === "INCOMPLETE") return null;

                      const resultLabel =
                        (
                          {
                            Green: "ไม่พบความเสี่ยง",
                            "Green-Low": "พบความเสี่ยงเล็กน้อย",
                            Yellow: "พบความเสี่ยงปานกลาง",
                            Orange: "พบความเสี่ยงมาก",
                            Red: "พบความเสี่ยงรุนแรง",
                            NEGATIVE: "ไม่พบความเสี่ยง",
                            POSITIVE_LOW: "พบความเสี่ยงเล็กน้อย",
                            POSITIVE_MODERATE: "พบความเสี่ยงปานกลาง",
                            POSITIVE_HIGH: "พบความเสี่ยงมาก",
                            POSITIVE_SEVERE: "พบความเสี่ยงรุนแรง",
                          } as Record<string, string>
                        )[String(result)] ?? String(result);

                      const color =
                        result === "Green" ||
                        result === "Green-Low" ||
                        result === "NEGATIVE" ||
                        result === "POSITIVE_LOW"
                          ? "success"
                          : result === "Yellow" ||
                              result === "POSITIVE_MODERATE"
                            ? "warning"
                            : result === "Orange" || result === "POSITIVE_HIGH"
                              ? "warning"
                              : "danger";

                      return (
                        <Chip color={color} size="sm" variant="flat">
                          <span className="text-xs font-medium">
                            {resultLabel}
                          </span>
                        </Chip>
                      );
                    })()}
                  </div>
                </div>
              </DrawerHeader>
              {error && (
                <div className="px-4 py-2 bg-red-100 text-red-700 rounded-md mx-4">
                  {error}
                </div>
              )}
              <DrawerBody
                className={
                  isConsultationMode
                    ? "flex min-h-0 flex-1 basis-0 flex-col overflow-hidden p-0"
                    : "overflow-y-auto"
                }
              >
                {isConsultationMode ? (
                  <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="shrink-0 border-b border-default-200 px-3 py-2 lg:hidden">
                      <Tabs
                        fullWidth
                        aria-label="สลับแผงแบบประเมินและคำปรึกษา"
                        classNames={{
                          tabList: "gap-1.5 p-1.5",
                          tab: "h-9 text-sm",
                          tabContent: "text-sm font-medium",
                        }}
                        selectedKey={consultationMobilePane}
                        size="md"
                        onSelectionChange={(key) =>
                          setConsultationMobilePane(
                            key as "assessment" | "consultation"
                          )
                        }
                      >
                        <Tab key="assessment" title="แบบประเมิน" />
                        <Tab key="consultation" title="คำปรึกษา" />
                      </Tabs>
                    </div>

                    <div className="consultation-split-panes grid min-h-0 flex-1 grid-cols-1 overflow-hidden">
                      <aside
                        className={
                          consultationMobilePane === "assessment"
                            ? "consultation-split-pane flex min-h-0 min-w-0 flex-col overflow-hidden border-default-200 bg-content2/30 lg:border-r"
                            : "consultation-split-pane hidden min-h-0 min-w-0 flex-col overflow-hidden border-default-200 bg-content2/30 lg:flex lg:border-r"
                        }
                      >
                        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-4">
                          <QuestionDetailDrawer data={questionData || data} />
                        </div>
                      </aside>

                      <section
                        className={
                          consultationMobilePane === "consultation"
                            ? "consultation-split-pane flex min-h-0 min-w-0 flex-col overflow-hidden bg-content1"
                            : "consultation-split-pane hidden min-h-0 min-w-0 flex-col overflow-hidden bg-content1 lg:flex"
                        }
                      >
                        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                          <ConsultationCitizenHeader
                            addressLine={addressLine}
                            data={data}
                            expanded={consultationProfileExpanded}
                            hnLoading={actions.hnLoading}
                            mode={mode}
                            nhsoLoading={actions.nhsoLoading}
                            questionData={questionData}
                            sendMessageLoading={actions.sendMessageLoading}
                            onEditProfile={() => setIsModalOpen(true)}
                            onHnChange={(value) =>
                              setQuestionData((prev) => ({
                                ...prev,
                                hn: value,
                              }))
                            }
                            onNhsoChange={(value) =>
                              setQuestionData((prev) => ({
                                ...prev,
                                nhsoDraft: {
                                  ...(prev.nhsoDraft ?? {}),
                                  mainInsclName: value,
                                  mainInsclCode:
                                    prev.nhsoDraft?.mainInsclCode ?? null,
                                },
                              }))
                            }
                            onSaveHn={() => void actions.changeHn()}
                            onSaveNhso={() => void actions.changeNhsoRights()}
                            onSearchAndSave={(opts) =>
                              void actions.searchAndSaveLookups(opts)
                            }
                            onSendLine={() => void actions.sendConsultMessage()}
                            onToggleExpanded={() =>
                              setConsultationProfileExpanded((v) => !v)
                            }
                          />

                          <div className="flex flex-col gap-4 px-3 py-4 sm:px-5">
                            <CaseTransferPanel
                              busy={actions.transferLoading}
                              data={questionData || data}
                              section="pending"
                              viewerFacilityId={viewerFacilityId}
                              onAccept={async () => {
                                await actions.acceptTransfer();
                              }}
                              onCancel={async (reason) => {
                                await actions.cancelTransfer(reason);
                              }}
                              onReject={async (reason) => {
                                await actions.rejectTransfer(reason);
                              }}
                            />
                            {(() => {
                              const q = questionData ?? data;
                              const statusVal = q?.status ?? data?.status;
                              const cs =
                                q?.caseStatus ?? data?.caseStatus ?? null;
                              const needsClaim = cs === "PENDING";
                              const isClosed = cs === "CLOSED";
                              const isTransferPending =
                                cs === "TRANSFER_PENDING";
                              const consultationReadOnly =
                                mode === "view-consultation" ||
                                isClosed ||
                                isTransferPending;
                              const isLocked = statusVal === 0 || needsClaim;
                              const id = q?.id ?? data?.id ?? "";

                              return (
                                <>
                                  {mode === "edit-consultation" &&
                                    needsClaim && (
                                      <div className="flex flex-col gap-3 rounded-lg border border-primary-200 bg-primary-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex flex-col gap-1">
                                          <p className="text-sm font-semibold text-foreground">
                                            ขั้นตอนที่ 1: รับเคส
                                          </p>
                                          <p className="text-sm text-default-600">
                                            รับดูแลเคสนี้ก่อน
                                            จึงจะบันทึกการให้คำปรึกษาได้
                                          </p>
                                        </div>
                                        {canClaimCase ? (
                                          <Button
                                            className="h-10 min-w-[6rem] text-sm font-medium"
                                            color="primary"
                                            isLoading={actions.claimLoading}
                                            size="md"
                                            onPress={() =>
                                              void actions.runClaim()
                                            }
                                          >
                                            รับเคส
                                          </Button>
                                        ) : (
                                          <p className="text-sm text-warning-600">
                                            เฉพาะ Consult เท่านั้นที่รับเคสได้
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  {mode === "edit-consultation" && isClosed && (
                                    <p className="rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-sm text-default-600">
                                      เคสนี้ปิดแล้ว ดูประวัติได้อย่างเดียว —
                                      หากต้องการติดตามต่อให้สร้างเคสใหม่
                                    </p>
                                  )}
                                  <ConsultationRoundsPanel
                                    ref={consultationRoundsRef}
                                    caseId={id}
                                    consultants={consultantsForPanel}
                                    defaultConsultId={defaultConsultId}
                                    locked={
                                      mode === "edit-consultation"
                                        ? isLocked
                                        : false
                                    }
                                    notes={
                                      q?.treatmentNotes as
                                        | Parameters<
                                            typeof ConsultationRoundsPanel
                                          >[0]["notes"]
                                        | undefined
                                    }
                                    readOnly={consultationReadOnly}
                                    onNotesChange={(notes) => {
                                      setQuestionData((prev) => ({
                                        ...prev,
                                        ...(flattenTreatmentNotes(
                                          notes
                                        ) as Partial<QuestionsData>),
                                        treatmentNotes: notes,
                                      }));
                                    }}
                                    onSaveFooterChange={
                                      setConsultationSaveFooter
                                    }
                                    onSoapSaved={({ prompt }) => {
                                      if (prompt === "transfer") {
                                        addToast({
                                          title: "แผนหลัง: ส่งต่อ",
                                          description:
                                            "บันทึกโน้ตแล้ว — กรุณาสร้าง CaseTransfer ถ้าต้องการส่งต่อหน่วยงาน",
                                          color: "primary",
                                        });
                                        void openTransferModal();

                                        return;
                                      }
                                      if (prompt === "closeCase") {
                                        addToast({
                                          title: "แผนหลัง: ยุติการติดตาม",
                                          description:
                                            "บันทึกโน้ตแล้ว — กดปิดเคสเมื่อพร้อม (ไม่บังคับทันที)",
                                          color: "primary",
                                        });
                                        openCloseCaseModal();

                                        return;
                                      }
                                      if (mode === "edit-consultation") {
                                        onClose();
                                      }
                                    }}
                                  />
                                  {renderCloseCaseReasonBlock(q)}
                                </>
                              );
                            })()}
                            <CaseTransferPanel
                              busy={actions.transferLoading}
                              data={questionData || data}
                              section="history"
                              viewerFacilityId={viewerFacilityId}
                              onAccept={async () => {
                                await actions.acceptTransfer();
                              }}
                              onCancel={async (reason) => {
                                await actions.cancelTransfer(reason);
                              }}
                              onReject={async (reason) => {
                                await actions.rejectTransfer(reason);
                              }}
                            />
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                ) : (
                  <div>
                    {mode === "edit-questionnaire" ? (
                      <QuestionnaireProfileCards
                        addressLine={addressLine}
                        data={data}
                        districtName={districtName}
                        provinceName={provinceName}
                        questionData={questionData}
                        sendMessageLoading={actions.sendMessageLoading}
                        subdistrictName={subdistrictName}
                        onEditProfile={() => setIsModalOpen(true)}
                        onSendLine={() => void actions.sendConsultMessage()}
                      />
                    ) : null}

                    {mode === "edit-questionnaire" ? (
                      <QuestionDetailDrawer
                        data={questionData || data}
                        mode="edit-questionnaire"
                        onQuestionChange={handleQuestionChange}
                      />
                    ) : null}
                  </div>
                )}
              </DrawerBody>
              <DrawerFooter className="sticky bottom-0 z-10 flex w-full shrink-0 flex-wrap items-center justify-end gap-2 border-t border-default-200 bg-content1 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:px-6">
                <Button
                  className={consultationFooterBtnClass}
                  color="default"
                  size="md"
                  variant="light"
                  onPress={onClose}
                >
                  ปิด
                </Button>
                {mode === "edit-consultation" && (
                  <Button
                    className={consultationFooterBtnClass}
                    color="secondary"
                    isDisabled={
                      (questionData?.caseStatus ?? data?.caseStatus) ===
                        "PENDING" ||
                      (questionData?.caseStatus ?? data?.caseStatus) ===
                        "TRANSFER_PENDING" ||
                      (questionData?.caseStatus ?? data?.caseStatus) ===
                        "CLOSED"
                    }
                    size="md"
                    type="button"
                    variant="flat"
                    onPress={() => void openTransferModal()}
                  >
                    ส่งต่อ
                  </Button>
                )}
                {mode === "edit-consultation" && (
                  <Button
                    className={consultationFooterBtnClass}
                    color="warning"
                    isDisabled={
                      actions.closeCaseLoading ||
                      (questionData?.caseStatus ?? data?.caseStatus) ===
                        "PENDING" ||
                      (questionData?.caseStatus ?? data?.caseStatus) ===
                        "TRANSFER_PENDING" ||
                      (questionData?.caseStatus ?? data?.caseStatus) ===
                        "CLOSED"
                    }
                    isLoading={actions.closeCaseLoading}
                    size="md"
                    type="button"
                    variant="flat"
                    onPress={openCloseCaseModal}
                  >
                    ปิดเคส
                  </Button>
                )}
                {mode === "edit-consultation" &&
                  consultationSaveFooter.visible &&
                  (questionData?.caseStatus ?? data?.caseStatus) !== "CLOSED" &&
                  (questionData?.caseStatus ?? data?.caseStatus) !==
                    "TRANSFER_PENDING" && (
                    <Button
                      className={consultationFooterBtnClass}
                      color={consultationSaveFooter.color}
                      isDisabled={consultationSaveFooter.disabled}
                      isLoading={consultationSaveFooter.loading}
                      size="md"
                      type="button"
                      variant={consultationSaveFooter.variant}
                      onPress={() => void consultationRoundsRef.current?.save()}
                    >
                      {consultationSaveFooter.label}
                    </Button>
                  )}
                {mode === "edit-questionnaire" && (
                  <Button
                    className={consultationFooterBtnClass}
                    color="primary"
                    isDisabled={questionnaireLoading}
                    isLoading={questionnaireLoading}
                    size="md"
                    type="submit"
                    variant="solid"
                  >
                    บันทึกแบบประเมิน
                  </Button>
                )}
              </DrawerFooter>
            </Form>
          )}
        </DrawerContent>
      </Drawer>

      <ModalEditProfile
        key={`modal-${questionData?.profile?.id ?? data?.profile?.id}-${modalKey}`}
        data={toModalEditProfileData(questionData ?? data)}
        isOpen={isModalOpen}
        mode="edit"
        onClose={() => setIsModalOpen(false)}
        onSuccess={actions.refresh}
      />

      <Modal
        isOpen={isCloseCaseModalOpen}
        placement="center"
        onClose={() => setIsCloseCaseModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>ปิดเคส</ModalHeader>
          <ModalBody>
            <Textarea
              isRequired
              label="เหตุผลการปิดเคส"
              labelPlacement="outside"
              minRows={3}
              placeholder="กรุณาระบุเหตุผลการปิดเคส"
              value={closeCaseReason}
              variant="bordered"
              onChange={(e) => setCloseCaseReason(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => setIsCloseCaseModalOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              color="danger"
              isLoading={actions.closeCaseLoading}
              onPress={handleCloseCase}
            >
              ยืนยันปิดเคส
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isTransferModalOpen}
        placement="center"
        size="lg"
        onClose={() => setIsTransferModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>ส่งต่อเคส</span>
          </ModalHeader>
          <ModalBody className="gap-4">
            <Autocomplete
              isRequired
              defaultItems={transferFacilities}
              isLoading={transferFacilitiesLoading}
              label="หน่วยงานปลายทาง"
              labelPlacement="outside"
              placeholder="เลือกหน่วยงานที่ต้องการส่งต่อ"
              selectedKey={transferFacilityId || null}
              variant="bordered"
              onSelectionChange={(key) =>
                setTransferFacilityId(key ? String(key) : "")
              }
            >
              {(item) => (
                <AutocompleteItem key={item.id} textValue={item.name}>
                  {item.name}
                </AutocompleteItem>
              )}
            </Autocomplete>
            <Textarea
              isRequired
              label="หมายเหตุการส่งต่อ"
              labelPlacement="outside"
              minRows={3}
              placeholder="ระบุเหตุผลหรือรายละเอียดการส่งต่อ"
              value={transferNote}
              variant="bordered"
              onChange={(e) => setTransferNote(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => setIsTransferModalOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              color="secondary"
              isDisabled={transferFacilitiesLoading}
              isLoading={actions.transferLoading}
              onPress={() => void handleTransferSubmit()}
            >
              ยืนยันส่งต่อ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
