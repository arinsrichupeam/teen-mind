"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
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

import { QuestionDrawer } from "./components/question-drawer";
import { QuestionColumnsName as columns, statusOptions } from "./data";
import { RenderCell } from "./components/render-cell";

import { capitalize } from "@/utils/helper";
import { QuestionsData, QuestionsList } from "@/types";

export default function QuestionPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<QuestionsData>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [questionsList, setQuestionsList] = useState<QuestionsList[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<any>({
    column: "id",
    direction: "ascending",
  });
  const [mode, setMode] = useState("Detail");

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = useMemo(() => {
    let filteredUsers = [...questionsList];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((val: QuestionsList) => {
        val.firstname.toLowerCase().includes(filterValue.toLowerCase());
      });
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
    return [...items].sort((a: QuestionsList, b: QuestionsList) => {
      const first = a[sortDescriptor.column as keyof QuestionsList] as number;
      const second = b[sortDescriptor.column as keyof QuestionsList] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const onRowsPerPageChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(parseInt(e.target.value));
      setPages(Math.ceil(sortedItems.length / parseInt(e.target.value)));
      setPage(1);
    },
    [pages, items]
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
            หน้า {page}/{pages} ({sortedItems.length} รายการ)
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

  const onRowDetailPress = useCallback((e: any) => {
    fetch("/api/question/" + e)
      .then((res) => res.json())
      .then((val) => {
        setSelectedKeys(val[0]);
        setMode("Detail");
        onOpen();
      });
  }, []);

  const onRowEditPress = useCallback((e: any) => {
    fetch("/api/question/" + e)
      .then((res) => res.json())
      .then((val) => {
        setSelectedKeys(val[0]);
        setMode("Edit");
        onOpen();
      });
  }, []);

  useEffect(() => {
    fetch("/api/question")
      .then((res) => res.json())
      .then((val) => {
        setQuestionsList(val.questionsList);
        setPages(Math.ceil(val.questionsList.length / rowsPerPage));
        setIsLoading(false);
      });
  }, [isLoading]);

  return (
    <div className="my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4">
      <div className="max-w-[95rem] mx-auto w-full">
        <QuestionDrawer
          data={selectedKeys}
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
                          questionsList.findIndex((x) => x.id == item.id) + 1,
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
  );
}
