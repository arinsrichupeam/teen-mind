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
  Chip,
} from "@heroui/react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { questionStatusOptions as options } from "../data/optionData";
import { QuestionEditDrawer } from "../components/question/question-edit-drawer";
import { QuestionColumnsName } from "../data/tableColumn";

import { prefix } from "@/utils/data";
import { QuestionsData } from "@/types";
import Loading from "@/app/loading";

interface Column {
  key: string;
  label: string;
  align?: "center" | "start" | "end";
}

const tableColumns: Column[] = QuestionColumnsName.map((col) => ({
  key: col.uid,
  label: col.name,
  align: (col.align || "start") as "center" | "start" | "end",
}));

const calculateAge = (birthday: string) => {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

export default function QuestionPage() {
  const router = useRouter();
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<QuestionsData>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [statusFilter, setStatusFilter] = useState<Selection>(
    new Set(["0", "1"])
  );
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<any>({
    column: "createdAt",
    direction: "descending",
  });
  const [mode, setMode] = useState("view-questionnaire");
  const { data: session, status } = useSession();
  const [error] = useState("");

  const hasSearchFilter = Boolean(filterValue);

  const { data, mutate } = useSWR(
    "/api/question",
    async (url) => {
      try {
        const res = await fetch(url, {
          next: { revalidate: 60 },
        });

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
      dedupingInterval: 5000,
    }
  );

  const filteredItems = useMemo(() => {
    if (!data) return [];

    return data.filter((val: QuestionsData) => {
      const matchesSearch =
        !hasSearchFilter ||
        val.profile.firstname.toLowerCase().includes(filterValue.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        Array.from(statusFilter).includes(val.status.toString());

      return matchesSearch && matchesStatus;
    });
  }, [data, filterValue, statusFilter, hasSearchFilter]);

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
    if (!items.length) return [];

    const { column, direction } = sortDescriptor;

    return [...items].sort((a: QuestionsData, b: QuestionsData) => {
      const first = a[column as keyof QuestionsData];
      const second = b[column as keyof QuestionsData];

      if (typeof first === "string" && typeof second === "string") {
        return direction === "descending"
          ? second.localeCompare(first)
          : first.localeCompare(second);
      }

      const cmp =
        (first as number) < (second as number)
          ? -1
          : (first as number) > (second as number)
            ? 1
            : 0;

      return direction === "descending" ? -cmp : cmp;
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

  const topContent = useMemo(
    () => (
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
              {options.map((status) => (
                <DropdownItem key={status.uid} className="capitalize">
                  {status.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    ),
    [filterValue, statusFilter, onSearchChange]
  );

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
              แสดงต่อหน้า:
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
          setMode("view-questionnaire");
          onOpen();
        });
    },
    [selectedKeys]
  );

  const onRowConsultationPress = useCallback(
    (e: any) => {
      fetch("/api/question/" + e)
        .then((res) => res.json())
        .then((val: QuestionsData[]) => {
          setSelectedKeys(val[0]);
          setMode("view-consultation");
          onOpen();
        });
    },
    [selectedKeys]
  );

  const onRowEditQuestionnairePress = useCallback(
    (e: any) => {
      fetch("/api/question/" + e)
        .then((res) => res.json())
        .then((val: QuestionsData[]) => {
          setSelectedKeys(val[0]);
          setMode("edit-questionnaire");
          onOpen();
        });
    },
    [selectedKeys]
  );

  const onRowEditConsultationPress = useCallback(
    (e: any) => {
      fetch("/api/question/" + e)
        .then((res) => res.json())
        .then((val: QuestionsData[]) => {
          setSelectedKeys(val[0]);
          setMode("edit-consultation");
          onOpen();
        });
    },
    [selectedKeys]
  );

  const onDrawerClose = useCallback(() => {
    onClose();
    mutate();
  }, [onClose, mutate]);

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

  const renderCell = useCallback(
    (item: any, columnKey: any) => {
      const cellValue = item[columnKey];

      switch (columnKey) {
        case "id":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">
                {filteredItems.findIndex(
                  (x: QuestionsData) => x.id === item.id
                ) + 1}
              </p>
            </div>
          );
        case "name":
          const prefixLabel =
            prefix.find((p) => p.key === item.profile?.prefixId?.toString())
              ?.label || "";

          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">
                {prefixLabel} {item.profile?.firstname || ""}{" "}
                {item.profile?.lastname || ""}
              </p>
            </div>
          );
        case "age":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">
                {item.profile.birthday
                  ? calculateAge(item.profile.birthday)
                  : "-"}{" "}
                ปี
              </p>
            </div>
          );
        case "school":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">{item.profile.school.name}</p>
            </div>
          );
        case "result":
          let resultText = item.result_text;

          return (
            <Chip
              className="capitalize"
              color={
                item.result === "Green"
                  ? "success"
                  : item.result === "Yellow"
                    ? "warning"
                    : item.result === "Orange"
                      ? "warning"
                      : "danger"
              }
              size="sm"
              variant="flat"
            >
              {resultText}
            </Chip>
          );
        case "phqa":
          if (Array.isArray(cellValue) && cellValue.length > 0) {
            return cellValue[0].sum;
          }

          return "-";
        case "date":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">
                {new Date(item.createdAt).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                น.
              </p>
            </div>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={
                item.status === 0
                  ? "default"
                  : item.status === 1
                    ? "primary"
                    : item.status === 2
                      ? "warning"
                      : "success"
              }
              size="sm"
              variant="flat"
            >
              {item.status === 0
                ? "รอเปิด HN"
                : item.status === 1
                  ? "รอนัดวัน Tele"
                  : item.status === 2
                    ? "รอผล Tele"
                    : "ดำเนินการเสร็จสิ้น"}
            </Chip>
          );
        case "actions":
          return (
            <div className="relative flex items-center gap-2">
              <div className="flex justify-center gap-2">
                <div>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        name="Detail"
                        size="sm"
                        variant="light"
                      >
                        <EyeIcon className="size-6 text-primary-400" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Detail options">
                      <DropdownItem
                        key="view-questionnaire"
                        onPress={() => onRowDetailPress(item.id)}
                      >
                        รายละเอียดแบบสอบถาม
                      </DropdownItem>
                      <DropdownItem
                        key="view-consultation"
                        onPress={() => onRowConsultationPress(item.id)}
                      >
                        รายละเอียดการให้คำปรึกษา
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                <div>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly name="Edit" size="sm" variant="light">
                        <PencilIcon className="size-6 text-warning-400" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Edit options">
                      <DropdownItem
                        key="edit-questionnaire"
                        onPress={() => onRowEditQuestionnairePress(item.id)}
                      >
                        แก้ไขแบบสอบถาม
                      </DropdownItem>
                      <DropdownItem
                        key="edit-consultation"
                        onPress={() => onRowEditConsultationPress(item.id)}
                      >
                        แก้ไขการให้คำปรึกษา
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                <div>
                  <Button isIconOnly size="sm" variant="light">
                    <TrashIcon className="size-6 text-danger-500" />
                  </Button>
                </div>
              </div>
            </div>
          );
        default:
          if (typeof cellValue === "object" && cellValue !== null) {
            return JSON.stringify(cellValue);
          }

          return cellValue;
      }
    },
    [
      onRowDetailPress,
      onRowConsultationPress,
      onRowEditQuestionnairePress,
      onRowEditConsultationPress,
      filteredItems,
    ]
  );

  return (
    <Suspense fallback={<Loading />}>
      <div className="my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4">
        <div className="flex justify-between items-end ">
          <h3 className="text-lg font-semibold">จัดการแบบสอบถาม</h3>
        </div>
        <div className="max-w-[95rem] mx-auto w-full">
          <QuestionEditDrawer
            data={selectedKeys!}
            isOpen={isOpen}
            mode={mode}
            onClose={onDrawerClose}
          />
          <div className="w-full flex flex-col gap-4 text-nowrap">
            <Table
              aria-label="Question List Table"
              bottomContent={bottomContent}
              bottomContentPlacement="outside"
              sortDescriptor={sortDescriptor}
              topContent={topContent}
              topContentPlacement="outside"
              onSortChange={setSortDescriptor}
            >
              <TableHeader columns={tableColumns}>
                {(column) => (
                  <TableColumn
                    key={column.key}
                    align={column.align}
                    allowsSorting={true}
                  >
                    {column.label}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody
                emptyContent={"ไม่พบข้อมูล"}
                items={sortedItems}
                loadingContent={<Spinner label="Loading..." />}
              >
                {(item: QuestionsData) => (
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
        </div>
      </div>
    </Suspense>
  );
}
