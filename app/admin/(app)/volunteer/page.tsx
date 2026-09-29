"use client";

import { useState, ChangeEvent, useEffect, useCallback } from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
  useDisclosure,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  addToast,
} from "@heroui/react";
import {
  Volunteer,
  VolunteerType,
  EmployeeType,
  Affiliation,
} from "@prisma/client";

import { VolunteerRenderCell } from "../components/volunteer/render-cell";
import {
  ModalVolunteer,
  type VolunteerFormData,
} from "../components/modal/modal-volunteer";
import { AuthGuard } from "../components/auth-guard";

import { VolunteerColumnsName as columns } from "@/app/admin/(app)/data/tableColumn";

type ReferentWithRelations = Volunteer & {
  volunteerType?: VolunteerType;
  employeeType?: EmployeeType;
  affiliation: Affiliation;
  healthcareFacility?: { id: string; name: string } | null;
  facilityUnit?: { id: number; name: string } | null;
  prefix: string;
  question_count: number;
  status: boolean;
};

const emptyForm = (): VolunteerFormData => ({
  id: 0,
  citizenId: "",
  prefixId: 0,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  volunteerTypeId: 0,
  employeeTypeId: 0,
  affiliationId: 0,
  healthcareFacilityId: "",
  facilityUnitId: null,
  status: true,
});

function toFormData(row: ReferentWithRelations): VolunteerFormData {
  return {
    id: row.id,
    citizenId: row.citizenId,
    prefixId: row.prefixId,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    volunteerTypeId: row.volunteerTypeId,
    employeeTypeId: row.employeeTypeId,
    affiliationId: row.affiliationId,
    healthcareFacilityId: row.healthcareFacilityId,
    facilityUnitId: row.facilityUnitId ?? null,
    status: row.status,
  };
}

export default function VolunteerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [referents, setReferents] = useState<ReferentWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [mode, setMode] = useState<"View" | "edit" | "create">("View");
  const [selected, setSelected] = useState<VolunteerFormData>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const fetchReferents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/referent");
      const data = await response.json();

      if (!response.ok) {
        addToast({
          color: "danger",
          title: "โหลดข้อมูลไม่สำเร็จ",
          description: data?.error ?? `เกิดข้อผิดพลาด (${response.status})`,
        });
        setReferents([]);

        return;
      }

      setReferents(Array.isArray(data) ? data : []);
    } catch (error) {
      addToast({
        color: "danger",
        title: "โหลดข้อมูลไม่สำเร็จ",
        description: error instanceof Error ? error.message : String(error),
      });
      setReferents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReferents();
  }, [fetchReferents]);

  const onRowDetailPress = useCallback(
    (id: string) => {
      const referent = referents.find((r) => r.id.toString() === id);

      if (!referent) return;
      setSelected(toFormData(referent));
      setMode("View");
      onOpen();
    },
    [referents, onOpen]
  );

  const onRowEditPress = useCallback(
    (id: string) => {
      const referent = referents.find((r) => r.id.toString() === id);

      if (!referent) return;
      setSelected(toFormData(referent));
      setMode("edit");
      onOpen();
    },
    [referents, onOpen]
  );

  const onRowDeletePress = useCallback(
    (id: string) => {
      setDeleteId(id);
      onDeleteOpen();
    },
    [onDeleteOpen]
  );

  const onCreatePress = useCallback(() => {
    setSelected(emptyForm());
    setMode("create");
    onOpen();
  }, [onOpen]);

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/data/referent/${deleteId}`, {
        method: "DELETE",
      });
      const val = await res.json();

      if (!res.ok || val?.success === false) {
        addToast({
          color: "danger",
          title: "ลบไม่สำเร็จ",
          description: val?.error ?? `เกิดข้อผิดพลาด (${res.status})`,
        });

        return;
      }

      addToast({
        color: "success",
        title: "ปิดการใช้งานแล้ว",
        description: "สถานะอาสาสมัครถูกตั้งเป็นไม่ใช้งาน",
      });
      onDeleteClose();
      setDeleteId(null);
      await fetchReferents();
    } catch (error) {
      addToast({
        color: "danger",
        title: "ลบไม่สำเร็จ",
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteId, fetchReferents, onDeleteClose]);

  const filteredReferents = referents.filter((referent) =>
    `${referent.firstName} ${referent.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const pages = Math.max(1, Math.ceil(filteredReferents.length / rowsPerPage));
  const items = filteredReferents.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const bottomContent = (
    <div>
      <div className="flex justify-center">
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>
      <div className="mt-4 md:mt-[-30px] px-2 flex justify-between items-center">
        <div className="w-[30%] text-small text-default-400">
          หน้า {page}/{pages} ({filteredReferents.length} รายการ)
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small" />
          <label className="flex items-center text-default-400 text-small">
            แสดงต่อหน้า:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              defaultValue={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <AuthGuard allowedRoles={[4]} redirectTo="/admin">
      <div className="my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4">
        <div className="flex justify-between items-end gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">รายชื่ออาสาสมัคร</h1>
          <div className="flex items-center gap-3 flex-1 justify-end min-w-[280px]">
            <div className="relative w-full max-w-xs">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
              </div>
              <input
                className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ค้นหาอาสาสมัคร..."
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <Button
              color="primary"
              startContent={<PlusIcon className="size-5" />}
              onPress={onCreatePress}
            >
              เพิ่มอาสาสมัคร
            </Button>
          </div>
        </div>

        <ModalVolunteer
          Mode={mode}
          Volunteer={selected}
          isOpen={isOpen}
          onClose={onClose}
          onReLoad={fetchReferents}
        />

        <Modal isOpen={isDeleteOpen} placement="center" onClose={onDeleteClose}>
          <ModalContent>
            {(close) => (
              <>
                <ModalHeader>ยืนยันปิดการใช้งาน</ModalHeader>
                <ModalBody>
                  ต้องการปิดการใช้งานอาสาสมัครรหัส{" "}
                  {deleteId ? String(deleteId).padStart(3, "0") : ""} หรือไม่?
                  (ข้อมูลจะไม่ถูกลบถาวร)
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={close}>
                    ยกเลิก
                  </Button>
                  <Button
                    color="danger"
                    isLoading={isDeleting}
                    onPress={confirmDelete}
                  >
                    ปิดการใช้งาน
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <div className="max-w-[95rem] mx-auto w-full">
          <div className="w-full flex flex-col gap-4 text-nowrap">
            <Table
              aria-label="Volunteer Table"
              bottomContent={bottomContent}
              bottomContentPlacement="outside"
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn
                    key={column.uid}
                    align={column.align as "center" | "start" | "end"}
                  >
                    {column.name}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody
                emptyContent={"ไม่พบข้อมูล"}
                isLoading={isLoading}
                items={items}
                loadingContent={<Spinner label="กำลังโหลด..." />}
              >
                {(item) => (
                  <TableRow key={item.id}>
                    {(columnKey) => (
                      <TableCell>
                        {VolunteerRenderCell({
                          data: item,
                          columnKey,
                          index:
                            referents.findIndex((x) => x.id === item.id) + 1,
                          viewDetail: onRowDetailPress,
                          editDetail: onRowEditPress,
                          deleteDetail: onRowDeletePress,
                        })}
                      </TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
