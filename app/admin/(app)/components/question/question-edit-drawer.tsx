"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import moment from "moment";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Districts, Provinces, Subdistricts } from "@prisma/client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  addToast,
  Autocomplete,
  AutocompleteItem,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  DatePicker,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Form,
  Image,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tab,
  Tabs,
  Textarea,
} from "@heroui/react";

import { questionStatusOptions as options } from "../../data/optionData";
import {
  ModalEditProfile,
  type ModalEditProfileData,
} from "../modal/modal-edit-profile";

import { QuestionDetailDrawer } from "./question-detail-drawer";

import { safeParseDate, formatThaiDateTime } from "@/utils/helper";
// eslint-disable-next-line import/order -- ไม่มีบรรทัดว่างภายในกลุ่ม import
import { prefix } from "@/utils/data";

/** คืนค่าเฉพาะ CalendarDate สำหรับ DatePicker (กรอง string ออก) */
function parseDateForPicker(
  val: Date | string | null | undefined
): import("@internationalized/date").CalendarDate | null | undefined {
  const p = safeParseDate(val);

  return p != null && typeof p !== "string" ? p : undefined;
}

/** แปลง QuestionsData เป็น ModalEditProfileData (profile.prefixId เป็น number) */
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
  };
}
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import {
  Addon,
  Consultant,
  Phqa,
  Q8Data,
  Questions2Q,
  QuestionsData,
} from "@/types";
import { subtitle } from "@/components/primitives";
import {
  CONSULT_TELEMED_ROUNDS,
  DISCHARGE_SUMMARY_ROUNDS,
  FOLLOW_UP_ROUNDS,
  isConsultTelemedRoundComplete,
  isFollowUpRoundComplete,
} from "@/lib/question-followup-rounds";

/** map ชื่อฟิลด์ schedule/consult → รอบ 0–2 */
function roundIndexFromScheduleOrConsult(name: string): 0 | 1 | 2 | null {
  if (name === "schedule_telemed" || name === "consult") return 0;
  if (name === "schedule_telemed2" || name === "consult2") return 1;
  if (name === "schedule_telemed3" || name === "consult3") return 2;

  return null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: QuestionsData;
  mode: string;
}

const ConsultantInitValue: Consultant[] = [
  {
    id: "",
    name: "",
  },
];

