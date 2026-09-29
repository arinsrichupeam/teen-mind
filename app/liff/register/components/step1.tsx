"use client";

import { Profile, School } from "@prisma/client";
import { Input } from "@heroui/input";
import { Form } from "@heroui/form";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  AutocompleteItem,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { BirthdaySelect } from "@/components/birthday-select";
import { mapSexToLegacyNumber } from "@/lib/legacy-value-mapping";
import { liffPopoverProps } from "@/utils/liff-popover-props";
import { LineIcon } from "@/components/icons";
import { prefix, sex, gradeYearLevels } from "@/utils/data";
import {
  formatDateForDisplay,
  validateBirthday,
  validateBirthdayValue,
  validateCitizen,
  validateTel,
} from "@/utils/helper";

/** Profile ที่มีฟิลด์ชั้นปี (gradeYear) สำหรับฟอร์มลงทะเบียน */
type ProfileWithGradeYear = Omit<
  Profile,
  | "birthDate"
  | "sex"
  | "gradeYear"
  | "isStudent"
  | "mainInsclCode"
  | "mainInsclName"
  | "subInsclCode"
  | "subInsclName"
  | "hmainCode"
  | "hmainName"
  | "hsubCode"
  | "hsubName"
  | "nhsoVerifiedAt"
> & {
  gradeYear?: number | null;
  isStudent?: boolean;
  birthDate: Date | null;
  sex: Profile["sex"] | number;
  mainInsclCode?: string | null;
  mainInsclName?: string | null;
  subInsclCode?: string | null;
  subInsclName?: string | null;
  hmainCode?: string | null;
  hmainName?: string | null;
  hsubCode?: string | null;
  hsubName?: string | null;
  nhsoVerifiedAt?: Date | null;
};

type StepName = "Profile" | "Address" | "Emergency";

/** เหตุการณ์เปลี่ยนค่า (รองรับทั้ง event จริงและ synthetic object จาก DatePicker/Autocomplete) */
export type ChangeEventLike = {
  target: { name: string; value: string | number | boolean | null };
};

interface Props {
  NextStep: (val: StepName) => void;
  Result: ProfileWithGradeYear | undefined;
  HandleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | ChangeEventLike
  ) => void;
  onCancel?: () => void;
  /** กำหนดลำดับปุ่มหลัก: "next" = ปุ่มถัดไปอยู่บน, "cancel" = ปุ่มยกเลิกอยู่บน */
  primaryAction?: "next" | "cancel";
  /** flow อสท. ลงทะเบียนผู้รับการประเมิน */
  isReferentFlow?: boolean;
}

