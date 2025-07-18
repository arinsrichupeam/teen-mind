"use client";

import {
  ChangeEvent,
  Suspense,
  useCallback,
  useMemo,
  useState,
  Key,
} from "react";
import {
  Button,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Input,
  Chip,
  SortDescriptor,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import useSWR from "swr";

import { ModalEditProfile } from "../components/modal/modal-edit-profile";

import UserDetailDrawer from "./components/user-detail-drawer";

import { prefix } from "@/utils/data";
import Loading from "@/app/loading";

interface UserData {
  id: string;
  firstname: string;
  lastname: string;
  prefixId: number;
  sex: number;
  citizenId: string;
  tel: string;
  school: {
    id: number;
    name: string;
  } | null;
  questions: {
    id: string;
    createdAt: string;
    result: string;
    result_text?: string;
  }[];
}

interface SchoolData {
  id: number;
  name: string;
  districtId: number;
  status: boolean;
}

const columns = [
  { name: "ลำดับ", uid: "id", align: "center" as const, sortable: true },
  {
    name: "ชื่อ-นามสกุล",
    uid: "name",
    align: "start" as const,
    sortable: true,
  },
  { name: "โรงเรียน", uid: "school", align: "start" as const, sortable: true },
  {
    name: "จำนวนแบบสอบถาม",
    uid: "questionCount",
    align: "center" as const,
    sortable: true,
  },
  { name: "", uid: "actions", align: "center" as const, sortable: false },
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UserPage() {
  const {
    data: users = [],
    isLoading,
    mutate,
  } = useSWR<UserData[]>("/api/profile/user", fetcher);

  // ดึงข้อมูลโรงเรียน
  const { data: schools = [] } = useSWR<SchoolData[]>(
    "/api/data/school",
    fetcher
  );

  const [filterValue, setFilterValue] = useState("");
  const [citizenIdFilter, setCitizenIdFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  // State สำหรับ UserDetailDrawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">("view");

  // State สำหรับ Modal เพิ่ม Profile
  const [isAddProfileModalOpen, setIsAddProfileModalOpen] = useState(false);

  const hasSearchFilter = Boolean(filterValue);
  const hasCitizenIdFilter = Boolean(citizenIdFilter);
  const hasSchoolFilter = Boolean(schoolFilter);

  const filteredItems = useMemo(() => {
    let filteredUsers = [...users];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        `${prefix.find((val) => val.key == user.prefixId.toString())?.label} ${
          user.firstname
        } ${user.lastname}`
          .toLowerCase()
          .includes(filterValue.toLowerCase())
      );
    }

    if (hasCitizenIdFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.citizenId.toLowerCase().includes(citizenIdFilter.toLowerCase())
      );
    }

    if (hasSchoolFilter) {
      filteredUsers = filteredUsers.filter(
        (user) => user.school?.id.toString() === schoolFilter
      );
    }

    return filteredUsers;
  }, [users, filterValue, citizenIdFilter, schoolFilter]);

  const pages = useMemo(() => {
    return filteredItems.length
      ? Math.ceil(filteredItems.length / rowsPerPage)
      : 0;
  }, [filteredItems.length, rowsPerPage]);

  const sortedItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const slicedItems = filteredItems.slice(start, end);

    return [...slicedItems].sort((a: UserData, b: UserData) => {
      const getSortableValue = (user: UserData, column: Key) => {
        switch (column) {
          case "id":
            return users.findIndex((u) => u.id === user.id);
          case "name":
            return `${user.firstname} ${user.lastname}`;
          case "school":
            return user.school?.name || "";
          case "questionCount":
            return user.questions.length;
          default:
            return "";
        }
      };

      const first = getSortableValue(a, sortDescriptor.column);
      const second = getSortableValue(b, sortDescriptor.column);
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, page, rowsPerPage, filteredItems, users]);

  const onRowsPerPageChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(parseInt(e.target.value));
      setPage(1);
    },
    []
  );

  const onSearchChange = useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = useCallback(() => {
    setFilterValue("");
    setCitizenIdFilter("");
    setSchoolFilter("");
    setPage(1);
  }, []);

  const topContent = useMemo(() => {
    // สร้าง items สำหรับ Autocomplete
    const schoolItems = schools.map((school) => ({
      key: school.id.toString(),
      name: school.name,
    }));

    return (
      <div className="flex flex-col gap-4 bg-white p-2 rounded-lg shadow-sm border border-default-200">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="เลขประจำตัวประชาชน"
            startContent={
              <MagnifyingGlassIcon className="size-4 text-default-400" />
            }
            value={citizenIdFilter}
            variant="bordered"
            onClear={() => setCitizenIdFilter("")}
            onValueChange={(value) => {
              setCitizenIdFilter(value);
              setPage(1);
            }}
          />
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="ค้นหาชื่อ-นามสกุล..."
            startContent={
              <MagnifyingGlassIcon className="size-4 text-default-400" />
            }
            value={filterValue}
            variant="bordered"
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <Autocomplete
            className="w-full sm:max-w-[44%]"
            defaultItems={schoolItems}
            placeholder="เลือกโรงเรียน"
            selectedKey={schoolFilter}
            variant="bordered"
            onSelectionChange={(key) => {
              setSchoolFilter(key as string);
              setPage(1);
            }}
          >
            {(item) => (
              <AutocompleteItem key={item.key} textValue={item.name}>
                {item.name}
              </AutocompleteItem>
            )}
          </Autocomplete>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 justify-between w-full">
            <span className="text-default-400 text-small">
              รวม {filteredItems.length} รายการ
            </span>
            <Button
              className="text-white font-semibold"
              color="success"
              size="md"
              startContent={<PlusIcon className="size-5 text-white" />}
              variant="solid"
              onClick={() => {
                setIsAddProfileModalOpen(true);
              }}
            >
              เพิ่มผู้ใช้งาน
            </Button>
          </div>
        </div>
      </div>
    );
  }, [
    filterValue,
    citizenIdFilter,
    onSearchChange,
    onClear,
    filteredItems.length,
    schools,
    schoolFilter,
  ]);

  const bottomContent = useMemo(() => {
    return (
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
            หน้า {page}/{pages}
          </div>
          <div className="flex justify-between items-center">
            <label className="flex items-center text-default-400 text-small">
              แสดงต่อหน้า:
              <select
                className="bg-transparent outline-none text-default-400 text-small"
                defaultValue={rowsPerPage}
                onChange={onRowsPerPageChange}
              >
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    );
  }, [page, pages, rowsPerPage, onRowsPerPageChange]);

  const renderCell = useCallback(
    (user: UserData, columnKey: React.Key) => {
      switch (columnKey) {
        case "id":
          return (
            <p className="text-bold text-small capitalize">
              {users.findIndex((x) => x.id === user.id) + 1}
            </p>
          );
        case "name":
          return (
            <div>
              <p className="text-bold text-small capitalize">
                {
                  prefix.find((val) => val.key == user.prefixId.toString())
                    ?.label
                }{" "}
                {user.firstname} {user.lastname}
              </p>
              <p className="text-bold text-tiny capitalize text-default-400">
                {user.citizenId}
              </p>
            </div>
          );
        case "school":
          return (
            <p className="text-bold text-small capitalize">
              {user.school?.name || "-"}
            </p>
          );
        case "questionCount":
          return (
            <Chip
              color={user.questions.length > 0 ? "primary" : "default"}
              size="sm"
              variant="flat"
            >
              {user.questions.length}
            </Chip>
          );
        case "actions":
          return (
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onClick={() => {
                  setSelectedUser(user);
                  setDrawerMode("view");
                  setIsDrawerOpen(true);
                }}
              >
                <EyeIcon className="size-6 text-primary-400" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onClick={() => {
                  setSelectedUser(user);
                  setDrawerMode("edit");
                  setIsDrawerOpen(true);
                }}
              >
                <PencilIcon className="size-6 text-warning-400" />
              </Button>
              <Button isIconOnly size="sm" variant="light" onClick={() => {}}>
                <TrashIcon className="size-6 text-danger-500" />
              </Button>
            </div>
          );
        default:
          return null;
      }
    },
    [users]
  );

  return (
    <Suspense fallback={<Loading />}>
      <div className="max-w-[95rem] my-10 px-4 lg:px-6 mx-auto w-full flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">จัดการผู้ใช้งาน (User)</h3>
        </div>

        <div className="w-full flex flex-col gap-4 text-nowrap">
          <Table
            isStriped
            aria-label="User List Table"
            bottomContent={bottomContent}
            bottomContentPlacement="outside"
            classNames={{
              wrapper: "max-h-[calc(65vh)]",
            }}
            sortDescriptor={sortDescriptor}
            topContent={topContent}
            topContentPlacement="outside"
            onSortChange={setSortDescriptor}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.uid}
                  align={column.align}
                  allowsSorting={column.sortable}
                >
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              emptyContent={isLoading ? " " : "ไม่พบข้อมูล"}
              isLoading={isLoading}
              items={sortedItems}
              loadingContent={<Spinner label="กำลังโหลด..." />}
            >
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => (
                    <TableCell className="text-nowrap">
                      {renderCell(item, columnKey)}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* UserDetailDrawer */}
        <UserDetailDrawer
          isOpen={isDrawerOpen}
          mode={drawerMode}
          user={selectedUser}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedUser(null);
            setDrawerMode("view");
          }}
          onRefresh={() => {
            mutate();
            // ปิด drawer หลังจากรีเฟรชข้อมูล
            setIsDrawerOpen(false);
            setSelectedUser(null);
            setDrawerMode("view");
          }}
        />

        {/* Modal เพิ่ม Profile */}
        <ModalEditProfile
          data={{}}
          isOpen={isAddProfileModalOpen}
          mode="create"
          onClose={() => setIsAddProfileModalOpen(false)}
          onSuccess={() => {
            mutate();
            setIsAddProfileModalOpen(false);
          }}
        />
      </div>
    </Suspense>
  );
}
