"use client";

import { Spinner } from "@heroui/react";
import {
  SortDescriptor,
  Table,
  TableBody,
  TableColumn,
  TableHeader,
  Selection,
  TableRow,
  TableCell,
} from "@heroui/table";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@heroui/input";
import { Pagination } from "@heroui/pagination";
import { useDisclosure } from "@heroui/modal";

import { RenderCell } from "../components/render-cell";

import { QuestionDrawer } from "./components/question-drawer";

import { QuestionsData, User } from "@/types";

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

export const columns = [
  { name: "ลำดับที่", uid: "id", sortable: true },
  { name: "ชื่อ - สกุล", uid: "name", sortable: true },
  { name: "อายุ", uid: "age" },
  { name: "โรงเรียน", uid: "school" },
  { name: "ผลการประเมิน", uid: "result", sortable: true },
  { name: "วันที่ประเมิน", uid: "date" },
  { name: "สถานะ", uid: "status", sortable: true },
  { name: "", uid: "actions" },
];

export const statusOptions = [
  { name: "Active", uid: "0" },
  { name: "Paused", uid: "1" },
  { name: "Vacation", uid: "2" },
];

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<User>();
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [questionsList, setQuestionsList] = useState<QuestionsData[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "age",
    direction: "ascending",
  });

  const pages = Math.ceil(questionsList.length / rowsPerPage);

  type Questions = (typeof questionsList)[0];

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = useMemo(() => {
    let filteredUsers = [...questionsList];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.User.profile[0].firstname
          .toLowerCase()
          .includes(filterValue.toLowerCase())
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
  }, [questionsList, filterValue, statusFilter]);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: Questions, b: Questions) => {
      const first = a[sortDescriptor.column as keyof Questions] as number;
      const second = b[sortDescriptor.column as keyof Questions] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const onNextPage = useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onRowsPerPageChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(Number(e.target.value));
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

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            classNames={{
              base: "w-full sm:max-w-[44%]",
              inputWrapper: "border-1",
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
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  size="sm"
                  variant="flat"
                >
                  Status
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
                    {capitalize(status.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
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
    );
  }, [
    filterValue,
    statusFilter,
    onSearchChange,
    onRowsPerPageChange,
    questionsList.length,
    hasSearchFilter,
  ]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          หน้า {page}/{pages} ({questionsList.length} รายการ)
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onPreviousPage}
          >
            Previous
          </Button>
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  const onRowPress = useCallback((e: any) => {
    fetch("/api/question/" + e)
      .then((res) => res.json())
      .then((val) => {
        setSelectedKeys(val[0].User);
        onOpen();
      });
  }, []);

  useEffect(() => {
    fetch("/api/question")
      .then((res) => res.json())
      .then((val) => {
        setQuestionsList(val.questions_data);
        setIsLoading(false);
      });
  }, []);

  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <div className="my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4">
      <div className="max-w-[95rem] mx-auto w-full">
        <QuestionDrawer data={selectedKeys} isOpen={isOpen} onClose={onClose} />
        <div className=" w-full flex flex-col gap-4 text-nowrap">
          <Table
            isHeaderSticky
            bottomContent={bottomContent}
            bottomContentPlacement="outside"
            classNames={{
              wrapper: "max-h-[calc(65vh)]",
            }}
            // sortDescriptor={sortDescriptor}
            topContent={topContent}
            topContentPlacement="outside"
            onSortChange={setSortDescriptor}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.uid}
                  align={column.uid === "actions" ? "center" : "start"}
                  allowsSorting={column.sortable}
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
                          questionsList.findIndex((x) => x.id == item.id) + 1,
                        selectKey: onRowPress,
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
  );
}
