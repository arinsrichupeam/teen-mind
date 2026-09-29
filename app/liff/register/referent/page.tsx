"use client";

import {
  addToast,
  Autocomplete,
  AutocompleteItem,
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Affiliation,
  EmployeeType,
  FacilityUnit,
  Volunteer,
  VolunteerType,
} from "@prisma/client";
import React from "react";

import {
  RegistrationInfoModal,
  RegistrationDescriptionModal,
  VerificationModal,
  ReferentQRCodeModal,
} from "./components";

import { title } from "@/components/primitives";
import { normalizeProfileFormFieldName } from "@/lib/profile-form-fields";
import { prefix } from "@/utils/data";
import { validateCitizen, validateEmail } from "@/utils/helper";
import { generateQRCode } from "@/utils/qrcode";
import { referentInitValue } from "@/types/initData";

type Mode = "register" | "edit";

type FacilityOption = {
  id: string;
  name: string;
  affiliationId: number;
};

type UnitOption = {
  id: number;
  name: string;
};

type ReferentFormState = Volunteer & {
  facilityUnitId: number | null;
  newFacilityUnitName: string;
};

const referentFormInit: ReferentFormState = {
  ...referentInitValue,
  facilityUnitId: null,
  newFacilityUnitName: "",
};

const NEW_UNIT_KEY_PREFIX = "new:";
const FIELD_ROW_CLASS =
  "flex w-full max-w-xl min-w-[320px] flex-row items-end gap-2";
const AUTOCOMPLETE_CLASS_NAMES = {
  base: "min-w-0 flex-1",
  inputWrapper: "h-12 min-h-12",
} as const;
const ADD_BUTTON_CLASS =
  "h-12 min-h-12 max-h-12 w-[9.5rem] shrink-0 px-2 text-sm";

