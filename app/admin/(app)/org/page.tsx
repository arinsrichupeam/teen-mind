"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Switch,
  addToast,
  useDisclosure,
} from "@heroui/react";
import { FacilityStatus } from "@prisma/client";
import { PencilIcon } from "@heroicons/react/24/outline";

import { AuthGuard } from "../components/auth-guard";

type AffiliationRow = {
  id: number;
  name: string;
  status: boolean;
  _count?: { facilities: number };
};

type FacilityRow = {
  id: string;
  name: string;
  status: FacilityStatus;
  affiliationId: number;
  zoneId: number | null;
  zoneFacilitator?: boolean;
  affiliation?: { id: number; name: string } | null;
  zone?: { id: number; name: string } | null;
  _count?: { units: number };
};

type UnitRow = {
  id: number;
  name: string;
  status: boolean;
  healthcareFacilityId: string;
};

type ZoneRow = {
  id: number;
  name: string;
  status: boolean;
  facilitatorFacilityId: string | null;
  facilitatorFacility?: { id: string; name: string } | null;
  _count?: { facilities: number };
};

type EntityKind = "affiliation" | "facility" | "unit" | "zone";

type EditTarget = {
  kind: EntityKind;
  id: string | number;
  name: string;
  status: boolean;
  zoneId?: string;
};

const CREATE_TITLES: Record<EntityKind, string> = {
  affiliation: "เพิ่มสังกัด",
  facility: "เพิ่มหน่วยงาน",
  unit: "เพิ่มหน่วยงานย่อย",
  zone: "เพิ่ม Zone",
};

const EDIT_TITLES: Record<EntityKind, string> = {
  affiliation: "แก้ไขสังกัด",
  facility: "แก้ไขหน่วยงาน",
  unit: "แก้ไขหน่วยงานย่อย",
  zone: "แก้ไข Zone",
};

