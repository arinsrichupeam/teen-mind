import {
  Modal,
  ModalContent,
  Form,
  ModalHeader,
  Divider,
  ModalBody,
  User,
  ScrollShadow,
  Input,
  Select,
  SelectItem,
  ModalFooter,
  Button,
  addToast,
} from "@heroui/react";
import {
  AdminDataScope,
  Affiliation,
  EmployeeType,
  FacilityUnit,
} from "@prisma/client";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProfileAdminData } from "@/types";
import { prefix } from "@/utils/data";
import { normalizeProfileFormFieldName } from "@/lib/profile-form-fields";
import {
  ADMIN_DATA_SCOPE_OPTIONS,
  adminDataScopeLabel,
} from "@/lib/admin-data-scope";
import { ROLE_CODE } from "@/lib/admin-roles";
import {
  userStatusOptions as Options,
  emergencyOptions as Emergency,
  staffAssignableRoles,
} from "@/app/admin/(app)/data/optionData";

interface FacilityOption {
  id: string;
  name: string;
  affiliationId?: number;
}

interface ZoneOption {
  id: number;
  name: string;
  status?: boolean;
}

interface Props {
  Profile: ProfileAdminData;
  Mode: string;
  isOpen: boolean;
  onClose: () => void;
  onReLoad: () => void;
}

