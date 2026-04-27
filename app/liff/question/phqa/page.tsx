"use client";

import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Tab, Tabs } from "@heroui/tabs";
import { Progress } from "@heroui/progress";
import { Image } from "@heroui/image";
import {
  Questions_8Q,
  Questions_9Q,
  Questions_PHQA,
  Questions_PHQA_Addon,
} from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Radio, RadioGroup } from "@heroui/radio";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Divider, InputOtp } from "@heroui/react";

import { subtitle, title } from "@/components/primitives";
import { LocationData, ProblemPayload } from "@/types";
import Loading from "@/app/loading";
import { calculateAge } from "@/utils/helper";
import {
  q2,
  qPhqa,
  phqaAddon,
  q9 as q9Questions,
  q8 as q8Questions,
  q8Addon as q8AddonQuestions,
  teenMindProblems,
} from "@/app/data";

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

  const phqaInitValue: Questions_PHQA = {
    id: "",
    questions_MasterId: "",
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
  };

  const Q2InitValue: Questions_PHQA_Addon = {
    id: "",
    questions_MasterId: "",
    q1: 99,
    q2: 99,
  };

  const phqaAddonInitValue: Questions_PHQA_Addon = {
    id: "",
    questions_MasterId: "",
    q1: 99,
    q2: 99,
  };

  const q9InitValue: Questions_9Q = {
    id: "",
    questions_MasterId: "",
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
  };

  const q8InitValue: Questions_8Q = {
    id: "",
    questions_MasterId: "",
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
  const [questionName, setQuestionName] = useState("2Q");
  const [progress, setProgress] = useState(0);
  const [showPHQA, setPHQAShow] = useState(false);
  const [showPHQAAddon, setPHQAAddonShow] = useState(false);
  const [showQ9, setShowQ9] = useState(false);
  const [showQ8, setShowQ8] = useState(false);
  const [showProblem, setShowProblem] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [lastQuestionAnswered, setLastQuestionAnswered] = useState(false);
  const [profileIdState, setProfileIdState] = useState("");
  const [ageGroup, setAgeGroup] = useState<"under12" | "over12" | null>(null);
  const [referenceId, setReferenceId] = useState("");
  const [referentData, setReferentData] = useState<{
    fullName: string;
    affiliation: string;
    agency: string;
  }>();
  const [question, setQuestion] = useState("1");
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [isModalOpened, setIsModalOpened] = useState(false);
  const [isOtpEmpty, setIsOtpEmpty] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentQuestionAnswers, setCurrentQuestionAnswers] = useState<{
    [key: string]: string;
  }>({});

  const [phqa_data, setPHQA] = useState<Questions_PHQA>(phqaInitValue);
  const [Q2_data, setQ2] = useState<Questions_PHQA_Addon>(Q2InitValue);
  const [phqaAddon_data, setPHQAAddon] =
    useState<Questions_PHQA_Addon>(phqaAddonInitValue);
  const [q9_data, setQ9] = useState<Questions_9Q>(q9InitValue);
  const [q8_data, setQ8] = useState<Questions_8Q>(q8InitValue);
  const [problem_data, setProblem] = useState<ProblemPayload>(problemInitValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [location, setLocation] = useState<LocationData>();
  const [calculationResult, setCalculationResult] = useState<{
    phqa_sum: number;
    result: string;
    result_text: string;
    q9_value: number;
  } | null>(null);

  type RiskDisplay = {
    text?: string;
    textColor: string;
    barColor: string;
    scoreRange: string;
  };

  const riskDisplayMap: Record<string, RiskDisplay> = {
    Green: {
      textColor: "text-green-700",
      barColor: "bg-green-200",
      scoreRange: "0 - 4 คะแนน",
    },
    "Green-Low": {
      textColor: "text-green-600",
      barColor: "bg-green-400",
      scoreRange: "5 - 9 คะแนน",
    },
    Yellow: {
      textColor: "text-yellow-700",
      barColor: "bg-yellow-500",
      scoreRange: "10 - 14 คะแนน",
    },
    Orange: {
      textColor: "text-orange-700",
      barColor: "bg-orange-500",
      scoreRange: "15 - 19 คะแนน",
    },
    Red: {
      textColor: "text-red-700",
      barColor: "bg-red-500",
      scoreRange: "20 - 27 คะแนน",
    },
  };

  const getNineQRiskDisplay = (
    sum: number
  ): {
    text: string;
    textColor: string;
    barColor: string;
    scoreRange: string;
  } => {
    if (sum < 7) {
      return {
        text: "ไม่มีอาการของโรคซึมเศร้า",
        textColor: "text-green-700",
        barColor: "bg-green-300",
        scoreRange: "< 7 คะแนน",
      };
    }

    if (sum <= 12) {
      return {
        text: "มีอาการของโรคซึมเศร้า ระดับน้อย",
        textColor: "text-yellow-700",
        barColor: "bg-yellow-400",
        scoreRange: "7 - 12 คะแนน",
      };
    }

    if (sum <= 18) {
      return {
        text: "มีอาการของโรคซึมเศร้า ระดับปานกลาง",
        textColor: "text-orange-700",
        barColor: "bg-orange-500",
        scoreRange: "13 - 18 คะแนน",
      };
    }

    return {
      text: "มีอาการของโรคซึมเศร้า ระดับรุนแรง",
      textColor: "text-red-700",
      barColor: "bg-red-500",
      scoreRange: ">= 19 คะแนน",
    };
  };

  const getEightQRiskDisplay = (
    sum: number
  ): {
    text: string;
    textColor: string;
    barColor: string;
    scoreRange: string;
  } => {
    if (sum === 0) {
      return {
        text: "ไม่มีแนวโน้มฆ่าตัวตายในปัจจุบัน",
        textColor: "text-green-700",
        barColor: "bg-green-300",
        scoreRange: "0 คะแนน",
      };
    }

    if (sum <= 8) {
      return {
        text: "มีแนวโน้มที่จะฆ่าตัวตายในปัจจุบัน ระดับน้อย",
        textColor: "text-yellow-700",
        barColor: "bg-yellow-400",
        scoreRange: "1 - 8 คะแนน",
      };
    }

    if (sum <= 16) {
      return {
        text: "มีแนวโน้มที่จะฆ่าตัวตายในปัจจุบัน ระดับปานกลาง",
        textColor: "text-orange-700",
        barColor: "bg-orange-500",
        scoreRange: "9 - 16 คะแนน",
      };
    }

    return {
      text: "มีแนวโน้มที่จะฆ่าตัวตายในปัจจุบัน ระดับรุนแรง",
      textColor: "text-red-700",
      barColor: "bg-red-500",
      scoreRange: ">= 17 คะแนน",
    };
  };

  const selectedRisk = calculationResult
    ? ageGroup === "over12"
      ? getNineQRiskDisplay(calculationResult.phqa_sum)
      : (riskDisplayMap[calculationResult.result] ?? riskDisplayMap.Red)
    : null;
  const selectedEightQRisk = calculationResult
    ? getEightQRiskDisplay(calculationResult.q9_value)
    : null;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const checkProfile = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/profile/user/${id}`);
        const data = await response.json();

        if (data?.profile.length === 0) {
          router.push("/liff/privacy");
        } else {
          setProfileIdState(data?.profile[0].id);
          const birthday = data?.profile?.[0]?.birthday;

          if (birthday) {
            const age = calculateAge(String(birthday));

            // spec: อายุ < 12 -> under12, อายุ > 12 -> over12
            // กรณีอายุเท่ากับ 12 ให้ถือว่า over12
            setAgeGroup(age < 12 ? "under12" : "over12");
          } else {
            setAgeGroup(null);
          }

          // reset flow state
          setPHQAShow(false);
          setPHQAAddonShow(false);
          setShowQ9(false);
          setShowQ8(false);
          setShowProblem(false);
          setQuestion("1");
          setQuestionName("2Q");
          setProgress(0);
          setCanProceed(false);
          setCurrentAnswer("");
          setCurrentQuestionAnswers({});
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
    [profileId, router]
  );

  useEffect(() => {
    if (status !== "loading" && status === "authenticated") {
      if (session?.user?.id) {
        checkProfile(session.user.id as string);
      }
    } else {
      setProfileIdState(profileId);
      setAgeGroup(null);
    }

    // ตรวจสอบ QR code data
    if (ref) {
      setReferenceId(ref);
    } else {
      onOpen();
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        const { accuracy, latitude, longitude } = coords;

        setLocation({ accuracy, latitude, longitude });
      });
    }

    // เริ่มต้น progress ที่ 0%
    setProgress(0);
  }, [session, status, profileId, ref, checkProfile, onOpen]);

  const fetchReferentData = useCallback(
    async (id: string) => {
      const referentId = parseInt(id);

      setIsLoading(true);

      try {
        const response = await fetch(`/api/data/referent/${referentId}`);
        const data = await response.json();
        const fullName = data[0].firstname + " " + data[0].lastname;
        const affiliation = data[0].affiliation.name;
        const agency = data[0].agency;

        setReferentData({
          fullName: fullName,
          affiliation: affiliation,
          agency: agency,
        });
      } catch {
        setReferentData({
          fullName: "ไม่พบข้อมูล",
          affiliation: "ไม่พบข้อมูล",
          agency: "ไม่พบข้อมูล",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [ageGroup]
  );

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

  const calProgress = useCallback(
    (e: number) => {
      if (!ageGroup) return 0;

      // จำนวนคำถามทั้งหมด (นับเฉพาะหน้าที่แสดงด้วย Tab)
      // under12: 2Q(2) + PHQ-A(9) + PHQ-A Addon(2) + 8Q(9) = 22
      // + ประเมินปัญหา(1)
      // over12 : 2Q(2) + 9Q(9) + 8Q(9) + ประเมินปัญหา(1) = 21
      const totalQuestions = ageGroup === "under12" ? 23 : 21;
      const currentQuestion = e - 1; // ลบ 1 เพื่อให้เริ่มจาก 0

      // คำนวณเปอร์เซ็นต์ความคืบหน้า (100/13 ≈ 7.7% ต่อข้อ)
      const progress = Math.round((currentQuestion * 100) / totalQuestions);

      return progress;
    },
    [ageGroup]
  );

  const phqaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const Question = parseInt(e.target.name, 10);
      const name = "q" + e.target.name;
      const value = e.target.value;

      setCurrentAnswer(value);
      setCanProceed(true);
      setCurrentQuestionAnswers((prev) => {
        const newAnswers = {
          ...prev,
          [Question]: value,
        };

        return newAnswers;
      });

      setPHQA((prev) => {
        const newData = {
          ...prev,
          [name]: parseInt(value, 10),
        };

        // คำนวณผลรวมของคำตอบ PHQ-A
        const sum = Object.keys(newData)
          .filter((key) => key.startsWith("q") && key !== "questions_MasterId")
          .reduce(
            (acc: number, key: string) =>
              acc + (Number(newData[key as keyof Questions_PHQA]) || 0),
            0
          );

        return { ...newData, sum };
      });

      if (Question === 9) {
        setLastQuestionAnswered(true);
      }
    },
    [currentQuestionAnswers]
  );

  const Q2Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const Question = parseInt(e.target.name, 10);
    const name = "q" + Question;
    const value = parseInt(e.target.value);

    setCurrentAnswer(value.toString());
    setCanProceed(true);
    setCurrentQuestionAnswers((prev) => ({
      ...prev,
      [Question]: value.toString(),
    }));

    setQ2((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (Question === 2) {
      setLastQuestionAnswered(true);
    }
  }, []);

  const phqaAddonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const Question = parseInt(e.target.name, 10);
    const name = "q" + (Question - 11); // แปลงจาก q12, q13 เป็น q1, q2
    const value = parseInt(e.target.value, 10);

    setCurrentAnswer(value.toString());
    setCanProceed(true);
    setCurrentQuestionAnswers((prev) => ({
      ...prev,
      [Question]: value.toString(),
    }));

    setPHQAAddon((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (Question === 13) {
      setLastQuestionAnswered(true);
    }
  };

  const q9Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const Question = parseInt(e.target.name, 10); // 1..9
      const name = "q" + e.target.name;
      const value = e.target.value;

      setCurrentAnswer(value);
      setCanProceed(true);

      setCurrentQuestionAnswers((prev) => ({
        ...prev,
        [Question]: value,
      }));

      setQ9((prev) => {
        const newData = {
          ...prev,
          [name]: parseInt(value, 10),
        } as Questions_9Q;

        // คำนวณผลรวม q1..q9
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

      if (Question === 9) setLastQuestionAnswered(true);
    },
    [currentQuestionAnswers]
  );

  const q8Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const Question = parseInt(e.target.name, 10); // 1..8 (ฟิลด์ q1..q8)
      const name = ("q" + e.target.name) as keyof Questions_8Q;
      const value = parseInt(e.target.value, 10);

      setCurrentAnswer(value.toString());
      setCanProceed(true);

      setCurrentQuestionAnswers((prev) => ({
        ...prev,
        [Question]: value.toString(),
      }));

      setQ8((prev) => {
        const updated = {
          ...prev,
          [name]: value,
          ...(Question === 3 && value === 0 ? { q8Addon: 0 } : {}),
        } as Questions_8Q;

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

      if (Question === 8) setLastQuestionAnswered(true);
    },
    [currentQuestionAnswers]
  );

  const q8AddonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10); // 0 หรือ 8

    setCurrentAnswer(value.toString());
    setCanProceed(true);
    setCurrentQuestionAnswers((prev) => ({
      ...prev,
      q8Addon: value.toString(),
    }));

    setQ8((prev) => {
      const updated = { ...prev, q8Addon: value };
      const sum =
        Number(updated.q1 ?? 0) +
        Number(updated.q2 ?? 0) +
        Number(updated.q3 ?? 0) +
        Number(updated.q4 ?? 0) +
        Number(updated.q5 ?? 0) +
        Number(updated.q6 ?? 0) +
        Number(updated.q7 ?? 0) +
        Number(updated.q8 ?? 0) +
        Number(value ?? 0);

      return { ...updated, sum };
    });
  };

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

  const handleNext = useCallback(() => {
    if (!ageGroup) return;

    const currentQuestion = parseInt(question, 10);
    const q8Start = ageGroup === "under12" ? 14 : 12;
    /** คีย์สุดท้ายของ 8Q: q1..q3, addon, q4..q8 (รวม 9 ขั้น) */
    const q8LastKey = q8Start + 8;
    const problemStepKey = q8LastKey + 1;

    const resetForNext = (nextKey: number) => {
      setProgress(calProgress(nextKey));
      setQuestion(nextKey.toString());
      setCurrentAnswer("");
      setCanProceed(false);
      setCurrentQuestionAnswers({});
      setLastQuestionAnswered(false);
    };

    // 2Q -> (PHQ-A หรือ 9Q)
    if (currentQuestion === 2) {
      const isUnder12 = ageGroup === "under12";

      setPHQAShow(isUnder12);
      setPHQAAddonShow(false);
      setShowQ9(!isUnder12);
      setShowQ8(false);
      setShowProblem(false);

      setQuestionName(isUnder12 ? "PHQ-A" : "9Q");
      resetForNext(3);

      return;
    }

    // under12: PHQ-A (3..11) -> PHQ-A Addon (12..13) -> 8Q (q8Start..q8LastKey)
    if (ageGroup === "under12") {
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
        setQuestionName("PHQ-A Addon");
        resetForNext(12);

        return;
      }

      if (currentQuestion === 12) {
        resetForNext(13);

        return;
      }

      if (currentQuestion === 13) {
        setPHQAAddonShow(false);
        setShowQ9(false);
        setShowQ8(true);
        setShowProblem(false);
        setQuestionName("8Q");
        resetForNext(q8Start);

        return;
      }
    }

    // over12: 9Q (3..11) -> 8Q (q8Start..q8LastKey)
    if (ageGroup === "over12") {
      if (currentQuestion >= 3 && currentQuestion < 11) {
        resetForNext(currentQuestion + 1);

        return;
      }

      if (currentQuestion === 11) {
        setPHQAShow(false);
        setPHQAAddonShow(false);
        setShowQ9(false);
        setShowQ8(true);
        setShowProblem(false);
        setQuestionName("8Q");
        resetForNext(q8Start);

        return;
      }
    }

    // 8Q segment (under12 / over12): ลำดับ q1–q3 → addon → q4–q8
    if (currentQuestion >= q8Start && currentQuestion < q8LastKey) {
      let nextKey = currentQuestion + 1;

      // จาก q3: ถ้าไม่ใช่ (0) ข้ามแท็บ addon ไป q4
      if (currentQuestion === q8Start + 2 && q8_data.q3 === 0) {
        nextKey = q8Start + 4;
      }
      setProgress(calProgress(nextKey));
      setQuestion(nextKey.toString());
      setCurrentAnswer("");
      setCurrentQuestionAnswers({});
      setLastQuestionAnswered(false);
      setCanProceed(false);

      return;
    }

    if (currentQuestion === q8LastKey) {
      setShowQ8(false);
      setShowProblem(true);
      setQuestionName("ประเมินปัญหา");
      setProgress(calProgress(problemStepKey));
      setQuestion(problemStepKey.toString());
      setCurrentAnswer("");
      setCurrentQuestionAnswers({});
      setLastQuestionAnswered(false);
      setCanProceed(true);

      return;
    }

    // fallback
    resetForNext(currentQuestion + 1);
  }, [question, calProgress, ageGroup, q8_data.q3]);

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

    // ตรวจสอบ 8Q (รวมคำถามต่อเนื่อง q8Addon เมื่อ q3=6)
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

    const q8_sum =
      Number(q8_data.q1 ?? 0) +
      Number(q8_data.q2 ?? 0) +
      Number(q8_data.q3 ?? 0) +
      Number(q8_data.q4 ?? 0) +
      Number(q8_data.q5 ?? 0) +
      Number(q8_data.q6 ?? 0) +
      Number(q8_data.q7 ?? 0) +
      Number(q8_data.q8 ?? 0) +
      Number(q8AddonValue ?? 0);

    let dataToSave: Record<string, unknown>;
    let scoreSum: number;

    if (ageGroup === "under12") {
      // ตรวจสอบ PHQ-A (PHQA)
      const phqaAnswers = Object.entries(phqa_data)
        .filter(([key]) => key.startsWith("q") && key !== "questions_MasterId")
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

      scoreSum = phqaAnswers.reduce((acc: number, val: number) => acc + val, 0);

      dataToSave = {
        profileId: profileIdState,
        phqa: {
          ...phqa_data,
          sum: scoreSum,
        },
        Q2: Q2_data,
        phqaAddon: phqaAddon_data,
        q8: {
          ...q8_data,
          q8Addon: q8AddonValue,
          sum: q8_sum,
        },
        problem: problem_data,
        location: location || null,
        reference: referenceId ? parseInt(referenceId) : null,
      };
    } else {
      // over12: ตรวจสอบ 9Q
      const q9Answers = Object.entries(q9_data)
        .filter(([key]) => key.startsWith("q") && key !== "questions_MasterId")
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
        q8: {
          ...q8_data,
          q8Addon: q8AddonValue,
          sum: q8_sum,
        },
        problem: problem_data,
        location: location || null,
        reference: referenceId ? parseInt(referenceId) : null,
      };
    }

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
        setCalculationResult({
          phqa_sum: scoreSum,
          result: responseData.data.result,
          result_text: responseData.data.result_text,
          q9_value: q8_sum,
        });
      } else {
        setErrorMessage(
          `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${responseData.message || "กรุณาลองใหม่อีกครั้ง"}`
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

  const BackStep = useCallback(async () => {
    if (!ageGroup) return;

    const currentKey = parseInt(question, 10);

    if (currentKey <= 1) {
      router.back();

      return;
    }

    const q8Start = ageGroup === "under12" ? 14 : 12;
    const q8LastKey = q8Start + 8;
    const problemStepKey = q8LastKey + 1;
    // จาก q4 กลับ: ถ้า q3=0 ไม่ได้ผ่าน addon — ข้ามกลับไป q3
    const prevKey =
      currentKey === problemStepKey
        ? q8LastKey
        : currentKey === q8Start + 4 && q8_data.q3 === 0
          ? q8Start + 2
          : currentKey - 1;

    setProgress(calProgress(prevKey));
    setQuestion(prevKey.toString());
    setCanProceed(true);

    // reset current answer สำหรับ 2Q
    if (prevKey === 1) setCurrentAnswer(String(Q2_data.q1));
    if (prevKey === 2) setCurrentAnswer(String(Q2_data.q2));

    // sync show flags ตาม key
    if (ageGroup === "under12") {
      setShowQ9(false);
      setShowQ8(prevKey >= 14 && prevKey <= q8LastKey);
      setShowProblem(prevKey === problemStepKey);
      setPHQAShow(prevKey >= 3 && prevKey <= 11);
      setPHQAAddonShow(prevKey >= 12 && prevKey <= 13);
      setQuestionName(
        prevKey <= 2
          ? "2Q"
          : prevKey <= 11
            ? "PHQ-A"
            : prevKey <= 13
              ? "PHQ-A Addon"
              : prevKey <= q8LastKey
                ? "8Q"
                : "ประเมินปัญหา"
      );
    } else {
      setPHQAShow(false);
      setPHQAAddonShow(false);
      setShowQ9(prevKey >= 3 && prevKey <= 11);
      setShowQ8(prevKey >= 12 && prevKey <= q8LastKey);
      setShowProblem(prevKey === problemStepKey);
      setQuestionName(
        prevKey <= 2
          ? "2Q"
          : prevKey <= 11
            ? "9Q"
            : prevKey <= q8LastKey
              ? "8Q"
              : "ประเมินปัญหา"
      );
    }
  }, [question, calProgress, router, ageGroup, Q2_data, q8_data.q3]);

  useEffect(() => {
    if (
      showPHQAAddon &&
      phqaAddon_data.q1 !== 99 &&
      phqaAddon_data.q2 !== 99 &&
      lastQuestionAnswered
    ) {
      // ลบการบันทึกอัตโนมัติออก
      // SaveToDB();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phqaAddon_data]);

  return (
    <section className="flex flex-col w-[calc(100vw)] items-center justify-center gap-4 pt-10 px-8 py-8 md:py-10">
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
                        หน่วยงาน : {referentData?.agency}
                      </span>
                    ) : (
                      <span className="flex flex-col box-border rounded-lg bg-danger-100 text-danger-500 p-3 text-center w-full text-md font-semibold">
                        รหัสผู้ให้คำแนะนำไม่ถูกต้อง
                      </span>
                    ))}
                </ModalBody>
                <ModalFooter className="flex flex-col justify-center">
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
                    ถัดไป
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

        <h1 className={title({ size: "xs" })}>
          แบบประเมินภาวะซึมเศร้าในวัยรุ่น
        </h1>

        <Progress
          aria-label="Loading..."
          className="max-w-md"
          showValueLabel={true}
          value={progress}
        />

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
              router.push("/liff");
            }}
          >
            <ModalContent>
              {() => (
                <>
                  <ModalHeader className="flex flex-col items-center font-semibold text-2xl">
                    ผลการประเมิน
                  </ModalHeader>
                  <ModalBody className="items-center text-center">
                    <div className="w-full space-y-4">
                      <p>
                        <span className="font-semibold">คะแนนรวม:</span>{" "}
                        {calculationResult.phqa_sum} คะแนน
                      </p>
                      <div className="w-full space-y-2">
                        <div className="flex flex-col gap-2 justify-center items-center">
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-col items-center gap-2">
                              <span className={`${selectedRisk?.textColor}`}>
                                {ageGroup === "over12"
                                  ? selectedRisk?.text
                                  : calculationResult.result_text}
                              </span>
                              <span className="text-xs text-default-500">
                                เกณฑ์คะแนน: {selectedRisk?.scoreRange}
                              </span>
                            </div>
                            <div className="flex w-full h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full w-full ${selectedRisk?.barColor}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-full space-y-2 pt-1">
                        <p>
                          <span className="font-semibold">คะแนนรวม 8Q:</span>{" "}
                          {calculationResult.q9_value} คะแนน
                        </p>
                        <div className="flex flex-col items-center gap-2">
                          <span className={`${selectedEightQRisk?.textColor}`}>
                            {selectedEightQRisk?.text}
                          </span>
                          <span className="text-xs text-default-500">
                            เกณฑ์คะแนน: {selectedEightQRisk?.scoreRange}
                          </span>
                          <div className="flex w-full h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full w-full ${selectedEightQRisk?.barColor}`}
                            />
                          </div>
                        </div>
                      </div>
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
                        router.push("/liff");
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

        <div className="flex flex-col w-full min-h-[calc(100vh_-_350px)]">
          <h2 className={subtitle()}>{questionName}</h2>
          <Tabs
            aria-label="Options"
            className="max-w-xs"
            classNames={{ tabList: "invisible" }}
            color="primary"
            selectedKey={question}
            variant="underlined"
          >
            {!showPHQA && !showPHQAAddon && !showQ9 && !showQ8 && !showProblem
              ? q2.map((val, index) => (
                  <Tab key={(index + 1).toString()}>
                    <div className="flex flex-col gap-4 mt-[-50px]">
                      <div className="flex flex-col items-center">
                        {q2_Image[index]}
                      </div>
                      <div className="flex flex-col gap-4 items-start text-start">
                        <p className="text-primary-500 font-semibold">
                          {index + 1}. {val}
                        </p>
                        <div className="flex flex-col gap-2 w-full mt-[-15px] ml-[-5px]">
                          <RadioGroup
                            key={index}
                            className="pl-5"
                            label="เลือกข้อที่รู้สึกตรงกับตัวเอง"
                            name={(index + 1).toString()}
                            value={currentAnswer}
                            onChange={(val) => {
                              Q2Change(val);
                            }}
                          >
                            <Radio
                              className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                              value="0"
                            >
                              ไม่ใช่
                            </Radio>
                            <Radio
                              className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                              value="1"
                            >
                              ใช่
                            </Radio>
                          </RadioGroup>
                        </div>
                      </div>
                    </div>
                  </Tab>
                ))
              : showPHQA
                ? qPhqa.map((val, index) => {
                    const questionNumber = index + 1;

                    return (
                      <Tab key={(index + 3).toString()}>
                        <div className="flex flex-col gap-4 mt-[-50px]">
                          <div className="flex flex-col items-center">
                            {qPhqa_Image[index]}
                          </div>
                          <div className="flex flex-col gap-4 items-start text-start">
                            <p className="text-primary-500 font-semibold">
                              {questionNumber}. {val}
                            </p>
                            <div className="flex flex-col gap-2 w-full mt-[-15px] ml-[-5px]">
                              <RadioGroup
                                key={`phqa-${questionNumber}`}
                                className="pl-5"
                                label="ในช่วง 2 สัปดาห์ คุณมีอาการเหล่านี้บ่อยแค่ไหน"
                                name={questionNumber.toString()}
                                value={
                                  currentQuestionAnswers[questionNumber] || ""
                                }
                                onChange={(val) => {
                                  phqaChange(val);
                                }}
                              >
                                <Radio
                                  className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                  value="0"
                                >
                                  ไม่มีเลย
                                </Radio>
                                <Radio
                                  className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                  value="1"
                                >
                                  มีบางวัน
                                </Radio>
                                <Radio
                                  className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                  value="2"
                                >
                                  มีมากกว่า 7 วัน
                                </Radio>
                                <Radio
                                  className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                  value="3"
                                >
                                  มีแทบทุกวัน
                                </Radio>
                              </RadioGroup>
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
                        <Tab key={(index + 12).toString()}>
                          <div className="flex flex-col gap-4 mt-[-50px]">
                            <div className="flex flex-col items-center">
                              {qPhqa_Image[index]}
                            </div>
                            <div className="flex flex-col gap-4 items-start text-start">
                              <p className="text-primary-500 font-semibold">
                                {questionNumber}. {val}
                              </p>
                              <div className="flex flex-col gap-2 w-full mt-[-15px] ml-[-5px]">
                                <RadioGroup
                                  key={`phqa-addon-${questionNumber}`}
                                  className="pl-5"
                                  label="เลือกข้อที่รู้สึกตรงกับตัวเอง"
                                  name={(questionNumber + 11).toString()}
                                  value={
                                    currentQuestionAnswers[
                                      questionNumber + 11
                                    ] || ""
                                  }
                                  onChange={(val) => {
                                    phqaAddonChange(val);
                                  }}
                                >
                                  <Radio
                                    className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                    value="0"
                                  >
                                    ไม่ใช่
                                  </Radio>
                                  <Radio
                                    className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                    value="1"
                                  >
                                    ใช่
                                  </Radio>
                                </RadioGroup>
                              </div>
                            </div>
                          </div>
                        </Tab>
                      );
                    })
                  : showQ9
                    ? q9Questions.map((val, index) => {
                        const questionNumber = index + 1;
                        const qKey = `q${questionNumber}` as keyof Questions_9Q;
                        const radioValue =
                          q9_data[qKey] === 99 ? "" : String(q9_data[qKey]);

                        return (
                          <Tab key={(index + 3).toString()}>
                            <div className="flex flex-col gap-4 mt-[-50px]">
                              <div className="flex flex-col items-center">
                                {qPhqa_Image[index]}
                              </div>
                              <div className="flex flex-col gap-4 items-start text-start">
                                <p className="text-primary-500 font-semibold">
                                  {questionNumber}. {val}
                                </p>
                                <div className="flex flex-col gap-2 w-full mt-[-15px] ml-[-5px]">
                                  <RadioGroup
                                    key={`q9-${questionNumber}`}
                                    className="pl-5"
                                    label="ในช่วง 2 สัปดาห์ คุณมีอาการเหล่านี้บ่อยแค่ไหน"
                                    name={questionNumber.toString()}
                                    value={radioValue}
                                    onChange={(ev) => {
                                      q9Change(ev);
                                    }}
                                  >
                                    <Radio
                                      className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                      value="0"
                                    >
                                      ไม่มีเลย
                                    </Radio>
                                    <Radio
                                      className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                      value="1"
                                    >
                                      มีบางวัน
                                    </Radio>
                                    <Radio
                                      className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                      value="2"
                                    >
                                      มีมากกว่า 7 วัน
                                    </Radio>
                                    <Radio
                                      className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                      value="3"
                                    >
                                      มีแทบทุกวัน
                                    </Radio>
                                  </RadioGroup>
                                </div>
                              </div>
                            </div>
                          </Tab>
                        );
                      })
                    : showQ8
                      ? (() => {
                          const q8Start = ageGroup === "under12" ? 14 : 12;
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
                              `q${questionNumber}` as keyof Questions_8Q;
                            const radioValue =
                              q8_data[qKey] === 99 ? "" : String(q8_data[qKey]);
                            const yesWeight =
                              yesWeights[questionNumber - 1] ?? 1;

                            return (
                              <Tab key={tabKey.toString()}>
                                <div className="flex flex-col gap-4 mt-[-50px]">
                                  <div className="flex flex-col gap-4 items-start text-start">
                                    <p className="text-primary-500 font-semibold">
                                      {displayNo}. {val}
                                    </p>
                                    <div className="flex flex-col gap-2 w-full mt-[-15px] ml-[-5px]">
                                      <RadioGroup
                                        key={`q8-${questionNumber}`}
                                        className="pl-5"
                                        label="เลือกข้อที่รู้สึกตรงกับตัวเอง"
                                        name={questionNumber.toString()}
                                        value={radioValue}
                                        onChange={(ev) => {
                                          q8Change(ev);
                                        }}
                                      >
                                        <Radio
                                          className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                          value="0"
                                        >
                                          ไม่ใช่
                                        </Radio>
                                        <Radio
                                          className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                          value={String(yesWeight)}
                                        >
                                          ใช่
                                        </Radio>
                                      </RadioGroup>
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

                              <Tab key={q8AddonTabKey.toString()}>
                                <div className="flex flex-col gap-4 mt-[-50px]">
                                  <div className="flex flex-col gap-4 items-start text-start">
                                    <p className="text-primary-500 font-semibold">
                                      คำถามต่อเนื่อง (addon):{" "}
                                      {q8AddonQuestions[0]}
                                    </p>
                                    <div className="flex flex-col gap-2 w-full mt-[-15px] ml-[-5px]">
                                      <RadioGroup
                                        key="q8-addon"
                                        className="pl-5"
                                        isDisabled={q8_data.q3 !== 6}
                                        label="คำถามต่อเนื่อง"
                                        name="addon"
                                        value={String(q8_data.q8Addon ?? 0)}
                                        onChange={(ev) => {
                                          q8AddonChange(ev);
                                        }}
                                      >
                                        <Radio
                                          className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                          value="0"
                                        >
                                          ได้
                                        </Radio>
                                        <Radio
                                          className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                          value="8"
                                        >
                                          ไม่ได้
                                        </Radio>
                                      </RadioGroup>
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
                              ageGroup === "under12" ? "23" : "21";

                            return (
                              <Tab key={problemTabKey}>
                                <div className="flex flex-col gap-4 mt-[-40px]">
                                  <p className="text-primary-500 font-semibold text-start">
                                    เลือกหัวข้อที่ตรงกับสิ่งที่คุณกำลังพบเจออยู่
                                    (เลือกได้มากกว่า 1 ข้อ)
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
              ageGroup === "under12"
                ? "23"
                : ageGroup === "over12"
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
              ageGroup === "under12"
                ? "23"
                : ageGroup === "over12"
                  ? "21"
                  : "13";

            return question === finalQuestionKey ? "บันทึกผล" : "ถัดไป";
          })()}
        </Button>
      </Suspense>
    </section>
  );
}
