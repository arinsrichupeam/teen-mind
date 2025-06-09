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
  addToast,
} from "@heroui/react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { questionStatusOptions as statusOptions } from "../data/optionData";
import { QuestionColumnsName as columns } from "../data/tableColumn";
import { QuestionEditDrawer } from "../components/question/question-edit-drawer";
import { RenderCell } from "../components/question/render-cell";

import { QuestionsData } from "@/types";
import Loading from "@/app/loading";

export default function MyCasePage() {
  const router = useRouter();
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<QuestionsData>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<any>({
    column: "id",
    direction: "ascending",
  });
  const [mode, setMode] = useState("View");
  const { data: session, status } = useSession();

  const hasSearchFilter = Boolean(filterValue);

  const { data, isLoading, error } = useSWR(
    "/api/question",
    async (url) => {
      try {
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error("Failed to fetch questions");
        }
        const data = await res.json();

        return data.questionsList;
      } catch (error) {
        throw error;
      }
    },
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const filteredItems = useMemo(() => {
    let filteredUsers = [
      ...(data?.filter((val: any) => val.consult === session?.user?.id) || []),
    ];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((val) => {
        return val.user.profile[0].firstname
          .toLowerCase()
          .includes(filterValue.toLowerCase());
      });
    }
    if (statusFilter !== "all") {
      filteredUsers = filteredUsers.filter((user) =>
        Array.from(statusFilter).includes(user.status.toString())
      );
    }

    return filteredUsers;
  }, [data, filterValue, statusFilter]);

  const pages = useMemo(() => {
    return filteredItems.length
      ? Math.ceil(filteredItems.length / rowsPerPage)
      : 0;
  }, [filteredItems.length, rowsPerPage]);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: QuestionsData, b: QuestionsData) => {
      const first = a[sortDescriptor.column as keyof QuestionsData] as number;
      const second = b[sortDescriptor.column as keyof QuestionsData] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const onRowsPerPageChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(parseInt(e.target.value));
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
      <div className="flex flex-col">
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
    data?.length,
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
            onChange={(page) => setPage(page)}
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
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  const onRowDetailPress = useCallback(
    (e: any) => {
      fetch("/api/question/" + e)
        .then((res) => res.json())
        .then((val: QuestionsData[]) => {
          setSelectedKeys(val[0]);
          setMode("View");
          onOpen();
        });
    },
    [selectedKeys, mode]
  );

  const onRowEditPress = useCallback(
    (e: any) => {
      fetch("/api/question/" + e)
        .then((res) => res.json())
        .then((val: QuestionsData[]) => {
          setSelectedKeys(val[0]);
          setMode("Edit");
          onOpen();
        });
    },
    [selectedKeys, mode]
  );

  useEffect(() => {
    if (status !== "loading") {
      if (status === "unauthenticated") {
        router.push("/admin/login");
      }
    }
  }, [session]);

  useEffect(() => {
    if (error) {
      // Handle error appropriately
      addToast({
        title: "Error loading questions:",
        description: error,
        color: "danger",
      });
    }
  }, [error]);

  return (
    <Suspense fallback={<Loading />}>
      <div className="my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4">
        <div className="flex justify-between items-end ">
          <h3 className="text-lg font-semibold">รายการที่ดูแล</h3>
        </div>
        <div className="max-w-[95rem] mx-auto w-full">
          <QuestionEditDrawer
            data={selectedKeys!}
            isOpen={isOpen}
            mode={mode}
            onClose={onClose}
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
              sortDescriptor={sortDescriptor}
              topContent={topContent}
              topContentPlacement="outside"
              onSortChange={setSortDescriptor}
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
                          columnKey: columnKey,
                          index:
                            filteredItems.findIndex((x) => x.id == item.id) + 1,
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
      </div>
    </Suspense>
  );
}
