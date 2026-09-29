"use client";

import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Tab, Tabs } from "@heroui/tabs";
import { Progress } from "@heroui/progress";
import { Image } from "@heroui/image";
import {
  Question8Q,
  Question9Q,
  QuestionPhqa,
  QuestionPhqaAddon,
} from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Divider, InputOtp } from "@heroui/react";

import { title } from "@/components/primitives";
import {
  AssessmentChoiceGroup,
  FREQUENCY_OPTIONS,
  YES_NO_OPTIONS,
} from "@/components/assessment-choice-group";
import { LocationData, ProblemPayload } from "@/types";
import Loading from "@/app/loading";
import { calculateAge } from "@/utils/helper";
import { clearReferentRef, peekReferentRef } from "@/utils/referent-ref";
import {
  type AssessmentFlowGroup,
  getAssessmentFlowGroupFromAge,
} from "@/lib/assessment-scale";
import {
  isTwoQPositive,
  nextAfterTwoQ,
  resolveDepressionBackStep,
  shouldEnter8Q,
} from "@/lib/depression-flow";
import {
  normalize8QAddon,
  sum8Q,
  sum9Q,
  sumPhqa,
} from "@/lib/assessment-scoring";
import {
  buildAssessmentResultBlocks,
  type AssessmentResultDisplayInput,
} from "@/lib/assessment-result-display";
import {
  getScreeningProgressView,
  isElevatedScreeningRisk,
} from "@/lib/liff-screening-progress";
import {
  q2,
  qPhqa,
  phqaAddon,
  q9 as q9Questions,
  q8 as q8Questions,
  q8Addon as q8AddonQuestions,
  teenMindProblems,
} from "@/app/data";

const AUTO_ADVANCE_MS = 350;