export const Step1 = ({
  NextStep,
  Result,
  HandleChange,
  onCancel,
  primaryAction = "next",
  isReferentFlow = false,
}: Props) => {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const request = true;
  const [school, setSchool] = useState<School[]>([]);
  const [facilities, setFacilities] = useState<{ id: string; name: string }[]>(
    []
  );
  const [facilityError, setFacilityError] = useState("");
  const [studentSchoolError, setStudentSchoolError] = useState("");
  const [error, setError] = useState<string>("");
  const [birthdayError, setBirthdayError] = useState<string>("");
  const [gradeYearError, setGradeYearError] = useState<string>("");
  const [referentDuplicate, setReferentDuplicate] = useState(false);
  const [referentDuplicateHasLine, setReferentDuplicateHasLine] =
    useState(false);
  const [linkCitizenId, setLinkCitizenId] = useState("");
  const [isLinkingLine, setIsLinkingLine] = useState(false);
  const [linkError, setLinkError] = useState("");
  const latestCitizenIdRef = useRef("");
  const citizenIdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCheckingCitizenId, setIsCheckingCitizenId] = useState(false);
  const [hnLookupWarning, setHnLookupWarning] = useState("");
  const [nhsoLookupMessage, setNhsoLookupMessage] = useState("");

  const clearNhsoFields = useCallback(() => {
    for (const name of [
      "mainInsclCode",
      "mainInsclName",
      "subInsclCode",
      "subInsclName",
      "hmainCode",
      "hmainName",
      "hsubCode",
      "hsubName",
      "nhsoVerifiedAt",
    ] as const) {
      HandleChange({ target: { name, value: null } });
    }
  }, [HandleChange]);
  const {
    isOpen: isLinkLineModalOpen,
    onOpen: onOpenLinkLineModal,
    onClose: onCloseLinkLineModal,
    onOpenChange: onLinkLineModalOpenChange,
  } = useDisclosure();

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const error = validateBirthdayValue(Result?.birthDate ?? null);

      if (error) {
        setBirthdayError(error);

        return;
      }

      setBirthdayError("");

      if (!Result?.healthcareFacilityId?.trim()) {
        setFacilityError("กรุณาเลือกสถานพยาบาล");

        return;
      }

      setFacilityError("");

      const isStudent = Result?.isStudent === true;
      const hasSchool = Result?.schoolId != null && Number(Result.schoolId) > 0;
      const hasGradeYear =
        Result?.gradeYear != null && Number(Result.gradeYear) > 0;

      if (isStudent && !hasSchool) {
        setStudentSchoolError("นักเรียนต้องระบุสถานศึกษา");

        return;
      }

      setStudentSchoolError("");

      if (hasSchool && !hasGradeYear) {
        setGradeYearError("กรุณาเลือกชั้นปี");

        return;
      }

      setGradeYearError("");
      NextStep("Profile");
    },
    [
      NextStep,
      Result?.birthDate,
      Result?.gradeYear,
      Result?.schoolId,
      Result?.isStudent,
      Result?.healthcareFacilityId,
    ]
  );

  const validateCitizenId = async (value: string) => {
    // ตอนแก้ไขโปรไฟล์ ให้ exclude เลขบัตรของตัวเอง ไม่ให้ขึ้นว่าซ้ำ
    const excludeId = Result?.id ? Result.id : null;
    const result = await validateCitizen(value, "user", excludeId);
    const data = await result.json();

    if (!data.valid) {
      if (isReferentFlow) {
        setReferentDuplicate(true);
        setReferentDuplicateHasLine(!!data.hasLineLinked);
        if (data.hasLineLinked) {
          setError(
            'ผู้รับการประเมินรายนี้เชื่อมต่อ LINE แล้ว กรุณาให้ทำแบบประเมินด้วยตนเองที่เมนู "แบบทดสอบของฉัน" หรือติดต่อผู้ดูแลระบบ'
          );
        } else {
          setError(
            "พบข้อมูลเลขบัตรประชาชนนี้ในระบบแล้ว กรุณาค้นหาผู้รับการประเมินที่หน้าค้นหา"
          );
        }

        return false;
      }

      if (data.canLinkLine) {
        setError("");
        setLinkCitizenId(value);
        setLinkError("");
        onOpenLinkLineModal();

        return false;
      }

      setError(data.error);

      return false;
    }
    setError("");
    setReferentDuplicate(false);
    setReferentDuplicateHasLine(false);

    return true;
  };

  const handleLinkLine = useCallback(async () => {
    if (!linkCitizenId) {
      return;
    }

    if (sessionStatus === "unauthenticated") {
      await signIn("line");

      return;
    }

    setIsLinkingLine(true);
    setLinkError("");

    try {
      const response = await fetch("/api/profile/link-line", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ citizenId: linkCitizenId }),
        credentials: "include",
      });
      const payload = (await response.json()) as {
        error?: string;
        requiresLineSignIn?: boolean;
      };

      if (!response.ok) {
        if (payload.requiresLineSignIn) {
          await signIn("line");

          return;
        }

        setLinkError(payload.error || "ไม่สามารถเชื่อมต่อ LINE ได้");

        return;
      }

      onCloseLinkLineModal();
      router.push("/liff/question/list");
    } catch {
      setLinkError("ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLinkingLine(false);
    }
  }, [linkCitizenId, onCloseLinkLineModal, router, sessionStatus]);

  const searchAndSetHn = useCallback(
    async (citizenId: string) => {
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
          hn?: string | null;
        };

        // ป้องกันการเขียนทับด้วยผลลัพธ์ request เก่า
        if (latestCitizenIdRef.current !== citizenId) {
          return;
        }

        if (!response.ok) {
          HandleChange({ target: { name: "hn", value: "" } });
          setHnLookupWarning(
            "ไม่สามารถค้นหา HN จากระบบโรงพยาบาลได้ในขณะนี้ สามารถลงทะเบียนต่อได้"
          );

          return;
        }

        setHnLookupWarning("");
        HandleChange({
          target: { name: "hn", value: payload.hn?.trim() || "" },
        });
      } catch {
        if (latestCitizenIdRef.current === citizenId) {
          HandleChange({ target: { name: "hn", value: "" } });
          setHnLookupWarning(
            "ไม่สามารถค้นหา HN จากระบบโรงพยาบาลได้ในขณะนี้ สามารถลงทะเบียนต่อได้"
          );
        }
      }
    },
    [HandleChange]
  );

  const searchAndSetNhso = useCallback(
    async (citizenId: string) => {
      try {
        const response = await fetch("/api/profile/nhso", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ citizenId }),
        });
        const payload = (await response.json()) as {
          error?: string;
          nhsoResult?: {
            status: string;
            mainInsclCode?: string;
            mainInsclName?: string;
            subInsclCode?: string;
            subInsclName?: string;
            hmainCode?: string;
            hmainName?: string;
            hsubCode?: string;
            hsubName?: string;
            verifiedAt?: string;
            errorMessage?: string;
          };
        };

        if (latestCitizenIdRef.current !== citizenId) {
          return;
        }

        if (!response.ok || !payload.nhsoResult) {
          clearNhsoFields();
          setNhsoLookupMessage(
            response.status === 404
              ? "ไม่พบข้อมูลสิทธิ สปสช. สามารถลงทะเบียนต่อได้"
              : "ไม่สามารถตรวจสอบสิทธิ สปสช. ได้ในขณะนี้ สามารถลงทะเบียนต่อได้"
          );

          return;
        }

        const result = payload.nhsoResult;
        const rightsLabel =
          result.mainInsclName?.trim() ||
          result.mainInsclCode?.trim() ||
          "พบข้อมูลสิทธิ";

        HandleChange({
          target: {
            name: "mainInsclCode",
            value: result.mainInsclCode ?? null,
          },
        });
        HandleChange({
          target: {
            name: "mainInsclName",
            value: result.mainInsclName ?? null,
          },
        });
        HandleChange({
          target: { name: "subInsclCode", value: result.subInsclCode ?? null },
        });
        HandleChange({
          target: { name: "subInsclName", value: result.subInsclName ?? null },
        });
        HandleChange({
          target: { name: "hmainCode", value: result.hmainCode ?? null },
        });
        HandleChange({
          target: { name: "hmainName", value: result.hmainName ?? null },
        });
        HandleChange({
          target: { name: "hsubCode", value: result.hsubCode ?? null },
        });
        HandleChange({
          target: { name: "hsubName", value: result.hsubName ?? null },
        });
        HandleChange({
          target: {
            name: "nhsoVerifiedAt",
            value: result.verifiedAt
              ? new Date(result.verifiedAt).toISOString()
              : null,
          },
        });
        setNhsoLookupMessage(`สิทธิ: ${rightsLabel}`);
      } catch {
        if (latestCitizenIdRef.current === citizenId) {
          clearNhsoFields();
          setNhsoLookupMessage(
            "ไม่สามารถตรวจสอบสิทธิ สปสช. ได้ในขณะนี้ สามารถลงทะเบียนต่อได้"
          );
        }
      }
    },
    [HandleChange, clearNhsoFields]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!/^\d*$/.test(value)) {
      return;
    }

    if (citizenIdTimerRef.current) {
      clearTimeout(citizenIdTimerRef.current);
      citizenIdTimerRef.current = null;
    }

    if (value.length === 13) {
      setIsCheckingCitizenId(true);
      latestCitizenIdRef.current = value;
      citizenIdTimerRef.current = setTimeout(async () => {
        try {
          const isValid = await validateCitizenId(value);

          if (latestCitizenIdRef.current !== value) {
            return;
          }

          if (isValid) {
            await Promise.all([searchAndSetHn(value), searchAndSetNhso(value)]);
          } else {
            setHnLookupWarning("");
            setNhsoLookupMessage("");
            HandleChange({ target: { name: "hn", value: "" } });
            clearNhsoFields();
          }
        } finally {
          if (latestCitizenIdRef.current === value) {
            setIsCheckingCitizenId(false);
          }
        }
      }, 500);
    } else {
      setIsCheckingCitizenId(false);
      setError("");
      setHnLookupWarning("");
      setNhsoLookupMessage("");
      setReferentDuplicate(false);
      setReferentDuplicateHasLine(false);
      HandleChange({ target: { name: "hn", value: "" } });
      clearNhsoFields();
    }

    HandleChange({ target: { name: "citizenId", value } });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.length > 0 && value.length < 13) {
      setError("กรอกเลขบัตรประชาชนไม่ครบถ้วน");
    }
  };

  useEffect(() => {
    fetch("/api/data/school")
      .then((res) => res.json())
      .then((val) => {
        setSchool(val);
      });
    fetch("/api/data/healthcare-facility")
      .then((res) => res.json())
      .then((val) => {
        if (Array.isArray(val)) setFacilities(val);
      })
      .catch(() => setFacilities([]));
  }, []);

  useEffect(() => {
    if (isCheckingCitizenId || nhsoLookupMessage) return;
    const label =
      Result?.mainInsclName?.trim() || Result?.mainInsclCode?.trim() || "";

    if (label) {
      setNhsoLookupMessage(`สิทธิ: ${label}`);
    }
  }, [
    Result?.mainInsclCode,
    Result?.mainInsclName,
    isCheckingCitizenId,
    nhsoLookupMessage,
  ]);

  useEffect(() => {
    return () => {
      if (citizenIdTimerRef.current) {
        clearTimeout(citizenIdTimerRef.current);
      }
    };
  }, []);

  return (
    <Form
      className="flex flex-col gap-3 sm:gap-4 w-full min-w-0 text-start"
      validationBehavior="native"
      onSubmit={onSubmit}
    >
      <Autocomplete
        isRequired
        className="w-full"
        defaultItems={facilities}
        errorMessage={facilityError || "กรุณาเลือกสถานพยาบาล"}
        isInvalid={!!facilityError}
        label="สถานพยาบาล"
        labelPlacement="inside"
        menuTrigger="input"
        name="healthcareFacilityId"
        placeholder="เลือก ศบส. / สถานพยาบาล"
        popoverProps={liffPopoverProps}
        radius="md"
        scrollShadowProps={{
          isEnabled: false,
        }}
        selectedKey={Result?.healthcareFacilityId ?? null}
        size="sm"
        variant="faded"
        onSelectionChange={(val) => {
          setFacilityError("");
          HandleChange({
            target: {
              name: "healthcareFacilityId",
              value: val != null ? String(val) : null,
            },
          });
        }}
      >
        {(item) => (
          <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
        )}
      </Autocomplete>
      <Checkbox
        classNames={{
          base: "w-full max-w-full m-0 inline-flex items-center justify-start gap-2 px-3 py-2 bg-default-100 border-2 border-default-200 rounded-md hover:bg-default-200 cursor-pointer",
          label: "text-sm text-foreground",
        }}
        isSelected={Result?.isStudent === true}
        size="sm"
        onValueChange={(checked) => {
          setStudentSchoolError("");
          HandleChange({
            target: { name: "isStudent", value: checked },
          });
        }}
      >
        เป็นนักเรียน
      </Checkbox>
      {Result?.isStudent === true && (
        <>
          <Autocomplete
            isRequired
            className="w-full"
            defaultItems={school}
            errorMessage={studentSchoolError || "กรุณากรอกสถานศึกษา"}
            isInvalid={!!studentSchoolError}
            label="สถานศึกษา"
            labelPlacement="inside"
            menuTrigger="input"
            name="school"
            placeholder="โรงเรียน"
            popoverProps={liffPopoverProps}
            radius="md"
            scrollShadowProps={{
              isEnabled: false,
            }}
            selectedKey={
              Result?.schoolId != null && Result.schoolId > 0
                ? String(Result.schoolId)
                : null
            }
            size="sm"
            variant="faded"
            onSelectionChange={(val) => {
              const schoolId = val != null ? Number(val) : 0;

              setStudentSchoolError("");
              HandleChange({ target: { name: "school", value: schoolId } });
              if (schoolId === 0) {
                HandleChange({ target: { name: "gradeYear", value: "" } });
                setGradeYearError("");
              }
            }}
          >
            {(item) => (
              <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
            )}
          </Autocomplete>
          {Result?.schoolId != null && Result.schoolId > 0 && (
            <Select
              isRequired
              errorMessage={gradeYearError || "กรุณาเลือกชั้นปี"}
              isInvalid={!!gradeYearError}
              label="ชั้นปี"
              labelPlacement="inside"
              name="gradeYear"
              placeholder="เลือกชั้นปี"
              popoverProps={liffPopoverProps}
              radius="md"
              selectedKeys={
                Result?.gradeYear != null ? [Result.gradeYear.toString()] : []
              }
              size="sm"
              variant="faded"
              onChange={(e) => {
                setGradeYearError("");
                HandleChange({
                  target: {
                    name: "gradeYear",
                    value: e.target.value ? parseInt(e.target.value, 10) : "",
                  },
                });
              }}
            >
              {gradeYearLevels.map((item) => (
                <SelectItem key={item.key}>{item.label}</SelectItem>
              ))}
            </Select>
          )}
        </>
      )}
      <Input
        description={
          isCheckingCitizenId
            ? "กำลังตรวจสอบ HN และสิทธิ สปสช...."
            : [hnLookupWarning, nhsoLookupMessage]
                .filter(Boolean)
                .join(" · ") || undefined
        }
        errorMessage={error}
        isInvalid={!!error}
        isRequired={request}
        label="เลขบัตรประชาชน"
        labelPlacement="inside"
        maxLength={13}
        name="citizenId"
        placeholder="เลขบัตรประชาชน"
        radius="md"
        size="sm"
        type="text"
        value={Result?.citizenId ?? ""}
        variant="faded"
        onBlur={handleBlur}
        onChange={handleChange}
      />
      {isReferentFlow && referentDuplicate && !referentDuplicateHasLine ? (
        <Button
          className="w-full"
          color="primary"
          radius="full"
          size="sm"
          variant="bordered"
          onPress={() => router.push("/liff/referent/lookup")}
        >
          กลับไปค้นหาผู้รับการประเมิน
        </Button>
      ) : null}
      <div className="flex flex-row gap-2 sm:gap-4 w-full min-w-0">
        <Select
          className="flex-1 basis-0"
          errorMessage="กรุณาเลือกคำนำหน้า"
          isDisabled={false}
          isRequired={request}
          label="คำนำหน้า"
          labelPlacement="inside"
          name="prefix"
          placeholder="คำนำหน้า"
          popoverProps={liffPopoverProps}
          radius="md"
          selectedKeys={Result?.prefixId ? [Result.prefixId.toString()] : []}
          size="sm"
          variant="faded"
          onChange={HandleChange}
        >
          {prefix.map((prefix) => (
            <SelectItem key={prefix.key}>{prefix.label}</SelectItem>
          ))}
        </Select>
        <Select
          className="flex-1 basis-0"
          errorMessage="กรุณาเลือกเพศ"
          isDisabled={false}
          isRequired={request}
          label="เพศ"
          labelPlacement="inside"
          name="sex"
          placeholder="เพศ"
          popoverProps={liffPopoverProps}
          radius="md"
          selectedKeys={
            Result?.sex != null
              ? [String(mapSexToLegacyNumber(Result.sex as never))]
              : []
          }
          size="sm"
          variant="faded"
          onChange={HandleChange}
        >
          {sex.map((sex) => (
            <SelectItem key={sex.key}>{sex.label}</SelectItem>
          ))}
        </Select>
      </div>
      <Input
        errorMessage="กรุณากรอกชื่อ"
        isRequired={request}
        label="ชื่อ"
        labelPlacement="inside"
        name="firstName"
        placeholder="ชื่อ"
        radius="md"
        size="sm"
        value={Result?.firstName}
        variant="faded"
        onChange={HandleChange}
      />
      <Input
        errorMessage="กรุณากรอกนามสกุล"
        isRequired={request}
        label="นามสกุล"
        labelPlacement="inside"
        name="lastName"
        placeholder="นามสกุล"
        radius="md"
        size="sm"
        value={Result?.lastName}
        variant="faded"
        onChange={HandleChange}
      />
      <BirthdaySelect
        errorMessage={birthdayError}
        isInvalid={!!birthdayError}
        isRequired={request}
        label="วันเกิด"
        labelPlacement="inside"
        size="sm"
        value={Result?.birthDate}
        variant="faded"
        onChange={(isoDate) => {
          if (!isoDate) {
            setBirthdayError("กรุณาระบุวันเกิด");
            HandleChange({ target: { name: "birthday", value: isoDate } });

            return;
          }

          const thaiDate = formatDateForDisplay(`${isoDate}T12:00:00`);
          const error = validateBirthday(thaiDate);

          setBirthdayError(error);
          HandleChange({ target: { name: "birthday", value: isoDate } });
        }}
      />
      <div className="flex flex-row gap-2 sm:gap-4 w-full min-w-0">
        <Input
          className="flex-1 min-w-0"
          errorMessage="กรุณากรอกเชื้อชาติ"
          isRequired={request}
          label="เชื้อชาติ"
          labelPlacement="inside"
          name="ethnicity"
          placeholder="เชื้อชาติ"
          radius="md"
          size="sm"
          value={Result?.ethnicity}
          variant="faded"
          onChange={HandleChange}
        />
        <Input
          className="flex-1 min-w-0"
          errorMessage="กรุณากรอกสัญชาติ"
          isRequired={request}
          label="สัญชาติ"
          labelPlacement="inside"
          name="nationality"
          placeholder="สัญชาติ"
          radius="md"
          size="sm"
          value={Result?.nationality}
          variant="faded"
          onChange={HandleChange}
        />
      </div>
      <Input
        errorMessage="กรอกเบอร์โทรศัพท์ไม่ถูกต้อง"
        label="เบอร์โทรศัพท์"
        labelPlacement="inside"
        maxLength={10}
        name="phone"
        placeholder="เบอร์โทรศัพท์"
        radius="md"
        size="sm"
        type="text"
        validate={(val) => {
          const tel = val.toString();

          return tel === "" ? "" : validateTel(tel);
        }}
        value={Result?.phone}
        variant="faded"
        onChange={HandleChange}
      />
      {primaryAction === "cancel" && onCancel ? (
        <>
          <Button
            className="w-full"
            color="default"
            radius="full"
            size="lg"
            variant="solid"
            onPress={onCancel}
          >
            ยกเลิก
          </Button>
          <Button
            className="w-full"
            color="primary"
            radius="full"
            size="lg"
            type="submit"
            variant="solid"
          >
            ถัดไป
          </Button>
        </>
      ) : (
        <>
          <Button
            className="w-full"
            color="primary"
            radius="full"
            size="lg"
            type="submit"
            variant="solid"
          >
            ถัดไป
          </Button>
          {onCancel && (
            <Button
              className="w-full"
              color="default"
              radius="full"
              size="lg"
              variant="solid"
              onPress={onCancel}
            >
              ยกเลิก
            </Button>
          )}
        </>
      )}
      <Modal
        backdrop="opaque"
        isOpen={isLinkLineModalOpen}
        placement="center"
        size="sm"
        onOpenChange={onLinkLineModalOpenChange}
      >
        <ModalContent>
          {() => (
            <>
              <ModalBody className="items-center text-center gap-3 pt-8 pb-2">
                <h2 className="text-lg font-semibold">คุณเคยลงทะเบียนแล้ว</h2>
                <p className="text-sm text-default-600">
                  พบข้อมูลเลขบัตรประชาชนนี้ในระบบแล้ว แต่ยังไม่ได้เชื่อมต่อบัญชี
                  LINE กรุณาเชื่อมต่อเพื่อใช้งานต่อ
                </p>
                {linkError ? (
                  <p className="text-sm text-danger">{linkError}</p>
                ) : null}
              </ModalBody>
              <ModalFooter className="flex flex-col gap-2 pb-6">
                <Button
                  className="w-full bg-emerald-200 text-emerald-600"
                  isLoading={isLinkingLine}
                  radius="full"
                  size="lg"
                  startContent={
                    !isLinkingLine ? <LineIcon size={24} /> : undefined
                  }
                  variant="solid"
                  onPress={handleLinkLine}
                >
                  เชื่อมต่อ LINE
                </Button>
                <Button
                  className="w-full"
                  color="default"
                  isDisabled={isLinkingLine}
                  radius="full"
                  size="lg"
                  variant="light"
                  onPress={onCloseLinkLineModal}
                >
                  ปิด
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Form>
  );
};
