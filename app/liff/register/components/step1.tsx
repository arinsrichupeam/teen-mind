"use client";

import { Profile, School } from "@prisma/client";
import { Input } from "@heroui/input";
import { Form } from "@heroui/form";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { CalendarDate, parseDate } from "@internationalized/date";
import { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import {
  Autocomplete,
  AutocompleteItem,
  DatePicker,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { LineIcon } from "@/components/icons";
import { prefix, sex, gradeYearLevels } from "@/utils/data";
import { validateCitizen, validateTel, safeParseDate } from "@/utils/helper";

/** Profile ที่มีฟิลด์ชั้นปี (gradeYear) สำหรับฟอร์มลงทะเบียน */
type ProfileWithGradeYear = Profile & { gradeYear?: number | null };

type StepName = "Profile" | "Address" | "Emergency";

/** เหตุการณ์เปลี่ยนค่า (รองรับทั้ง event จริงและ synthetic object จาก DatePicker/Autocomplete) */
export type ChangeEventLike = {
  target: { name: string; value: string | number | null };
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
  const [birthday, setBirthday] = useState<CalendarDate | null>(null);
  const [school, setSchool] = useState<School[]>([]);
  const [error, setError] = useState<string>("");
  const [referentDuplicate, setReferentDuplicate] = useState(false);
  const [referentDuplicateHasLine, setReferentDuplicateHasLine] =
    useState(false);
  const [linkCitizenId, setLinkCitizenId] = useState("");
  const [isLinkingLine, setIsLinkingLine] = useState(false);
  const [linkError, setLinkError] = useState("");
  const latestCitizenIdRef = useRef("");
  const {
    isOpen: isLinkLineModalOpen,
    onOpen: onOpenLinkLineModal,
    onClose: onCloseLinkLineModal,
    onOpenChange: onLinkLineModalOpenChange,
  } = useDisclosure();

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      NextStep("Profile");
    },
    [NextStep]
  );

  const DateChange = useCallback(
    (val: CalendarDate | null) => {
      setBirthday(val);
      if (val) {
        HandleChange({ target: { name: "birthday", value: val.toString() } });
      }
    },
    [HandleChange]
  );

  const validateCitizenId = async (value: string) => {
    const result = await validateCitizen(value, "user");
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
      latestCitizenIdRef.current = citizenId;
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
          if (response.status !== 401) {
            setError(payload.error || "เกิดข้อผิดพลาดในการค้นหา HN");
          }

          return;
        }

        HandleChange({
          target: { name: "hn", value: payload.hn?.trim() || "" },
        });
      } catch {
        if (latestCitizenIdRef.current === citizenId) {
          HandleChange({ target: { name: "hn", value: "" } });
        }
      }
    },
    [HandleChange]
  );

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!/^\d*$/.test(value)) {
      return;
    }

    if (value.length === 13) {
      const isValid = await validateCitizenId(value);

      if (isValid) {
        await searchAndSetHn(value);
      } else {
        HandleChange({ target: { name: "hn", value: "" } });
      }
    } else {
      setError("");
      setReferentDuplicate(false);
      setReferentDuplicateHasLine(false);
      HandleChange({ target: { name: "hn", value: "" } });
    }

    HandleChange({ target: { name: "citizenId", value } });
  };

  useEffect(() => {
    if (Result?.birthday) {
      const parsedDate = safeParseDate(Result.birthday);

      if (parsedDate && typeof parsedDate !== "string") {
        setBirthday(parsedDate);
      }
    }
  }, [Result?.birthday]);

  useEffect(() => {
    fetch("/api/data/school")
      .then((res) => res.json())
      .then((val) => {
        setSchool(val);
      });
  }, []);

  return (
    <Form
      className="flex flex-col gap-4 w-full text-start"
      validationBehavior="native"
      onSubmit={onSubmit}
    >
      <Input
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
      <div className="flex flex-row gap-4 w-full">
        <Select
          className="max-w-xs"
          errorMessage="กรุณาเลือกคำนำหน้า"
          isDisabled={false}
          isRequired={request}
          label="คำนำหน้า"
          labelPlacement="inside"
          name="prefix"
          placeholder="คำนำหน้า"
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
          className="max-w-xs"
          errorMessage="กรุณาเลือกเพศ"
          isDisabled={false}
          isRequired={request}
          label="เพศ"
          labelPlacement="inside"
          name="sex"
          placeholder="เพศ"
          radius="md"
          selectedKeys={Result?.sex ? [Result.sex.toString()] : []}
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
        name="firstname"
        placeholder="ชื่อ"
        radius="md"
        size="sm"
        value={Result?.firstname}
        variant="faded"
        onChange={HandleChange}
      />
      <Input
        errorMessage="กรุณากรอกนามสกุล"
        isRequired={request}
        label="นามสกุล"
        labelPlacement="inside"
        name="lastname"
        placeholder="นามสกุล"
        radius="md"
        size="sm"
        value={Result?.lastname}
        variant="faded"
        onChange={HandleChange}
      />
      <DatePicker
        className="w-full"
        errorMessage="กรุณาระบุวันเกิดให้ถูกต้อง"
        isRequired={request}
        label="วันเกิด"
        labelPlacement="inside"
        maxValue={parseDate(moment().format("YYYY-MM-DD"))}
        minValue={parseDate(
          moment().subtract(100, "years").format("YYYY-MM-DD")
        )}
        radius="md"
        selectorButtonPlacement="start"
        showMonthAndYearPickers={true}
        size="sm"
        value={birthday ?? undefined}
        variant="faded"
        onChange={DateChange}
      />
      <div className="flex flex-row gap-4 w-full">
        <Input
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
        isRequired={request}
        label="เบอร์โทรศัพท์"
        labelPlacement="inside"
        maxLength={10}
        name="tel"
        placeholder="เบอร์โทรศัพท์"
        radius="md"
        size="sm"
        type="text"
        validate={(val) => validateTel(val.toString())}
        value={Result?.tel}
        variant="faded"
        onChange={HandleChange}
      />
      <Autocomplete
        defaultItems={school}
        errorMessage="กรุณากรอกสถานศึกษา"
        isRequired={false}
        label="สถานศึกษา"
        labelPlacement="inside"
        menuTrigger="input"
        name="school"
        placeholder="โรงเรียน"
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

          HandleChange({ target: { name: "school", value: schoolId } });
          if (schoolId === 0) {
            HandleChange({ target: { name: "gradeYear", value: "" } });
          }
        }}
      >
        {(item) => (
          <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
        )}
      </Autocomplete>
      {Result?.schoolId != null && Result.schoolId > 0 && (
        <Select
          errorMessage="กรุณาเลือกชั้นปี"
          isRequired={false}
          label="ชั้นปี"
          labelPlacement="inside"
          name="gradeYear"
          placeholder="เลือกชั้นปี"
          radius="md"
          selectedKeys={
            Result?.gradeYear != null ? [Result.gradeYear.toString()] : []
          }
          size="sm"
          variant="faded"
          onChange={(e) =>
            HandleChange({
              target: {
                name: "gradeYear",
                value: e.target.value ? parseInt(e.target.value, 10) : "",
              },
            } as React.ChangeEvent<HTMLSelectElement>)
          }
        >
          {gradeYearLevels.map((level) => (
            <SelectItem key={level.key}>{level.label}</SelectItem>
          ))}
        </Select>
      )}
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
