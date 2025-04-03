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
import { Affiliation, Profile_Admin } from "@prisma/client";

import { ModalUserProfile } from "../components/modal/modal-user-profile";

import { QuestionColumnsName as columns, statusOptions } from "./data";
import { RenderCell } from "./components/render-cell";

import { ProfileAdminData } from "@/types";
import Loading from "@/app/loading";

const ProfileAdminDataInitData: ProfileAdminData = {
  id: "",
  userId: "",
  providerAccountId: "",
  image: "",
  name: "",
  citizenId: "",
  prefixId: 0,
  firstname: "",
  lastname: "",
  tel: "",
  affiliationId: 0,
  agency: "",
  employeeTypeId: 0,
  professional: "",
  license: "",
  status: 0,
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
  const [profileAdminList, setProfileAdminList] = useState<Profile_Admin[]>([]);
  const [affiliationList, setAffiliationList] = useState<Affiliation[]>([]);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<any>({
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
      filteredUsers = filteredUsers.filter((val) =>
        val.firstname.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredUsers = filteredUsers.filter((user) =>
        Array.from(statusFilter).includes(user.status.toString())
      );
    }

    return filteredUsers;
  }, [profileAdminList, filterValue, statusFilter]);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: Profile_Admin, b: Profile_Admin) => {
      const first = a[sortDescriptor.column as keyof Profile_Admin] as number;
      const second = b[sortDescriptor.column as keyof Profile_Admin] as number;
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
    [pages, items]
  );

  const onSearchChange = useCallback(
    (value?: string) => {
      if (value) {
        setFilterValue(value);
        setPage(1);
      } else {
        setFilterValue("");
      }
    },
    [filterValue]
  );

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center gap-3">
          <Input
            isClearable
            classNames={{
              base: "w-full",
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
              aria-label="Table Columns"
              closeOnSelect={false}
              selectedKeys={statusFilter}
              selectionMode="multiple"
              onSelectionChange={setStatusFilter}
            >
              {statusOptions.map((status) => (
                <DropdownItem key={status.uid} className="capitalize">
                  {status.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    onSearchChange,
    onRowsPerPageChange,
    profileAdminList.length,
    hasSearchFilter,
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
    async (e: any) => {
      await fetch("/api/profile/admin/" + e)
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
    (e: any) => {
      fetch("/api/profile/admin/" + e)
        .then((res) => res.json())
        .then((val) => {
          setSelectedProfile(val);
          setMode("Edit");
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
        setIsLoading(false);
      });
  }, [profileAdminList]);

  const GetAffiliationList = useCallback(async () => {
    await fetch("/api/data/affiliation")
      .then((res) => res.json())
      .then((val) => {
        setAffiliationList(val);
      });
  }, [affiliationList]);

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
                        data: item,
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
  );
}
