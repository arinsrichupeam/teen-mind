"use client";

import {
  Modal,
  ModalContent,
  Form,
  ModalHeader,
  Divider,
  ModalBody,
  ScrollShadow,
  Input,
  Select,
  SelectItem,
  ModalFooter,
  Button,
  addToast,
} from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import {
  Affiliation,
  EmployeeType,
  FacilityUnit,
  VolunteerType,
} from "@prisma/client";

import { prefix } from "@/utils/data";
import { normalizeProfileFormFieldName } from "@/lib/profile-form-fields";
import { referentInitValue } from "@/types/initData";

export type VolunteerFormData = {
  id: number;
  citizenId: string;
  prefixId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  volunteerTypeId: number;
  employeeTypeId: number;
  affiliationId: number;
  healthcareFacilityId: string;
  facilityUnitId: number | null;
  status: boolean;
};

interface FacilityOption {
  id: string;
  name: string;
  affiliationId?: number;
}

interface Props {
  Volunteer: VolunteerFormData;
  Mode: "View" | "edit" | "create";
  isOpen: boolean;
  onClose: () => void;
  onReLoad: () => void;
}

const emptyVolunteer = (): VolunteerFormData => ({
  id: 0,
  citizenId: referentInitValue.citizenId,
  prefixId: referentInitValue.prefixId,
  firstName: referentInitValue.firstName,
  lastName: referentInitValue.lastName,
  email: referentInitValue.email,
  phone: referentInitValue.phone,
  volunteerTypeId: referentInitValue.volunteerTypeId,
  employeeTypeId: referentInitValue.employeeTypeId,
  affiliationId: referentInitValue.affiliationId,
  healthcareFacilityId: referentInitValue.healthcareFacilityId,
  facilityUnitId: referentInitValue.facilityUnitId,
  status: true,
});