export const ModalUserProfile = ({
  Profile,
  Mode,
  isOpen,
  onClose,
  onReLoad,
}: Props) => {
  const { data: session } = useSession();
  const [mode, setMode] = useState("View");
  const [isRequest] = useState(false);
  const [canEditScope, setCanEditScope] = useState(false);
  const [affiliationList, setAffiliationList] = useState<Affiliation[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([]);
  const [facilityList, setFacilityList] = useState<FacilityOption[]>([]);
  const [facilityUnits, setFacilityUnits] = useState<FacilityUnit[]>([]);
  const [zoneList, setZoneList] = useState<ZoneOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedProfile, setSelectedProfile] =
    useState<ProfileAdminData>(Profile);

  const scopeLevel = (selectedProfile.scopeLevel ??
    AdminDataScope.FACILITY) as AdminDataScope;
  const effectiveScope = (selectedProfile.effectiveScopeLevel ??
    scopeLevel) as AdminDataScope;

  const showAffiliation = useMemo(() => {
    if (mode === "edit") {
      if (canEditScope) {
        return (
          scopeLevel === AdminDataScope.FACILITY ||
          scopeLevel === AdminDataScope.AFFILIATION
        );
      }

      // Admin ทั่วไปแก้โปรไฟล์ — ต้องเลือกสังกัดได้เสมอ (อย่าซ่อนเมื่อล้างค่า)
      return true;
    }

    return (
      effectiveScope === AdminDataScope.FACILITY ||
      effectiveScope === AdminDataScope.AFFILIATION ||
      selectedProfile.affiliationId != null
    );
  }, [
    canEditScope,
    mode,
    scopeLevel,
    effectiveScope,
    selectedProfile.affiliationId,
  ]);

  const showFacility = useMemo(() => {
    if (mode === "edit") {
      if (canEditScope && scopeLevel === AdminDataScope.SYSTEM) {
        return false;
      }

      // แสดงช่องหน่วยงานเสมอตอนแก้ — แม้เพิ่งล้างค่าหลังเปลี่ยนสังกัด
      return true;
    }

    return Boolean(selectedProfile.healthcareFacilityId);
  }, [canEditScope, mode, scopeLevel, selectedProfile.healthcareFacilityId]);

  const showZone = useMemo(() => {
    if (canEditScope && mode === "edit") {
      return scopeLevel === AdminDataScope.ZONE;
    }

    return (
      effectiveScope === AdminDataScope.ZONE ||
      selectedProfile.zoneId != null ||
      Boolean(selectedProfile.facilitatedZoneName)
    );
  }, [
    canEditScope,
    mode,
    scopeLevel,
    effectiveScope,
    selectedProfile.zoneId,
    selectedProfile.facilitatedZoneName,
  ]);

  const facilityRequired =
    mode === "edit" &&
    (!canEditScope || scopeLevel === AdminDataScope.FACILITY);

  const GetAffiliationList = useCallback(async () => {
    await fetch("/api/data/affiliation")
      .then((res) => res.json())
      .then((val) => {
        setAffiliationList(val);
      });
  }, []);

  const GetEmployeeList = useCallback(async () => {
    await fetch("/api/data/employee")
      .then((res) => res.json())
      .then((val) => {
        setEmployeeTypes(val);
      });
  }, []);

  const GetFacilityList = useCallback(async () => {
    await fetch("/api/data/healthcare-facility")
      .then((res) => res.json())
      .then((val) => {
        const rows = Array.isArray(val) ? val : (val?.data ?? []);

        setFacilityList(
          rows.map(
            (f: FacilityOption & { affiliationId?: number | string }) => ({
              id: f.id,
              name: f.name,
              affiliationId:
                f.affiliationId != null ? Number(f.affiliationId) : undefined,
            })
          )
        );
      });
  }, []);

  const facilitiesForAffiliation = useMemo(() => {
    const affiliationId = selectedProfile.affiliationId;

    if (affiliationId == null || affiliationId === 0) return [];

    return facilityList.filter((f) => f.affiliationId === affiliationId);
  }, [facilityList, selectedProfile.affiliationId]);

  const GetZoneList = useCallback(async () => {
    try {
      const res = await fetch("/api/data/zone");

      if (!res.ok) {
        setZoneList([]);

        return;
      }
      const val = await res.json();

      setZoneList(Array.isArray(val) ? val : []);
    } catch {
      setZoneList([]);
    }
  }, []);

  const loadFacilityUnits = useCallback(
    async (facilityId: string | undefined) => {
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
    },
    []
  );

  const HandleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (mode !== "edit") return;

      const { name, value } = e.target;

      if (name === "alert") {
        setSelectedProfile((prev) => ({
          ...prev,
          receiveAlert: value === "1",
        }));

        return;
      }

      if (name === "scopeLevel") {
        const next = value as AdminDataScope;

        setSelectedProfile((prev) => ({
          ...prev,
          scopeLevel: next,
          zoneId: next === AdminDataScope.ZONE ? prev.zoneId : null,
          affiliationId:
            next === AdminDataScope.SYSTEM || next === AdminDataScope.ZONE
              ? null
              : prev.affiliationId,
          healthcareFacilityId:
            next === AdminDataScope.SYSTEM
              ? null
              : next === AdminDataScope.FACILITY
                ? prev.healthcareFacilityId
                : prev.healthcareFacilityId,
          facilityUnitId:
            next === AdminDataScope.SYSTEM ? null : prev.facilityUnitId,
        }));

        return;
      }

      if (name === "zoneId") {
        setSelectedProfile((prev) => ({
          ...prev,
          zoneId: value ? parseInt(value, 10) : null,
        }));

        return;
      }

      if (name === "healthcareFacilityId") {
        const facility = facilitiesForAffiliation.find((f) => f.id === value);

        setSelectedProfile((prev) => ({
          ...prev,
          healthcareFacilityId: value || null,
          agency: facility?.name ?? prev.agency,
          facilityUnitId: null,
        }));

        return;
      }

      if (name === "facilityUnitId") {
        const facilityUnitId =
          value === "" || value == null
            ? null
            : parseInt(String(value), 10) || null;

        setSelectedProfile((prev) => ({
          ...prev,
          facilityUnitId:
            facilityUnitId != null && facilityUnitId > 0
              ? facilityUnitId
              : null,
        }));

        return;
      }

      if (name === "affiliationId") {
        const nextAffiliationId = value ? parseInt(value, 10) : null;

        setSelectedProfile((prev) => {
          const stillValid =
            prev.healthcareFacilityId &&
            facilityList.some(
              (f) =>
                f.id === prev.healthcareFacilityId &&
                f.affiliationId === nextAffiliationId
            );

          return {
            ...prev,
            affiliationId: nextAffiliationId,
            healthcareFacilityId: stillValid ? prev.healthcareFacilityId : null,
            agency: stillValid ? prev.agency : "",
            facilityUnitId: stillValid ? prev.facilityUnitId : null,
          };
        });

        return;
      }

      const field = normalizeProfileFormFieldName(name);

      setSelectedProfile((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [mode, facilityList, facilitiesForAffiliation]
  );

  const ModalSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSaving(true);

      try {
        const res = await fetch("/api/profile/admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profile_data: selectedProfile }),
        });
        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          addToast({
            color: "danger",
            title: "แก้ไขผู้ใช้งานไม่สำเร็จ",
            description: payload?.error ?? `เกิดข้อผิดพลาด (${res.status})`,
            timeout: 4000,
          });

          return;
        }

        onReLoad?.();
        onClose();
        addToast({
          color: "success",
          title: "แก้ไขผู้ใช้งาน",
          description: "แก้ไขผู้ใช้งานสำเร็จ",
          timeout: 3000,
        });
      } finally {
        setIsSaving(false);
      }
    },
    [selectedProfile, onReLoad, onClose]
  );

  useEffect(() => {
    GetAffiliationList();
    GetEmployeeList();
    GetFacilityList();
    GetZoneList();
    if (isOpen) {
      setSelectedProfile({
        ...Profile,
        facilityUnitId: Profile.facilityUnitId ?? null,
        scopeLevel: Profile.scopeLevel ?? AdminDataScope.FACILITY,
        zoneId: Profile.zoneId ?? null,
      });
      setMode(Mode);
      void loadFacilityUnits(Profile.healthcareFacilityId ?? undefined);
    }
  }, [isOpen, Profile, Mode]);

  useEffect(() => {
    void loadFacilityUnits(selectedProfile.healthcareFacilityId ?? undefined);
  }, [selectedProfile.healthcareFacilityId, loadFacilityUnits]);

  // ถ้ามีหน่วยงานแล้วสังกัดไม่ตรงกับของหน่วยงาน — ดึงสังกัดจากหน่วยงานมาให้
  useEffect(() => {
    if (!isOpen || facilityList.length === 0) return;

    const facilityId = selectedProfile.healthcareFacilityId;

    if (!facilityId) return;

    const facility = facilityList.find((f) => f.id === facilityId);

    if (
      facility?.affiliationId != null &&
      facility.affiliationId !== selectedProfile.affiliationId
    ) {
      setSelectedProfile((prev) => ({
        ...prev,
        affiliationId: facility.affiliationId ?? null,
      }));
    }
  }, [
    isOpen,
    facilityList,
    selectedProfile.healthcareFacilityId,
    selectedProfile.affiliationId,
  ]);

  useEffect(() => {
    const userId = session?.user?.id;

    if (!userId || !isOpen) return;

    void fetch(`/api/profile/admin/${userId}`)
      .then((res) => res.json())
      .then((me: ProfileAdminData | null) => {
        setCanEditScope(me?.roleCode === ROLE_CODE.SUPERADMIN);
      })
      .catch(() => setCanEditScope(false));
  }, [session?.user?.id, isOpen]);

  const maeZoneHint =
    effectiveScope === AdminDataScope.ZONE &&
    scopeLevel === AdminDataScope.FACILITY &&
    selectedProfile.facilitatedZoneName
      ? `เห็นทั้งโซนอัตโนมัติ (แม่ ${selectedProfile.facilitatedZoneName})`
      : null;

  return (
    <Modal
      backdrop="opaque"
      className="mx-6"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      isOpen={isOpen}
      placement="center"
      radius="lg"
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        {(onClose) => (
          <Form validationBehavior="native" onSubmit={ModalSubmit}>
            <ModalHeader className="flex flex-col gap-1 w-full">
              {mode === "View" ? "ดูข้อมูลผู้ใช้งาน" : "แก้ไขข้อมูลผู้ใช้งาน"}
              <Divider className="mt-3" />
            </ModalHeader>
            <ModalBody className="flex w-full">
              <div className="w-full">
                <User
                  avatarProps={{
                    src: selectedProfile.image,
                    size: "lg",
                  }}
                  classNames={{ name: "font-semibold" }}
                  description={
                    <p>Line ID : {selectedProfile.providerAccountId}</p>
                  }
                  name={
                    <>
                      <p>หมายเลข ปชช : {selectedProfile.citizenId}</p>
                      <p>Line : {selectedProfile.name}</p>
                    </>
                  }
                />
              </div>
              <ScrollShadow className="h-[350px]" size={20}>
                <div className="flex flex-col gap-3 font-semibold">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="หมายเลขโทรศัพท์"
                      labelPlacement="outside"
                      name="phone"
                      placeholder="หมายเลขโทรศัพท์"
                      radius="sm"
                      size="md"
                      value={selectedProfile.phone}
                      variant="bordered"
                      onChange={HandleChange}
                    />
                    <Select
                      className="max-w-xl"
                      errorMessage="กรุณาเลือกคำนำหน้า"
                      isRequired={isRequest}
                      label="คำนำหน้า"
                      labelPlacement="outside"
                      name="prefixId"
                      placeholder="คำนำหน้า"
                      radius="sm"
                      selectedKeys={
                        selectedProfile.prefixId == 0
                          ? ""
                          : selectedProfile.prefixId.toString()
                      }
                      size="md"
                      variant="bordered"
                      onChange={HandleChange}
                    >
                      {prefix.map((prefixItem) => (
                        <SelectItem key={prefixItem.key}>
                          {prefixItem.label}
                        </SelectItem>
                      ))}
                    </Select>
                    <Input
                      isRequired={isRequest}
                      label="ชื่อ"
                      labelPlacement="outside"
                      name="firstName"
                      placeholder="ชื่อ"
                      radius="sm"
                      size="md"
                      value={selectedProfile.firstName}
                      variant="bordered"
                      onChange={HandleChange}
                    />
                    <Input
                      isRequired={isRequest}
                      label="นามสกุล"
                      labelPlacement="outside"
                      name="lastName"
                      placeholder="นามสกุล"
                      radius="sm"
                      size="md"
                      value={selectedProfile.lastName}
                      variant="bordered"
                      onChange={HandleChange}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Select
                      description={
                        maeZoneHint ??
                        (canEditScope
                          ? "SUPERADMIN ตั้งรัศมีที่เห็นข้อมูลได้"
                          : "รัศมีที่เห็นข้อมูล (แก้ไขได้เฉพาะ SUPERADMIN)")
                      }
                      isDisabled={mode !== "edit" || !canEditScope}
                      label="รัศมีข้อมูล"
                      labelPlacement="outside"
                      name="scopeLevel"
                      placeholder="รัศมีข้อมูล"
                      radius="sm"
                      selectedKeys={[scopeLevel]}
                      size="md"
                      variant="bordered"
                      onChange={HandleChange}
                    >
                      {ADMIN_DATA_SCOPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </Select>

                    {showZone ? (
                      <Select
                        description={
                          selectedProfile.facilitatedZoneName &&
                          !selectedProfile.zoneId
                            ? `จากแม่ zone: ${selectedProfile.facilitatedZoneName}`
                            : undefined
                        }
                        errorMessage="กรุณาเลือก Zone"
                        isDisabled={mode !== "edit" || !canEditScope}
                        isRequired={
                          canEditScope &&
                          mode === "edit" &&
                          scopeLevel === AdminDataScope.ZONE
                        }
                        label="Zone"
                        labelPlacement="outside"
                        name="zoneId"
                        placeholder="เลือก Zone"
                        radius="sm"
                        selectedKeys={
                          selectedProfile.zoneId != null
                            ? [String(selectedProfile.zoneId)]
                            : selectedProfile.facilitatedZoneId != null
                              ? [String(selectedProfile.facilitatedZoneId)]
                              : []
                        }
                        size="md"
                        variant="bordered"
                        onChange={HandleChange}
                      >
                        {zoneList.map((z) => (
                          <SelectItem key={String(z.id)}>{z.name}</SelectItem>
                        ))}
                      </Select>
                    ) : null}

                    {showAffiliation ? (
                      <Select
                        errorMessage="กรุณาเลือกสังกัด"
                        isDisabled={
                          mode !== "edit" ||
                          (canEditScope && scopeLevel === AdminDataScope.ZONE)
                        }
                        isRequired={
                          mode === "edit" &&
                          (!canEditScope ||
                            scopeLevel === AdminDataScope.FACILITY ||
                            scopeLevel === AdminDataScope.AFFILIATION)
                        }
                        label="สังกัด"
                        labelPlacement="outside"
                        name="affiliationId"
                        placeholder="สังกัด"
                        radius="sm"
                        selectedKeys={
                          selectedProfile.affiliationId == null ||
                          selectedProfile.affiliationId === 0
                            ? []
                            : [selectedProfile.affiliationId.toString()]
                        }
                        size="md"
                        variant="bordered"
                        onChange={HandleChange}
                      >
                        {affiliationList.map((val) => (
                          <SelectItem key={String(val.id)}>
                            {val.name}
                          </SelectItem>
                        ))}
                      </Select>
                    ) : null}

                    {showFacility ? (
                      <Select
                        errorMessage="กรุณาเลือกหน่วยงาน"
                        isDisabled={
                          mode !== "edit" ||
                          selectedProfile.affiliationId == null ||
                          selectedProfile.affiliationId === 0
                        }
                        isRequired={facilityRequired}
                        label={
                          scopeLevel === AdminDataScope.FACILITY
                            ? "หน่วยงาน"
                            : "หน่วยงาน (บ้าน / ไม่บังคับ)"
                        }
                        labelPlacement="outside"
                        name="healthcareFacilityId"
                        placeholder={
                          selectedProfile.affiliationId == null ||
                          selectedProfile.affiliationId === 0
                            ? "เลือกสังกัดก่อน"
                            : facilitiesForAffiliation.length === 0
                              ? "ไม่มีหน่วยงานในสังกัดนี้"
                              : "หน่วยงาน"
                        }
                        radius="sm"
                        selectedKeys={
                          selectedProfile.healthcareFacilityId &&
                          facilitiesForAffiliation.some(
                            (f) => f.id === selectedProfile.healthcareFacilityId
                          )
                            ? [selectedProfile.healthcareFacilityId]
                            : []
                        }
                        size="md"
                        variant="bordered"
                        onChange={HandleChange}
                      >
                        {facilitiesForAffiliation.map((val) => (
                          <SelectItem key={val.id}>{val.name}</SelectItem>
                        ))}
                      </Select>
                    ) : null}

                    {showFacility ? (
                      <Select
                        isDisabled={
                          mode !== "edit" ||
                          !selectedProfile.healthcareFacilityId ||
                          facilityUnits.length === 0
                        }
                        isRequired={false}
                        label="หน่วยงานย่อย (ถ้ามี)"
                        labelPlacement="outside"
                        name="facilityUnitId"
                        placeholder={
                          !selectedProfile.healthcareFacilityId
                            ? "เลือกหน่วยงานก่อน"
                            : facilityUnits.length === 0
                              ? "ยังไม่มีหน่วยงานย่อย"
                              : "เลือกหน่วยงานย่อย (ไม่บังคับ)"
                        }
                        radius="sm"
                        selectedKeys={
                          selectedProfile.facilityUnitId != null
                            ? [selectedProfile.facilityUnitId.toString()]
                            : []
                        }
                        size="md"
                        variant="bordered"
                        onChange={HandleChange}
                      >
                        {facilityUnits.map((unit) => (
                          <SelectItem key={unit.id}>{unit.name}</SelectItem>
                        ))}
                      </Select>
                    ) : null}

                    <Select
                      errorMessage="กรุณาเลือกประเภทการจ้าง"
                      isRequired={isRequest}
                      label="ประเภทการจ้าง"
                      labelPlacement="outside"
                      name="employeeTypeId"
                      placeholder="ประเภทการจ้าง"
                      radius="sm"
                      selectedKeys={
                        selectedProfile.employeeTypeId === 0
                          ? ""
                          : selectedProfile.employeeTypeId.toString()
                      }
                      size="md"
                      variant="bordered"
                      onChange={HandleChange}
                    >
                      {employeeTypes.map((val) => (
                        <SelectItem key={val.id}>{val.name}</SelectItem>
                      ))}
                    </Select>
                    <Input
                      isRequired={false}
                      label="สาขาวิชาชีพ"
                      labelPlacement="outside"
                      name="professional"
                      placeholder="สาขาวิชาชีพ"
                      radius="sm"
                      size="md"
                      value={selectedProfile.professional}
                      variant="bordered"
                      onChange={HandleChange}
                    />

                    <Input
                      isRequired={false}
                      label="เลขที่ใบอนุญาติ"
                      labelPlacement="outside"
                      name="license"
                      placeholder="เลขที่ใบอนุญาติ"
                      radius="sm"
                      size="md"
                      value={selectedProfile.license}
                      variant="bordered"
                      onChange={HandleChange}
                    />

                    {mode === "View" ? (
                      <p className="text-sm text-default-500 font-normal">
                        รัศมีที่เห็นจริง: {adminDataScopeLabel(effectiveScope)}
                        {maeZoneHint ? ` — ${maeZoneHint}` : ""}
                      </p>
                    ) : null}
                  </div>
                  {mode === "edit" && (
                    <>
                      <Divider />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Select
                          className="max-w-xl"
                          label="สิทธิ์การใช้งาน"
                          labelPlacement="outside"
                          name="roleId"
                          placeholder="สิทธิ์การใช้งาน"
                          radius="sm"
                          selectedKeys={
                            selectedProfile.roleId === 0
                              ? ""
                              : selectedProfile.roleId.toString()
                          }
                          size="md"
                          variant="bordered"
                          onChange={HandleChange}
                        >
                          {staffAssignableRoles.map((val) => (
                            <SelectItem key={val.id}>{val.name}</SelectItem>
                          ))}
                        </Select>
                        <Select
                          className="max-w-xl"
                          label="สถานะ"
                          labelPlacement="outside"
                          name="status"
                          placeholder="สถานะ"
                          radius="sm"
                          selectedKeys={
                            selectedProfile.status === 0
                              ? ""
                              : selectedProfile.status.toString()
                          }
                          size="md"
                          variant="bordered"
                          onChange={HandleChange}
                        >
                          {Options.map((val) => (
                            <SelectItem key={val.uid}>{val.name}</SelectItem>
                          ))}
                        </Select>
                        <Select
                          className="max-w-xl"
                          label="Emergency Alert"
                          labelPlacement="outside"
                          name="alert"
                          placeholder="Emergency Alert"
                          radius="sm"
                          selectedKeys={
                            selectedProfile.receiveAlert === false ? "0" : "1"
                          }
                          size="md"
                          variant="bordered"
                          onChange={HandleChange}
                        >
                          {Emergency.map((val) => (
                            <SelectItem key={val.uid}>{val.name}</SelectItem>
                          ))}
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </ScrollShadow>
            </ModalBody>
            <ModalFooter className="flex w-full items-end">
              <Button color="default" variant="bordered" onPress={onClose}>
                ปิด
              </Button>
              <Button
                className="bg-primary shadow-lg shadow-indigo-500/20 font-bold text-white "
                isDisabled={mode === "View" || isSaving}
                isLoading={isSaving}
                type="submit"
                variant="bordered"
              >
                {mode === "Create" ? "เพิ่ม" : "แก้ไข"}
              </Button>
            </ModalFooter>
          </Form>
        )}
      </ModalContent>
    </Modal>
  );
};
