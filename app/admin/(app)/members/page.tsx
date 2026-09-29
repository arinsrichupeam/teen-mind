"use client";

import {
  ChangeEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
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
  useDisclosure,
  Selection,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Affiliation, ProfileAdmin } from "@prisma/client";

import { ModalUserProfile } from "../components/modal/modal-user-profile";
import { userStatusOptions, staffAssignableRoles } from "../data/optionData";
import { MemberColumnsName as columns } from "../data/tableColumn";
import { AuthGuard } from "../components/auth-guard";

import { RenderCell } from "./components/render-cell";

import { SortDescriptor } from "@/types";
import { ProfileAdminData } from "@/types";
import Loading from "@/app/loading";

type MemberListRow = ProfileAdmin & {
  role?: { id: number; name: string };
  agency?: string | null;
  healthcareFacility?: { id: string; name: string } | null;
  user?: { image: string };
  effectiveScopeLevel?: string | null;
  facilitatedZoneId?: number | null;
  facilitatedZoneName?: string | null;
};

const ProfileAdminDataInitData: ProfileAdminData = {
  id: "",
  userId: "",
  providerAccountId: "",
  image: "",
  name: "",
  citizenId: "",
  prefixId: 0,
  firstName: "",
  lastName: "",
  phone: "",
  affiliationId: 0,
  healthcareFacilityId: "",
  scopeLevel: "FACILITY",
  zoneId: null,
  employeeTypeId: 0,
  profession: "",
  license: "",
  status: 0,
  receiveAlert: false,
  createdAt: "",
  updatedAt: "",
  roleId: 0,
};