export default function ReferentPage() {
  const request = true;
  const [error, setError] = useState<string>("");
  const [mode, setMode] = useState<Mode>("register");

  const formRef = useRef<HTMLFormElement>(null);
  const [selectedReferent, setSelectedReferent] =
    useState<ReferentFormState>(referentFormInit);
  const [referent, setReferent] = useState<ReferentFormState>(referentFormInit);
  const [volunteerType, setvolunteerType] = useState<VolunteerType[]>([]);
  const [employeeType, setEmployeeType] = useState<EmployeeType[]>([]);
  const [affiliation, setAffiliation] = useState<Affiliation[]>([]);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [facilityUnits, setFacilityUnits] = useState<FacilityUnit[]>([]);
  const [localFacilityUnits, setLocalFacilityUnits] = useState<UnitOption[]>(
    []
  );
  const [newUnitName, setNewUnitName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");

  const facilityItems = useMemo(() => {
    if (!selectedReferent.affiliationId) return facilities;

    return facilities.filter(
      (f) => f.affiliationId === selectedReferent.affiliationId
    );
  }, [facilities, selectedReferent.affiliationId]);

  const unitItems = useMemo(() => {
    const fromDb = facilityUnits.map((u) => ({ id: u.id, name: u.name }));
    const merged = [...fromDb, ...localFacilityUnits];
    const seen = new Set<string>();

    return merged.filter((u) => {
      const key = u.name.trim().toLowerCase();

      if (seen.has(key)) return false;
      seen.add(key);

      return true;
    });
  }, [facilityUnits, localFacilityUnits]);

  const selectedUnitKey = useMemo(() => {
    if (selectedReferent.newFacilityUnitName.trim()) {
      return `${NEW_UNIT_KEY_PREFIX}${selectedReferent.newFacilityUnitName.trim()}`;
    }
    if (selectedReferent.facilityUnitId != null) {
      return String(selectedReferent.facilityUnitId);
    }

    return null;
  }, [selectedReferent.facilityUnitId, selectedReferent.newFacilityUnitName]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenModal2,
    onOpen: onOpenModal2,
    onClose: onCloseModal2,
  } = useDisclosure();
  const {
    isOpen: isOpenModal3,
    onOpen: onOpenModal3,
    onClose: onCloseModal3,
    onOpenChange,
  } = useDisclosure();

  const {
    isOpen: isOpenModal4,
    onOpen: onOpenModal4,
    onClose: onCloseModal4,
  } = useDisclosure();
  const {
    isOpen: isUnitOpen,
    onOpen: onUnitOpen,
    onClose: onUnitClose,
  } = useDisclosure();

  const GetvolunteerType = useCallback(async () => {
    await fetch("/api/data/volunteer")
      .then((res) => res.json())
      .then((data) => {
        setvolunteerType(data);
      });
  }, [volunteerType]);

  const GetEmployeeType = useCallback(async () => {
    await fetch("/api/data/employee")
      .then((res) => res.json())
      .then((data) => {
        setEmployeeType(data);
      });
  }, [employeeType]);

  const GetAffiliation = useCallback(async () => {
    await fetch("/api/data/affiliation")
      .then((res) => res.json())
      .then((data) => {
        setAffiliation(data);
      });
  }, [affiliation]);

  const GetFacilities = useCallback(async () => {
    await fetch("/api/data/healthcare-facility")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFacilities(
            data.map((f: FacilityOption) => ({
              id: f.id,
              name: f.name,
              affiliationId: Number(f.affiliationId),
            }))
          );
        }
      })
      .catch(() => setFacilities([]));
  }, []);

  const loadFacilityUnits = useCallback(async (facilityId: string) => {
    if (!facilityId) {
      setFacilityUnits([]);

      return;
    }

    try {
      const res = await fetch(
        `/api/data/facility-unit?healthcareFacilityId=${encodeURIComponent(facilityId)}`
      );
      const data = await res.json();

      setFacilityUnits(Array.isArray(data) ? data : []);
    } catch {
      setFacilityUnits([]);
    }
  }, []);

  useEffect(() => {
    void loadFacilityUnits(selectedReferent.healthcareFacilityId);
  }, [selectedReferent.healthcareFacilityId, loadFacilityUnits]);

  const handleVerification = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data = {
        citizenId: formData.get("citizenId"),
        phone: formData.get("phone") ?? formData.get("tel"),
      };

      await fetch(`/api/data/referent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            const referent = data[0];

            if (referent.affiliation?.name) {
              referent.affiliationId = affiliation.find(
                (x) => x.name === referent.affiliation.name
              )?.id;
            }

            if (referent.volunteer_type?.name) {
              referent.volunteerTypeId = volunteerType.find(
                (x) => x.name === referent.volunteer_type.name
              )?.id;
            }

            if (referent.employee_type?.name) {
              referent.employeeTypeId = employeeType.find(
                (x) => x.name === referent.employee_type.name
              )?.id;
            }

            if (referent.prefixId) {
              referent.prefixId = referent.prefixId.toString();
            }

            if (referent.facilityUnitId == null) {
              referent.facilityUnitId = null;
            }

            if (mode === "edit") {
              setSelectedReferent({
                ...referentFormInit,
                ...referent,
                facilityUnitId: referent.facilityUnitId ?? null,
              });
              onCloseModal3();
              addToast({
                title: "สำเร็จ",
                color: "success",
                description: "พบข้อมูลการลงทะเบียน สามารถแก้ไขได้",
              });
            } else {
              if (
                referent &&
                referent.id !== undefined &&
                referent.id !== null
              ) {
                setReferent({
                  ...referentFormInit,
                  ...referent,
                  facilityUnitId: referent.facilityUnitId ?? null,
                });
                onOpenModal4();
              } else {
                addToast({
                  title: "เกิดข้อผิดพลาด",
                  color: "danger",
                  description: "ข้อมูล referent ไม่ถูกต้อง",
                });
                onCloseModal3();
              }
            }
          } else {
            addToast({
              title: "แจ้งเตือน",
              color: "danger",
              description: "ไม่พบข้อมูลการลงทะเบียน",
            });
            onCloseModal3();
          }
        });
    },
    [
      selectedReferent,
      onOpen,
      affiliation,
      volunteerType,
      mode,
      onCloseModal3,
      onOpenModal4,
      employeeType,
    ]
  );

  const validateCitizenId = async (value: string) => {
    if (!value || value.length !== 13) {
      setError("กรอกเลขบัตรประชาชนไม่ครบถ้วน");

      return false;
    }

    const isDigit = /^[0-9]*$/.test(value);

    if (!isDigit) {
      setError("เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น");

      return false;
    }

    let sum = 0;

    for (let i = 0; i < 12; i++) {
      sum += parseInt(value.charAt(i)) * (13 - i);
    }
    const checksum = (11 - (sum % 11)) % 10;

    if (checksum !== parseInt(value.charAt(12))) {
      setError("กรอกเลขบัตรประชาชนไม่ถูกต้อง");

      return false;
    }

    const result = await validateCitizen(value, "referent");
    const data = await result.json();

    if (!data.valid) {
      setError(data.error);

      return false;
    }

    setError("");

    return true;
  };

  type ChangeEventLike =
    | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    | { target: { name: string; value: string } };

  const HandleChange = useCallback(async (e: ChangeEventLike) => {
    if (e.target.name === "citizenId") {
      const value = e.target.value;

      if (value.length > 13) {
        return;
      }
      if (value.length === 13) {
        await validateCitizenId(value);
      } else if (value.length > 0) {
        setError("กรอกเลขบัตรประชาชนไม่ครบถ้วน");
      } else {
        setError("");
      }
      setSelectedReferent((prev) => ({
        ...prev,
        [e.target.name]: value,
      }));
    } else if (e.target.name === "affiliationId") {
      const affiliationId = parseInt(String(e.target.value), 10) || 0;

      setSelectedReferent((prev) => ({
        ...prev,
        affiliationId,
        healthcareFacilityId: "",
        facilityUnitId: null,
        newFacilityUnitName: "",
      }));
      setFacilityUnits([]);
      setLocalFacilityUnits([]);
    } else {
      const { name, value } = e.target;
      const field = normalizeProfileFormFieldName(name);

      setSelectedReferent((prev) => ({
        ...prev,
        [field]:
          field === "prefixId" ||
          field === "volunteerTypeId" ||
          field === "employeeTypeId"
            ? parseInt(String(value), 10) || 0
            : value,
      }));
    }
  }, []);

  const handleFacilitySelect = useCallback((key: React.Key | null) => {
    if (key == null) {
      setSelectedReferent((prev) => ({
        ...prev,
        healthcareFacilityId: "",
        facilityUnitId: null,
        newFacilityUnitName: "",
      }));
      setLocalFacilityUnits([]);

      return;
    }

    setSelectedReferent((prev) => ({
      ...prev,
      healthcareFacilityId: String(key),
      facilityUnitId: null,
      newFacilityUnitName: "",
    }));
    setLocalFacilityUnits([]);
  }, []);

  const handleUnitSelect = useCallback((key: React.Key | null) => {
    if (key == null) {
      setSelectedReferent((prev) => ({
        ...prev,
        facilityUnitId: null,
        newFacilityUnitName: "",
      }));

      return;
    }

    const keyStr = String(key);

    if (keyStr.startsWith(NEW_UNIT_KEY_PREFIX)) {
      setSelectedReferent((prev) => ({
        ...prev,
        facilityUnitId: null,
        newFacilityUnitName: keyStr.slice(NEW_UNIT_KEY_PREFIX.length),
      }));

      return;
    }

    const id = parseInt(keyStr, 10);

    setSelectedReferent((prev) => ({
      ...prev,
      facilityUnitId: Number.isNaN(id) || id <= 0 ? null : id,
      newFacilityUnitName: "",
    }));
  }, []);

  const handleAddUnit = useCallback(() => {
    const name = newUnitName.trim();

    if (!selectedReferent.healthcareFacilityId) {
      addToast({
        title: "เลือกหน่วยงานก่อน",
        color: "warning",
        description: "กรุณาเลือกหน่วยงานก่อนเพิ่มหน่วยงานย่อย",
      });

      return;
    }

    if (!name) {
      addToast({
        title: "ข้อมูลไม่ครบ",
        color: "danger",
        description: "กรุณาระบุชื่อหน่วยงานย่อย",
      });

      return;
    }

    const exists = unitItems.some(
      (u) => u.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      const matched = unitItems.find(
        (u) => u.name.trim().toLowerCase() === name.toLowerCase()
      );

      if (matched) {
        const isLocal = localFacilityUnits.some((u) => u.id === matched.id);

        setSelectedReferent((prev) => ({
          ...prev,
          facilityUnitId: isLocal || matched.id <= 0 ? null : matched.id,
          newFacilityUnitName: isLocal || matched.id <= 0 ? matched.name : "",
        }));
      }
      setNewUnitName("");
      onUnitClose();

      return;
    }

    setLocalFacilityUnits((prev) => [...prev, { id: -Date.now(), name }]);
    setSelectedReferent((prev) => ({
      ...prev,
      facilityUnitId: null,
      newFacilityUnitName: name,
    }));
    setNewUnitName("");
    onUnitClose();
    addToast({
      color: "success",
      title: "เพิ่มหน่วยงานย่อยแล้ว",
      description: `${name} จะถูกสร้างเมื่อลงทะเบียนสำเร็จ`,
    });
  }, [
    newUnitName,
    selectedReferent.healthcareFacilityId,
    unitItems,
    localFacilityUnits,
    onUnitClose,
  ]);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const data = JSON.stringify({ referent_data: selectedReferent });

      if (mode === "register") {
        await fetch("/api/register/referent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: data,
        })
          .then((res) => {
            setIsLoading(true);

            return res.json();
          })
          .then((data) => {
            if (data == "000") {
              addToast({
                title: "แจ้งเตือน",
                color: "danger",
                description: "เลขบัตรประชาชนนี้ได้ถูกลงทะเบียนไว้แล้ว",
              });
              setIsLoading(false);
            } else {
              HandleChange({ target: { name: "id", value: String(data) } });
              generateQR(data);
              onOpen();
            }
          });
      } else {
        if (!selectedReferent.id) {
          addToast({
            title: "แจ้งเตือน",
            color: "danger",
            description: "ไม่พบ ID ของข้อมูลที่ต้องการอัปเดต",
          });

          return;
        }

        await fetch(`/api/data/referent/${selectedReferent.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedReferent),
        })
          .then((res) => {
            setIsLoading(true);

            return res.json();
          })
          .then((data) => {
            if (data.success) {
              addToast({
                title: "สำเร็จ",
                color: "success",
                description: "อัปเดตข้อมูลเรียบร้อยแล้ว",
              });
              setMode("register");
              formRef.current?.reset();
              setSelectedReferent(referentFormInit);
            } else {
              addToast({
                title: "แจ้งเตือน",
                color: "danger",
                description: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
              });
            }
            setIsLoading(false);
          })
          .catch((error) => {
            addToast({
              title: "แจ้งเตือน",
              color: "danger",
              description: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" + error,
            });
            setIsLoading(false);
          });
      }
    },
    [selectedReferent, HandleChange, onOpen, mode]
  );

  const handleEditMode = useCallback(async () => {
    setMode("edit");
    onOpenModal3();
  }, [onOpenModal3]);

  const handleRegisterMode = useCallback(() => {
    setMode("register");
    setSelectedReferent(referentFormInit);
    setFacilityUnits([]);
    setLocalFacilityUnits([]);
    setNewUnitName("");
    setError("");
    formRef.current?.reset();
  }, []);

  const generateQR = async (referentId: number | string) => {
    try {
      const qrCodeUrl = await generateQRCode(
        `https://liff.line.me/1656886344-OopvvNmA/liff/register?ref=${referentId}`
      );

      setQrCode(qrCodeUrl);
    } catch (error) {
      addToast({
        title: "เกิดข้อผิดพลาดในการสร้าง QR Code",
        color: "danger",
        description: error as string,
      });
    }
  };

  useEffect(() => {
    if (mode === "register") {
      onOpenModal2();
    }
    GetvolunteerType();
    GetEmployeeType();
    GetAffiliation();
    GetFacilities();
  }, [mode, onOpenModal2]);

  return (
    <div className="flex flex-col w-[calc(100vw)] min-h-screen items-center gap-4 pt-10 px-8 py-8 pb-14 md:py-10">
      <h1 className={title({ size: "sm" })}>
        {mode === "register" ? "ลงทะเบียน อสท." : "แก้ไขข้อมูล อสท."}
      </h1>

      <div className="flex gap-4 mb-4">
        <Button
          color={mode === "register" ? "primary" : "default"}
          variant={mode === "register" ? "solid" : "bordered"}
          onPress={handleRegisterMode}
        >
          ลงทะเบียนใหม่
        </Button>
        <Button
          color={mode === "edit" ? "primary" : "default"}
          variant={mode === "edit" ? "solid" : "bordered"}
          onPress={handleEditMode}
        >
          แก้ไขข้อมูล
        </Button>
      </div>

      <RegistrationDescriptionModal
        isOpen={isOpenModal2}
        onClose={onCloseModal2}
      />

      <Form
        ref={formRef}
        className="flex flex-col gap-4 text-start"
        validationBehavior="native"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col items-center w-full gap-4 mb-4">
          <Input
            className="max-w-xl w-full min-w-[320px]"
            errorMessage={error}
            isInvalid={!!error}
            isReadOnly={mode === "edit"}
            isRequired={request}
            label="เลขบัตรประชาชน"
            labelPlacement="inside"
            maxLength={13}
            name="citizenId"
            placeholder="เลขบัตรประชาชน"
            radius="md"
            size="sm"
            type="text"
            value={selectedReferent.citizenId || ""}
            variant="faded"
            onChange={HandleChange}
          />
          <Select
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณาเลือกคำนำหน้า"
            isRequired={request}
            label="คำนำหน้า"
            labelPlacement="inside"
            name="prefixId"
            placeholder="คำนำหน้า"
            radius="md"
            selectedKeys={
              selectedReferent.prefixId
                ? [selectedReferent.prefixId.toString()]
                : []
            }
            size="sm"
            variant="faded"
            onChange={HandleChange}
          >
            {prefix.map((prefix) => (
              <SelectItem key={prefix.key}>{prefix.label}</SelectItem>
            ))}
          </Select>

          <Input
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณากรอกชื่อ"
            isRequired={request}
            label="ชื่อ"
            labelPlacement="inside"
            name="firstName"
            placeholder="ชื่อ"
            radius="md"
            size="sm"
            value={selectedReferent.firstName || ""}
            variant="faded"
            onChange={HandleChange}
          />
          <Input
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณากรอกนามสกุล"
            isRequired={request}
            label="นามสกุล"
            labelPlacement="inside"
            name="lastName"
            placeholder="นามสกุล"
            radius="md"
            size="sm"
            value={selectedReferent.lastName || ""}
            variant="faded"
            onChange={HandleChange}
          />
          <Input
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณากรอกเบอร์โทรศัพท์"
            isRequired={request}
            label="เบอร์โทรศัพท์"
            labelPlacement="inside"
            name="phone"
            placeholder="เบอร์โทรศัพท์"
            radius="md"
            size="sm"
            type="number"
            value={selectedReferent.phone || ""}
            variant="faded"
            onChange={HandleChange}
          />
          <Input
            className="max-w-xl w-full min-w-[320px]"
            isRequired={request}
            label="อีเมล"
            labelPlacement="inside"
            name="email"
            placeholder="อีเมล"
            radius="md"
            size="sm"
            type="text"
            validate={(val) => validateEmail(val.toString())}
            value={selectedReferent.email || ""}
            variant="faded"
            onChange={HandleChange}
          />
          <Select
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณาเลือกประเภทอาสาสมัคร"
            isRequired={request}
            label="ประเภทอาสาสมัคร"
            labelPlacement="inside"
            name="volunteerTypeId"
            placeholder="ประเภทอาสาสมัคร"
            radius="md"
            selectedKeys={
              selectedReferent.volunteerTypeId
                ? [selectedReferent.volunteerTypeId.toString()]
                : []
            }
            size="sm"
            variant="faded"
            onChange={HandleChange}
          >
            {volunteerType.map((volunteerType) => (
              <SelectItem key={volunteerType.id}>
                {volunteerType.name}
              </SelectItem>
            ))}
          </Select>
          <Select
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณาเลือกสังกัด"
            isRequired={request}
            label="สังกัด"
            labelPlacement="inside"
            name="affiliationId"
            placeholder="สังกัด"
            radius="md"
            selectedKeys={
              selectedReferent.affiliationId
                ? [selectedReferent.affiliationId.toString()]
                : []
            }
            size="sm"
            variant="faded"
            onChange={HandleChange}
          >
            {affiliation.map((affiliation) => (
              <SelectItem key={affiliation.id}>{affiliation.name}</SelectItem>
            ))}
          </Select>
          <Autocomplete
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณาเลือกหน่วยงาน"
            isDisabled={!selectedReferent.affiliationId}
            isRequired={request}
            items={facilityItems}
            label="หน่วยงาน"
            labelPlacement="inside"
            menuTrigger="input"
            placeholder={
              selectedReferent.affiliationId
                ? "ค้นหาหรือเลือกหน่วยงาน"
                : "เลือกสังกัดก่อน"
            }
            radius="md"
            selectedKey={selectedReferent.healthcareFacilityId || null}
            size="sm"
            variant="faded"
            onSelectionChange={handleFacilitySelect}
          >
            {(item) => (
              <AutocompleteItem key={item.id} textValue={item.name}>
                {item.name}
              </AutocompleteItem>
            )}
          </Autocomplete>
          <div className={FIELD_ROW_CLASS}>
            <Autocomplete
              className="min-w-0 flex-1"
              classNames={AUTOCOMPLETE_CLASS_NAMES}
              isDisabled={!selectedReferent.healthcareFacilityId}
              isRequired={false}
              items={unitItems.map((u) => ({
                id: u.id > 0 ? String(u.id) : `${NEW_UNIT_KEY_PREFIX}${u.name}`,
                name: u.name,
              }))}
              label="หน่วยงานย่อย (ถ้ามี)"
              labelPlacement="inside"
              menuTrigger="input"
              placeholder={
                !selectedReferent.healthcareFacilityId
                  ? "เลือกหน่วยงานก่อน"
                  : unitItems.length === 0
                    ? "ยังไม่มี — กดเพิ่มได้"
                    : "เลือกหรือเพิ่มหน่วยงานย่อย"
              }
              radius="md"
              selectedKey={selectedUnitKey}
              size="sm"
              variant="faded"
              onSelectionChange={handleUnitSelect}
            >
              {(item) => (
                <AutocompleteItem key={item.id} textValue={item.name}>
                  {item.name}
                  {String(item.id).startsWith(NEW_UNIT_KEY_PREFIX)
                    ? " (ใหม่)"
                    : ""}
                </AutocompleteItem>
              )}
            </Autocomplete>
            <Button
              className={ADD_BUTTON_CLASS}
              color="primary"
              isDisabled={!selectedReferent.healthcareFacilityId}
              radius="md"
              type="button"
              variant="solid"
              onPress={onUnitOpen}
            >
              เพิ่มหน่วยงานย่อย
            </Button>
          </div>
          <Select
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณาเลือกประเภทการจ้างงาน"
            isRequired={request}
            label="ประเภทการจ้างงาน"
            labelPlacement="inside"
            name="employeeTypeId"
            placeholder="ประเภทการจ้างงาน"
            radius="md"
            selectedKeys={
              selectedReferent.employeeTypeId
                ? [selectedReferent.employeeTypeId.toString()]
                : []
            }
            size="sm"
            variant="faded"
            onChange={HandleChange}
          >
            {employeeType.map((employeeType) => (
              <SelectItem key={employeeType.id}>{employeeType.name}</SelectItem>
            ))}
          </Select>
        </div>
        <div className="flex justify-center w-full">
          <Button
            color="primary"
            isLoading={isLoading}
            type="submit"
            variant="solid"
          >
            {isLoading
              ? mode === "register"
                ? "กำลังลงทะเบียน..."
                : "กำลังบันทึก..."
              : mode === "register"
                ? "ลงทะเบียน"
                : "บันทึกข้อมูล"}
          </Button>
        </div>

        {mode === "register" && (
          <div className="flex justify-center items-center gap-4 w-full font-semibold">
            <p>ตรวจสอบข้อมูลการลงทะเบียน อสท.</p>
            <Button
              color="warning"
              type="button"
              variant="solid"
              onPress={onOpenModal3}
            >
              ตรวจสอบ
            </Button>
          </div>
        )}
      </Form>

      <RegistrationInfoModal
        affiliation={affiliation}
        facilities={facilities}
        facilityUnits={facilityUnits}
        formRef={formRef as React.RefObject<HTMLFormElement>}
        isOpen={isOpen}
        qrCode={qrCode}
        selectedReferent={selectedReferent}
        setIsLoading={setIsLoading}
        volunteerType={volunteerType}
        onClose={onClose}
      />

      <ReferentQRCodeModal
        affiliation={affiliation}
        data={referent}
        facilities={facilities}
        isOpen={isOpenModal4}
        volunteerType={volunteerType}
        onClose={onCloseModal4}
      />

      <VerificationModal
        isOpen={isOpenModal3}
        mode={mode}
        request={request}
        onClose={onCloseModal3}
        onOpenChange={onOpenChange}
        onSubmit={handleVerification}
      />

      <Modal
        isOpen={isUnitOpen}
        placement="center"
        size="sm"
        onClose={onUnitClose}
      >
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>เพิ่มหน่วยงานย่อย</ModalHeader>
              <ModalBody>
                <p className="text-sm text-default-500">
                  หน่วยงาน:{" "}
                  {facilityItems.find(
                    (f) => f.id === selectedReferent.healthcareFacilityId
                  )?.name ?? "-"}
                </p>
                <Input
                  isRequired
                  label="ชื่อหน่วยงานย่อย"
                  labelPlacement="inside"
                  placeholder="เช่น งานส่งเสริมสุขภาพ"
                  value={newUnitName}
                  variant="bordered"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddUnit();
                    }
                  }}
                  onValueChange={setNewUnitName}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="bordered" onPress={close}>
                  ยกเลิก
                </Button>
                <Button color="primary" onPress={handleAddUnit}>
                  เพิ่ม
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
