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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  addToast,
  Chip,
} from "@heroui/react";
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { QuestionEditDrawer } from "../components/question/question-edit-drawer";
import { QuestionColumnsName } from "../data/tableColumn";
import { QuestionFilterContent } from "../components/question/question-filter-content";

import { prefix } from "@/utils/data";
import { QuestionsData, ProfileAdminData, TableSortDescriptor } from "@/types";
import Loading from "@/app/loading";
import { formatThaiDate, calculateAge } from "@/utils/helper";

interface Column {
  key: string;
  label: string;
  align?: "center" | "start" | "end";
}

type QuestionRow = QuestionsData & { rowIndex?: number };

const tableColumns: Column[] = QuestionColumnsName.map((col) => ({
  key: col.uid,
  label: col.name,
  align: (col.align || "start") as "center" | "start" | "end",
}));

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
  const [sortDescriptor, setSortDescriptor] = useState<TableSortDescriptor>({
    column: "screeningDate",
    direction: "descending",
  });
  const [mode, setMode] = useState("view-questionnaire");
  const { data: session, status } = useSession();
  const [error] = useState("");

  // เพิ่ม state สำหรับ filter ใหม่
  const [schoolFilter, setSchoolFilter] = useState<string>("");
  const [phqaFilter, setPhqaFilter] = useState<Selection>(new Set([]));
  const [q2Filter, setQ2Filter] = useState<Selection>(new Set([]));
  const [addonFilter, setAddonFilter] = useState<Selection>(new Set([]));

  // เพิ่ม state สำหรับ profile admin
  const [adminProfile, setAdminProfile] = useState<ProfileAdminData | null>(
    null
  );

  const prefixMap = useMemo(
    () => new Map(prefix.map((p) => [String(p.key), p.label])),
    []
  );

  // ดึงข้อมูล profile admin
  const { data: adminData } = useSWR(
    session?.user?.id ? `/api/profile/admin/${session.user.id}` : null,
    async (url) => {
      try {
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error("Failed to fetch admin profile");
        }

        return await res.json();
      } catch (error) {
        addToast({
          title: "ผิดพลาด",
          description:
            "ไม่สามารถดึงข้อมูลจากระบบ" +
            (error instanceof Error ? error.message : "ไม่ระบุข้อมูล"),
          color: "danger",
        });

        return null;
      }
    }
  );

  // อัปเดต adminProfile เมื่อได้ข้อมูล
  useEffect(() => {
    if (adminData) {
      setAdminProfile(adminData);
    }
  }, [adminData]);

  const referentCitizenId =
    adminProfile?.roleId === 2 ? (adminProfile?.citizenId ?? "") : "";

  const filterKey = useMemo(() => {
    const statusKey =
      statusFilter === "all"
        ? "all"
        : Array.from(statusFilter as Set<string>)
            .sort()
            .join(",");
    const phqaKey = Array.from(phqaFilter as Set<string>)
      .sort()
      .join(",");
    const q2Set = q2Filter as Set<string>;
    const q2Risk = q2Set.has("risk")
      ? "risk"
      : q2Set.has("no-risk")
        ? "no-risk"
        : "";
    const addonSet = addonFilter as Set<string>;
    const addonRisk = addonSet.has("risk")
      ? "risk"
      : addonSet.has("no-risk")
        ? "no-risk"
        : "";

    return {
      search: filterValue,
      status: statusKey,
      school: schoolFilter,
      phqa: phqaKey,
      q2Risk,
      addonRisk,
      referentCitizenId,
    };
  }, [
    filterValue,
    statusFilter,
    schoolFilter,
    phqaFilter,
    q2Filter,
    addonFilter,
    referentCitizenId,
  ]);

  const { data, mutate } = useSWR(
    ["/api/question", page, rowsPerPage, filterKey],
    async ([url, apiPage, apiLimit, key]) => {
      try {
        const params = new URLSearchParams({
          page: String(apiPage),
          limit: String(apiLimit),
        });

        if (key.search) params.set("search", key.search);
        if (key.status && key.status !== "all")
          params.set("status", key.status);
        if (key.school) params.set("school", key.school);
        if (key.phqa) params.set("result", key.phqa);
        if (key.q2Risk) params.set("q2Risk", key.q2Risk);
        if (key.addonRisk) params.set("addonRisk", key.addonRisk);
        if (key.referentCitizenId)
          params.set("referentCitizenId", key.referentCitizenId);

        const res = await fetch(`${url}?${params}`, {
          next: { revalidate: 60 },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch questions");
        }
        const json = await res.json();

        return {
          questionsList: json.questionsList ?? [],
          pagination: json.pagination ?? {
            page: apiPage,
            limit: apiLimit,
            total: 0,
            totalPages: 0,
          },
        };
      } catch (error) {
        addToast({
          title: "ผิดพลาด",
          description:
            "ไม่สามารถดึงข้อมูลจากระบบ" +
            (error instanceof Error ? error.message : "ไม่ระบุข้อมูล"),
          color: "danger",
        });

        return {
          questionsList: [],
          pagination: {
            page: 1,
            limit: Number(apiLimit),
            total: 0,
            totalPages: 0,
          },
        };
      }
    },
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  const questionsList = data?.questionsList ?? [];
  const serverPagination = data?.pagination;

  const pages = useMemo(() => {
    return serverPagination?.totalPages ?? 1;
  }, [serverPagination?.totalPages]);

  // API กรองแล้ว (search, status, school, result, q2, addon, referent) — ใช้แสดงในตารางตรงๆ
  const items = useMemo(() => questionsList, [questionsList]);

  const setStatusFilterAndResetPage = useCallback((s: Selection) => {
    setStatusFilter(s);
    setPage(1);
  }, []);
  const setSchoolFilterAndResetPage = useCallback((s: string) => {
    setSchoolFilter(s);
    setPage(1);
  }, []);
  const setPhqaFilterAndResetPage = useCallback((s: Selection) => {
    setPhqaFilter(s);
    setPage(1);
  }, []);
  const setQ2FilterAndResetPage = useCallback((s: Selection) => {
    setQ2Filter(s);
    setPage(1);
  }, []);
  const setAddonFilterAndResetPage = useCallback((s: Selection) => {
    setAddonFilter(s);
    setPage(1);
  }, []);

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
      setRowsPerPage(Number(e.target.value));
      setPage(1);
    },
    []
  );

  const onSearchChange = useCallback((value?: string) => {
    setFilterValue(value ?? "");
    setPage(1);
  }, []);

  const setSelectedQuestion = useCallback(
    (val: QuestionsData | QuestionsData[]) => {
      setSelectedKeys(Array.isArray(val) ? val[0] : val);
    },
    []
  );

  const onRowDetailPress = useCallback(
    (e: string) => {
      fetch("/api/question/" + e)
        .then((res) => res.json())
        .then((val: QuestionsData | QuestionsData[]) => {
          setSelectedQuestion(val);
          setMode("view-questionnaire");
          onOpen();
        });
    },
    [onOpen, setSelectedQuestion]
  );

  const onRowConsultationPress = useCallback(
    (e: string) => {
      fetch("/api/question/" + e)
        .then((res) => res.json())
        .then((val: QuestionsData | QuestionsData[]) => {
          setSelectedQuestion(val);
          setMode("view-consultation");
          onOpen();
        });
    },
    [onOpen, setSelectedQuestion]
  );

  const onRowEditQuestionnairePress = useCallback(
    (e: string) => {
      fetch("/api/question/" + e)
        .then((res) => res.json())
        .then((val: QuestionsData | QuestionsData[]) => {
          setSelectedQuestion(val);
          setMode("edit-questionnaire");
          onOpen();
        });
    },
    [onOpen, setSelectedQuestion]
  );

  const onRowEditConsultationPress = useCallback(
    (e: string) => {
      fetch("/api/question/" + e)
        .then((res) => res.json())
        .then((val: QuestionsData | QuestionsData[]) => {
          setSelectedQuestion(val);
          setMode("edit-consultation");
          onOpen();
        });
    },
    [onOpen, setSelectedQuestion]
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
    (item: QuestionRow, columnKey: string) => {
      const cellValue = item[columnKey as keyof QuestionRow];

      switch (columnKey) {
        case "name":
          const prefixLabel =
            prefixMap.get(item.profile?.prefixId?.toString() ?? "") || "";

          return (
            <div className="flex items-center gap-2">
              {item.profile.userId ? (
                <DevicePhoneMobileIcon className="size-5 text-success-500" />
              ) : (
                <DocumentTextIcon className="size-5 text-primary-500" />
              )}
              <p className="text-bold text-small">
                {prefixLabel} {item.profile?.firstname || ""}{" "}
                {item.profile?.lastname || ""}
              </p>
            </div>
          );
        case "age": {
          const school = item.profile?.school;
          const screeningDate =
            typeof school === "object" && school !== null
              ? school.screeningDate
              : undefined;

          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">
                {item.profile?.birthday
                  ? calculateAge(item.profile.birthday, screeningDate)
                  : "-"}{" "}
                ปี
              </p>
            </div>
          );
        }
        case "school": {
          const school = item.profile?.school;
          const schoolName =
            typeof school === "object" && school !== null
              ? school.name
              : typeof school === "string"
                ? school
                : "-";

          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">{schoolName}</p>
            </div>
          );
        }
        case "result":
          let resultText = item.result_text;

          return (
            <Chip
              className="capitalize"
              color={
                item.result === "Green"
                  ? "success"
                  : item.result === "Green-Low"
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
          if (Array.isArray(item.phqa) && item.phqa.length > 0) {
            return item.phqa[0].sum;
          }

          return "-";
        case "2q":
          if (Array.isArray(item.q2) && item.q2.length > 0) {
            const q2Data = item.q2[0];
            const hasRisk = q2Data.q1 === 1 || q2Data.q2 === 1;

            return (
              <Chip
                className="capitalize"
                color={hasRisk ? "danger" : "success"}
                size="sm"
                variant="flat"
              >
                {hasRisk ? "พบความเสี่ยง" : "ไม่พบความเสี่ยง"}
              </Chip>
            );
          }

          return "-";

        case "addon":
          if (Array.isArray(item.addon) && item.addon.length > 0) {
            const addonData = item.addon[0];
            const hasRisk = addonData.q1 === 1 || addonData.q2 === 1;

            return (
              <Chip
                className="capitalize"
                color={hasRisk ? "danger" : "success"}
                size="sm"
                variant="flat"
              >
                {hasRisk ? "พบความเสี่ยง" : "ไม่พบความเสี่ยง"}
              </Chip>
            );
          }

          return "-";
        case "screeningDate": {
          const school = item.profile?.school;
          const screeningDate =
            typeof school === "object" && school !== null
              ? school.screeningDate
              : undefined;

          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">
                {screeningDate
                  ? formatThaiDate(
                      typeof screeningDate === "string"
                        ? screeningDate
                        : screeningDate instanceof Date
                          ? screeningDate.toISOString()
                          : ""
                    )
                  : "-"}
              </p>
            </div>
          );
        }
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
                ? "รอระบุ HN"
                : item.status === 1
                  ? "รอจัดนัด Telemed"
                  : item.status === 2
                    ? "รอสรุปผลการให้คำปรึกษา"
                    : "เสร็จสิ้น"}
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
                        รายละเอียดแบบประเมิน
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
                        แก้ไขแบบประเมิน
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
      prefixMap,
      onRowDetailPress,
      onRowConsultationPress,
      onRowEditQuestionnairePress,
      onRowEditConsultationPress,
    ]
  );

  const topContent = useMemo(
    () => (
      <QuestionFilterContent
        addonFilter={addonFilter}
        data={questionsList}
        filterValue={filterValue}
        filteredData={questionsList}
        phqaFilter={phqaFilter}
        q2Filter={q2Filter}
        schoolFilter={schoolFilter}
        setAddonFilter={setAddonFilterAndResetPage}
        setPhqaFilter={setPhqaFilterAndResetPage}
        setQ2Filter={setQ2FilterAndResetPage}
        setSchoolFilter={setSchoolFilterAndResetPage}
        setStatusFilter={setStatusFilterAndResetPage}
        statusFilter={statusFilter}
        onDataUpdate={mutate}
        onSearchChange={onSearchChange}
      />
    ),
    [
      filterValue,
      onSearchChange,
      statusFilter,
      setStatusFilterAndResetPage,
      schoolFilter,
      setSchoolFilterAndResetPage,
      phqaFilter,
      setPhqaFilterAndResetPage,
      q2Filter,
      setQ2FilterAndResetPage,
      addonFilter,
      setAddonFilterAndResetPage,
      questionsList,
      mutate,
    ]
  );

  const bottomContent = useMemo(() => {
    const total = serverPagination?.total ?? 0;

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
            onChange={(p) => setPage(p)}
          />
        </div>
        <div className="mt-4 md:mt-[-30px] px-2 flex justify-between items-center">
          <div className="w-[30%] text-small text-default-400">
            หน้า {page}/{pages || 1} (ทั้งหมด {total} รายการ)
          </div>
          <div className="flex justify-between items-center">
            <span className="text-default-400 text-small" />
            <label className="flex items-center text-default-400 text-small">
              แสดงต่อหน้า:
              <select
                className="bg-transparent outline-none text-default-400 text-small"
                value={rowsPerPage}
                onChange={onRowsPerPageChange}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    );
  }, [page, pages, serverPagination?.total, rowsPerPage, onRowsPerPageChange]);

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
              isStriped
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
                {(item: QuestionRow) => (
                  <TableRow key={item.id}>
                    {(columnKey) => (
                      <TableCell className="text-nowrap">
                        {renderCell(item, String(columnKey))}
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
