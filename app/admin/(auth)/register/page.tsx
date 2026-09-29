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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Affiliation,
  EmployeeType,
  AdminStatus,
  FacilityUnit,
} from "@prisma/client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { title } from "@/components/primitives";
import { normalizeProfileFormFieldName } from "@/lib/profile-form-fields";
import { validateCitizen } from "@/utils/helper";
import { prefix } from "@/utils/data";

type FacilityOption = {
  id: string;
  name: string;
  affiliationId: number;
};

/** Form state for admin register */
type AdminRegisterForm = {
  id: string;
  userId: string;
  citizenId: string;
  prefixId: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  affiliationId: number;
  agency: string;
  healthcareFacilityId: string;
  facilityUnitId: number | null;
  newFacilityUnitName: string;
  employeeTypeId: number;
  profession: string;
  professional: string;
  license: string | null;
  status: AdminStatus | number;
  createdAt: Date;
  updatedAt: Date;
  roleId: number;
  receiveAlert: boolean;
};

type UnitOption = {
  id: number;
  name: string;
};

const profileInitValue: AdminRegisterForm = {
  id: "",
  userId: "",
  citizenId: "",
  prefixId: 0,
  firstName: "",
  lastName: "",
  phone: "",
  affiliationId: 0,
  agency: "",
  healthcareFacilityId: "",
  facilityUnitId: null,
  newFacilityUnitName: "",
  employeeTypeId: 0,
  profession: "",
  professional: "",
  license: "",
  status: AdminStatus.PENDING,
  createdAt: new Date(),
  updatedAt: new Date(),
  roleId: 3,
  receiveAlert: false,
};

const NEW_FACILITY_KEY_PREFIX = "new:";
const NEW_UNIT_KEY_PREFIX = "new:";
const FIELD_ROW_CLASS = "flex w-full max-w-xl flex-row items-end gap-2";
const AUTOCOMPLETE_CLASS_NAMES = {
  base: "min-w-0 flex-1",
  inputWrapper: "h-12 min-h-12",
} as const;
const ADD_BUTTON_CLASS =
  "h-12 min-h-12 max-h-12 w-[9.5rem] shrink-0 px-2 text-sm";