export default function OrgAdminPage() {
  const [affiliations, setAffiliations] = useState<AffiliationRow[]>([]);
  const [facilities, setFacilities] = useState<FacilityRow[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [zoneFacilities, setZoneFacilities] = useState<FacilityRow[]>([]);

  const [selectedAffId, setSelectedAffId] = useState<number | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    null
  );
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

  const [affSearch, setAffSearch] = useState("");
  const [facilitySearch, setFacilitySearch] = useState("");
  const [unitSearch, setUnitSearch] = useState("");
  const [zoneSearch, setZoneSearch] = useState("");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isAssignOpen,
    onOpen: onAssignOpen,
    onClose: onAssignClose,
  } = useDisclosure();
  const [formKind, setFormKind] = useState<EntityKind>("affiliation");
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState(true);
  const [formZoneId, setFormZoneId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [assignCandidates, setAssignCandidates] = useState<FacilityRow[]>([]);
  const [assignFacilityId, setAssignFacilityId] = useState<string>("");
  const [assignSearch, setAssignSearch] = useState("");
  const [assignSaving, setAssignSaving] = useState(false);

  const selectedAffName = useMemo(
    () => affiliations.find((a) => a.id === selectedAffId)?.name,
    [affiliations, selectedAffId]
  );
  const selectedFacilityName = useMemo(
    () => facilities.find((f) => f.id === selectedFacilityId)?.name,
    [facilities, selectedFacilityId]
  );
  const selectedZoneName = useMemo(
    () => zones.find((z) => z.id === selectedZoneId)?.name,
    [zones, selectedZoneId]
  );

  const loadAffiliations = useCallback(async () => {
    const res = await fetch("/api/data/affiliation?all=1");

    if (!res.ok) return;
    setAffiliations(await res.json());
  }, []);

  const loadZones = useCallback(async () => {
    const res = await fetch("/api/data/zone");

    if (!res.ok) return;
    setZones(await res.json());
  }, []);

  const loadFacilities = useCallback(async (affiliationId: number) => {
    const res = await fetch(
      `/api/data/healthcare-facility?affiliationId=${affiliationId}`
    );

    if (!res.ok) return;
    setFacilities(await res.json());
  }, []);

  const loadUnits = useCallback(async (facilityId: string) => {
    const res = await fetch(
      `/api/data/facility-unit?healthcareFacilityId=${facilityId}`
    );

    if (!res.ok) return;
    setUnits(await res.json());
  }, []);

  const loadZoneFacilities = useCallback(async (zoneId: number) => {
    const res = await fetch(`/api/data/healthcare-facility?zoneId=${zoneId}`);

    if (!res.ok) return;
    setZoneFacilities(await res.json());
  }, []);

  useEffect(() => {
    void loadAffiliations();
    void loadZones();
  }, [loadAffiliations, loadZones]);

  useEffect(() => {
    if (selectedAffId == null) {
      setFacilities([]);
      setSelectedFacilityId(null);

      return;
    }
    void loadFacilities(selectedAffId);
  }, [selectedAffId, loadFacilities]);

  useEffect(() => {
    if (!selectedFacilityId) {
      setUnits([]);

      return;
    }
    void loadUnits(selectedFacilityId);
  }, [selectedFacilityId, loadUnits]);

  useEffect(() => {
    if (selectedZoneId == null) {
      setZoneFacilities([]);

      return;
    }
    void loadZoneFacilities(selectedZoneId);
  }, [selectedZoneId, loadZoneFacilities]);

  const filteredAff = useMemo(
    () =>
      affiliations.filter((a) =>
        a.name.toLowerCase().includes(affSearch.toLowerCase())
      ),
    [affiliations, affSearch]
  );
  const filteredFacilities = useMemo(
    () =>
      facilities.filter((f) =>
        f.name.toLowerCase().includes(facilitySearch.toLowerCase())
      ),
    [facilities, facilitySearch]
  );
  const filteredUnits = useMemo(
    () =>
      units.filter((u) =>
        u.name.toLowerCase().includes(unitSearch.toLowerCase())
      ),
    [units, unitSearch]
  );
  const filteredZones = useMemo(
    () =>
      zones.filter((z) =>
        z.name.toLowerCase().includes(zoneSearch.toLowerCase())
      ),
    [zones, zoneSearch]
  );

  const toastError = (title: string, err: unknown) => {
    addToast({
      color: "danger",
      title,
      description: err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
    });
  };

  const filteredAssignCandidates = useMemo(() => {
    const q = assignSearch.toLowerCase();

    return assignCandidates.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.affiliation?.name ?? "").toLowerCase().includes(q)
    );
  }, [assignCandidates, assignSearch]);

  const openAssignToZoneModal = async () => {
    if (selectedZoneId == null) return;
    setAssignFacilityId("");
    setAssignSearch("");
    const [unassignedRes, allRes] = await Promise.all([
      fetch("/api/data/healthcare-facility?unassigned=1"),
      fetch("/api/data/healthcare-facility?all=1"),
    ]);
    const unassigned: FacilityRow[] = unassignedRes.ok
      ? await unassignedRes.json()
      : [];
    const all: FacilityRow[] = allRes.ok ? await allRes.json() : [];
    const inOtherZones = all.filter(
      (f) => f.zoneId != null && f.zoneId !== selectedZoneId
    );
    const byId = new Map<string, FacilityRow>();

    for (const f of [...unassigned, ...inOtherZones]) {
      byId.set(f.id, f);
    }
    setAssignCandidates(
      Array.from(byId.values()).sort((a, b) =>
        a.name.localeCompare(b.name, "th")
      )
    );
    onAssignOpen();
  };

  const submitAssignToZone = async () => {
    if (selectedZoneId == null || !assignFacilityId) {
      toastError("กรอกข้อมูลไม่ครบ", new Error("กรุณาเลือกหน่วยงาน"));

      return;
    }
    setAssignSaving(true);
    try {
      const res = await fetch("/api/data/healthcare-facility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: assignFacilityId,
          zoneId: selectedZoneId,
        }),
      });
      const json = await res.json();

      if (!res.ok)
        throw new Error(json.error ?? "เพิ่มหน่วยงานเข้า Zone ไม่สำเร็จ");
      await loadZoneFacilities(selectedZoneId);
      await loadZones();
      if (selectedAffId != null) await loadFacilities(selectedAffId);
      addToast({ color: "success", title: "เพิ่มหน่วยงานเข้า Zone แล้ว" });
      onAssignClose();
    } catch (err) {
      toastError("เพิ่มหน่วยงานเข้า Zone", err);
    } finally {
      setAssignSaving(false);
    }
  };

  const removeFromZone = async (facilityId: string) => {
    if (selectedZoneId == null) return;
    const res = await fetch("/api/data/healthcare-facility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: facilityId,
        zoneId: null,
        zoneFacilitator: false,
      }),
    });
    const json = await res.json();

    if (!res.ok) {
      toastError("นำออกจาก Zone", new Error(json.error ?? "ไม่สำเร็จ"));

      return;
    }
    await loadZoneFacilities(selectedZoneId);
    await loadZones();
    if (selectedAffId != null) await loadFacilities(selectedAffId);
    addToast({ color: "success", title: "นำหน่วยงานออกจาก Zone แล้ว" });
  };

  const openCreateModal = (kind: EntityKind) => {
    setEditTarget(null);
    setFormKind(kind);
    setFormName("");
    setFormStatus(true);
    setFormZoneId("");
    onOpen();
  };

  const openEditModal = (target: EditTarget) => {
    setEditTarget(target);
    setFormKind(target.kind);
    setFormName(target.name);
    setFormStatus(target.status);
    setFormZoneId(target.zoneId ?? "");
    onOpen();
  };

  const patchAffiliationStatus = async (id: number, status: boolean) => {
    const res = await fetch("/api/data/affiliation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));

      throw new Error(json.error ?? "อัปเดตสถานะสังกัดไม่สำเร็จ");
    }
    await loadAffiliations();
  };

  const patchFacilityStatus = async (id: string, active: boolean) => {
    const res = await fetch("/api/data/healthcare-facility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status: active ? FacilityStatus.ACTIVE : FacilityStatus.INACTIVE,
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));

      throw new Error(json.error ?? "อัปเดตสถานะหน่วยงานไม่สำเร็จ");
    }
    if (selectedAffId != null) await loadFacilities(selectedAffId);
    if (selectedZoneId != null) await loadZoneFacilities(selectedZoneId);
  };

  const patchUnitStatus = async (id: number, status: boolean) => {
    const res = await fetch("/api/data/facility-unit", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));

      throw new Error(json.error ?? "อัปเดตสถานะหน่วยงานย่อยไม่สำเร็จ");
    }
    if (selectedFacilityId) await loadUnits(selectedFacilityId);
  };

  const patchZoneStatus = async (id: number, status: boolean) => {
    const res = await fetch("/api/data/zone", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));

      throw new Error(json.error ?? "อัปเดตสถานะ Zone ไม่สำเร็จ");
    }
    await loadZones();
  };

  const submitForm = async () => {
    const name = formName.trim();

    if (!name) {
      toastError("กรอกข้อมูลไม่ครบ", new Error("กรุณาระบุชื่อ"));

      return;
    }

    setSaving(true);
    try {
      if (editTarget) {
        if (editTarget.kind === "affiliation") {
          const res = await fetch("/api/data/affiliation", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: Number(editTarget.id),
              name,
              status: formStatus,
            }),
          });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error ?? "แก้ไขสังกัดไม่สำเร็จ");
          await loadAffiliations();
        } else if (editTarget.kind === "facility") {
          const res = await fetch("/api/data/healthcare-facility", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: String(editTarget.id),
              name,
              zoneId: formZoneId ? Number(formZoneId) : null,
              status: formStatus
                ? FacilityStatus.ACTIVE
                : FacilityStatus.INACTIVE,
            }),
          });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error ?? "แก้ไขหน่วยงานไม่สำเร็จ");
          if (selectedAffId != null) await loadFacilities(selectedAffId);
          if (selectedZoneId != null) await loadZoneFacilities(selectedZoneId);
        } else if (editTarget.kind === "unit") {
          const res = await fetch("/api/data/facility-unit", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: Number(editTarget.id),
              name,
              status: formStatus,
            }),
          });
          const json = await res.json();

          if (!res.ok)
            throw new Error(json.error ?? "แก้ไขหน่วยงานย่อยไม่สำเร็จ");
          if (selectedFacilityId) await loadUnits(selectedFacilityId);
        } else {
          const res = await fetch("/api/data/zone", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: Number(editTarget.id),
              name,
              status: formStatus,
            }),
          });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error ?? "แก้ไข Zone ไม่สำเร็จ");
          await loadZones();
        }
        addToast({ color: "success", title: "บันทึกการแก้ไขแล้ว" });
      } else if (formKind === "affiliation") {
        const res = await fetch("/api/data/affiliation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, status: formStatus }),
        });
        const json = await res.json();

        if (!res.ok) throw new Error(json.error ?? "เพิ่มสังกัดไม่สำเร็จ");
        await loadAffiliations();
        addToast({ color: "success", title: "เพิ่มสังกัดสำเร็จ" });
      } else if (formKind === "facility") {
        if (selectedAffId == null) throw new Error("กรุณาเลือกสังกัดก่อน");
        const res = await fetch("/api/data/healthcare-facility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            affiliationId: selectedAffId,
            zoneId: formZoneId ? Number(formZoneId) : null,
            status: formStatus
              ? FacilityStatus.ACTIVE
              : FacilityStatus.INACTIVE,
          }),
        });
        const json = await res.json();

        if (!res.ok) throw new Error(json.error ?? "เพิ่มหน่วยงานไม่สำเร็จ");
        await loadFacilities(selectedAffId);
        addToast({ color: "success", title: "เพิ่มหน่วยงานสำเร็จ" });
      } else if (formKind === "unit") {
        if (!selectedFacilityId) throw new Error("กรุณาเลือกหน่วยงานก่อน");
        const res = await fetch("/api/data/facility-unit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            healthcareFacilityId: selectedFacilityId,
            status: formStatus,
          }),
        });
        const json = await res.json();

        if (!res.ok)
          throw new Error(json.error ?? "เพิ่มหน่วยงานย่อยไม่สำเร็จ");
        await loadUnits(selectedFacilityId);
        addToast({ color: "success", title: "เพิ่มหน่วยงานย่อยสำเร็จ" });
      } else {
        const res = await fetch("/api/data/zone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, status: formStatus }),
        });
        const json = await res.json();

        if (!res.ok) throw new Error(json.error ?? "เพิ่ม Zone ไม่สำเร็จ");
        await loadZones();
        addToast({ color: "success", title: "เพิ่ม Zone สำเร็จ" });
      }
      onClose();
    } catch (err) {
      toastError(
        editTarget ? EDIT_TITLES[formKind] : CREATE_TITLES[formKind],
        err
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard allowedRoles={[4]} redirectTo="/admin">
      <div className="max-w-[95rem] my-8 px-4 lg:px-6 mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">
            จัดการ สังกัด / Zone / หน่วยงาน
          </h3>
          <p className="text-sm text-default-500">
            คลิกชื่อเพื่อเลือกดูรายการถัดไป · กดไอคอนดินสอเพื่อแก้ไข ·
            สวิตช์เพื่อเปิด/ปิดใช้งาน
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h4 className="font-semibold text-default-700">
            สังกัด → หน่วยงาน → หน่วยงานย่อย
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex justify-between items-center">
                <span className="font-semibold">สังกัด</span>
                <Button
                  color="primary"
                  size="sm"
                  onPress={() => openCreateModal("affiliation")}
                >
                  + เพิ่ม
                </Button>
              </CardHeader>
              <CardBody className="gap-3">
                <Input
                  placeholder="ค้นหา"
                  size="sm"
                  value={affSearch}
                  onValueChange={setAffSearch}
                />
                <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
                  {filteredAff.map((a) => (
                    <div
                      key={a.id}
                      className={`flex items-center gap-2 px-2 py-2 rounded-md border ${
                        selectedAffId === a.id
                          ? "border-primary bg-primary-50"
                          : "border-transparent hover:bg-default-100"
                      }`}
                    >
                      <button
                        className="flex-1 text-left min-w-0"
                        type="button"
                        onClick={() => setSelectedAffId(a.id)}
                      >
                        <span className="block truncate">{a.name}</span>
                        <span className="text-xs text-default-400">
                          {a._count?.facilities ?? 0} หน่วยงาน
                        </span>
                      </button>
                      <Switch
                        aria-label={`สถานะ ${a.name}`}
                        isSelected={a.status}
                        size="sm"
                        onValueChange={async (checked) => {
                          try {
                            await patchAffiliationStatus(a.id, checked);
                          } catch (err) {
                            toastError("อัปเดตสถานะสังกัด", err);
                          }
                        }}
                      />
                      <Button
                        isIconOnly
                        aria-label={`แก้ไข ${a.name}`}
                        className="text-white"
                        color="warning"
                        size="sm"
                        variant="solid"
                        onPress={() =>
                          openEditModal({
                            kind: "affiliation",
                            id: a.id,
                            name: a.name,
                            status: a.status,
                          })
                        }
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex justify-between items-center">
                <span className="font-semibold">หน่วยงาน</span>
                <Button
                  color="primary"
                  isDisabled={selectedAffId == null}
                  size="sm"
                  onPress={() => openCreateModal("facility")}
                >
                  + เพิ่ม
                </Button>
              </CardHeader>
              <CardBody className="gap-3">
                <p className="text-xs text-default-500">
                  {selectedAffId == null
                    ? "เลือกสังกัดทางซ้าย"
                    : selectedAffName}
                </p>
                <Input
                  isDisabled={selectedAffId == null}
                  placeholder="ค้นหา"
                  size="sm"
                  value={facilitySearch}
                  onValueChange={setFacilitySearch}
                />
                <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
                  {filteredFacilities.map((f) => (
                    <div
                      key={f.id}
                      className={`flex items-center gap-2 px-2 py-2 rounded-md border ${
                        selectedFacilityId === f.id
                          ? "border-primary bg-primary-50"
                          : "border-transparent hover:bg-default-100"
                      }`}
                    >
                      <button
                        className="flex-1 text-left min-w-0"
                        type="button"
                        onClick={() => setSelectedFacilityId(f.id)}
                      >
                        <span className="block truncate">{f.name}</span>
                        {f.zone?.name ? (
                          <span className="text-xs text-default-400">
                            Zone: {f.zone.name}
                          </span>
                        ) : (
                          <span className="text-xs text-default-400">
                            ยังไม่เข้า Zone
                          </span>
                        )}
                      </button>
                      <Switch
                        aria-label={`สถานะ ${f.name}`}
                        isSelected={f.status === "ACTIVE"}
                        size="sm"
                        onValueChange={async (checked) => {
                          try {
                            await patchFacilityStatus(f.id, checked);
                          } catch (err) {
                            toastError("อัปเดตสถานะหน่วยงาน", err);
                          }
                        }}
                      />
                      <Button
                        isIconOnly
                        aria-label={`แก้ไข ${f.name}`}
                        className="text-white"
                        color="warning"
                        size="sm"
                        variant="solid"
                        onPress={() =>
                          openEditModal({
                            kind: "facility",
                            id: f.id,
                            name: f.name,
                            status: f.status === "ACTIVE",
                            zoneId: f.zoneId != null ? String(f.zoneId) : "",
                          })
                        }
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex justify-between items-center">
                <span className="font-semibold">หน่วยงานย่อย</span>
                <Button
                  color="primary"
                  isDisabled={!selectedFacilityId}
                  size="sm"
                  onPress={() => openCreateModal("unit")}
                >
                  + เพิ่ม
                </Button>
              </CardHeader>
              <CardBody className="gap-3">
                <p className="text-xs text-default-500">
                  {!selectedFacilityId
                    ? "เลือกหน่วยงานตรงกลาง"
                    : selectedFacilityName}
                </p>
                <Input
                  isDisabled={!selectedFacilityId}
                  placeholder="ค้นหา"
                  size="sm"
                  value={unitSearch}
                  onValueChange={setUnitSearch}
                />
                <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
                  {filteredUnits.length === 0 ? (
                    <p className="text-sm text-default-400 px-2 py-3">
                      {selectedFacilityId
                        ? "ยังไม่มีหน่วยงานย่อย — กด “+ เพิ่ม”"
                        : "เลือกหน่วยงานก่อน"}
                    </p>
                  ) : (
                    filteredUnits.map((u) => (
                      <div
                        key={u.id}
                        className="px-2 py-2 rounded-md bg-default-50 flex items-center gap-2"
                      >
                        <span className="flex-1 min-w-0 truncate">
                          {u.name}
                        </span>
                        <Switch
                          aria-label={`สถานะ ${u.name}`}
                          isSelected={u.status}
                          size="sm"
                          onValueChange={async (checked) => {
                            try {
                              await patchUnitStatus(u.id, checked);
                            } catch (err) {
                              toastError("อัปเดตสถานะหน่วยงานย่อย", err);
                            }
                          }}
                        />
                        <Button
                          isIconOnly
                          aria-label={`แก้ไข ${u.name}`}
                          className="text-white"
                          color="warning"
                          size="sm"
                          variant="solid"
                          onPress={() =>
                            openEditModal({
                              kind: "unit",
                              id: u.id,
                              name: u.name,
                              status: u.status,
                            })
                          }
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h4 className="font-semibold text-default-700">
            Zone → หน่วยงานในโซน
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex justify-between items-center">
                <span className="font-semibold">Zone</span>
                <Button
                  color="primary"
                  size="sm"
                  onPress={() => openCreateModal("zone")}
                >
                  + เพิ่ม
                </Button>
              </CardHeader>
              <CardBody className="gap-3">
                <Input
                  placeholder="ค้นหา"
                  size="sm"
                  value={zoneSearch}
                  onValueChange={setZoneSearch}
                />
                <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
                  {filteredZones.length === 0 ? (
                    <p className="text-sm text-default-400 px-2 py-3">
                      ยังไม่มี Zone — กด “+ เพิ่ม”
                    </p>
                  ) : (
                    filteredZones.map((z) => (
                      <div
                        key={z.id}
                        className={`flex items-center gap-2 px-2 py-2 rounded-md border ${
                          selectedZoneId === z.id
                            ? "border-primary bg-primary-50"
                            : "border-transparent hover:bg-default-100"
                        }`}
                      >
                        <button
                          className="flex-1 text-left min-w-0"
                          type="button"
                          onClick={() => setSelectedZoneId(z.id)}
                        >
                          <span className="block truncate">{z.name}</span>
                          <span className="text-xs text-default-400">
                            {z._count?.facilities ?? 0} หน่วยงาน
                            {z.facilitatorFacility?.name
                              ? ` · แม่ zone: ${z.facilitatorFacility.name}`
                              : ""}
                          </span>
                        </button>
                        <Switch
                          aria-label={`สถานะ ${z.name}`}
                          isSelected={z.status}
                          size="sm"
                          onValueChange={async (checked) => {
                            try {
                              await patchZoneStatus(z.id, checked);
                            } catch (err) {
                              toastError("อัปเดตสถานะ Zone", err);
                            }
                          }}
                        />
                        <Button
                          isIconOnly
                          aria-label={`แก้ไข ${z.name}`}
                          className="text-white"
                          color="warning"
                          size="sm"
                          variant="solid"
                          onPress={() =>
                            openEditModal({
                              kind: "zone",
                              id: z.id,
                              name: z.name,
                              status: z.status,
                            })
                          }
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex justify-between items-center">
                <span className="font-semibold">หน่วยงานใน Zone</span>
                <Button
                  color="primary"
                  isDisabled={selectedZoneId == null}
                  size="sm"
                  onPress={() => void openAssignToZoneModal()}
                >
                  + เพิ่มหน่วยงาน
                </Button>
              </CardHeader>
              <CardBody className="gap-2 max-h-96 overflow-y-auto">
                {selectedZoneId == null ? (
                  <p className="text-sm text-default-500">เลือก Zone ทางซ้าย</p>
                ) : zoneFacilities.length === 0 ? (
                  <p className="text-sm text-default-500">
                    ยังไม่มีหน่วยงานใน Zone นี้ — กด “+ เพิ่มหน่วยงาน”
                  </p>
                ) : (
                  zoneFacilities.map((f) => (
                    <div
                      key={f.id}
                      className="px-3 py-2 rounded-md bg-default-50 flex justify-between items-center gap-3"
                    >
                      <div className="min-w-0">
                        <p>{f.name}</p>
                        <p className="text-xs text-default-400">
                          {f.affiliation?.name ??
                            (f.affiliationId
                              ? `สังกัด #${f.affiliationId}`
                              : "")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          isSelected={Boolean(f.zoneFacilitator)}
                          size="sm"
                          onValueChange={async (checked) => {
                            await fetch("/api/data/healthcare-facility", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                id: f.id,
                                zoneFacilitator: checked,
                              }),
                            });
                            await loadZoneFacilities(selectedZoneId);
                            await loadZones();
                          }}
                        >
                          แม่ zone
                        </Switch>
                        <Button
                          color="danger"
                          size="sm"
                          variant="light"
                          onPress={() => void removeFromZone(f.id)}
                        >
                          นำออก
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </div>
        </section>

        <Modal isOpen={isOpen} placement="center" size="md" onClose={onClose}>
          <ModalContent>
            {(close) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {editTarget ? EDIT_TITLES[formKind] : CREATE_TITLES[formKind]}
                </ModalHeader>
                <ModalBody className="gap-4">
                  {formKind === "facility" && selectedAffName ? (
                    <p className="text-sm text-default-500">
                      สังกัด: {selectedAffName}
                    </p>
                  ) : null}
                  {formKind === "unit" && selectedFacilityName ? (
                    <p className="text-sm text-default-500">
                      หน่วยงาน: {selectedFacilityName}
                    </p>
                  ) : null}
                  <Input
                    isRequired
                    label="ชื่อ"
                    labelPlacement="outside"
                    placeholder={
                      formKind === "affiliation"
                        ? "ชื่อสังกัด"
                        : formKind === "facility"
                          ? "ชื่อหน่วยงาน"
                          : formKind === "unit"
                            ? "ชื่อหน่วยงานย่อย"
                            : "ชื่อ Zone"
                    }
                    value={formName}
                    variant="bordered"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void submitForm();
                      }
                    }}
                    onValueChange={setFormName}
                  />
                  {formKind === "facility" ? (
                    <Select
                      label="Zone (ถ้ามี)"
                      labelPlacement="outside"
                      placeholder="ไม่ระบุ Zone"
                      selectedKeys={formZoneId ? [formZoneId] : []}
                      variant="bordered"
                      onChange={(e) => setFormZoneId(e.target.value)}
                    >
                      {zones.map((z) => (
                        <SelectItem key={String(z.id)}>{z.name}</SelectItem>
                      ))}
                    </Select>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">สถานะใช้งาน</span>
                    <Switch
                      isSelected={formStatus}
                      onValueChange={setFormStatus}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="bordered" onPress={close}>
                    ยกเลิก
                  </Button>
                  <Button
                    color="primary"
                    isLoading={saving}
                    onPress={() => void submitForm()}
                  >
                    บันทึก
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <Modal
          isOpen={isAssignOpen}
          placement="center"
          size="lg"
          onClose={onAssignClose}
        >
          <ModalContent>
            {(close) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  เพิ่มหน่วยงานเข้า Zone
                  {selectedZoneName ? (
                    <span className="text-sm font-normal text-default-500">
                      {selectedZoneName}
                    </span>
                  ) : null}
                </ModalHeader>
                <ModalBody className="gap-4">
                  <Input
                    label="ค้นหาหน่วยงาน"
                    labelPlacement="outside"
                    placeholder="ชื่อหน่วยงาน หรือ สังกัด"
                    value={assignSearch}
                    variant="bordered"
                    onValueChange={setAssignSearch}
                  />
                  <Select
                    isRequired
                    label="เลือกหน่วยงาน"
                    labelPlacement="outside"
                    placeholder="หน่วยงานที่ยังไม่อยู่ใน Zone นี้"
                    selectedKeys={assignFacilityId ? [assignFacilityId] : []}
                    variant="bordered"
                    onChange={(e) => setAssignFacilityId(e.target.value)}
                  >
                    {filteredAssignCandidates.map((f) => (
                      <SelectItem
                        key={f.id}
                        textValue={`${f.name} ${f.affiliation?.name ?? ""}`}
                      >
                        <div className="flex flex-col">
                          <span>{f.name}</span>
                          <span className="text-xs text-default-400">
                            {f.affiliation?.name ?? "ไม่ระบุสังกัด"}
                            {f.zone?.name ? ` · ปัจจุบัน: ${f.zone.name}` : ""}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                  {filteredAssignCandidates.length === 0 ? (
                    <p className="text-sm text-default-500">
                      ไม่พบหน่วยงานที่มอบหมายได้ — สร้างหน่วยงานจากแผงด้านบนก่อน
                    </p>
                  ) : null}
                </ModalBody>
                <ModalFooter>
                  <Button variant="bordered" onPress={close}>
                    ยกเลิก
                  </Button>
                  <Button
                    color="primary"
                    isDisabled={!assignFacilityId}
                    isLoading={assignSaving}
                    onPress={() => void submitAssignToZone()}
                  >
                    เพิ่มเข้า Zone
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </AuthGuard>
  );
}