export const QuestionEditDrawer = ({ isOpen, onClose, data, mode }: Props) => {
  const [distrince, setDistrince] = useState<Districts[]>([]);
  const [province, setProvince] = useState<Provinces[]>([]);
  const [subdistrince, setSubDistrince] = useState<Subdistricts[]>([]);
  const [Consultant, setConsultant] =
    useState<Consultant[]>(ConsultantInitValue);
  const [questionData, setQuestionData] = useState<QuestionsData>(data);
  const [hnIsloading, setHnIsloading] = useState(false);
  const [consultantLoading, setConsultantLoading] = useState(false);
  const [questionnaireLoading, setQuestionnaireLoading] = useState(false);
  const [consultationLoading, setConsultationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [consultValidationRound, setConsultValidationRound] = useState<
    0 | 1 | 2 | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCloseCaseModalOpen, setIsCloseCaseModalOpen] = useState(false);
  const [closeCaseReason, setCloseCaseReason] = useState("");
  const [modalKey, setModalKey] = useState(0);
  /** รอบไหนบันทึกวันที่พบ + ผู้ให้คำปรึกษาแล้ว (ถึงจะกรอก SOAP / หมายเหตุ / นัดพบครั้งถัดไป) */
  const [consultantRoundSaved, setConsultantRoundSaved] = useState<
    [boolean, boolean, boolean]
  >([
    isConsultTelemedRoundComplete(data, 0),
    isConsultTelemedRoundComplete(data, 1),
    isConsultTelemedRoundComplete(data, 2),
  ]);
  const [consultationSaved, setConsultationSaved] = useState(false);
  const [followUpRoundTab, setFollowUpRoundTab] = useState("r1");

  const latitude =
    questionData?.latitude != null
      ? questionData?.latitude
      : data?.latitude != null
        ? data?.latitude
        : 0;
  const longitude =
    questionData?.longitude != null
      ? questionData?.longitude
      : data?.longitude != null
        ? data?.longitude
        : 0;

  const fetchData = async <T,>(
    url: string,
    setter: React.Dispatch<React.SetStateAction<T>>
  ) => {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Failed to fetch data from ${url}`);
      }
      const json = await res.json();

      setter(json as T);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล"
      );
      addToast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        color: "danger",
      });
    }
  };

  const GetDistrictList = useCallback(async () => {
    await fetchData("/api/data/districts", setDistrince);
  }, []);

  const GetProvinceList = useCallback(async () => {
    await fetchData("/api/data/provinces", setProvince);
  }, []);

  const GetSubdistrictList = useCallback(async () => {
    await fetchData("/api/data/subdistricts", setSubDistrince);
  }, []);

  const GetConsultantList = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/admin");

      if (!res.ok) throw new Error("Failed to fetch consultant list");

      const val = await res.json();
      const consult = val.filter(
        (x: { status: number; role: { id: number } }) =>
          x.status === 1 && x.role.id === 3
      );

      if (consult.length > 0) {
        setConsultant(
          consult.map(
            (item: {
              id: string;
              userId?: string;
              firstname?: string;
              lastname?: string;
            }) => ({
              id: item.userId ?? item.id,
              name:
                [item.firstname, item.lastname].filter(Boolean).join(" ") || "",
            })
          )
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการโหลดข้อมูลที่ปรึกษา"
      );
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

  const ChangeHN = async () => {
    const json = JSON.stringify({
      id: questionData?.profile?.id || data?.profile?.id,
      hn: questionData.hn,
      schedule_telemed:
        questionData?.schedule_telemed || data?.schedule_telemed,
      consult: questionData?.consult || data?.consult,
      subjective: questionData?.subjective || data?.subjective,
      objective: questionData?.objective || data?.objective,
      assessment: questionData?.assessment || data?.assessment,
      plan: questionData?.plan || data?.plan,
    });

    setHnIsloading(true);
    try {
      const response = await fetch("/api/profile/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: json,
      });

      if (response.ok) {
        await refreshDrawerData();

        addToast({
          title: "สำเร็จ",
          description: "บันทึก HN สำเร็จ",
          color: "success",
        });
      } else {
        throw new Error("เกิดข้อผิดพลาดในการบันทึก HN");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก HN"
      );
      addToast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก HN",
        color: "danger",
      });
    } finally {
      setHnIsloading(false);
    }
  };

  const handleSearchHN = async () => {
    const citizenId = (
      questionData?.profile?.citizenId ||
      data?.profile?.citizenId ||
      ""
    ).trim();

    if (!citizenId) {
      addToast({
        title: "ไม่พบเลขบัตรประชาชน",
        description: "กรุณาตรวจสอบข้อมูลเลขบัตรประชาชนก่อนค้นหา HN",
        color: "warning",
      });

      return;
    }

    setHnIsloading(true);
    try {
      const response = await fetch("/api/his/patient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardno: citizenId }),
      });
      const payload = (await response.json()) as {
        error?: string;
        hn?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "เกิดข้อผิดพลาดในการค้นหา HN");
      }

      const foundHn = payload.hn?.trim();

      if (!foundHn) {
        addToast({
          title: "ไม่พบข้อมูล HN",
          description: `ไม่พบข้อมูลผู้ป่วยจากเลขบัตร ${citizenId}`,
          color: "warning",
        });

        return;
      }

      setQuestionData((prev) => ({
        ...prev,
        hn: foundHn,
      }));

      addToast({
        title: "ค้นหา HN สำเร็จ",
        description: `พบ HN: ${foundHn}`,
        color: "success",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการค้นหา HN"
      );
      addToast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการค้นหา HN",
        color: "danger",
      });
    } finally {
      setHnIsloading(false);
    }
  };

  const refreshDrawerData = async () => {
    try {
      if (!data?.id) {
        return;
      }

      const response = await fetch(`/api/question/${data.id}`);

      if (response.ok) {
        const updatedData = await response.json();

        if (updatedData) {
          setQuestionData(
            Array.isArray(updatedData) ? updatedData[0] : updatedData
          );
        }
      } else {
        // หาก API ล้มเหลว ให้ใช้ data เดิม
        setQuestionData(data);
      }
    } catch (err) {
      // หากเกิด error ให้ใช้ data เดิม
      setQuestionData(data);
      addToast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการดึงข้อมูลล่าสุด",
        color: "danger",
      });
    }
  };

  type ChangeEventLike =
    | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    | { target: { name: string; value: string | number | null } };

  const HandleChange = (e: ChangeEventLike) => {
    const { name, value } = e.target;
    const valueStr = value != null ? String(value) : "";

    if (
      (name === "consult" && valueStr !== "") ||
      (name === "status" && valueStr !== "2")
    ) {
      setIsError(false);
    }

    if (
      name === "schedule_telemed" ||
      name === "schedule_telemed2" ||
      name === "schedule_telemed3"
    ) {
      setQuestionData((prev) => ({
        ...prev,
        [name]: valueStr ? new Date(valueStr) : null,
      }));
    } else if (
      name === "follow_up" ||
      name === "follow_up2" ||
      name === "follow_up3"
    ) {
      setQuestionData((prev) => ({
        ...prev,
        [name]: valueStr ? new Date(valueStr) : null,
      }));
    } else if (name === "status") {
      setQuestionData((prev) => ({
        ...prev,
        status: valueStr ? parseInt(valueStr, 10) : 0,
      }));
    } else {
      setQuestionData((prev) => ({
        ...prev,
        [name]: valueStr,
      }));
    }

    const roundIdx = roundIndexFromScheduleOrConsult(name);

    if (roundIdx !== null) {
      setConsultantRoundSaved((prev) => {
        const next: [boolean, boolean, boolean] = [...prev];

        next[roundIdx] = false;

        return next;
      });
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // ตรวจสอบว่ามีข้อมูลที่จำเป็นครบหรือไม่
    if (!questionData?.id) {
      setError("ไม่พบข้อมูลคำถาม");

      return;
    }

    // ตั้งค่า loading state ตาม mode
    if (mode === "edit-questionnaire") {
      setQuestionnaireLoading(true);
    } else if (mode === "edit-consultation") {
      setConsultationLoading(true);
    }

    setError(null);

    try {
      let updateData;

      if (mode === "edit-questionnaire") {
        updateData = {
          id: questionData.id,
          q2: questionData.q2,
          phqa: questionData.phqa,
          addon: questionData.addon,
          q8: questionData.q8,
          status: questionData.status,
        };
      } else {
        updateData = {
          id: questionData.id,
          consult: questionData.consult,
          consult2: questionData.consult2,
          consult3: questionData.consult3,
          schedule_telemed: questionData.schedule_telemed,
          schedule_telemed2: questionData.schedule_telemed2,
          schedule_telemed3: questionData.schedule_telemed3,
          subjective: questionData.subjective,
          subjective2: questionData.subjective2,
          subjective3: questionData.subjective3,
          objective: questionData.objective,
          objective2: questionData.objective2,
          objective3: questionData.objective3,
          assessment: questionData.assessment,
          assessment2: questionData.assessment2,
          assessment3: questionData.assessment3,
          plan: questionData.plan,
          plan2: questionData.plan2,
          plan3: questionData.plan3,
          note: questionData.note,
          note2: questionData.note2,
          note3: questionData.note3,
          close_case_reason: questionData.close_case_reason,
          follow_up: questionData.follow_up,
          follow_up2: questionData.follow_up2,
          follow_up3: questionData.follow_up3,
          status: questionData.status,
          q2: questionData.q2,
          phqa: questionData.phqa,
          addon: questionData.addon,
          q8: questionData.q8,
        };
      }

      const response = await fetch("/api/question/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await refreshDrawerData();

        addToast({
          title: "Success",
          description: "บันทึกข้อมูลสำเร็จ",
          color: "success",
        });

        // ตั้งค่าสถานะการบันทึกสำเร็จตาม mode
        if (mode === "edit-consultation") {
          setConsultationSaved(true);
        }

        // ปิด drawer อัตโนมัติเมื่อบันทึกในโหมด edit-questionnaire
        if (mode === "edit-questionnaire") {
          onClose();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(errorData.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
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
      // ตั้งค่า loading state กลับเป็น false ตาม mode
      if (mode === "edit-questionnaire") {
        setQuestionnaireLoading(false);
      } else if (mode === "edit-consultation") {
        setConsultationLoading(false);
      }
    }
  };

  const validateForm = useCallback(() => {
    setError(null);
    setIsError(false);
    setConsultValidationRound(null);

    if (!questionData) {
      setError("ไม่พบข้อมูลที่จะตรวจสอบ");

      return false;
    }

    if (mode === "edit-consultation") {
      const statusVal = questionData.status;

      // Round 1
      if (statusVal === 2 && !questionData.consult) {
        setIsError(true);
        setConsultValidationRound(0);
        setError("กรุณาเลือกผู้ให้คำปรึกษาเมื่อสถานะเป็น 'เสร็จสิ้น'");

        return false;
      }

      if (!questionData.schedule_telemed) {
        setIsError(true);
        setConsultValidationRound(0);
        setError("กรุณาเลือกวันนัด Telemedicine");

        return false;
      }

      const isPendingSummary = statusVal === 2;
      const isCompleted = statusVal === 3;
      const requiresRound2 = isPendingSummary || isCompleted;
      const requiresRound3 = isCompleted;

      // Round 2
      if (requiresRound2 && !questionData.schedule_telemed2) {
        setIsError(true);
        setConsultValidationRound(1);
        setError("กรุณาเลือกวันนัด Telemedicine รอบที่ 2");

        return false;
      }

      if (statusVal === 2 && !questionData.consult2) {
        setIsError(true);
        setConsultValidationRound(1);
        setError(
          "กรุณาเลือกผู้ให้คำปรึกษาเมื่อสถานะเป็น 'เสร็จสิ้น' (รอบที่ 2)"
        );

        return false;
      }

      // Round 3
      if (requiresRound3 && !questionData.schedule_telemed3) {
        setIsError(true);
        setConsultValidationRound(2);
        setError("กรุณาเลือกวันนัด Telemedicine รอบที่ 3");

        return false;
      }

      if (requiresRound3 && !questionData.consult3) {
        setIsError(true);
        setConsultValidationRound(2);
        setError(
          "กรุณาเลือกผู้ให้คำปรึกษาเมื่อสถานะเป็น 'เสร็จสิ้น' (รอบที่ 3)"
        );

        return false;
      }

      // Discharge Summary SOAP
      // status=2 ต้องครบรอบ 1-2, status=3 ต้องครบรอบ 1-3
      if (requiresRound2) {
        if (!questionData.subjective || questionData.subjective.trim() === "") {
          setIsError(true);
          setConsultValidationRound(null);
          setError("กรุณากรอกข้อมูล Subjective data (รอบที่ 1)");

          return false;
        }

        if (!questionData.objective || questionData.objective.trim() === "") {
          setIsError(true);
          setConsultValidationRound(null);
          setError("กรุณากรอกข้อมูล Objective data (รอบที่ 1)");

          return false;
        }

        if (!questionData.assessment || questionData.assessment.trim() === "") {
          setIsError(true);
          setConsultValidationRound(null);
          setError("กรุณากรอกข้อมูล Assessment (รอบที่ 1)");

          return false;
        }

        if (!questionData.plan || questionData.plan.trim() === "") {
          setIsError(true);
          setConsultValidationRound(null);
          setError("กรุณากรอกข้อมูล Plan (รอบที่ 1)");

          return false;
        }

        if (
          !questionData.subjective2 ||
          questionData.subjective2.trim() === ""
        ) {
          setIsError(true);
          setConsultValidationRound(null);
          setError("กรุณากรอกข้อมูล Subjective data (รอบที่ 2)");

          return false;
        }

        if (!questionData.objective2 || questionData.objective2.trim() === "") {
          setIsError(true);
          setConsultValidationRound(null);
          setError("กรุณากรอกข้อมูล Objective data (รอบที่ 2)");

          return false;
        }

        if (
          !questionData.assessment2 ||
          questionData.assessment2.trim() === ""
        ) {
          setIsError(true);
          setConsultValidationRound(null);
          setError("กรุณากรอกข้อมูล Assessment (รอบที่ 2)");

          return false;
        }

        if (!questionData.plan2 || questionData.plan2.trim() === "") {
          setIsError(true);
          setConsultValidationRound(null);
          setError("กรุณากรอกข้อมูล Plan (รอบที่ 2)");

          return false;
        }
      }

      if (requiresRound3) {
        if (
          !questionData.subjective3 ||
          questionData.subjective3.trim() === ""
        ) {
          setIsError(true);
          setConsultValidationRound(null);
          setError("กรุณากรอกข้อมูล Subjective data (รอบที่ 3)");

          return false;
        }

        if (!questionData.objective3 || questionData.objective3.trim() === "") {
          setIsError(true);
          setConsultValidationRound(null);
          setError("กรุณากรอกข้อมูล Objective data (รอบที่ 3)");

          return false;
        }

        if (
          !questionData.assessment3 ||
          questionData.assessment3.trim() === ""
        ) {
          setIsError(true);
          setConsultValidationRound(null);
          setError("กรุณากรอกข้อมูล Assessment (รอบที่ 3)");

          return false;
        }

        if (!questionData.plan3 || questionData.plan3.trim() === "") {
          setIsError(true);
          setConsultValidationRound(null);
          setError("กรุณากรอกข้อมูล Plan (รอบที่ 3)");

          return false;
        }
      }
    }

    if (mode === "edit-questionnaire") {
      // ตรวจสอบ Q2
      if (!questionData.q2 || questionData.q2.length === 0) {
        setError("กรุณากรอกข้อมูลแบบประเมิน 2Q");

        return false;
      }

      // ตรวจสอบ PHQA
      if (!questionData.phqa || questionData.phqa.length === 0) {
        setError("กรุณากรอกข้อมูลแบบประเมิน PHQ-A");

        return false;
      }

      // ตรวจสอบ Addon (ถ้ามี)
      if (!questionData.addon || questionData.addon.length === 0) {
        setError("กรุณากรอกข้อมูลแบบประเมิน PHQ-A Addon");

        return false;
      }
    }

    return true;
  }, [questionData, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
  };

  const openCloseCaseModal = () => {
    setCloseCaseReason(questionData?.close_case_reason ?? "");
    setIsCloseCaseModalOpen(true);
  };

  const handleCloseCase = async () => {
    if (!questionData?.id) {
      setError("ไม่พบข้อมูลคำถาม");

      return;
    }

    const reason = closeCaseReason.trim();

    if (!reason) {
      addToast({
        title: "แจ้งเตือน",
        description: "กรุณาระบุเหตุผลการปิดเคสก่อนยืนยัน",
        color: "warning",
      });

      return;
    }

    setConsultationLoading(true);
    setError(null);

    try {
      const updatedPayload: QuestionsData = {
        ...questionData,
        close_case_reason: reason,
      };
      const saveReasonResponse = await fetch("/api/question/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPayload),
      });

      if (!saveReasonResponse.ok) {
        const errorData = await saveReasonResponse.json().catch(() => ({}));

        throw new Error(
          errorData.message || "ไม่สามารถบันทึกเหตุผลการปิดเคสได้"
        );
      }

      const statusResponse = await fetch("/api/question/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedIds: [questionData.id],
          newStatus: 3,
        }),
      });

      const statusResult = await statusResponse.json().catch(() => ({}));

      if (!statusResponse.ok || !statusResult?.success) {
        throw new Error(
          statusResult?.error || "ไม่สามารถอัปเดตสถานะเป็นเสร็จสิ้นได้"
        );
      }

      await refreshDrawerData();
      setQuestionData((prev) => ({
        ...prev,
        status: 3,
        close_case_reason: reason,
      }));

      addToast({
        title: "Success",
        description: "ปิดเคสสำเร็จ (สถานะเสร็จสิ้น)",
        color: "success",
      });
      setIsCloseCaseModalOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการปิดเคส";

      setError(message);
      addToast({
        title: "Error",
        description: message,
        color: "danger",
      });
    } finally {
      setConsultationLoading(false);
    }
  };

  const handleSaveConsultant = async (roundIndex: 0 | 1 | 2) => {
    if (!questionData?.id) {
      setError("ไม่พบข้อมูลคำถาม");

      return;
    }

    if (!isConsultTelemedRoundComplete(questionData, roundIndex)) {
      setError("กรุณากรอกวันที่พบนักจิตวิทยาและผู้ให้คำปรึกษาให้ครบก่อนบันทึก");
      addToast({
        title: "แจ้งเตือน",
        description:
          "กรุณากรอกวันที่พบนักจิตวิทยาและผู้ให้คำปรึกษาให้ครบก่อนบันทึก",
        color: "warning",
      });

      return;
    }

    setConsultantLoading(true);
    setError(null);

    try {
      const updateData = {
        ...questionData,
        phqa: questionData.phqa,
        q2: questionData.q2,
        addon: questionData.addon,
      };

      const response = await fetch("/api/question/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Refresh ข้อมูลหลังจากบันทึกเพื่อให้ SOAP fields เปิดใช้งาน
        await refreshDrawerData();

        addToast({
          title: "Success",
          description: "บันทึกผู้ให้คำปรึกษาสำเร็จ",
          color: "success",
        });

        setConsultantRoundSaved((prev) => {
          const next: [boolean, boolean, boolean] = [...prev];

          next[roundIndex] = true;

          return next;
        });
      } else {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          errorData.message || "เกิดข้อผิดพลาดในการบันทึกผู้ให้คำปรึกษา"
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการบันทึกผู้ให้คำปรึกษา"
      );
      addToast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการบันทึกผู้ให้คำปรึกษา",
        color: "danger",
      });
    } finally {
      setConsultantLoading(false);
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
    const roundIdx = roundIndexFromScheduleOrConsult(field);

    if (roundIdx !== null) {
      setConsultantRoundSaved((prev) => {
        const next: [boolean, boolean, boolean] = [...prev];

        next[roundIdx] = false;

        return next;
      });
    }
  };

  // โหลด list APIs พร้อมกันเพื่อลดเวลาเปิด drawer (async-parallel)
  useEffect(() => {
    void Promise.all([
      GetProvinceList(),
      GetDistrictList(),
      GetSubdistrictList(),
      GetConsultantList(),
    ]);
  }, [GetProvinceList, GetDistrictList, GetSubdistrictList, GetConsultantList]);

  // แยก useEffect สำหรับการจัดการข้อมูล
  useEffect(() => {
    if (isOpen && data) {
      // อัปเดต modal key เพื่อให้ modal ถูกสร้างใหม่
      setModalKey((prev) => prev + 1);
    }
  }, [isOpen, data?.id]); // เปลี่ยน dependency เป็น data?.id เพื่อให้ trigger เมื่อข้อมูลเปลี่ยน

  useEffect(() => {
    if (!isOpen) {
      setIsCloseCaseModalOpen(false);
      setCloseCaseReason("");
    }
  }, [isOpen]);

  // useEffect เพิ่มเติมสำหรับ refresh ข้อมูลหลังจาก drawer เปิดแล้ว
  useEffect(() => {
    if (isOpen && data?.id) {
      // เรียก refreshDrawerData หลังจาก drawer เปิดแล้ว
      const timer = setTimeout(() => {
        refreshDrawerData();
      }, 200); // เพิ่มเวลารอเพื่อให้แน่ใจว่า drawer เปิดเสร็จแล้ว

      return () => clearTimeout(timer);
    }
  }, [isOpen, data?.id]);

  // useEffect สำหรับ reset ข้อมูลเมื่อ data เปลี่ยน
  useEffect(() => {
    if (data) {
      setQuestionData(data);
      setConsultantRoundSaved([
        isConsultTelemedRoundComplete(data, 0),
        isConsultTelemedRoundComplete(data, 1),
        isConsultTelemedRoundComplete(data, 2),
      ]);
    }
  }, [data?.id]); // เปลี่ยน dependency เป็น data?.id เพื่อให้ trigger เมื่อข้อมูลเปลี่ยน

  // useEffect สำหรับรีเซ็ตสถานะการบันทึกเมื่อ drawer เปิดใหม่
  useEffect(() => {
    if (isOpen && data) {
      setConsultantRoundSaved([
        isConsultTelemedRoundComplete(data, 0),
        isConsultTelemedRoundComplete(data, 1),
        isConsultTelemedRoundComplete(data, 2),
      ]);
      setConsultationSaved(false);
      if (mode === "edit-consultation") {
        const q = data;
        const r1Complete = isFollowUpRoundComplete(q, 0);
        const r2Complete = isFollowUpRoundComplete(q, 1);

        setFollowUpRoundTab(r1Complete ? (r2Complete ? "r3" : "r2") : "r1");
      } else {
        setFollowUpRoundTab("r1");
      }
    }
  }, [isOpen, data?.id]);

  // ถ้ารอบก่อนหน้าว่าง แท็บที่เลือกอยู่ไม่ถูกต้อง — ถอยกลับ
  useEffect(() => {
    const q = questionData ?? data;
    const r1 = isFollowUpRoundComplete(q, 0);
    const r2 = isFollowUpRoundComplete(q, 1);

    if (followUpRoundTab === "r3" && !r2) {
      setFollowUpRoundTab(r1 ? "r2" : "r1");
    } else if (followUpRoundTab === "r2" && !r1) {
      setFollowUpRoundTab("r1");
    }
  }, [questionData, data, followUpRoundTab]);

  // useEffect สำหรับ reset ข้อมูลเมื่อ drawer เปิด
  useEffect(() => {
    if (isOpen && data) {
      // Reset ข้อมูลเมื่อ drawer เปิดเฉพาะเมื่อเป็นข้อมูลใหม่
      setQuestionData(data);
      setConsultantRoundSaved([
        isConsultTelemedRoundComplete(data, 0),
        isConsultTelemedRoundComplete(data, 1),
        isConsultTelemedRoundComplete(data, 2),
      ]);
      // ล้าง error state
      setError(null);
      setIsError(false);
    } else if (!isOpen) {
      // ล้าง error state เมื่อปิด drawer
      setError(null);
      setIsError(false);
    }
  }, [isOpen, data?.id]); // เปลี่ยน dependency เป็น data?.id เพื่อให้ trigger เมื่อข้อมูลเปลี่ยน

  // ถ้า drawer ปิดแล้วให้ unmount เลย เพื่อกัน backdrop/overlay ค้างบังการใช้งาน
  if (!isOpen) return null;

  return (
    <>
      <Drawer
        key={`drawer-${data?.id || "default"}-${modalKey}`}
        isKeyboardDismissDisabled={true}
        isOpen={isOpen}
        placement="right"
        size="5xl"
        onClose={onClose}
      >
        <DrawerContent>
          {(onClose) => (
            <Form onReset={onClose} onSubmit={handleSubmit}>
              <DrawerHeader className="w-full">
                <div className="flex flex-col lg:flex-row w-full justify-between gap-3 text-sm items-start lg:items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">วันที่ประเมิน:</span>
                    <span>
                      {formatThaiDateTime(
                        questionData?.createdAt || (data?.createdAt as string)
                      )}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">โหมด:</span>
                      <span>{mode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">สถานะ:</span>
                      {(() => {
                        const statusVal = questionData?.status ?? data?.status;
                        const statusName =
                          options.find((item) => item.uid === String(statusVal))
                            ?.name ?? `สถานะ ${statusVal}`;

                        const chipColor =
                          statusVal === 0
                            ? "default"
                            : statusVal === 1
                              ? "primary"
                              : statusVal === 2
                                ? "warning"
                                : "success";

                        return (
                          <Chip color={chipColor} size="lg" variant="flat">
                            <span className="text-xs">{statusName}</span>
                          </Chip>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">ผลการประเมิน:</span>
                      <Chip
                        color={
                          (questionData?.result || data?.result) === "Green"
                            ? "success"
                            : (questionData?.result || data?.result) ===
                                "Green-Low"
                              ? "success"
                              : (questionData?.result || data?.result) ===
                                  "Yellow"
                                ? "warning"
                                : (questionData?.result || data?.result) ===
                                    "Orange"
                                  ? "warning"
                                  : "danger"
                        }
                        size="lg"
                        variant="flat"
                      >
                        <span className="capitalize text-xs">
                          {questionData?.result || data?.result}
                        </span>
                      </Chip>
                    </div>
                  </div>
                </div>
              </DrawerHeader>
              {error && (
                <div className="px-4 py-2 bg-red-100 text-red-700 rounded-md mx-4">
                  {error}
                </div>
              )}
              <DrawerBody className="w-full">
                {mode !== "edit-questionnaire" ? (
                  <div className="flex flex-col sm:flex-row gap-5 mx-auto justify-center w-full">
                    <>
                      <Card className="w-[400px]">
                        <CardHeader className="flex gap-3">
                          <Image
                            key={`image-${questionData?.profile?.id || data?.profile?.id}-${questionData?.id || data?.id}`}
                            alt={`รูปภาพ ${questionData?.profile?.id || data?.profile?.id}`}
                            className="object-cover rounded cursor-pointer hover:opacity-80 transition-opacity min-w-[100px] h-[100px]"
                            fallbackSrc="https://placehold.co/100x100?text=NO+IMAGE\\nAVAILABLE"
                            height={100}
                            loading="lazy"
                            src={
                              questionData?.profile?.user || data?.profile?.user
                                ? questionData?.profile?.user?.image ||
                                  data?.profile?.user?.image
                                : undefined
                            }
                            width={100}
                          />
                          <div className="flex flex-col">
                            <p className="text-md">
                              HN:{" "}
                              <b>
                                {questionData?.profile?.hn || data?.profile?.hn}
                              </b>
                            </p>
                            <p className="text-small">
                              LINE :{" "}
                              <b>
                                {questionData?.profile?.user?.name ||
                                  data?.profile?.user?.name ||
                                  "-"}
                              </b>
                            </p>
                            <p className="text-md">
                              {
                                prefix.find(
                                  (val) =>
                                    val.key ==
                                    (questionData?.profile?.prefixId ||
                                      data?.profile?.prefixId)
                                )?.label
                              }
                              {questionData?.profile?.firstname ||
                                data?.profile?.firstname}{" "}
                              {questionData?.profile?.lastname ||
                                data?.profile?.lastname}
                            </p>
                            <p className="text-small">
                              เลขที่บัตรประชาชน :{" "}
                              <b>
                                {questionData?.profile?.citizenId ||
                                  data?.profile?.citizenId}
                              </b>
                            </p>
                            <p className="text-small">
                              วัน/เดือน/ปี เกิด :{" "}
                              <b>
                                {moment(
                                  questionData?.profile?.birthday ||
                                    data?.profile?.birthday
                                )
                                  .add(543, "year")
                                  .locale("th-TH")
                                  .format("DD/MM/YYYY")}
                              </b>
                            </p>
                            <p className="text-small">
                              เชื้อชาติ :{" "}
                              <b>
                                {questionData?.profile?.ethnicity ||
                                  data?.profile?.ethnicity}
                              </b>{" "}
                              สัญชาติ :{" "}
                              <b>
                                {questionData?.profile?.nationality ||
                                  data?.profile?.nationality}
                              </b>
                            </p>
                          </div>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                          <div>
                            <p className="text-small">
                              ที่อยู่ :{" "}
                              <b>
                                {questionData?.profile?.address?.[0]?.houseNo ||
                                  data?.profile?.address?.[0]?.houseNo}
                              </b>{" "}
                              หมู่ที่ :{" "}
                              <b>
                                {(questionData?.profile?.address?.[0]
                                  ?.villageNo ||
                                  data?.profile?.address?.[0]?.villageNo) == ""
                                  ? "-"
                                  : questionData?.profile?.address?.[0]
                                      ?.villageNo ||
                                    data?.profile?.address?.[0]?.villageNo}
                              </b>{" "}
                              ซอย :{" "}
                              <b>
                                {questionData?.profile?.address?.[0]?.soi ||
                                  data?.profile?.address?.[0]?.soi}
                              </b>
                            </p>
                            <p className="text-small">
                              ถนน :{" "}
                              <b>
                                {questionData?.profile?.address?.[0]?.road ||
                                  data?.profile?.address?.[0]?.road}
                              </b>{" "}
                              ตำบล :{" "}
                              <b>
                                {
                                  subdistrince?.find(
                                    (x) =>
                                      x.id ==
                                      (questionData?.profile?.address?.[0]
                                        ?.subdistrict ||
                                        data?.profile?.address?.[0]
                                          ?.subdistrict)
                                  )?.nameInThai
                                }
                              </b>{" "}
                              อำเภอ :{" "}
                              <b>
                                {
                                  distrince?.find(
                                    (x) =>
                                      x.id ==
                                      (questionData?.profile?.address?.[0]
                                        ?.district ||
                                        data?.profile?.address?.[0]?.district)
                                  )?.nameInThai
                                }
                              </b>
                            </p>
                            <p className="text-small">
                              จังหวัด :{" "}
                              <b>
                                {
                                  province?.find(
                                    (x) =>
                                      x.id ==
                                      (questionData?.profile?.address?.[0]
                                        ?.province ||
                                        data?.profile?.address?.[0]?.province)
                                  )?.nameInThai
                                }
                              </b>{" "}
                              โทรศัพท์ :{" "}
                              <b>
                                {questionData?.profile?.tel ||
                                  data?.profile?.tel}
                              </b>
                            </p>
                          </div>
                        </CardBody>
                        <Divider />
                        <CardBody>
                          <div>
                            <p className="text-small">
                              ชื่อผู้ติดต่อฉุกเฉิน :{" "}
                              <b>
                                {questionData?.profile?.emergency?.[0]?.name ||
                                  data?.profile?.emergency?.[0]?.name}
                              </b>{" "}
                            </p>
                            <p className="text-small">
                              โทรศัพท์ :{" "}
                              <b>
                                {questionData?.profile?.emergency?.[0]?.tel ||
                                  data?.profile?.emergency?.[0]?.tel}
                              </b>{" "}
                              ความสัมพันธ์ :{" "}
                              <b>
                                {questionData?.profile?.emergency?.[0]
                                  ?.relation ||
                                  data?.profile?.emergency?.[0]?.relation}
                              </b>
                            </p>
                          </div>
                        </CardBody>
                        <Divider />
                        <CardFooter>
                          {!(questionData?.profile?.hn || data?.profile?.hn) ? (
                            <div className="flex flex-row gap-4">
                              <Input
                                endContent={
                                  <Button
                                    isIconOnly
                                    aria-label="ค้นหา HN"
                                    isDisabled={
                                      mode == "view-questionnaire" ||
                                      mode == "view-consultation"
                                    }
                                    size="sm"
                                    variant="light"
                                    onPress={handleSearchHN}
                                  >
                                    <MagnifyingGlassIcon className="w-4 h-4" />
                                  </Button>
                                }
                                isDisabled={
                                  mode == "view-questionnaire" ||
                                  mode == "view-consultation"
                                }
                                name="hn"
                                startContent={<p> HN:</p>}
                                value={
                                  questionData?.hn ||
                                  questionData?.profile?.hn ||
                                  data?.profile?.hn ||
                                  ""
                                }
                                variant="bordered"
                                onChange={HandleChange}
                              />
                              <Button
                                color="primary"
                                isDisabled={
                                  mode == "view-questionnaire" ||
                                  mode == "view-consultation"
                                }
                                isLoading={hnIsloading}
                                type="button"
                                onPress={() => ChangeHN()}
                              >
                                บันทึก HN
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-row gap-4 justify-center w-full">
                              <Button
                                color="warning"
                                variant="flat"
                                onPress={() => setIsModalOpen(true)}
                              >
                                แก้ไขข้อมูลส่วนตัว
                              </Button>
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                      <Card className="w-[400px]">
                        <CardBody>
                          <div className="mx-auto w-[352px] h-[265px]">
                            <MapContainer
                              center={[latitude, longitude]}
                              doubleClickZoom={false}
                              dragging={false}
                              scrollWheelZoom={false}
                              style={{ height: "100%", width: "100%" }}
                              zoom={17}
                              zoomControl={false}
                            >
                              <TileLayer
                                attribution=""
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <Marker
                                draggable={false}
                                position={[latitude, longitude]}
                              >
                                <Popup>Hey ! I study here</Popup>
                              </Marker>
                            </MapContainer>
                          </div>
                        </CardBody>
                        <Divider />
                        <CardFooter>
                          <Link
                            isExternal
                            showAnchorIcon
                            href={`https://www.google.co.th/maps/place/${questionData?.latitude || data?.latitude},${questionData?.longitude || data?.longitude}`}
                          >
                            ดูบนแผนที่
                          </Link>
                        </CardFooter>
                      </Card>
                    </>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-5 mx-auto justify-center w-full">
                    <>
                      <Card className="w-[400px]">
                        <CardHeader className="flex gap-3">
                          <Image
                            key={`image-${questionData?.profile?.id || data?.profile?.id}-${questionData?.id || data?.id}`}
                            alt={`รูปภาพ ${questionData?.profile?.id || data?.profile?.id}`}
                            className="object-cover rounded cursor-pointer hover:opacity-80 transition-opacity min-w-[100px] h-[100px]"
                            fallbackSrc="https://placehold.co/100x100?text=NO+IMAGE\\nAVAILABLE"
                            height={100}
                            loading="lazy"
                            src={
                              questionData?.profile?.user || data?.profile?.user
                                ? questionData?.profile?.user?.image ||
                                  data?.profile?.user?.image
                                : undefined
                            }
                            width={100}
                          />
                          <div className="flex flex-col">
                            <p className="text-small">
                              LINE :{" "}
                              <b>
                                {questionData?.profile?.user?.name ||
                                  data?.profile?.user?.name ||
                                  "-"}
                              </b>
                            </p>
                            <p className="text-md">
                              {
                                prefix.find(
                                  (val) =>
                                    val.key ==
                                    (questionData?.profile?.prefixId ||
                                      data?.profile?.prefixId)
                                )?.label
                              }{" "}
                              {questionData?.profile?.firstname ||
                                data?.profile?.firstname}{" "}
                              {questionData?.profile?.lastname ||
                                data?.profile?.lastname}
                            </p>
                            <p className="text-small">
                              เลขที่บัตรประชาชน :{" "}
                              <b>
                                {questionData?.profile?.citizenId ||
                                  data?.profile?.citizenId}
                              </b>
                            </p>
                            <p className="text-small">
                              วัน/เดือน/ปี เกิด :{" "}
                              <b>
                                {moment(
                                  questionData?.profile?.birthday ||
                                    data?.profile?.birthday
                                )
                                  .add(543, "year")
                                  .locale("th-TH")
                                  .format("DD/MM/YYYY")}
                              </b>
                            </p>
                            <p className="text-small">
                              เชื้อชาติ :{" "}
                              <b>
                                {questionData?.profile?.ethnicity ||
                                  data?.profile?.ethnicity}
                              </b>{" "}
                              สัญชาติ :{" "}
                              <b>
                                {questionData?.profile?.nationality ||
                                  data?.profile?.nationality}
                              </b>
                            </p>
                          </div>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                          <div>
                            <p className="text-small">
                              ที่อยู่ :{" "}
                              <b>
                                {questionData?.profile.address?.[0]?.houseNo ||
                                  "-"}
                              </b>{" "}
                              หมู่ที่ :{" "}
                              <b>
                                {questionData?.profile.address?.[0]
                                  ?.villageNo == ""
                                  ? "-"
                                  : questionData?.profile.address?.[0]
                                      ?.villageNo || "-"}
                              </b>{" "}
                              ซอย :{" "}
                              <b>
                                {questionData?.profile.address?.[0]?.soi || "-"}
                              </b>
                            </p>
                            <p className="text-small">
                              ถนน :{" "}
                              <b>
                                {questionData?.profile.address?.[0]?.road ||
                                  "-"}
                              </b>{" "}
                              ตำบล :{" "}
                              <b>
                                {subdistrince?.find(
                                  (x) =>
                                    x.id ==
                                    questionData?.profile.address?.[0]
                                      ?.subdistrict
                                )?.nameInThai || "-"}
                              </b>{" "}
                              อำเภอ :{" "}
                              <b>
                                {distrince?.find(
                                  (x) =>
                                    x.id ==
                                    questionData?.profile.address?.[0]?.district
                                )?.nameInThai || "-"}
                              </b>
                            </p>
                            <p className="text-small">
                              จังหวัด :{" "}
                              <b>
                                {province?.find(
                                  (x) =>
                                    x.id ==
                                    questionData?.profile.address?.[0]?.province
                                )?.nameInThai || "-"}
                              </b>{" "}
                              โทรศัพท์ :{" "}
                              <b>{questionData?.profile.tel || "-"}</b>
                            </p>
                          </div>
                        </CardBody>
                        <Divider />
                        <CardBody>
                          <div>
                            <p className="text-small">
                              ชื่อผู้ติดต่อฉุกเฉิน :{" "}
                              <b>
                                {questionData?.profile.emergency?.[0]?.name ||
                                  "-"}
                              </b>{" "}
                            </p>
                            <p className="text-small">
                              โทรศัพท์ :{" "}
                              <b>
                                {questionData?.profile.emergency?.[0]?.tel ||
                                  "-"}
                              </b>{" "}
                              ความสัมพันธ์ :{" "}
                              <b>
                                {questionData?.profile.emergency?.[0]
                                  ?.relation || "-"}
                              </b>
                            </p>
                          </div>
                        </CardBody>
                        <Divider />
                        <CardFooter>
                          <div className="flex flex-row gap-4 justify-center w-full">
                            <Button
                              color="warning"
                              variant="flat"
                              onPress={() => setIsModalOpen(true)}
                            >
                              แก้ไขข้อมูลส่วนตัว
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                      <Card className="w-[400px]">
                        <CardBody>
                          <div className="mx-auto w-[352px] h-[265px]">
                            <MapContainer
                              center={[latitude, longitude]}
                              doubleClickZoom={false}
                              dragging={false}
                              scrollWheelZoom={false}
                              style={{ height: "100%", width: "100%" }}
                              zoom={17}
                              zoomControl={false}
                            >
                              <TileLayer
                                attribution=""
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <Marker
                                draggable={false}
                                position={[latitude, longitude]}
                              >
                                <Popup>Hey ! I study here</Popup>
                              </Marker>
                            </MapContainer>
                          </div>
                        </CardBody>
                        <Divider />
                        <CardFooter>
                          <Link
                            isExternal
                            showAnchorIcon
                            href={`https://www.google.co.th/maps/place/${questionData?.latitude},${questionData?.longitude}`}
                          >
                            ดูบนแผนที่
                          </Link>
                        </CardFooter>
                      </Card>
                    </>
                  </div>
                )}

                {mode === "view-questionnaire" ? (
                  <QuestionDetailDrawer data={questionData || data} />
                ) : mode === "view-consultation" ? (
                  <div className="flex flex-col gap-6">
                    <Card className="rounded-xl border border-default-200 shadow-sm">
                      <CardBody className="flex flex-col gap-4 p-4 sm:p-6">
                        {(() => {
                          const q = questionData ?? data;
                          const followTab2Disabled = !isFollowUpRoundComplete(
                            q,
                            0
                          );
                          const followTab3Disabled = !isFollowUpRoundComplete(
                            q,
                            1
                          );

                          return (
                            <>
                              <h2 className={subtitle()}>
                                บันทึกการให้คำปรึกษา
                              </h2>
                              <Tabs
                                fullWidth
                                aria-label="รอบติดตาม (Consultant/Telemedicine + Discharge Summary)"
                                className="w-full"
                                color="primary"
                                selectedKey={followUpRoundTab}
                                variant="bordered"
                                onSelectionChange={(key) =>
                                  setFollowUpRoundTab(String(key))
                                }
                              >
                                {CONSULT_TELEMED_ROUNDS.map((round, idx) => {
                                  const schedVal = q?.[
                                    round.schedule as keyof QuestionsData
                                  ] as Date | string | null | undefined;
                                  const consultVal = q?.[
                                    round.consult as keyof QuestionsData
                                  ] as string | null | undefined;
                                  const tabKey = `r${idx + 1}`;
                                  const dischargeRound =
                                    DISCHARGE_SUMMARY_ROUNDS[idx];
                                  const followUpVal = q?.[
                                    FOLLOW_UP_ROUNDS[idx]
                                      .followUp as keyof QuestionsData
                                  ] as Date | string | null | undefined;
                                  const isRoundComplete =
                                    isFollowUpRoundComplete(
                                      q,
                                      idx as 0 | 1 | 2
                                    );

                                  return (
                                    <Tab
                                      key={tabKey}
                                      isDisabled={
                                        (idx === 1 && followTab2Disabled) ||
                                        (idx === 2 && followTab3Disabled)
                                      }
                                      title={
                                        isRoundComplete ? (
                                          <span className="inline-flex items-center gap-1.5">
                                            <span>{round.label}</span>
                                            <CheckCircleIcon className="size-4 text-success" />
                                          </span>
                                        ) : (
                                          round.label
                                        )
                                      }
                                    >
                                      <div className="mt-2 flex flex-col gap-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                                          <DatePicker
                                            showMonthAndYearPickers
                                            defaultValue={parseDateForPicker(
                                              schedVal
                                            )}
                                            isDisabled={true}
                                            label="วันที่พบนักจิตวิทยา"
                                            labelPlacement="outside"
                                            name={round.schedule}
                                            selectorButtonPlacement="start"
                                            variant="bordered"
                                          />
                                          <Autocomplete
                                            defaultItems={Consultant}
                                            defaultSelectedKey={
                                              consultVal ?? undefined
                                            }
                                            isDisabled={true}
                                            label="ผู้ให้คำปรึกษา"
                                            labelPlacement="outside"
                                            placeholder="เลือกผู้ให้คำปรึกษา"
                                            radius="md"
                                            variant="bordered"
                                          >
                                            {(item) => (
                                              <AutocompleteItem key={item.id}>
                                                {item.name}
                                              </AutocompleteItem>
                                            )}
                                          </Autocomplete>
                                        </div>

                                        <Divider className="bg-default-200" />

                                        <div className="flex flex-col gap-4">
                                          <Textarea
                                            defaultValue={
                                              (q?.[
                                                dischargeRound.subjective as keyof QuestionsData
                                              ] as string | null | undefined) ??
                                              ""
                                            }
                                            isDisabled={true}
                                            label="1. Subjective data"
                                            labelPlacement="outside"
                                            minRows={3}
                                            name={dischargeRound.subjective}
                                            placeholder="Description"
                                            variant="bordered"
                                          />
                                          <Textarea
                                            defaultValue={
                                              (q?.[
                                                dischargeRound.objective as keyof QuestionsData
                                              ] as string | null | undefined) ??
                                              ""
                                            }
                                            isDisabled={true}
                                            label="2. Objective data"
                                            labelPlacement="outside"
                                            minRows={3}
                                            name={dischargeRound.objective}
                                            placeholder="Description"
                                            variant="bordered"
                                          />
                                          <Textarea
                                            defaultValue={
                                              (q?.[
                                                dischargeRound.assessment as keyof QuestionsData
                                              ] as string | null | undefined) ??
                                              ""
                                            }
                                            isDisabled={true}
                                            label="3. Assessment"
                                            labelPlacement="outside"
                                            minRows={3}
                                            name={dischargeRound.assessment}
                                            placeholder="Description"
                                            variant="bordered"
                                          />
                                          <Textarea
                                            defaultValue={
                                              (q?.[
                                                dischargeRound.plan as keyof QuestionsData
                                              ] as string | null | undefined) ??
                                              ""
                                            }
                                            isDisabled={true}
                                            label="4. Plan"
                                            labelPlacement="outside"
                                            minRows={3}
                                            name={dischargeRound.plan}
                                            placeholder="Description"
                                            variant="bordered"
                                          />
                                          <Textarea
                                            defaultValue={
                                              (q?.[
                                                dischargeRound.note as keyof QuestionsData
                                              ] as string | null | undefined) ??
                                              ""
                                            }
                                            isDisabled={true}
                                            label="5. หมายเหตุ"
                                            labelPlacement="outside"
                                            minRows={2}
                                            name={dischargeRound.note}
                                            placeholder="หมายเหตุเพิ่มเติม"
                                            variant="bordered"
                                          />
                                          <DatePicker
                                            showMonthAndYearPickers
                                            className="max-w-xs"
                                            defaultValue={parseDateForPicker(
                                              followUpVal
                                            )}
                                            isDisabled={true}
                                            label="นัดพบครั้งถัดไป"
                                            labelPlacement="outside"
                                            name={
                                              FOLLOW_UP_ROUNDS[idx].followUp
                                            }
                                            selectorButtonPlacement="start"
                                            variant="bordered"
                                          />
                                        </div>
                                      </div>
                                    </Tab>
                                  );
                                })}
                              </Tabs>
                            </>
                          );
                        })()}
                      </CardBody>
                    </Card>
                  </div>
                ) : mode === "edit-questionnaire" ? (
                  <QuestionDetailDrawer
                    data={questionData || data}
                    mode="edit-questionnaire"
                    onQuestionChange={handleQuestionChange}
                  />
                ) : (
                  <div className="flex flex-col gap-6">
                    <Card className="rounded-xl border border-default-200 shadow-sm">
                      <CardBody className="flex flex-col gap-4 p-4 sm:p-6">
                        {(() => {
                          const q = questionData ?? data;
                          const statusVal = q?.status ?? data?.status;
                          const isLocked = statusVal === 0;
                          const soapDisabled =
                            statusVal !== 2 && statusVal !== 3;
                          const followTab2Disabled = !isFollowUpRoundComplete(
                            q,
                            0
                          );
                          const followTab3Disabled = !isFollowUpRoundComplete(
                            q,
                            1
                          );

                          return (
                            <>
                              <h2 className={subtitle()}>
                                บันทึกการให้คำปรึกษา
                              </h2>
                              <Tabs
                                fullWidth
                                aria-label="รอบ Consultant และ Telemedicine"
                                className="w-full"
                                color="primary"
                                selectedKey={followUpRoundTab}
                                variant="bordered"
                                onSelectionChange={(key) =>
                                  setFollowUpRoundTab(String(key))
                                }
                              >
                                {CONSULT_TELEMED_ROUNDS.map((round, idx) => {
                                  const schedVal = q?.[
                                    round.schedule as keyof QuestionsData
                                  ] as Date | string | null | undefined;
                                  const consultVal = q?.[
                                    round.consult as keyof QuestionsData
                                  ] as string | null | undefined;
                                  const tabKey = `r${idx + 1}`;
                                  const dischargeRound =
                                    DISCHARGE_SUMMARY_ROUNDS[idx];
                                  const followUpVal = q?.[
                                    FOLLOW_UP_ROUNDS[idx]
                                      .followUp as keyof QuestionsData
                                  ] as Date | string | null | undefined;
                                  const isRoundComplete =
                                    isFollowUpRoundComplete(
                                      q,
                                      idx as 0 | 1 | 2
                                    );
                                  const soapSectionLocked =
                                    soapDisabled || !consultantRoundSaved[idx];

                                  return (
                                    <Tab
                                      key={tabKey}
                                      isDisabled={
                                        (idx === 1 && followTab2Disabled) ||
                                        (idx === 2 && followTab3Disabled)
                                      }
                                      title={
                                        isRoundComplete ? (
                                          <span className="inline-flex items-center gap-1.5">
                                            <span>{round.label}</span>
                                            <CheckCircleIcon className="size-4 text-success" />
                                          </span>
                                        ) : (
                                          round.label
                                        )
                                      }
                                    >
                                      <div className="mt-2 flex flex-col gap-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                                          <DatePicker
                                            showMonthAndYearPickers
                                            defaultValue={parseDateForPicker(
                                              schedVal
                                            )}
                                            isDisabled={isLocked}
                                            isRequired={!isLocked}
                                            label="วันที่พบนักจิตวิทยา"
                                            labelPlacement="outside"
                                            name={round.schedule}
                                            selectorButtonPlacement="start"
                                            variant="bordered"
                                            onChange={(date) => {
                                              HandleChange({
                                                target: {
                                                  name: round.schedule,
                                                  value: date
                                                    ? date.toString()
                                                    : "",
                                                },
                                              });
                                            }}
                                          />
                                          <div className="flex w-full min-w-0 flex-col gap-2 md:flex-row md:items-end md:gap-3">
                                            <Autocomplete
                                              className="min-w-0 flex-1"
                                              defaultItems={Consultant}
                                              defaultSelectedKey={
                                                consultVal ?? undefined
                                              }
                                              errorMessage="กรุณาระบุผู้ให้คำปรึกษา"
                                              isDisabled={isLocked}
                                              isInvalid={
                                                isError &&
                                                consultValidationRound === idx
                                              }
                                              isRequired={!isLocked}
                                              label="ผู้ให้คำปรึกษา"
                                              labelPlacement="outside"
                                              placeholder="เลือกผู้ให้คำปรึกษา"
                                              radius="md"
                                              variant="bordered"
                                              onSelectionChange={(val) =>
                                                HandleChange({
                                                  target: {
                                                    name: round.consult,
                                                    value:
                                                      val != null
                                                        ? String(val)
                                                        : null,
                                                  },
                                                })
                                              }
                                            >
                                              {(item) => (
                                                <AutocompleteItem key={item.id}>
                                                  {item.name}
                                                </AutocompleteItem>
                                              )}
                                            </Autocomplete>
                                            <Button
                                              className="w-full shrink-0 md:w-auto"
                                              color={
                                                consultantRoundSaved[idx]
                                                  ? "success"
                                                  : "primary"
                                              }
                                              isDisabled={consultantLoading}
                                              isLoading={consultantLoading}
                                              type="button"
                                              variant="flat"
                                              onPress={() =>
                                                handleSaveConsultant(
                                                  idx as 0 | 1 | 2
                                                )
                                              }
                                            >
                                              {consultantRoundSaved[idx]
                                                ? "บันทึกแล้ว"
                                                : "บันทึกผู้ให้คำปรึกษา"}
                                            </Button>
                                          </div>
                                        </div>

                                        <Divider className="bg-default-200" />

                                        {!soapDisabled &&
                                          !consultantRoundSaved[idx] && (
                                            <p className="text-small text-default-500">
                                              กรุณากรอกวันที่พบและผู้ให้คำปรึกษา
                                              แล้วกด
                                              &quot;บันทึกผู้ให้คำปรึกษา&quot;
                                              ก่อนกรอก Discharge Summary
                                              ด้านล่าง
                                            </p>
                                          )}

                                        <div className="flex flex-col gap-4">
                                          <Textarea
                                            isClearable
                                            defaultValue={
                                              (q?.[
                                                dischargeRound.subjective as keyof QuestionsData
                                              ] as string | null | undefined) ??
                                              ""
                                            }
                                            isDisabled={soapSectionLocked}
                                            isRequired={true}
                                            label="1. Subjective data"
                                            labelPlacement="outside"
                                            minRows={3}
                                            name={dischargeRound.subjective}
                                            placeholder="Description"
                                            variant="bordered"
                                            onChange={HandleChange}
                                            onClear={() =>
                                              HandleChange({
                                                target: {
                                                  name: dischargeRound.subjective,
                                                  value: "",
                                                },
                                              })
                                            }
                                          />
                                          <Textarea
                                            isClearable
                                            defaultValue={
                                              (q?.[
                                                dischargeRound.objective as keyof QuestionsData
                                              ] as string | null | undefined) ??
                                              ""
                                            }
                                            isDisabled={soapSectionLocked}
                                            isRequired={true}
                                            label="2. Objective data"
                                            labelPlacement="outside"
                                            minRows={3}
                                            name={dischargeRound.objective}
                                            placeholder="Description"
                                            variant="bordered"
                                            onChange={HandleChange}
                                            onClear={() =>
                                              HandleChange({
                                                target: {
                                                  name: dischargeRound.objective,
                                                  value: "",
                                                },
                                              })
                                            }
                                          />
                                          <Textarea
                                            isClearable
                                            defaultValue={
                                              (q?.[
                                                dischargeRound.assessment as keyof QuestionsData
                                              ] as string | null | undefined) ??
                                              ""
                                            }
                                            isDisabled={soapSectionLocked}
                                            isRequired={true}
                                            label="3. Assessment"
                                            labelPlacement="outside"
                                            minRows={3}
                                            name={dischargeRound.assessment}
                                            placeholder="Description"
                                            variant="bordered"
                                            onChange={HandleChange}
                                            onClear={() =>
                                              HandleChange({
                                                target: {
                                                  name: dischargeRound.assessment,
                                                  value: "",
                                                },
                                              })
                                            }
                                          />
                                          <Textarea
                                            isClearable
                                            defaultValue={
                                              (q?.[
                                                dischargeRound.plan as keyof QuestionsData
                                              ] as string | null | undefined) ??
                                              ""
                                            }
                                            isDisabled={soapSectionLocked}
                                            isRequired={true}
                                            label="4. Plan"
                                            labelPlacement="outside"
                                            minRows={3}
                                            name={dischargeRound.plan}
                                            placeholder="Description"
                                            variant="bordered"
                                            onChange={HandleChange}
                                            onClear={() =>
                                              HandleChange({
                                                target: {
                                                  name: dischargeRound.plan,
                                                  value: "",
                                                },
                                              })
                                            }
                                          />
                                          <Textarea
                                            isClearable
                                            defaultValue={
                                              (q?.[
                                                dischargeRound.note as keyof QuestionsData
                                              ] as string | null | undefined) ??
                                              ""
                                            }
                                            isDisabled={soapSectionLocked}
                                            label="5. หมายเหตุ"
                                            labelPlacement="outside"
                                            minRows={2}
                                            name={dischargeRound.note}
                                            placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)"
                                            variant="bordered"
                                            onChange={HandleChange}
                                            onClear={() =>
                                              HandleChange({
                                                target: {
                                                  name: dischargeRound.note,
                                                  value: "",
                                                },
                                              })
                                            }
                                          />
                                          <DatePicker
                                            showMonthAndYearPickers
                                            className="max-w-xs"
                                            defaultValue={parseDateForPicker(
                                              followUpVal
                                            )}
                                            isDisabled={soapSectionLocked}
                                            label="นัดพบครั้งถัดไป"
                                            labelPlacement="outside"
                                            name={
                                              FOLLOW_UP_ROUNDS[idx].followUp
                                            }
                                            selectorButtonPlacement="start"
                                            variant="bordered"
                                            onChange={(date) => {
                                              HandleChange({
                                                target: {
                                                  name: FOLLOW_UP_ROUNDS[idx]
                                                    .followUp,
                                                  value: date
                                                    ? date.toString()
                                                    : "",
                                                },
                                              });
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </Tab>
                                  );
                                })}
                              </Tabs>
                            </>
                          );
                        })()}
                      </CardBody>
                    </Card>
                  </div>
                )}
              </DrawerBody>
              <DrawerFooter className="flex w-full flex-wrap items-center justify-end gap-2 border-t border-default-200 bg-content1/40 px-4 py-3 sm:px-6">
                <Button color="danger" variant="light" onPress={onClose}>
                  ปิด
                </Button>
                {mode === "edit-consultation" && (
                  <Button
                    color="warning"
                    isDisabled={consultationLoading}
                    isLoading={consultationLoading}
                    type="button"
                    variant="flat"
                    onPress={openCloseCaseModal}
                  >
                    ปิดเคส
                  </Button>
                )}
                {mode === "edit-questionnaire" && (
                  <Button
                    color="primary"
                    isDisabled={questionnaireLoading}
                    isLoading={questionnaireLoading}
                    type="submit"
                    variant="flat"
                  >
                    บันทึกแบบประเมิน
                  </Button>
                )}
                {mode === "edit-consultation" && (
                  <Button
                    color={consultationSaved ? "success" : "primary"}
                    isDisabled={consultationLoading || !questionData?.consult}
                    isLoading={consultationLoading}
                    type="submit"
                    variant="flat"
                  >
                    {consultationSaved ? "บันทึกแล้ว" : "บันทึกการให้คำปรึกษา"}
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
        onSuccess={refreshDrawerData}
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
              isLoading={consultationLoading}
              onPress={handleCloseCase}
            >
              ยืนยันปิดเคส
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