export default function PHQAPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const profileId = searchParams.get("profileId") || "";

  const qPhqa_Image = [
    { src: "/image/Q1-01.png", alt: "PHQA Image 1" },
    { src: "/image/Q1-02.png", alt: "PHQA Image 2" },
    { src: "/image/Q1-03.png", alt: "PHQA Image 3" },
    { src: "/image/Q1-04.png", alt: "PHQA Image 4" },
    { src: "/image/Q1-05.png", alt: "PHQA Image 5" },
    { src: "/image/Q1-06.png", alt: "PHQA Image 6" },
    { src: "/image/Q1-07.png", alt: "PHQA Image 7" },
    { src: "/image/Q1-08.png", alt: "PHQA Image 8" },
    { src: "/image/Q1-09.png", alt: "PHQA Image 9" },
  ].map((image, index) => (
    <Image
      key={index}
      alt={image.alt}
      className="h-[20vh]"
      loading="eager"
      src={image.src}
    />
  ));

  const q2_Image = [
    { src: "/image/Q2-01.png", alt: "PHQA Addon Image 1" },
    { src: "/image/Q2-02.png", alt: "PHQA Addon Image 2" },
  ].map((image, index) => (
    <Image
      key={index}
      alt={image.alt}
      className="h-[20vh]"
      loading="eager"
      src={image.src}
    />
  ));

  const phqaInitValue: QuestionPhqa = {
    id: "",
    caseId: "",
    round: 1,
    q1: 99,
    q2: 99,
    q3: 99,
    q4: 99,
    q5: 99,
    q6: 99,
    q7: 99,
    q8: 99,
    q9: 99,
    sum: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const Q2InitValue: QuestionPhqaAddon = {
    id: "",
    caseId: "",
    round: 1,
    q1: 99,
    q2: 99,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const phqaAddonInitValue: QuestionPhqaAddon = {
    id: "",
    caseId: "",
    round: 1,
    q1: 99,
    q2: 99,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const q9InitValue: Question9Q = {
    id: "",
    caseId: "",
    round: 1,
    q1: 99,
    q2: 99,
    q3: 99,
    q4: 99,
    q5: 99,
    q6: 99,
    q7: 99,
    q8: 99,
    q9: 99,
    sum: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const q8InitValue: Question8Q = {
    id: "",
    caseId: "",
    round: 1,
    q1: 99,
    q2: 99,
    q3: 99,
    q4: 99,
    q5: 99,
    q6: 99,
    q7: 99,
    // ชุดคำถามใน `app/data.ts`: 8 ข้อหลัก + คำถามต่อเนื่อง (q8Addon)
    q8: 99,
    q8Addon: 99,
    sum: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const problemInitValue: ProblemPayload = {
    familyRelation: 0,
    familyStudyPressure: 0,
    familyConflict: 0,
    familyAbuse: 0,
    familyLoss: 0,
    socialFriendIssue: 0,
    socialBullying: 0,
    socialBreakup: 0,
    socialTeacher: 0,
    socialAssault: 0,
    studyStress: 0,
    studyNoMotivation: 0,
    studyBurnout: 0,
    studyTimeManage: 0,
    studyHomeworkLoad: 0,
    studyExamAnxiety: 0,
    financeFamilyIssue: 0,
    lifestyleSocialMediaOveruse: 0,
    lifestyleGamingAddiction: 0,
    lifestyleSubstanceUse: 0,
    lifestyleEatingIssue: 0,
    lifestyleBodyImageConcern: 0,
    lifestyleInsomnia: 0,
    sum: 0,
  };

  const router = useRouter();
  const { data: session, status } = useSession();
  const [showPHQA, setPHQAShow] = useState(false);
  const [showPHQAAddon, setPHQAAddonShow] = useState(false);
  const [showQ9, setShowQ9] = useState(false);
  const [showQ8, setShowQ8] = useState(false);
  const [showProblem, setShowProblem] = useState(false);
  const [show8QInterstitial, setShow8QInterstitial] = useState(false);
  const [twoQNegativePath, setTwoQNegativePath] = useState(false);
  const [entered8Q, setEntered8Q] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [profileIdState, setProfileIdState] = useState("");
  const [ageGroup, setAgeGroup] = useState<AssessmentFlowGroup | null>(null);
  const [referenceId, setReferenceId] = useState("");
  const [referentData, setReferentData] = useState<{
    fullName: string;
    affiliation: string;
    agency: string;
    facilityUnit?: string | null;
  }>();
  const [question, setQuestion] = useState("1");
  const [isModalOpened, setIsModalOpened] = useState(false);
  const [isOtpEmpty, setIsOtpEmpty] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [phqa_data, setPHQA] = useState<QuestionPhqa>(phqaInitValue);
  const [Q2_data, setQ2] = useState<QuestionPhqaAddon>(Q2InitValue);
  const [phqaAddon_data, setPHQAAddon] =
    useState<QuestionPhqaAddon>(phqaAddonInitValue);
  const [q9_data, setQ9] = useState<Question9Q>(q9InitValue);
  const [q8_data, setQ8] = useState<Question8Q>(q8InitValue);
  const [problem_data, setProblem] = useState<ProblemPayload>(problemInitValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [location, setLocation] = useState<LocationData>();
  const [calculationResult, setCalculationResult] =
    useState<AssessmentResultDisplayInput | null>(null);
  const resultBlocks = calculationResult
    ? buildAssessmentResultBlocks(calculationResult)
    : [];
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const applyProfileContext = useCallback(
    (id: string, birthDate: string | Date | null | undefined) => {
      setProfileIdState(id);

      if (birthDate) {
        const age = calculateAge(String(birthDate));

        // spec: อายุ < 18 -> PHQ-A, อายุ >= 18 -> 9Q
        setAgeGroup(getAssessmentFlowGroupFromAge(age));
      } else {
        setAgeGroup(null);
      }

      setPHQAShow(false);
      setPHQAAddonShow(false);
      setShowQ9(false);
      setShowQ8(false);
      setShowProblem(false);
      setShow8QInterstitial(false);
      setTwoQNegativePath(false);
      setEntered8Q(false);
      setQuestion("1");
      setCanProceed(false);
    },
    []
  );

  const checkProfile = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/profile/user/${id}`);
        const data = await response.json();

        if (!data?.profile?.length) {
          router.push("/liff/privacy");
        } else {
          applyProfileContext(data.profile[0].id, data.profile[0].birthDate);
        }
      } catch (error) {
        setErrorMessage(
          "เกิดข้อผิดพลาดในการตรวจสอบข้อมูลผู้ใช้งาน กรุณาลองใหม่อีกครั้ง" +
            error
        );
        setIsModalOpened(true);
        router.push("/liff");
      }
    },
    [applyProfileContext, router]
  );

  const loadAssessmentProfile = useCallback(
    async (targetProfileId: string) => {
      try {
        const response = await fetch(
          `/api/profile/assessment/${targetProfileId}`
        );

        if (!response.ok) {
          throw new Error("ไม่พบข้อมูลวัยรุ่นที่ลงทะเบียน");
        }

        const data = await response.json();

        applyProfileContext(data.id, data.birthDate);
      } catch (error) {
        setErrorMessage(
          "เกิดข้อผิดพลาดในการโหลดข้อมูลวัยรุ่น กรุณาลองใหม่อีกครั้ง" + error
        );
        setIsModalOpened(true);
        router.push("/liff");
      }
    },
    [applyProfileContext, router]
  );

  useEffect(() => {
    if (status !== "loading" && status === "authenticated") {
      if (profileId) {
        loadAssessmentProfile(profileId);
      } else if (session?.user?.id) {
        checkProfile(session.user.id as string);
      }
    } else if (profileId) {
      setProfileIdState(profileId);
      setAgeGroup(null);
    } else {
      setProfileIdState("");
      setAgeGroup(null);
    }

    // ตรวจสอบ ref จาก QR — ใช้จาก URL ก่อน ถ้าไม่มีค่อยอ่านจาก sessionStorage
    // เปิด modal ให้กรอกรหัส อสท. ก็ต่อเมื่อไม่พบ ref จากที่ไหนเลย
    // หรือเมื่อ ref ชี้ไปอาสาสมัครที่ปิดการใช้งานแล้ว
    const effectiveRef = ref || peekReferentRef();

    if (effectiveRef) {
      setReferenceId(effectiveRef);
      void (async () => {
        try {
          const response = await fetch(
            `/api/data/referent/${parseInt(effectiveRef, 10)}`
          );
          const data = await response.json();
          const row = Array.isArray(data) ? data[0] : null;

          if (!row) {
            setReferenceId("");
            onOpen();
          }
        } catch {
          setReferenceId("");
          onOpen();
        }
      })();
    } else {
      onOpen();
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        const { accuracy, latitude, longitude } = coords;

        setLocation({ accuracy, latitude, longitude });
      });
    }

    // เริ่มต้นที่ข้อแรก
  }, [
    session,
    status,
    profileId,
    ref,
    checkProfile,
    loadAssessmentProfile,
    onOpen,
  ]);

  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearAutoAdvance(), [clearAutoAdvance]);

  const handleNextRef = useRef<() => void>(() => {});

  const scheduleAutoAdvance = useCallback(() => {
    clearAutoAdvance();
    autoAdvanceTimerRef.current = setTimeout(() => {
      handleNextRef.current();
    }, AUTO_ADVANCE_MS);
  }, [clearAutoAdvance]);

  const fetchReferentData = useCallback(async (id: string) => {
    const referentId = parseInt(id);

    setIsLoading(true);

    try {
      const response = await fetch(`/api/data/referent/${referentId}`);
      const data = await response.json();
      const row = Array.isArray(data) ? data[0] : null;

      if (!row) {
        throw new Error("not found");
      }

      const facilityName = row.healthcareFacility?.name ?? "";

      setReferentData({
        fullName: `${row.firstName} ${row.lastName}`.trim(),
        affiliation: row.affiliation?.name ?? "",
        agency: facilityName,
        facilityUnit: row.facilityUnit?.name ?? null,
      });
    } catch {
      setReferentData({
        fullName: "ไม่พบข้อมูล",
        affiliation: "ไม่พบข้อมูล",
        agency: "ไม่พบข้อมูล",
        facilityUnit: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const ReferChange = useCallback(
    (e: React.FormEvent<HTMLDivElement> | string) => {
      const value =
        typeof e === "string"
          ? e
          : ((
              e as React.FormEvent<HTMLDivElement>
            ).currentTarget?.querySelector?.<HTMLInputElement>("input")
              ?.value ?? "");

      setReferenceId(value);
      setIsOtpEmpty(value.length < 3);
      if (value.length === 3) {
        fetchReferentData(value);
      }
    },
    [fetchReferentData]
  );

  const phqaChange = useCallback(
    (questionNo: number, value: string) => {
      const name = "q" + questionNo;

      setCanProceed(true);

      setPHQA((prev) => {
        const newData = {
          ...prev,
          [name]: parseInt(value, 10),
        };

        const sum = Object.keys(newData)
          .filter((key) => key.startsWith("q") && key !== "caseId")
          .reduce(
            (acc: number, key: string) =>
              acc + (Number(newData[key as keyof QuestionPhqa]) || 0),
            0
          );

        return { ...newData, sum };
      });

      scheduleAutoAdvance();
    },
    [scheduleAutoAdvance]
  );

  const Q2Change = useCallback(
    (questionNo: number, value: string) => {
      const name = "q" + questionNo;

      setCanProceed(true);

      setQ2((prev) => ({
        ...prev,
        [name]: parseInt(value, 10),
      }));

      scheduleAutoAdvance();
    },
    [scheduleAutoAdvance]
  );

  const phqaAddonChange = useCallback(
    (questionNo: number, value: string) => {
      const name = "q" + (questionNo - 11);

      setCanProceed(true);

      setPHQAAddon((prev) => ({
        ...prev,
        [name]: parseInt(value, 10),
      }));

      scheduleAutoAdvance();
    },
    [scheduleAutoAdvance]
  );

  const q9Change = useCallback(
    (questionNo: number, value: string) => {
      const name = "q" + questionNo;

      setCanProceed(true);

      setQ9((prev) => {
        const newData = {
          ...prev,
          [name]: parseInt(value, 10),
        } as Question9Q;

        const q9Keys = [
          "q1",
          "q2",
          "q3",
          "q4",
          "q5",
          "q6",
          "q7",
          "q8",
          "q9",
        ] as const;
        const sum = q9Keys.reduce(
          (acc: number, key) => acc + Number(newData[key] ?? 0),
          0
        );

        return { ...newData, sum };
      });

      scheduleAutoAdvance();
    },
    [scheduleAutoAdvance]
  );

  const q8Change = useCallback(
    (questionNo: number, value: string) => {
      const name = ("q" + questionNo) as keyof Question8Q;
      const parsed = parseInt(value, 10);

      setCanProceed(true);

      setQ8((prev) => {
        const updated = {
          ...prev,
          [name]: parsed,
          ...(questionNo === 3 && parsed === 0 ? { q8Addon: 0 } : {}),
        } as Question8Q;

        const sum =
          Number(updated.q1 ?? 0) +
          Number(updated.q2 ?? 0) +
          Number(updated.q3 ?? 0) +
          Number(updated.q4 ?? 0) +
          Number(updated.q5 ?? 0) +
          Number(updated.q6 ?? 0) +
          Number(updated.q7 ?? 0) +
          Number(updated.q8 ?? 0) +
          Number(updated.q8Addon ?? 0);

        return { ...updated, sum };
      });

      scheduleAutoAdvance();
    },
    [scheduleAutoAdvance]
  );

  const q8AddonChange = useCallback(
    (value: string) => {
      const parsed = parseInt(value, 10);

      setCanProceed(true);

      setQ8((prev) => {
        const updated = { ...prev, q8Addon: parsed };
        const sum =
          Number(updated.q1 ?? 0) +
          Number(updated.q2 ?? 0) +
          Number(updated.q3 ?? 0) +
          Number(updated.q4 ?? 0) +
          Number(updated.q5 ?? 0) +
          Number(updated.q6 ?? 0) +
          Number(updated.q7 ?? 0) +
          Number(updated.q8 ?? 0) +
          Number(parsed ?? 0);

        return { ...updated, sum };
      });
      scheduleAutoAdvance();
    },
    [scheduleAutoAdvance]
  );

  const toggleProblem = useCallback((key: keyof ProblemPayload) => {
    if (key === "sum") return;
    setProblem((prev) => {
      const nextValue = prev[key] === 1 ? 0 : 1;
      const nextData = {
        ...prev,
        [key]: nextValue,
      };
      const keys = Object.keys(nextData).filter(
        (itemKey) => itemKey !== "sum"
      ) as Array<keyof ProblemPayload>;
      const sum = keys.reduce(
        (acc, itemKey) =>
          acc + Number(itemKey !== "sum" && Number(nextData[itemKey]) === 1),
        0
      );

      return { ...nextData, sum };
    });
    setCanProceed(true);
  }, []);

  const openEightQInterstitial = useCallback(() => {
    clearAutoAdvance();
    setPHQAShow(false);
    setPHQAAddonShow(false);
    setShowQ9(false);
    setShowQ8(false);
    setShowProblem(false);
    setShow8QInterstitial(true);
    setEntered8Q(true);
    setCanProceed(false);
  }, [clearAutoAdvance]);

  const startEightQ = useCallback(() => {
    if (!ageGroup) return;
    const q8Start = ageGroup === "phqa" ? 14 : 12;

    setShow8QInterstitial(false);
    setShowQ8(true);
    setQuestion(q8Start.toString());
    setCanProceed(false);
  }, [ageGroup]);

  const handleNext = useCallback(() => {
    if (!ageGroup) return;
    clearAutoAdvance();

    const currentQuestion = parseInt(question, 10);
    const q8Start = ageGroup === "phqa" ? 14 : 12;
    const q8LastKey = q8Start + 8;
    const problemStepKey = q8LastKey + 1;

    const resetForNext = (nextKey: number) => {
      setQuestion(nextKey.toString());
      setCanProceed(false);
    };

    if (currentQuestion === 2) {
      if (nextAfterTwoQ(Number(Q2_data.q1), Number(Q2_data.q2)) === "problem") {
        setPHQAShow(false);
        setPHQAAddonShow(false);
        setShowQ9(false);
        setShowQ8(false);
        setShowProblem(true);
        setTwoQNegativePath(true);
        resetForNext(problemStepKey);
        setCanProceed(true);

        return;
      }

      const isUnder12 = ageGroup === "phqa";

      setTwoQNegativePath(false);
      setPHQAShow(isUnder12);
      setPHQAAddonShow(false);
      setShowQ9(!isUnder12);
      setShowQ8(false);
      setShowProblem(false);
      resetForNext(3);

      return;
    }

    if (ageGroup === "phqa") {
      if (currentQuestion >= 3 && currentQuestion < 11) {
        resetForNext(currentQuestion + 1);

        return;
      }

      if (currentQuestion === 11) {
        setPHQAShow(false);
        setPHQAAddonShow(true);
        setShowQ9(false);
        setShowQ8(false);
        setShowProblem(false);
        resetForNext(12);

        return;
      }

      if (currentQuestion === 12) {
        resetForNext(13);

        return;
      }

      if (currentQuestion === 13) {
        const phqaSum = sumPhqa(phqa_data);

        if (!shouldEnter8Q("PHQA", phqaSum)) {
          setPHQAAddonShow(false);
          setShowQ9(false);
          setShowQ8(false);
          setShowProblem(true);
          setEntered8Q(false);
          resetForNext(problemStepKey);
          setCanProceed(true);

          return;
        }

        openEightQInterstitial();

        return;
      }
    }

    if (ageGroup === "nineq") {
      if (currentQuestion >= 3 && currentQuestion < 11) {
        resetForNext(currentQuestion + 1);

        return;
      }

      if (currentQuestion === 11) {
        const nineSum = sum9Q(q9_data);

        if (!shouldEnter8Q("9Q", nineSum)) {
          setPHQAShow(false);
          setPHQAAddonShow(false);
          setShowQ9(false);
          setShowQ8(false);
          setShowProblem(true);
          setEntered8Q(false);
          resetForNext(problemStepKey);
          setCanProceed(true);

          return;
        }

        openEightQInterstitial();

        return;
      }
    }

    if (currentQuestion >= q8Start && currentQuestion < q8LastKey) {
      let nextKey = currentQuestion + 1;

      if (currentQuestion === q8Start + 2 && q8_data.q3 === 0) {
        nextKey = q8Start + 4;
      }
      setQuestion(nextKey.toString());
      setCanProceed(false);

      return;
    }

    if (currentQuestion === q8LastKey) {
      setShowQ8(false);
      setShowProblem(true);
      setQuestion(problemStepKey.toString());
      setCanProceed(true);

      return;
    }

    resetForNext(currentQuestion + 1);
  }, [
    question,
    ageGroup,
    q8_data.q3,
    Q2_data,
    phqa_data,
    q9_data,
    clearAutoAdvance,
    openEightQInterstitial,
  ]);

  handleNextRef.current = handleNext;

  const SaveToDB = async () => {
    setIsSaving(true);

    if (!ageGroup) {
      setErrorMessage("ยังไม่ทราบช่วงอายุของผู้ใช้");
      setIsModalOpened(true);
      setIsSaving(false);

      return;
    }

    // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    if (!profileIdState) {
      setErrorMessage("ไม่พบข้อมูลผู้ใช้งาน กรุณาลงทะเบียนใหม่");
      setIsModalOpened(true);
      setIsSaving(false);

      return;
    }

    // ตรวจสอบ Q2 (2Q)
    const q2Answers = [Q2_data.q1, Q2_data.q2].map((v) => Number(v));
    const hasAllQ2Answers = q2Answers.every(
      (value) => !isNaN(value) && value >= 0 && value <= 1
    );

    if (!hasAllQ2Answers) {
      setErrorMessage("กรุณาตอบคำถาม 2Q ให้ครบทุกข้อ");
      setIsModalOpened(true);
      setIsSaving(false);

      return;
    }

    const twoQPositive = isTwoQPositive(q2Answers[0], q2Answers[1]);
    const problemPayload =
      Number(problem_data.sum ?? 0) > 0 ? problem_data : undefined;

    let dataToSave: Record<string, unknown>;
    let scoreSum = 0;
    let q8_sum = 0;
    let needs8Q = false;
    const mainScale = ageGroup === "phqa" ? "PHQA" : "9Q";

    if (!twoQPositive) {
      dataToSave = {
        profileId: profileIdState,
        Q2: Q2_data,
        ...(problemPayload ? { problem: problemPayload } : {}),
        location: location || null,
        reference: referenceId ? parseInt(referenceId) : null,
      };
    } else {
      // ตรวจสอบ 8Q เฉพาะเมื่อเข้าเกณฑ์
      const mainSumPreview =
        ageGroup === "phqa" ? sumPhqa(phqa_data) : sum9Q(q9_data);

      needs8Q = shouldEnter8Q(mainScale, mainSumPreview);

      if (needs8Q) {
        const q8MainAnswers = [
          q8_data.q1,
          q8_data.q2,
          q8_data.q3,
          q8_data.q4,
          q8_data.q5,
          q8_data.q6,
          q8_data.q7,
          q8_data.q8,
        ].map((v) => Number(v));
        const hasAllQ8MainAnswers = q8MainAnswers.every(
          (value) => !isNaN(value) && value !== 99
        );

        if (!hasAllQ8MainAnswers) {
          setErrorMessage("กรุณาตอบคำถาม 8Q ให้ครบทุกข้อ");
          setIsModalOpened(true);
          setIsSaving(false);

          return;
        }

        const q8NeedsAddon = q8_data.q3 === 6;
        const q8AddonValue = q8NeedsAddon ? q8_data.q8Addon : 0;

        if (q8NeedsAddon) {
          if (q8AddonValue === 99 || isNaN(Number(q8AddonValue))) {
            setErrorMessage("กรุณาตอบคำถามต่อเนื่อง 8Q ให้ครบถ้วน");
            setIsModalOpened(true);
            setIsSaving(false);

            return;
          }
        }

        q8_sum = sum8Q({
          ...q8_data,
          q8Addon: normalize8QAddon(Number(q8_data.q3 ?? 0), q8AddonValue),
        });
      }

      const q8AddonForSave = normalize8QAddon(
        Number(q8_data.q3 ?? 0),
        q8_data.q8Addon
      );

      if (ageGroup === "phqa") {
        // ตรวจสอบ PHQ-A (PHQA)
        const phqaAnswers = Object.entries(phqa_data)
          .filter(([key]) => key.startsWith("q") && key !== "caseId")
          .map(([_, value]) => Number(value));

        const hasAllPhqaAnswers = phqaAnswers.every(
          (value) => !isNaN(value) && value >= 0 && value <= 3
        );

        if (!hasAllPhqaAnswers) {
          setErrorMessage("กรุณาตอบคำถาม PHQ-A ให้ครบทุกข้อ");
          setIsModalOpened(true);
          setIsSaving(false);

          return;
        }

        // ตรวจสอบ PHQ-A Addon
        const hasAllPhqaAddonAnswers =
          !isNaN(phqaAddon_data.q1) &&
          phqaAddon_data.q1 >= 0 &&
          phqaAddon_data.q1 <= 1 &&
          !isNaN(phqaAddon_data.q2) &&
          phqaAddon_data.q2 >= 0 &&
          phqaAddon_data.q2 <= 1;

        if (!hasAllPhqaAddonAnswers) {
          setErrorMessage("กรุณาตอบคำถาม PHQ-A Addon ให้ครบทุกข้อ");
          setIsModalOpened(true);
          setIsSaving(false);

          return;
        }

        scoreSum = phqaAnswers.reduce(
          (acc: number, val: number) => acc + val,
          0
        );

        dataToSave = {
          profileId: profileIdState,
          phqa: {
            ...phqa_data,
            sum: scoreSum,
          },
          Q2: Q2_data,
          phqaAddon: phqaAddon_data,
          ...(needs8Q
            ? {
                q8: {
                  ...q8_data,
                  q8Addon: q8AddonForSave,
                  sum: q8_sum,
                },
              }
            : {}),
          ...(problemPayload ? { problem: problemPayload } : {}),
          location: location || null,
          reference: referenceId ? parseInt(referenceId) : null,
        };
      } else {
        // over12: ตรวจสอบ 9Q
        const q9Answers = Object.entries(q9_data)
          .filter(([key]) => key.startsWith("q") && key !== "caseId")
          .map(([_, value]) => Number(value));

        const hasAllQ9Answers = q9Answers.every(
          (value) => !isNaN(value) && value >= 0 && value <= 3
        );

        if (!hasAllQ9Answers) {
          setErrorMessage("กรุณาตอบคำถาม 9Q ให้ครบทุกข้อ");
          setIsModalOpened(true);
          setIsSaving(false);

          return;
        }

        scoreSum = q9Answers.reduce((acc: number, val: number) => acc + val, 0);

        dataToSave = {
          profileId: profileIdState,
          Q2: Q2_data,
          q9: {
            ...q9_data,
            sum: scoreSum,
          },
          ...(needs8Q
            ? {
                q8: {
                  ...q8_data,
                  q8Addon: q8AddonForSave,
                  sum: q8_sum,
                },
              }
            : {}),
          ...(problemPayload ? { problem: problemPayload } : {}),
          location: location || null,
          reference: referenceId ? parseInt(referenceId) : null,
        };
      }
    } // end twoQPositive

    try {
      const response = await fetch("/api/question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      const responseData = await response.json();

      if (response.ok) {
        // บันทึกแบบประเมินสำเร็จ — ล้าง ref ที่เก็บไว้ ไม่ให้ค้างไปปนการประเมินรอบถัดไปในแท็บเดิม
        clearReferentRef();
        setCalculationResult({
          twoQPositive,
          took8Q: needs8Q,
          mainScale: twoQPositive ? mainScale : null,
          mainSum: twoQPositive ? scoreSum : null,
          mainResult: responseData.data.result ?? null,
          mainResultText: responseData.data.result_text ?? null,
          eightQSum: needs8Q ? q8_sum : null,
        });
      } else {
        setErrorMessage(
          `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${
            responseData.error || responseData.message || "กรุณาลองใหม่อีกครั้ง"
          }`
        );
        setIsModalOpened(true);
      }
    } catch (error) {
      setErrorMessage(
        `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง"}`
      );
      setIsModalOpened(true);
    } finally {
      setIsSaving(false);
    }
  };

  const BackStep = useCallback(() => {
    if (!ageGroup) return;
    clearAutoAdvance();

    const target = resolveDepressionBackStep({
      ageGroup,
      questionKey: parseInt(question, 10),
      show8QInterstitial,
      showProblem,
      showPHQA,
      showPHQAAddon,
      showQ9,
      showQ8,
      twoQNegativePath,
      entered8Q,
      q8q3: Number(q8_data.q3),
      phqaAddonQ2Answered: Number(phqaAddon_data.q2) !== 99,
      q9q9Answered: Number(q9_data.q9) !== 99,
    });

    if (target.action === "exit") {
      const exitRef = ref || peekReferentRef();

      router.push(
        exitRef
          ? `/liff/question?ref=${encodeURIComponent(exitRef)}`
          : "/liff/question"
      );

      return;
    }

    setQuestion(target.questionKey.toString());
    setCanProceed(target.canProceed);
    setPHQAShow(target.showPHQA);
    setPHQAAddonShow(target.showPHQAAddon);
    setShowQ9(target.showQ9);
    setShowQ8(target.showQ8);
    setShowProblem(target.showProblem);
    setShow8QInterstitial(target.show8QInterstitial);
    setTwoQNegativePath(target.twoQNegativePath);
    setEntered8Q(target.entered8Q);
  }, [
    ageGroup,
    question,
    clearAutoAdvance,
    show8QInterstitial,
    showProblem,
    showPHQA,
    showPHQAAddon,
    showQ9,
    showQ8,
    twoQNegativePath,
    entered8Q,
    q8_data.q3,
    phqaAddon_data.q2,
    q9_data.q9,
    ref,
    router,
  ]);

  const progressView =
    ageGroup != null
      ? getScreeningProgressView({
          ageGroup,
          questionKey: parseInt(question, 10),
          show8QInterstitial,
          twoQNegativePath,
          entered8Q: entered8Q || show8QInterstitial || showQ8,
          q8AddonInPath: Number(q8_data.q3) === 6,
        })
      : null;

  const showElevatedHelp =
    calculationResult != null &&
    isElevatedScreeningRisk({
      mainResult: calculationResult.mainResult,
      eightQSum: calculationResult.eightQSum,
      took8Q: calculationResult.took8Q,
    });

  return (
    <section className="flex min-h-[100dvh] w-[calc(100vw)] flex-col items-center gap-4 px-8 pb-0 pt-10 md:py-10">
      <Suspense fallback={<Loading />}>
        <Modal
          backdrop="blur"
          hideCloseButton={true}
          isDismissable={false}
          isKeyboardDismissDisabled={true}
          isOpen={isOpen}
          placement="center"
          size="xs"
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="flex flex-col items-center font-semibold text-2xl">
                  กรอกรหัสผู้ให้คำแนะนำ
                </ModalHeader>
                <ModalBody className="items-center text-center">
                  <Divider />
                  <div className="flex justify-center">
                    <InputOtp
                      className="items-center"
                      errorMessage="กรุณากรอกรหัสผู้ให้คำแนะนำให้ถูกต้อง"
                      length={3}
                      radius="lg"
                      size="lg"
                      value={referenceId}
                      variant="bordered"
                      onChange={(val) => ReferChange(val)}
                    />
                  </div>
                  <Divider />
                  {referenceId.length == 3 &&
                    (isLoading ? (
                      <div className="flex justify-center items-center p-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                      </div>
                    ) : referentData?.fullName !== "ไม่พบข้อมูล" ? (
                      <span className="flex flex-col box-border rounded-lg bg-primary-100 text-primary-500 p-3 text-left w-full text-md font-semibold">
                        ชื่อผู้ให้คำแนะนำ : {referentData?.fullName}
                        <br />
                        สังกัด : {referentData?.affiliation}
                        <br />
                        หน่วยงาน : {referentData?.agency || "-"}
                        <br />
                        หน่วยงานย่อย : {referentData?.facilityUnit || "-"}
                      </span>
                    ) : (
                      <span className="flex flex-col box-border rounded-lg bg-danger-100 text-danger-500 p-3 text-center w-full text-md font-semibold">
                        รหัสผู้ให้คำแนะนำไม่ถูกต้อง
                      </span>
                    ))}
                </ModalBody>
                <ModalFooter className="flex flex-col justify-center gap-2">
                  <Button
                    className="w-full"
                    color="primary"
                    isDisabled={
                      isOtpEmpty ||
                      isLoading ||
                      (typeof referentData !== "string" &&
                        referentData?.fullName === "ไม่พบข้อมูล")
                    }
                    radius="full"
                    variant="solid"
                    onPress={() => onOpenChange()}
                  >
                    ใช้รหัสนี้
                  </Button>
                  <Button
                    className="w-full"
                    color="default"
                    radius="full"
                    variant="bordered"
                    onPress={() => {
                      setReferenceId("");
                      onOpenChange();
                    }}
                  >
                    ข้าม
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <Modal
          backdrop="blur"
          isOpen={isModalOpened}
          placement="center"
          size="xs"
          onOpenChange={() => setIsModalOpened(false)}
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="flex flex-col items-center font-semibold text-2xl">
                  แจ้งเตือน
                </ModalHeader>
                <ModalBody className="items-center text-center">
                  <span className="flex flex-col box-border rounded-lg bg-danger-100 text-danger-500 p-3 text-center w-full text-md font-semibold">
                    {errorMessage}
                  </span>
                </ModalBody>
                <ModalFooter className="flex flex-col justify-center">
                  <Button
                    className="w-full"
                    color="primary"
                    radius="full"
                    variant="solid"
                    onPress={() => setIsModalOpened(false)}
                  >
                    ตกลง
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <h1 className={title({ size: "xs" })}>แบบประเมินภาวะซึมเศร้า</h1>

        {progressView ? (
          <div className="flex w-full max-w-md flex-col gap-2">
            <p className="text-sm text-default-600 text-center">
              {progressView.label}
            </p>
            <Progress
              aria-label={progressView.label}
              className="max-w-md"
              value={progressView.progressPercent}
            />
          </div>
        ) : null}

        {calculationResult && (
          <Modal
            backdrop="blur"
            hideCloseButton={false}
            isDismissable={true}
            isOpen={true}
            placement="center"
            size="sm"
            onClose={() => {
              setCalculationResult(null);
              router.push(profileId ? "/liff/referent" : "/liff");
            }}
          >
            <ModalContent>
              {() => (
                <>
                  <ModalHeader className="flex flex-col items-center font-semibold text-2xl">
                    ผลการประเมิน
                  </ModalHeader>
                  <ModalBody className="items-center text-center">
                    <div className="w-full space-y-5">
                      {resultBlocks.map((block) => (
                        <div key={block.key} className="w-full space-y-2">
                          <p className="font-semibold">
                            {block.scoreLine ?? block.title}
                          </p>
                          <div className="flex w-full flex-col items-center gap-2">
                            <span className={block.textColor}>
                              {block.text}
                            </span>
                            {block.scoreRange ? (
                              <span className="text-xs text-default-500">
                                เกณฑ์คะแนน: {block.scoreRange}
                              </span>
                            ) : null}
                            <div className="flex h-2 w-full overflow-hidden rounded-full">
                              <div
                                className={`h-full w-full ${block.barColor}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {showElevatedHelp ? (
                        <div className="rounded-xl bg-danger-50 p-3 text-sm text-danger-700 text-left">
                          <p className="font-semibold mb-1">
                            หากรู้สึกไม่ไหวหรือคิดทำร้ายตัวเอง
                          </p>
                          <p>
                            คุยกับผู้ใหญ่ที่ไว้ใจ
                            หรือติดต่อหน่วยบริการใกล้บ้านได้ทันที
                            {referentData?.fullName &&
                            referentData.fullName !== "ไม่พบข้อมูล"
                              ? ` · ผู้ให้คำแนะนำ: ${referentData.fullName}${
                                  referentData.agency
                                    ? ` (${referentData.agency})`
                                    : ""
                                }`
                              : ""}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </ModalBody>
                  <ModalFooter className="flex flex-col justify-center">
                    <Button
                      className="w-full"
                      color="primary"
                      isLoading={isNavigating}
                      radius="full"
                      variant="solid"
                      onPress={() => {
                        setIsNavigating(true);
                        router.push(profileId ? "/liff/referent" : "/liff");
                      }}
                    >
                      กลับหน้าหลัก
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        )}

        <div className="flex w-full flex-1 flex-col min-h-0 pb-4">
          {show8QInterstitial ? (
            <div className="flex flex-col gap-4 text-start rounded-2xl border border-default-200 p-5 mt-2">
              <p className="font-semibold text-lg text-primary-600">
                คำถามถัดไปอาจรู้สึกหนักหน่อย
              </p>
              <p className="text-default-600 text-sm leading-relaxed">
                ส่วนนี้ถามถึงความรู้สึกเกี่ยวกับการทำร้ายตัวเอง ตอบตามจริงได้เลย
                ไม่มีถูกหรือผิด และคุณสามารถย้อนกลับได้หากต้องการ
              </p>
              <Button
                className="w-full mt-2"
                color="primary"
                radius="full"
                size="lg"
                variant="solid"
                onPress={() => startEightQ()}
              >
                เริ่มต่อ
              </Button>
              <Button
                className="w-full"
                color="default"
                radius="full"
                size="lg"
                variant="bordered"
                onPress={() => BackStep()}
              >
                ย้อนกลับ
              </Button>
            </div>
          ) : (
            <div className="flex flex-col w-full min-h-[calc(100vh_-_350px)]">
              <Tabs
                aria-label="Options"
                className="max-w-xs"
                classNames={{ tabList: "invisible" }}
                color="primary"
                selectedKey={question}
                variant="underlined"
              >
                {!showPHQA &&
                !showPHQAAddon &&
                !showQ9 &&
                !showQ8 &&
                !showProblem
                  ? q2.map((val, index) => (
                      <Tab
                        key={(index + 1).toString()}
                        title={(index + 1).toString()}
                      >
                        <div className="flex flex-col gap-4 mt-[-50px]">
                          <div className="flex flex-col items-center">
                            {q2_Image[index]}
                          </div>
                          <div className="flex flex-col gap-4 items-start text-start">
                            <p className="text-primary-500 font-semibold">
                              {index + 1}. {val}
                            </p>
                            <div className="flex flex-col gap-2 w-full">
                              <AssessmentChoiceGroup
                                label="เลือกข้อที่รู้สึกตรงกับตัวเอง"
                                options={YES_NO_OPTIONS}
                                value={
                                  Number(
                                    Q2_data[`q${index + 1}` as "q1" | "q2"]
                                  ) === 99
                                    ? ""
                                    : String(
                                        Q2_data[`q${index + 1}` as "q1" | "q2"]
                                      )
                                }
                                onSelect={(value) => Q2Change(index + 1, value)}
                              />
                            </div>
                          </div>
                        </div>
                      </Tab>
                    ))
                  : showPHQA
                    ? qPhqa.map((val, index) => {
                        const questionNumber = index + 1;

                        return (
                          <Tab
                            key={(index + 3).toString()}
                            title={(index + 3).toString()}
                          >
                            <div className="flex flex-col gap-4 mt-[-50px]">
                              <div className="flex flex-col items-center">
                                {qPhqa_Image[index]}
                              </div>
                              <div className="flex flex-col gap-4 items-start text-start">
                                <p className="text-primary-500 font-semibold">
                                  {questionNumber}. {val}
                                </p>
                                <div className="flex flex-col gap-2 w-full">
                                  <AssessmentChoiceGroup
                                    label="ในช่วง 2 สัปดาห์ คุณมีอาการเหล่านี้บ่อยแค่ไหน"
                                    options={FREQUENCY_OPTIONS}
                                    value={
                                      Number(
                                        phqa_data[
                                          `q${questionNumber}` as keyof QuestionPhqa
                                        ]
                                      ) === 99
                                        ? ""
                                        : String(
                                            phqa_data[
                                              `q${questionNumber}` as keyof QuestionPhqa
                                            ]
                                          )
                                    }
                                    onSelect={(value) =>
                                      phqaChange(questionNumber, value)
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </Tab>
                        );
                      })
                    : showPHQAAddon
                      ? phqaAddon.map((val, index) => {
                          const questionNumber = index + 1;

                          return (
                            <Tab
                              key={(index + 12).toString()}
                              title={(index + 12).toString()}
                            >
                              <div className="flex flex-col gap-4 mt-[-50px]">
                                <div className="flex flex-col items-center">
                                  {qPhqa_Image[index]}
                                </div>
                                <div className="flex flex-col gap-4 items-start text-start">
                                  <p className="text-primary-500 font-semibold">
                                    {questionNumber}. {val}
                                  </p>
                                  <div className="flex flex-col gap-2 w-full">
                                    <AssessmentChoiceGroup
                                      label="เลือกข้อที่รู้สึกตรงกับตัวเอง"
                                      options={YES_NO_OPTIONS}
                                      value={
                                        Number(
                                          phqaAddon_data[
                                            `q${questionNumber}` as "q1" | "q2"
                                          ]
                                        ) === 99
                                          ? ""
                                          : String(
                                              phqaAddon_data[
                                                `q${questionNumber}` as
                                                  | "q1"
                                                  | "q2"
                                              ]
                                            )
                                      }
                                      onSelect={(value) =>
                                        phqaAddonChange(
                                          questionNumber + 11,
                                          value
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            </Tab>
                          );
                        })
                      : showQ9
                        ? q9Questions.map((val, index) => {
                            const questionNumber = index + 1;
                            const qKey =
                              `q${questionNumber}` as keyof Question9Q;
                            const radioValue =
                              q9_data[qKey] === 99 ? "" : String(q9_data[qKey]);

                            return (
                              <Tab
                                key={(index + 3).toString()}
                                title={(index + 3).toString()}
                              >
                                <div className="flex flex-col gap-4 mt-[-50px]">
                                  <div className="flex flex-col items-center">
                                    {qPhqa_Image[index]}
                                  </div>
                                  <div className="flex flex-col gap-4 items-start text-start">
                                    <p className="text-primary-500 font-semibold">
                                      {questionNumber}. {val}
                                    </p>
                                    <div className="flex flex-col gap-2 w-full">
                                      <AssessmentChoiceGroup
                                        label="ในช่วง 2 สัปดาห์ คุณมีอาการเหล่านี้บ่อยแค่ไหน"
                                        options={FREQUENCY_OPTIONS}
                                        value={radioValue}
                                        onSelect={(value) =>
                                          q9Change(questionNumber, value)
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              </Tab>
                            );
                          })
                        : showQ8
                          ? (() => {
                              const q8Start = ageGroup === "phqa" ? 14 : 12;
                              const q8AddonTabKey = q8Start + 3;
                              // คะแนนเมื่อเลือก "ใช่" ตามข้อ q1..q8 (ไม่รวม addon)
                              const yesWeights = [1, 2, 6, 8, 9, 5, 10, 4];

                              const renderQ8MainTab = (
                                tabKey: number,
                                displayNo: number,
                                val: string,
                                questionNumber: number
                              ) => {
                                const qKey =
                                  `q${questionNumber}` as keyof Question8Q;
                                const radioValue =
                                  q8_data[qKey] === 99
                                    ? ""
                                    : String(q8_data[qKey]);
                                const yesWeight =
                                  yesWeights[questionNumber - 1] ?? 1;

                                return (
                                  <Tab
                                    key={tabKey.toString()}
                                    title={tabKey.toString()}
                                  >
                                    <div className="flex flex-col gap-4 mt-[-50px]">
                                      <div className="flex flex-col gap-4 items-start text-start">
                                        <p className="text-primary-500 font-semibold">
                                          {displayNo}. {val}
                                        </p>
                                        <div className="flex flex-col gap-2 w-full">
                                          <AssessmentChoiceGroup
                                            label="เลือกข้อที่รู้สึกตรงกับตัวเอง"
                                            options={[
                                              { value: "0", label: "ไม่ใช่" },
                                              {
                                                value: String(yesWeight),
                                                label: "ใช่",
                                              },
                                            ]}
                                            value={radioValue}
                                            onSelect={(value) =>
                                              q8Change(questionNumber, value)
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </Tab>
                                );
                              };

                              return (
                                <>
                                  {renderQ8MainTab(
                                    q8Start + 0,
                                    1,
                                    q8Questions[0],
                                    1
                                  )}
                                  {renderQ8MainTab(
                                    q8Start + 1,
                                    2,
                                    q8Questions[1],
                                    2
                                  )}
                                  {renderQ8MainTab(
                                    q8Start + 2,
                                    3,
                                    q8Questions[2],
                                    3
                                  )}

                                  <Tab
                                    key={q8AddonTabKey.toString()}
                                    title={q8AddonTabKey.toString()}
                                  >
                                    <div className="flex flex-col gap-4 mt-[-50px]">
                                      <div className="flex flex-col gap-4 items-start text-start">
                                        <p className="text-primary-500 font-semibold">
                                          คำถามต่อเนื่อง (addon):{" "}
                                          {q8AddonQuestions[0]}
                                        </p>
                                        <div className="flex flex-col gap-2 w-full">
                                          <AssessmentChoiceGroup
                                            isDisabled={q8_data.q3 !== 6}
                                            label="คำถามต่อเนื่อง"
                                            options={[
                                              { value: "0", label: "ได้" },
                                              { value: "8", label: "ไม่ได้" },
                                            ]}
                                            value={
                                              Number(q8_data.q8Addon) === 99
                                                ? ""
                                                : String(q8_data.q8Addon ?? "")
                                            }
                                            onSelect={(value) =>
                                              q8AddonChange(value)
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </Tab>

                                  {renderQ8MainTab(
                                    q8Start + 4,
                                    4,
                                    q8Questions[3],
                                    4
                                  )}
                                  {renderQ8MainTab(
                                    q8Start + 5,
                                    5,
                                    q8Questions[4],
                                    5
                                  )}
                                  {renderQ8MainTab(
                                    q8Start + 6,
                                    6,
                                    q8Questions[5],
                                    6
                                  )}
                                  {renderQ8MainTab(
                                    q8Start + 7,
                                    7,
                                    q8Questions[6],
                                    7
                                  )}
                                  {renderQ8MainTab(
                                    q8Start + 8,
                                    8,
                                    q8Questions[7],
                                    8
                                  )}
                                </>
                              );
                            })()
                          : showProblem
                            ? (() => {
                                const problemTabKey =
                                  ageGroup === "phqa" ? "23" : "21";

                                return (
                                  <Tab
                                    key={problemTabKey}
                                    title={problemTabKey}
                                  >
                                    <div className="flex flex-col gap-4 mt-[-40px]">
                                      <p className="text-primary-500 font-semibold text-start">
                                        เลือกหัวข้อที่ตรงกับสิ่งที่คุณกำลังพบเจออยู่
                                        (เลือกได้มากกว่า 1 ข้อ · ไม่บังคับ)
                                      </p>
                                      <div className="flex flex-col gap-4">
                                        {teenMindProblems.map((section) => (
                                          <div
                                            key={section.category}
                                            className="rounded-xl border p-4"
                                          >
                                            <p className="font-semibold text-primary-500 mb-2">
                                              {section.category}
                                            </p>
                                            <div className="flex flex-col gap-2">
                                              {section.items.map((item) => (
                                                <Checkbox
                                                  key={item.key}
                                                  isSelected={
                                                    problem_data[
                                                      item.key as keyof ProblemPayload
                                                    ] === 1
                                                  }
                                                  onValueChange={() =>
                                                    toggleProblem(
                                                      item.key as keyof ProblemPayload
                                                    )
                                                  }
                                                >
                                                  {item.label}
                                                </Checkbox>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </Tab>
                                );
                              })()
                            : null}
              </Tabs>
            </div>
          )}
        </div>

        {!show8QInterstitial ? (
          <div className="sticky bottom-0 z-20 -mx-8 mt-auto flex w-[calc(100%+4rem)] flex-col gap-2 border-t border-default-200 bg-background/95 px-8 py-3 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button
              className="w-full"
              color="default"
              radius="full"
              size="lg"
              variant="bordered"
              onPress={() => BackStep()}
            >
              ย้อนกลับ
            </Button>

            <Button
              className="w-full"
              color="primary"
              isDisabled={!canProceed || isSaving}
              isLoading={isSaving}
              radius="full"
              size="lg"
              variant="solid"
              onPress={() => {
                const finalQuestionKey =
                  ageGroup === "phqa"
                    ? "23"
                    : ageGroup === "nineq"
                      ? "21"
                      : "13";

                if (question === finalQuestionKey) {
                  SaveToDB();
                } else {
                  handleNext();
                }
              }}
            >
              {(() => {
                const finalQuestionKey =
                  ageGroup === "phqa"
                    ? "23"
                    : ageGroup === "nineq"
                      ? "21"
                      : "13";

                return question === finalQuestionKey ? "บันทึกผล" : "ถัดไป";
              })()}
            </Button>
          </div>
        ) : null}
      </Suspense>
    </section>
  );
}