export default function MemberPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [filterValue, setFilterValue] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileAdminData>(
    ProfileAdminDataInitData
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [roleFilter, setRoleFilter] = useState<Selection>("all");
  const [facilityFilter, setFacilityFilter] = useState<Selection>("all");
  const [profileAdminList, setProfileAdminList] = useState<MemberListRow[]>([]);
  const [affiliationList, setAffiliationList] = useState<Affiliation[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<
    { id: string; name: string }[]
  >([]);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });
  const [mode, setMode] = useState("View");
  const { data: session, status } = useSession();
  const router = useRouter();

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = useMemo(() => {
    let filteredUsers = [...profileAdminList];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter(
        (val) =>
          val.firstName.toLowerCase().includes(filterValue.toLowerCase()) ||
          val.lastName.toLowerCase().includes(filterValue.toLowerCase()) ||
          `${val.firstName} ${val.lastName}`
            .toLowerCase()
            .includes(filterValue.toLowerCase())
      );
    }
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== userStatusOptions.length
    ) {
      filteredUsers = filteredUsers.filter((user) =>
        Array.from(statusFilter).includes(user.status.toString())
      );
    }
    if (
      roleFilter !== "all" &&
      Array.from(roleFilter).length !== staffAssignableRoles.length
    ) {
      filteredUsers = filteredUsers.filter((user) =>
        Array.from(roleFilter).includes(String(user.roleId))
      );
    }
    if (facilityFilter !== "all" && Array.from(facilityFilter).length > 0) {
      const selected = Array.from(facilityFilter).map(String);

      if (selected.length !== facilityOptions.length) {
        filteredUsers = filteredUsers.filter((user) =>
          selected.includes(user.healthcareFacilityId ?? "")
        );
      }
    }

    return filteredUsers;
  }, [
    profileAdminList,
    filterValue,
    statusFilter,
    roleFilter,
    facilityFilter,
    facilityOptions.length,
    hasSearchFilter,
  ]);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: MemberListRow, b: MemberListRow) => {
      const first = a[sortDescriptor.column as keyof MemberListRow] as number;
      const second = b[sortDescriptor.column as keyof MemberListRow] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const onRowsPerPageChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(parseInt(e.target.value));
      setPages(Math.ceil(filteredItems.length / parseInt(e.target.value)));
      setPage(1);
    },
    [filteredItems.length]
  );

  const onSearchChange = useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <Input
            isClearable
            classNames={{
              base: "w-full sm:max-w-xs",
              inputWrapper: "border-1 bg-white",
            }}
            placeholder="Search by name..."
            size="md"
            startContent={
              <MagnifyingGlassIcon className="size-6 text-default-400" />
            }
            value={filterValue}
            variant="bordered"
            onClear={() => setFilterValue("")}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-2 flex-wrap">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  color="primary"
                  endContent={<ChevronDownIcon className="size-6" />}
                  size="sm"
                  variant="solid"
                >
                  สิทธิ์
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Role filter"
                closeOnSelect={false}
                selectedKeys={roleFilter}
                selectionMode="multiple"
                onSelectionChange={setRoleFilter}
              >
                {staffAssignableRoles.map((role) => (
                  <DropdownItem key={String(role.id)} className="capitalize">
                    {role.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  color="primary"
                  endContent={<ChevronDownIcon className="size-6" />}
                  size="sm"
                  variant="solid"
                >
                  หน่วยงาน
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Facility filter"
                closeOnSelect={false}
                selectedKeys={facilityFilter}
                selectionMode="multiple"
                onSelectionChange={setFacilityFilter}
              >
                {facilityOptions.map((facility) => (
                  <DropdownItem key={facility.id} className="capitalize">
                    {facility.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  color="primary"
                  endContent={<ChevronDownIcon className="size-6" />}
                  size="sm"
                  variant="solid"
                >
                  สถานะ
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Status filter"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
                {userStatusOptions.map((statusOption) => (
                  <DropdownItem key={statusOption.uid} className="capitalize">
                    {statusOption.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    roleFilter,
    facilityFilter,
    facilityOptions,
    onSearchChange,
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
            หน้า {page}/{pages} ({filteredItems.length} รายการ)
          </div>
          <div className="flex justify-between items-center">
            <span className="text-default-400 text-small" />
            <label className="flex items-center text-default-400 text-small">
              Rows per page:
              <select
                className="bg-transparent outline-none text-default-400 text-small"
                defaultValue={rowsPerPage}
                onChange={onRowsPerPageChange}
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
  }, [selectedProfile, items.length, page, pages, hasSearchFilter]);

  const onRowDetailPress = useCallback(
    async (userId: string) => {
      await fetch("/api/profile/admin/" + userId)
        .then((res) => res.json())
        .then((val) => {
          setSelectedProfile(val);
          setMode("View");
          onOpen();
        });
    },
    [selectedProfile]
  );

  const onRowEditPress = useCallback(
    (userId: string) => {
      fetch("/api/profile/admin/" + userId)
        .then((res) => res.json())
        .then((val) => {
          setSelectedProfile(val);
          setMode("edit");
          onOpen();
        });
    },
    [selectedProfile]
  );

  const GetProfileAdminList = useCallback(async () => {
    await fetch("/api/profile/admin")
      .then((res) => res.json())
      .then((val) => {
        setProfileAdminList(val);
        setPages(Math.ceil(val.length / rowsPerPage));
        const facilities = new Map<string, string>();

        for (const row of val as MemberListRow[]) {
          if (row.healthcareFacilityId) {
            facilities.set(
              row.healthcareFacilityId,
              row.healthcareFacility?.name ??
                row.agency ??
                row.healthcareFacilityId
            );
          }
        }
        setFacilityOptions(
          Array.from(facilities.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name, "th"))
        );
        setIsLoading(false);
      });
  }, [rowsPerPage]);

  const GetAffiliationList = useCallback(async () => {
    await fetch("/api/data/affiliation")
      .then((res) => res.json())
      .then((val) => {
        setAffiliationList(val);
      });
  }, []);

  useEffect(() => {
    if (status !== "loading") {
      if (status === "unauthenticated") {
        router.push("/admin/login");
      } else {
        GetProfileAdminList();
        GetAffiliationList();
      }
    }
  }, [session, isLoading]);

  return (
    <AuthGuard allowedRoles={[4]} redirectTo="/admin">
      <Suspense fallback={<Loading />}>
        <div className="max-w-[95rem] my-10 px-4 lg:px-6 mx-auto w-full flex flex-col gap-4">
          <div className="flex justify-between items-end ">
            <h3 className="text-lg font-semibold">จัดการผู้ใช้งาน</h3>
          </div>
          <ModalUserProfile
            Mode={mode}
            Profile={selectedProfile}
            isOpen={isOpen}
            onClose={onClose}
            onReLoad={GetProfileAdminList}
          />

          <div className="w-full flex flex-col gap-4 text-nowrap">
            <Table
              isHeaderSticky
              aria-label="Question List Table"
              bottomContent={bottomContent}
              bottomContentPlacement="outside"
              classNames={{
                wrapper: "max-h-[calc(65vh)]",
              }}
              // sortDescriptor={sortDescriptor}
              topContent={topContent}
              topContentPlacement="outside"
              // onSortChange={setSortDescriptor}
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
                emptyContent={"No users found"}
                isLoading={isLoading}
                items={sortedItems}
                loadingContent={<Spinner label="Loading..." />}
              >
                {(item) => (
                  <TableRow>
                    {(columnKey) => (
                      <TableCell className="text-nowrap">
                        {RenderCell({
                          data: {
                            ...item,
                            agency: item.agency ?? undefined,
                          },
                          affiliationList: affiliationList,
                          columnKey: columnKey,
                          index:
                            profileAdminList.findIndex((x) => x.id == item.id) +
                            1,
                          viewDetail: onRowDetailPress,
                          editDetail: onRowEditPress,
                        })}
                      </TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Suspense>
    </AuthGuard>
  );
}