export default function RegisterPage() {
  const [request] = useState(true);
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const citizenIdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [employeeType, setEmployeeType] = useState<EmployeeType[]>([]);
  const [affiliation, setAffiliation] = useState<Affiliation[]>([]);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [localFacilities, setLocalFacilities] = useState<FacilityOption[]>([]);
  const [facilityUnits, setFacilityUnits] = useState<FacilityUnit[]>([]);
  const [localFacilityUnits, setLocalFacilityUnits] = useState<UnitOption[]>(
    []
  );
  const [newFacilityName, setNewFacilityName] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [facilityError, setFacilityError] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isUnitOpen,
    onOpen: onUnitOpen,
    onClose: onUnitClose,
  } = useDisclosure();
  const [admin, setProfileAdmin] =
    useState<AdminRegisterForm>(profileInitValue);

  const { data: session, status } = useSession();

  const facilityItems = useMemo(() => {
    const merged = [...facilities, ...localFacilities];

    if (!admin.affiliationId) return merged;

    return merged.filter((f) => f.affiliationId === admin.affiliationId);
  }, [facilities, localFacilities, admin.affiliationId]);

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

  const selectedFacilityKey = useMemo(() => {
    if (admin.healthcareFacilityId) return admin.healthcareFacilityId;
    if (admin.agency.trim()) {
      return `${NEW_FACILITY_KEY_PREFIX}${admin.agency.trim()}`;
    }

    return null;
  }, [admin.healthcareFacilityId, admin.agency]);

  const selectedUnitKey = useMemo(() => {
    if (admin.newFacilityUnitName.trim()) {
      return `${NEW_UNIT_KEY_PREFIX}${admin.newFacilityUnitName.trim()}`;
    }
    if (admin.facilityUnitId != null) return String(admin.facilityUnitId);

    return null;
  }, [admin.facilityUnitId, admin.newFacilityUnitName]);

  const canAddUnit = Boolean(admin.healthcareFacilityId || admin.agency.trim());

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!admin.affiliationId) {
        addToast({
          title: "ข้อมูลไม่ครบ",
          color: "danger",
          description: "กรุณาเลือกสังกัด",
        });

        return;
      }

      if (!admin.healthcareFacilityId && !admin.agency.trim()) {
        setFacilityError("กรุณาเลือกหรือเพิ่มหน่วยงาน");
        addToast({
          title: "ข้อมูลไม่ครบ",
          color: "danger",
          description: "กรุณาเลือกหรือเพิ่มหน่วยงาน",
        });

        return;
      }

      const data = JSON.stringify({ profile_admin: admin });

      try {
        const res = await fetch("/api/register/admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: data,
        });

        if (res.ok) {
          addToast({
            title: "ลงทะเบียนสำเร็จ",
            color: "success",
            description: "รอผู้ดูแลระบบอนุมัติก่อนเข้าใช้งาน",
            timeout: 3000,
          });
          setTimeout(() => {
            router.replace("/admin/login");
          }, 2500);

          return;
        }

        const payload = await res.json().catch(() => null);

        addToast({
          title: "ลงทะเบียนไม่สำเร็จ",
          color: "danger",
          description: payload?.error || `เกิดข้อผิดพลาด (${res.status})`,
          timeout: 4000,
        });
      } catch {
        addToast({
          title: "ลงทะเบียนไม่สำเร็จ",
          color: "danger",
          description: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
          timeout: 4000,
        });
      }
    },
    [admin, router]
  );

  const GetEmployeeType = useCallback(async () => {
    await fetch("/api/data/employee")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEmployeeType(data);
      });
  }, []);

  const GetAffiliation = useCallback(async () => {
    await fetch("/api/data/affiliation")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAffiliation(data);
      });
  }, []);

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
    void loadFacilityUnits(admin.healthcareFacilityId);
  }, [admin.healthcareFacilityId, loadFacilityUnits]);

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

    const result = await validateCitizen(value, "admin");
    const data = await result.json();

    if (!data.valid) {
      setError(data.error);

      return false;
    }

    setError("");

    return true;
  };

  const HandleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (e.target.name === "citizenId") {
        const value = e.target.value;

        if (value.length > 13) {
          return;
        }
        if (citizenIdTimerRef.current) {
          clearTimeout(citizenIdTimerRef.current);
          citizenIdTimerRef.current = null;
        }
        if (value.length === 13) {
          citizenIdTimerRef.current = setTimeout(async () => {
            await validateCitizenId(value);
          }, 500);
        } else if (value.length > 0) {
          setError("กรอกเลขบัตรประชาชนไม่ครบถ้วน");
        } else {
          setError("");
        }
        setProfileAdmin((prev) => ({
          ...prev,
          [e.target.name]: value,
        }));
      } else if (e.target.name === "affiliationId") {
        const affiliationId = parseInt(e.target.value, 10) || 0;

        setProfileAdmin((prev) => ({
          ...prev,
          affiliationId,
          healthcareFacilityId: "",
          agency: "",
          facilityUnitId: null,
          newFacilityUnitName: "",
        }));
        setFacilityError("");
        setFacilityUnits([]);
        setLocalFacilityUnits([]);
      } else {
        const { name, value } = e.target;
        const field = normalizeProfileFormFieldName(name);

        setProfileAdmin((prev) => ({
          ...prev,
          [field]:
            field === "prefixId" || field === "employeeTypeId"
              ? parseInt(String(value), 10) || 0
              : value,
        }));
      }
    },
    []
  );

  const handleFacilitySelect = useCallback(
    (key: React.Key | null) => {
      setFacilityError("");

      if (key == null) {
        setProfileAdmin((prev) => ({
          ...prev,
          healthcareFacilityId: "",
          agency: "",
          facilityUnitId: null,
          newFacilityUnitName: "",
        }));
        setLocalFacilityUnits([]);

        return;
      }

      const keyStr = String(key);

      if (keyStr.startsWith(NEW_FACILITY_KEY_PREFIX)) {
        const name = keyStr.slice(NEW_FACILITY_KEY_PREFIX.length);

        setProfileAdmin((prev) => ({
          ...prev,
          healthcareFacilityId: "",
          agency: name,
          facilityUnitId: null,
          newFacilityUnitName: "",
        }));
        setLocalFacilityUnits([]);

        return;
      }

      const selected = facilityItems.find((f) => f.id === keyStr);

      setProfileAdmin((prev) => ({
        ...prev,
        healthcareFacilityId: keyStr,
        agency: selected?.name ?? prev.agency,
        facilityUnitId: null,
        newFacilityUnitName: "",
      }));
      setLocalFacilityUnits([]);
    },
    [facilityItems]
  );

  const handleUnitSelect = useCallback((key: React.Key | null) => {
    if (key == null) {
      setProfileAdmin((prev) => ({
        ...prev,
        facilityUnitId: null,
        newFacilityUnitName: "",
      }));

      return;
    }

    const keyStr = String(key);

    if (keyStr.startsWith(NEW_UNIT_KEY_PREFIX)) {
      const name = keyStr.slice(NEW_UNIT_KEY_PREFIX.length);

      setProfileAdmin((prev) => ({
        ...prev,
        facilityUnitId: null,
        newFacilityUnitName: name,
      }));

      return;
    }

    const id = parseInt(keyStr, 10);

    setProfileAdmin((prev) => ({
      ...prev,
      facilityUnitId: Number.isNaN(id) || id <= 0 ? null : id,
      newFacilityUnitName: "",
    }));
  }, []);

  const handleAddUnit = useCallback(() => {
    const name = newUnitName.trim();

    if (!canAddUnit) {
      addToast({
        title: "เลือกหน่วยงานก่อน",
        color: "warning",
        description: "กรุณาเลือกหรือเพิ่มหน่วยงานก่อนเพิ่มหน่วยงานย่อย",
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

        setProfileAdmin((prev) => ({
          ...prev,
          facilityUnitId: isLocal || matched.id <= 0 ? null : matched.id,
          newFacilityUnitName: isLocal || matched.id <= 0 ? matched.name : "",
        }));
      }
      setNewUnitName("");
      onUnitClose();

      return;
    }

    const localId = -Date.now();

    setLocalFacilityUnits((prev) => [...prev, { id: localId, name }]);
    setProfileAdmin((prev) => ({
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
  }, [canAddUnit, unitItems, localFacilityUnits, newUnitName, onUnitClose]);

  const handleAddFacility = useCallback(() => {
    const name = newFacilityName.trim();

    if (!admin.affiliationId) {
      addToast({
        title: "เลือกสังกัดก่อน",
        color: "warning",
        description: "กรุณาเลือกสังกัดก่อนเพิ่มหน่วยงาน",
      });

      return;
    }

    if (!name) {
      addToast({
        title: "ข้อมูลไม่ครบ",
        color: "danger",
        description: "กรุณาระบุชื่อหน่วยงาน",
      });

      return;
    }

    const exists = facilityItems.some(
      (f) => f.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      const matched = facilityItems.find(
        (f) => f.name.trim().toLowerCase() === name.toLowerCase()
      );

      if (matched) {
        setProfileAdmin((prev) => ({
          ...prev,
          healthcareFacilityId: matched.id.startsWith(NEW_FACILITY_KEY_PREFIX)
            ? ""
            : matched.id,
          agency: matched.name,
          facilityUnitId: null,
          newFacilityUnitName: "",
        }));
        setLocalFacilityUnits([]);
      }
      setNewFacilityName("");
      onClose();
      setFacilityError("");

      return;
    }

    const localId = `${NEW_FACILITY_KEY_PREFIX}${name}`;

    setLocalFacilities((prev) => [
      ...prev,
      {
        id: localId,
        name,
        affiliationId: admin.affiliationId,
      },
    ]);
    setProfileAdmin((prev) => ({
      ...prev,
      healthcareFacilityId: "",
      agency: name,
      facilityUnitId: null,
      newFacilityUnitName: "",
    }));
    setLocalFacilityUnits([]);
    setFacilityError("");
    setNewFacilityName("");
    onClose();
    addToast({
      title: "เพิ่มหน่วยงานแล้ว",
      color: "success",
      description: "จะบันทึกลงระบบเมื่อกดลงทะเบียน",
      timeout: 2500,
    });
  }, [admin.affiliationId, facilityItems, newFacilityName, onClose]);

  useEffect(() => {
    if (status !== "loading") {
      if (status === "unauthenticated") {
        signIn();
      } else {
        setProfileAdmin((prev) => ({
          ...prev,
          userId: session?.user?.id as string,
        }));

        GetEmployeeType();
        GetAffiliation();
        GetFacilities();
      }
    }
  }, [session, status, GetEmployeeType, GetAffiliation, GetFacilities]);

  return (
    <div className="flex flex-col w-full items-center gap-4">
      <h1 className={title({ size: "sm" })}>ลงทะเบียน</h1>
      <Form
        className="flex flex-col items-center md:px-20 gap-4 w-full text-start"
        validationBehavior="native"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col items-center w-full gap-4 mb-4">
          <Input
            className="max-w-xl"
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
            value={admin.citizenId}
            variant="bordered"
            onChange={HandleChange}
          />
          <div className="flex w-full max-w-xl flex-row gap-2">
            <Select
              className="w-[7.5rem] shrink-0"
              errorMessage="กรุณาเลือกคำนำหน้า"
              isRequired={request}
              label="คำนำหน้า"
              labelPlacement="inside"
              name="prefixId"
              placeholder="คำนำหน้า"
              radius="md"
              selectedKeys={
                admin.prefixId === 0 ? [] : [admin.prefixId.toString()]
              }
              size="sm"
              variant="bordered"
              onChange={HandleChange}
            >
              {prefix.map((item) => (
                <SelectItem key={item.key}>{item.label}</SelectItem>
              ))}
            </Select>
            <Input
              className="min-w-0 flex-1"
              errorMessage="กรุณากรอกชื่อ"
              isRequired={request}
              label="ชื่อ"
              labelPlacement="inside"
              name="firstName"
              placeholder="ชื่อ"
              radius="md"
              size="sm"
              value={admin?.firstName}
              variant="bordered"
              onChange={HandleChange}
            />
            <Input
              className="min-w-0 flex-1"
              errorMessage="กรุณากรอกนามสกุล"
              isRequired={request}
              label="นามสกุล"
              labelPlacement="inside"
              name="lastName"
              placeholder="นามสกุล"
              radius="md"
              size="sm"
              value={admin?.lastName}
              variant="bordered"
              onChange={HandleChange}
            />
          </div>
          <Input
            className="max-w-xl"
            errorMessage="กรุณากรอกเบอร์โทรศัพท์"
            isRequired={false}
            label="เบอร์โทรศัพท์"
            labelPlacement="inside"
            name="phone"
            placeholder="เบอร์โทรศัพท์"
            radius="md"
            size="sm"
            type="number"
            value={admin.phone?.toString()}
            variant="bordered"
            onChange={HandleChange}
          />
          <Select
            className="max-w-xl"
            disabledKeys={["99"]}
            errorMessage="กรุณาเลือกสังกัด"
            isRequired={request}
            label="สังกัด"
            labelPlacement="inside"
            name="affiliationId"
            placeholder="สังกัด"
            radius="md"
            selectedKeys={
              admin.affiliationId === 0 ? [] : [admin.affiliationId.toString()]
            }
            size="sm"
            variant="bordered"
            onChange={HandleChange}
          >
            {affiliation.map((item) => (
              <SelectItem key={item.id}>{item.name}</SelectItem>
            ))}
          </Select>
          <div className={FIELD_ROW_CLASS}>
            <Autocomplete
              className="min-w-0 flex-1"
              classNames={AUTOCOMPLETE_CLASS_NAMES}
              errorMessage={facilityError || "กรุณาเลือกหน่วยงาน"}
              isDisabled={!admin.affiliationId}
              isInvalid={!!facilityError}
              isRequired={request}
              items={facilityItems}
              label="หน่วยงาน"
              labelPlacement="inside"
              menuTrigger="input"
              placeholder={
                admin.affiliationId
                  ? "ค้นหาหรือเลือกหน่วยงาน"
                  : "เลือกสังกัดก่อน"
              }
              radius="md"
              selectedKey={selectedFacilityKey}
              size="sm"
              variant="bordered"
              onSelectionChange={handleFacilitySelect}
            >
              {(item) => (
                <AutocompleteItem key={item.id} textValue={item.name}>
                  {item.name}
                  {String(item.id).startsWith(NEW_FACILITY_KEY_PREFIX)
                    ? " (ใหม่)"
                    : ""}
                </AutocompleteItem>
              )}
            </Autocomplete>
            <Button
              className={ADD_BUTTON_CLASS}
              color="primary"
              isDisabled={!admin.affiliationId}
              radius="md"
              type="button"
              variant="solid"
              onPress={onOpen}
            >
              เพิ่มหน่วยงาน
            </Button>
          </div>
          <div className={FIELD_ROW_CLASS}>
            <Autocomplete
              className="min-w-0 flex-1"
              classNames={AUTOCOMPLETE_CLASS_NAMES}
              isDisabled={!canAddUnit}
              isRequired={false}
              items={unitItems.map((u) => ({
                id: u.id > 0 ? String(u.id) : `${NEW_UNIT_KEY_PREFIX}${u.name}`,
                name: u.name,
              }))}
              label="หน่วยงานย่อย (ถ้ามี)"
              labelPlacement="inside"
              menuTrigger="input"
              placeholder={
                !canAddUnit
                  ? "เลือกหน่วยงานก่อน"
                  : unitItems.length === 0
                    ? "ยังไม่มี — กดเพิ่มได้"
                    : "เลือกหรือเพิ่มหน่วยงานย่อย"
              }
              radius="md"
              selectedKey={selectedUnitKey}
              size="sm"
              variant="bordered"
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
              isDisabled={!canAddUnit}
              radius="md"
              type="button"
              variant="solid"
              onPress={onUnitOpen}
            >
              เพิ่มหน่วยงานย่อย
            </Button>
          </div>
          <Select
            className="max-w-xl"
            errorMessage="กรุณาเลือกประเภทการจ้างงาน"
            isRequired={request}
            label="ประเภทการจ้างงาน"
            labelPlacement="inside"
            name="employeeTypeId"
            placeholder="ประเภทการจ้างงาน"
            radius="md"
            selectedKeys={
              admin.employeeTypeId === 0
                ? []
                : [admin.employeeTypeId.toString()]
            }
            size="sm"
            variant="bordered"
            onChange={HandleChange}
          >
            {employeeType.map((item) => (
              <SelectItem key={item.id}>{item.name}</SelectItem>
            ))}
          </Select>
          <div className="flex w-full max-w-xl flex-row gap-2">
            <Input
              className="min-w-0 flex-1"
              errorMessage="กรุณากรอกสาขาวิชาชีพ"
              isRequired={false}
              label="สาขาวิชาชีพ"
              labelPlacement="inside"
              name="profession"
              placeholder="สาขาวิชาชีพ"
              radius="md"
              size="sm"
              value={admin.profession || admin.professional || ""}
              variant="bordered"
              onChange={HandleChange}
            />
            <Input
              className="min-w-0 flex-1"
              errorMessage="กรุณากรอกเลขที่ใบประกอบวิชาชีพ"
              isRequired={false}
              label="เลขที่ใบประกอบวิชาชีพ"
              labelPlacement="inside"
              name="license"
              placeholder="เลขที่ใบประกอบวิชาชีพ"
              radius="md"
              size="sm"
              value={admin.license?.toString()}
              variant="bordered"
              onChange={HandleChange}
            />
          </div>
        </div>
        <Button color="primary" type="submit" variant="flat">
          ลงทะเบียน
        </Button>
      </Form>

      <Modal isOpen={isOpen} placement="center" size="sm" onClose={onClose}>
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>เพิ่มหน่วยงาน</ModalHeader>
              <ModalBody>
                <p className="text-sm text-default-500">
                  สังกัด:{" "}
                  {affiliation.find((a) => a.id === admin.affiliationId)
                    ?.name ?? "-"}
                </p>
                <Input
                  isRequired
                  label="ชื่อหน่วยงาน"
                  labelPlacement="inside"
                  placeholder="เช่น ศบส. บางกอกน้อย"
                  value={newFacilityName}
                  variant="bordered"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFacility();
                    }
                  }}
                  onValueChange={setNewFacilityName}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="bordered" onPress={close}>
                  ยกเลิก
                </Button>
                <Button color="primary" onPress={handleAddFacility}>
                  เพิ่ม
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

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
                  หน่วยงาน: {admin.agency || "-"}
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