export const ModalVolunteer = ({
  Volunteer,
  Mode,
  isOpen,
  onClose,
  onReLoad,
}: Props) => {
  const [mode, setMode] = useState<"View" | "edit" | "create">("View");
  const [isSaving, setIsSaving] = useState(false);
  const [affiliationList, setAffiliationList] = useState<Affiliation[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([]);
  const [volunteerTypes, setVolunteerTypes] = useState<VolunteerType[]>([]);
  const [facilityList, setFacilityList] = useState<FacilityOption[]>([]);
  const [facilityUnits, setFacilityUnits] = useState<FacilityUnit[]>([]);
  const [selected, setSelected] = useState<VolunteerFormData>(emptyVolunteer());

  const isEditable = mode === "edit" || mode === "create";

  const loadLookups = useCallback(async () => {
    const [affRes, empRes, volRes, facRes] = await Promise.all([
      fetch("/api/data/affiliation"),
      fetch("/api/data/employee"),
      fetch("/api/data/volunteer"),
      fetch("/api/data/healthcare-facility"),
    ]);

    const [aff, emp, vol, fac] = await Promise.all([
      affRes.json(),
      empRes.json(),
      volRes.json(),
      facRes.json(),
    ]);

    setAffiliationList(Array.isArray(aff) ? aff : []);
    setEmployeeTypes(Array.isArray(emp) ? emp : []);
    setVolunteerTypes(Array.isArray(vol) ? vol : []);

    const rows = Array.isArray(fac) ? fac : (fac?.data ?? []);

    setFacilityList(
      rows.map((f: FacilityOption & { affiliationId?: number }) => ({
        id: f.id,
        name: f.name,
        affiliationId: f.affiliationId,
      }))
    );
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

  const facilitiesForAffiliation = facilityList.filter(
    (f) =>
      !selected.affiliationId ||
      f.affiliationId == null ||
      f.affiliationId === selected.affiliationId
  );

  const HandleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (!isEditable) return;

      const { name, value } = e.target;

      if (name === "healthcareFacilityId") {
        setSelected((prev) => ({
          ...prev,
          healthcareFacilityId: value,
          facilityUnitId: null,
        }));
      } else if (name === "facilityUnitId") {
        const facilityUnitId =
          value === "" || value == null
            ? null
            : parseInt(String(value), 10) || null;

        setSelected((prev) => ({
          ...prev,
          facilityUnitId:
            facilityUnitId != null && facilityUnitId > 0
              ? facilityUnitId
              : null,
        }));
      } else if (name === "status") {
        setSelected((prev) => ({
          ...prev,
          status: value === "true" || value === "1",
        }));
      } else if (
        name === "prefixId" ||
        name === "affiliationId" ||
        name === "volunteerTypeId" ||
        name === "employeeTypeId"
      ) {
        const parsed = parseInt(String(value), 10) || 0;

        setSelected((prev) => ({
          ...prev,
          [name]: parsed,
          ...(name === "affiliationId"
            ? { healthcareFacilityId: "", facilityUnitId: null }
            : {}),
        }));
      } else {
        const field = normalizeProfileFormFieldName(name);

        setSelected((prev) => ({
          ...prev,
          [field]: value,
        }));
      }
    },
    [isEditable]
  );

  const ModalSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!isEditable) return;

      if (!selected.healthcareFacilityId?.trim()) {
        addToast({
          color: "danger",
          title: "ข้อมูลไม่ครบ",
          description: "กรุณาเลือกหน่วยงาน",
        });

        return;
      }

      setIsSaving(true);
      try {
        if (mode === "create") {
          const res = await fetch("/api/referent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referent_data: selected }),
          });
          const val = await res.json();

          if (!res.ok) {
            addToast({
              color: "danger",
              title: "เพิ่มอาสาสมัครไม่สำเร็จ",
              description: val?.error ?? `เกิดข้อผิดพลาด (${res.status})`,
            });

            return;
          }

          addToast({
            color: "success",
            title: "เพิ่มอาสาสมัคร",
            description: "เพิ่มอาสาสมัครสำเร็จ",
          });
        } else {
          const res = await fetch(`/api/data/referent/${selected.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(selected),
          });
          const val = await res.json();

          if (!res.ok || val?.success === false) {
            addToast({
              color: "danger",
              title: "แก้ไขไม่สำเร็จ",
              description: val?.error ?? `เกิดข้อผิดพลาด (${res.status})`,
            });

            return;
          }

          addToast({
            color: "success",
            title: "แก้ไขอาสาสมัคร",
            description: "แก้ไขข้อมูลสำเร็จ",
          });
        }

        onReLoad();
        onClose();
      } catch (error) {
        addToast({
          color: "danger",
          title: "เกิดข้อผิดพลาด",
          description: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setIsSaving(false);
      }
    },
    [isEditable, mode, selected, onClose, onReLoad]
  );

  useEffect(() => {
    if (!isOpen) return;

    void loadLookups();
    setMode(Mode);
    setSelected(
      Mode === "create"
        ? emptyVolunteer()
        : {
            ...Volunteer,
            facilityUnitId: Volunteer.facilityUnitId ?? null,
          }
    );
    void loadFacilityUnits(
      Mode === "create" ? undefined : Volunteer.healthcareFacilityId
    );
  }, [isOpen, Mode, Volunteer, loadLookups, loadFacilityUnits]);

  useEffect(() => {
    if (!isOpen || !isEditable) return;
    void loadFacilityUnits(selected.healthcareFacilityId);
  }, [isOpen, isEditable, selected.healthcareFacilityId, loadFacilityUnits]);

  const title =
    mode === "create"
      ? "เพิ่มอาสาสมัคร"
      : mode === "edit"
        ? "แก้ไขข้อมูลอาสาสมัคร"
        : "ดูข้อมูลอาสาสมัคร";

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
        {(close) => (
          <Form validationBehavior="native" onSubmit={ModalSubmit}>
            <ModalHeader className="flex flex-col gap-1 w-full">
              {title}
              <Divider className="mt-3" />
            </ModalHeader>
            <ModalBody className="flex w-full">
              <ScrollShadow className="h-[420px]" size={20}>
                <div className="flex flex-col gap-3 font-semibold">
                  {mode !== "create" ? (
                    <Input
                      isReadOnly
                      label="รหัส"
                      labelPlacement="outside"
                      radius="sm"
                      size="md"
                      value={String(selected.id).padStart(3, "0")}
                      variant="bordered"
                    />
                  ) : null}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      isReadOnly={!isEditable || mode === "edit"}
                      isRequired={isEditable}
                      label="เลขบัตรประชาชน"
                      labelPlacement="outside"
                      maxLength={13}
                      name="citizenId"
                      placeholder="เลขบัตรประชาชน"
                      radius="sm"
                      size="md"
                      value={selected.citizenId}
                      variant="bordered"
                      onChange={HandleChange}
                    />
                    <Select
                      isDisabled={!isEditable}
                      isRequired={isEditable}
                      label="คำนำหน้า"
                      labelPlacement="outside"
                      name="prefixId"
                      placeholder="คำนำหน้า"
                      radius="sm"
                      selectedKeys={
                        selected.prefixId ? [String(selected.prefixId)] : []
                      }
                      size="md"
                      variant="bordered"
                      onChange={HandleChange}
                    >
                      {prefix.map((p) => (
                        <SelectItem key={p.key}>{p.label}</SelectItem>
                      ))}
                    </Select>
                    <Input
                      isReadOnly={!isEditable}
                      isRequired={isEditable}
                      label="ชื่อ"
                      labelPlacement="outside"
                      name="firstName"
                      placeholder="ชื่อ"
                      radius="sm"
                      size="md"
                      value={selected.firstName}
                      variant="bordered"
                      onChange={HandleChange}
                    />
                    <Input
                      isReadOnly={!isEditable}
                      isRequired={isEditable}
                      label="นามสกุล"
                      labelPlacement="outside"
                      name="lastName"
                      placeholder="นามสกุล"
                      radius="sm"
                      size="md"
                      value={selected.lastName}
                      variant="bordered"
                      onChange={HandleChange}
                    />
                    <Input
                      isReadOnly={!isEditable}
                      isRequired={isEditable}
                      label="เบอร์โทรศัพท์"
                      labelPlacement="outside"
                      name="phone"
                      placeholder="เบอร์โทรศัพท์"
                      radius="sm"
                      size="md"
                      value={selected.phone}
                      variant="bordered"
                      onChange={HandleChange}
                    />
                    <Input
                      isReadOnly={!isEditable}
                      isRequired={isEditable}
                      label="อีเมล"
                      labelPlacement="outside"
                      name="email"
                      placeholder="อีเมล"
                      radius="sm"
                      size="md"
                      type="email"
                      value={selected.email}
                      variant="bordered"
                      onChange={HandleChange}
                    />
                  </div>
                  <Select
                    isDisabled={!isEditable}
                    isRequired={isEditable}
                    label="ประเภทอาสาสมัคร"
                    labelPlacement="outside"
                    name="volunteerTypeId"
                    placeholder="ประเภทอาสาสมัคร"
                    radius="sm"
                    selectedKeys={
                      selected.volunteerTypeId
                        ? [String(selected.volunteerTypeId)]
                        : []
                    }
                    size="md"
                    variant="bordered"
                    onChange={HandleChange}
                  >
                    {volunteerTypes.map((v) => (
                      <SelectItem key={v.id}>{v.name}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    isDisabled={!isEditable}
                    isRequired={isEditable}
                    label="ประเภทบุคลากร"
                    labelPlacement="outside"
                    name="employeeTypeId"
                    placeholder="ประเภทบุคลากร"
                    radius="sm"
                    selectedKeys={
                      selected.employeeTypeId
                        ? [String(selected.employeeTypeId)]
                        : []
                    }
                    size="md"
                    variant="bordered"
                    onChange={HandleChange}
                  >
                    {employeeTypes.map((v) => (
                      <SelectItem key={v.id}>{v.name}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    isDisabled={!isEditable}
                    isRequired={isEditable}
                    label="สังกัด"
                    labelPlacement="outside"
                    name="affiliationId"
                    placeholder="สังกัด"
                    radius="sm"
                    selectedKeys={
                      selected.affiliationId
                        ? [String(selected.affiliationId)]
                        : []
                    }
                    size="md"
                    variant="bordered"
                    onChange={HandleChange}
                  >
                    {affiliationList.map((v) => (
                      <SelectItem key={v.id}>{v.name}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    isDisabled={!isEditable || !selected.affiliationId}
                    isRequired={isEditable}
                    label="หน่วยงาน"
                    labelPlacement="outside"
                    name="healthcareFacilityId"
                    placeholder={
                      selected.affiliationId
                        ? "เลือกหน่วยงาน"
                        : "เลือกสังกัดก่อน"
                    }
                    radius="sm"
                    selectedKeys={
                      selected.healthcareFacilityId
                        ? [selected.healthcareFacilityId]
                        : []
                    }
                    size="md"
                    variant="bordered"
                    onChange={HandleChange}
                  >
                    {facilitiesForAffiliation.map((v) => (
                      <SelectItem key={v.id}>{v.name}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    isDisabled={
                      !isEditable ||
                      !selected.healthcareFacilityId ||
                      facilityUnits.length === 0
                    }
                    label="หน่วยงานย่อย (ถ้ามี)"
                    labelPlacement="outside"
                    name="facilityUnitId"
                    placeholder={
                      !selected.healthcareFacilityId
                        ? "เลือกหน่วยงานก่อน"
                        : facilityUnits.length === 0
                          ? "ยังไม่มีหน่วยงานย่อย"
                          : "เลือกหน่วยงานย่อย (ไม่บังคับ)"
                    }
                    radius="sm"
                    selectedKeys={
                      selected.facilityUnitId != null
                        ? [String(selected.facilityUnitId)]
                        : []
                    }
                    size="md"
                    variant="bordered"
                    onChange={HandleChange}
                  >
                    {facilityUnits.map((u) => (
                      <SelectItem key={u.id}>{u.name}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    isDisabled={!isEditable}
                    label="สถานะ"
                    labelPlacement="outside"
                    name="status"
                    placeholder="สถานะ"
                    radius="sm"
                    selectedKeys={[selected.status ? "true" : "false"]}
                    size="md"
                    variant="bordered"
                    onChange={HandleChange}
                  >
                    <SelectItem key="true">ใช้งาน</SelectItem>
                    <SelectItem key="false">ไม่ใช้งาน</SelectItem>
                  </Select>
                </div>
              </ScrollShadow>
            </ModalBody>
            <ModalFooter className="w-full">
              <Button radius="sm" variant="light" onPress={close}>
                ปิด
              </Button>
              {isEditable ? (
                <Button
                  color="primary"
                  isLoading={isSaving}
                  radius="sm"
                  type="submit"
                >
                  บันทึก
                </Button>
              ) : (
                <Button
                  color="warning"
                  radius="sm"
                  variant="flat"
                  onPress={() => setMode("edit")}
                >
                  แก้ไข
                </Button>
              )}
            </ModalFooter>
          </Form>
        )}
      </ModalContent>
    </Modal>
  );
};
