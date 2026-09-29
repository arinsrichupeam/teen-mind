"use client";

import {
  ChangeEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  Tabs,
  Tab,
  useDisclosure,
  Selection,
  addToast,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { EyeIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { QuestionEditDrawer } from "../components/question/question-edit-drawer";
import { QuestionTableStatusCell } from "../components/question/question-table-status-cell";
import { QuestionColumnsName } from "../data/tableColumn";
import { QuestionFilterContent } from "../components/question/question-filter-content";

import { prefix } from "@/utils/data";
import { QuestionsData, ProfileAdminData, TableSortDescriptor } from "@/types";
import Loading from "@/app/loading";
import { formatThaiDateTime, calculateAge } from "@/utils/helper";
import { getAssessmentResultLabel } from "@/lib/assessment-result-colors";
import { canClaimCase } from "@/lib/admin-roles";
import { readStoredAdminProfile } from "@/lib/admin-profile-client";

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
  const [statusFilter, setStatusFilter] = useState<Selection>(new Set([]));
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<TableSortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });
  const [mode, setMode] = useState("view-consultation");
  const { data: session, status } = useSession();
  const [error] = useState("");

  // เพิ่ม state สำหรับ filter ใหม่
  const [schoolFilter, setSchoolFilter] = useState<string>("");
  const [hiddenSchools, setHiddenSchools] = useState<Set<string>>(new Set());
  const [nineqResultFilter, setNineqResultFilter] = useState<Selection>(
    new Set([])
  );
  const [phqaResultFilter, setPhqaResultFilter] = useState<Selection>(
    new Set([])
  );
  const [q2Filter, setQ2Filter] = useState<Selection>(new Set([]));
  const [addonFilter, setAddonFilter] = useState<Selection>(new Set([]));
  const [q8Filter, setQ8Filter] = useState<Selection>(new Set([]));
  const [mainScaleFilter, setMainScaleFilter] = useState<string>("all");
  const [referentTypeFilter, setReferentTypeFilter] = useState<string>("all");
  const [listMode, setListMode] = useState<"all" | "transferInbox">("all");

  // เพิ่ม state สำหรับ profile admin — hydrate จาก sessionStorage ก่อน SWR
  const [adminProfile, setAdminProfile] = useState<ProfileAdminData | null>(
    () => readStoredAdminProfile()
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
      sessionStorage.setItem("adminProfile", JSON.stringify(adminData));
    }
  }, [adminData]);

  const referentCitizenId =
    adminProfile?.roleId === 2 ? (adminProfile?.citizenId ?? "") : "";
  const canClaimCases = canClaimCase(
    adminProfile?.roleId,
    adminProfile?.roleCode
  );

  const filterKey = useMemo(() => {
    const statusKey =
      statusFilter === "all"
        ? "all"
        : Array.from(statusFilter as Set<string>)
            .filter((s) => s !== "TRANSFER_PENDING")
            .sort()
            .join(",");
    const resultNineq = Array.from(nineqResultFilter as Set<string>)
      .sort()
      .join(",");
    const resultPhqa = Array.from(phqaResultFilter as Set<string>)
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
    const q8Set = q8Filter as Set<string>;
    const q8Risk = q8Set.has("risk")
      ? "risk"
      : q8Set.has("no-risk")
        ? "no-risk"
        : "";
    const mainScale =
      mainScaleFilter === "nineq" || mainScaleFilter === "phqa"
        ? mainScaleFilter
        : "";
    const referentType =
      referentTypeFilter === "outreach" || referentTypeFilter === "self"
        ? referentTypeFilter
        : "";

    const excludeSchools =
      hiddenSchools.size > 0 ? Array.from(hiddenSchools).join(",") : "";

    return {
      search: filterValue,
      status: statusKey,
      school: schoolFilter,
      resultNineq,
      resultPhqa,
      q2Risk,
      addonRisk,
      q8Risk,
      mainScale,
      referentType,
      referentCitizenId,
      excludeSchools,
      transferInbox: listMode === "transferInbox" ? "1" : "",
    };
  }, [
    filterValue,
    statusFilter,
    schoolFilter,
    nineqResultFilter,
    phqaResultFilter,
    q2Filter,
    addonFilter,
    q8Filter,
    mainScaleFilter,
    referentTypeFilter,
    referentCitizenId,
    hiddenSchools,
    listMode,
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
        if (!key.transferInbox && key.status && key.status !== "all")
          params.set("status", key.status);
        if (key.school) params.set("school", key.school);
        if (key.resultNineq) params.set("resultNineq", key.resultNineq);
        if (key.resultPhqa) params.set("resultPhqa", key.resultPhqa);
        if (key.q2Risk) params.set("q2Risk", key.q2Risk);
        if (key.addonRisk) params.set("addonRisk", key.addonRisk);
        if (key.q8Risk) params.set("q8Risk", key.q8Risk);
        if (key.mainScale) params.set("mainScale", key.mainScale);
        if (key.referentType) params.set("referentType", key.referentType);
        if (key.referentCitizenId)
          params.set("referentCitizenId", key.referentCitizenId);
        if (key.excludeSchools)
          params.set("excludeSchools", key.excludeSchools);
        if (key.transferInbox) params.set("transferInbox", key.transferInbox);

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

  const { data: transferInboxCount = 0, mutate: mutateTransferCount } = useSWR(
    session?.user?.id
      ? [
          "/api/question",
          "transfer-inbox-count",
          adminProfile?.healthcareFacilityId ?? "",
        ]
      : null,
    async () => {
      const params = new URLSearchParams({
        page: "1",
        limit: "10",
        transferInbox: "1",
      });
      const res = await fetch(`/api/question?${params}`);

      if (!res.ok) return 0;
      const json = await res.json();

      return Number(json.pagination?.total ?? 0);
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  const transferAlertShownRef = useRef(false);
  const {
    isOpen: isTransferAlertOpen,
    onOpen: onTransferAlertOpen,
    onClose: onTransferAlertClose,
  } = useDisclosure();

  useEffect(() => {
    if (transferAlertShownRef.current) return;
    if (transferInboxCount <= 0) return;
    transferAlertShownRef.current = true;
    onTransferAlertOpen();
  }, [transferInboxCount, onTransferAlertOpen]);

  const goToTransferInbox = useCallback(() => {
    setListMode("transferInbox");
    setPage(1);
    onTransferAlertClose();
  }, [onTransferAlertClose]);

  const refreshLists = useCallback(() => {
    void mutate();
    void mutateTransferCount();
  }, [mutate, mutateTransferCount]);

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
  const setHiddenSchoolsAndResetPage = useCallback((s: Set<string>) => {
    setHiddenSchools(s);
    setPage(1);
  }, []);
  const setNineqResultFilterAndResetPage = useCallback((s: Selection) => {
    setNineqResultFilter(s);
    setPage(1);
  }, []);
  const setPhqaResultFilterAndResetPage = useCallback((s: Selection) => {
    setPhqaResultFilter(s);
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
  const setQ8FilterAndResetPage = useCallback((s: Selection) => {
    setQ8Filter(s);
    setPage(1);
  }, []);
  const setMainScaleFilterAndResetPage = useCallback((s: string) => {
    setMainScaleFilter(s);
    setPage(1);
  }, []);
  const setReferentTypeFilterAndResetPage = useCallback((s: string) => {
    setReferentTypeFilter(s);
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

  const onRowEditConsultationPress = useCallback(
    async (e: string, caseStatus?: string | null) => {
      if (caseStatus === "PENDING" && !canClaimCases) {
        addToast({
          color: "warning",
          title: "รอ Consult รับเคส",
          description: "เฉพาะ Consult เท่านั้นที่รับเคสได้",
          timeout: 4000,
        });

        return;
      }

      const res = await fetch("/api/question/" + e);
      const val: QuestionsData | QuestionsData[] = await res.json();

      setSelectedQuestion(val);
      setMode("edit-consultation");
      onOpen();
    },
    [onOpen, setSelectedQuestion, canClaimCases]
  );

  const onDrawerClose = useCallback(() => {
    onClose();
    refreshLists();
  }, [onClose, refreshLists]);

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
          const facilityName = item.healthcareFacility?.name?.trim() || "";

          return (
            <div className="flex flex-col gap-0.5">
              <p className="text-bold text-small">
                {prefixLabel} {item.profile?.firstName || ""}{" "}
                {item.profile?.lastName || ""}
              </p>
              {facilityName ? (
                <p className="text-tiny text-default-500">{facilityName}</p>
              ) : null}
            </div>
          );
        case "age":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">
                {item.profile?.birthDate
                  ? calculateAge(item.profile.birthDate, item.createdAt)
                  : "-"}{" "}
                ปี
              </p>
            </div>
          );
        case "school": {
          const school = item.profile?.school;
          const schoolName =
            typeof school === "object" && school !== null
              ? school.name
              : typeof school === "string"
                ? school
                : null;

          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">{schoolName || "-"}</p>
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
          let phqaScore: string | number | null = null;

          if (Array.isArray(item.q9) && item.q9.length > 0) {
            phqaScore = item.q9[0].sum;
          } else if (Array.isArray(item.phqa) && item.phqa.length > 0) {
            phqaScore = item.phqa[0].sum;
          }

          if (!item.result || phqaScore == null) {
            return (
              <span className="text-default-500 text-small">
                ไม่เข้าเกณฑ์ประเมิน
              </span>
            );
          }

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
              {getAssessmentResultLabel(String(item.result))}
            </Chip>
          );
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

          return (
            <span className="text-default-500 text-small">
              ไม่เข้าเกณฑ์ประเมิน
            </span>
          );

        case "addon":
          if (Array.isArray(item.q8) && item.q8.length > 0) {
            const q8Score = Number(item.q8[0].sum ?? 0);
            const hasRisk = q8Score > 0;

            return (
              <Chip
                className="capitalize"
                color={hasRisk ? "danger" : "success"}
                size="sm"
                variant="flat"
              >
                {hasRisk ? `พบความเสี่ยง (${q8Score})` : "ไม่พบความเสี่ยง (0)"}
              </Chip>
            );
          }

          return (
            <span className="text-default-500 text-small">
              ไม่เข้าเกณฑ์ประเมิน
            </span>
          );
        case "screeningDate":
        case "createdAt": {
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">
                {item.createdAt
                  ? formatThaiDateTime(String(item.createdAt))
                  : "-"}
              </p>
            </div>
          );
        }
        case "status":
          return <QuestionTableStatusCell row={item} />;
        case "assignee":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">
                {item.assigneeName?.trim() || "—"}
              </p>
            </div>
          );
        case "actions":
          return (
            <div className="relative flex items-center gap-2">
              <div className="flex justify-center gap-2">
                <Button
                  isIconOnly
                  aria-label="ดูรายละเอียดเคส"
                  name="Detail"
                  size="sm"
                  variant="light"
                  onPress={() => onRowConsultationPress(item.id)}
                >
                  <EyeIcon className="size-6 text-primary-400" />
                </Button>
                <Button
                  isIconOnly
                  aria-label="บันทึกการให้คำปรึกษา"
                  name="Edit"
                  size="sm"
                  variant="light"
                  onPress={() =>
                    void onRowEditConsultationPress(item.id, item.caseStatus)
                  }
                >
                  <DocumentTextIcon className="size-6 text-warning-400" />
                </Button>
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
      canClaimCases,
      onRowConsultationPress,
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
        hiddenSchools={hiddenSchools}
        mainScaleFilter={mainScaleFilter}
        nineqResultFilter={nineqResultFilter}
        phqaResultFilter={phqaResultFilter}
        q2Filter={q2Filter}
        q8Filter={q8Filter}
        referentTypeFilter={referentTypeFilter}
        schoolFilter={schoolFilter}
        setAddonFilter={setAddonFilterAndResetPage}
        setHiddenSchools={setHiddenSchoolsAndResetPage}
        setMainScaleFilter={setMainScaleFilterAndResetPage}
        setNineqResultFilter={setNineqResultFilterAndResetPage}
        setPhqaResultFilter={setPhqaResultFilterAndResetPage}
        setQ2Filter={setQ2FilterAndResetPage}
        setQ8Filter={setQ8FilterAndResetPage}
        setReferentTypeFilter={setReferentTypeFilterAndResetPage}
        setSchoolFilter={setSchoolFilterAndResetPage}
        setStatusFilter={setStatusFilterAndResetPage}
        statusFilter={statusFilter}
        onDataUpdate={refreshLists}
        onSearchChange={onSearchChange}
      />
    ),
    [
      filterValue,
      onSearchChange,
      statusFilter,
      setStatusFilterAndResetPage,
      hiddenSchools,
      setHiddenSchoolsAndResetPage,
      schoolFilter,
      setSchoolFilterAndResetPage,
      nineqResultFilter,
      setNineqResultFilterAndResetPage,
      phqaResultFilter,
      setPhqaResultFilterAndResetPage,
      q2Filter,
      setQ2FilterAndResetPage,
      addonFilter,
      setAddonFilterAndResetPage,
      mainScaleFilter,
      setMainScaleFilterAndResetPage,
      referentTypeFilter,
      setReferentTypeFilterAndResetPage,
      q8Filter,
      setQ8FilterAndResetPage,
      questionsList,
      refreshLists,
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="text-lg font-semibold">จัดการเคส</h3>
          <Tabs
            aria-label="โหมดรายการเคส"
            selectedKey={listMode}
            size="sm"
            onSelectionChange={(key) => {
              setListMode(key as "all" | "transferInbox");
              setPage(1);
            }}
          >
            <Tab key="all" title="เคสทั้งหมด" />
            <Tab
              key="transferInbox"
              title={
                <div className="flex items-center gap-2">
                  <span>คำขอรับส่งต่อ</span>
                  {transferInboxCount > 0 ? (
                    <Chip color="danger" size="sm" variant="solid">
                      {transferInboxCount}
                    </Chip>
                  ) : null}
                </div>
              }
            />
          </Tabs>
        </div>

        <Modal
          backdrop="blur"
          isOpen={isTransferAlertOpen}
          placement="center"
          onClose={onTransferAlertClose}
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1 text-danger">
              มีคำขอรับส่งต่อรอตรวจสอบ
            </ModalHeader>
            <ModalBody>
              <p>
                มีเคสที่อยู่ระหว่างส่งต่อ{" "}
                <span className="font-semibold text-danger">
                  {transferInboxCount}
                </span>{" "}
                รายการ กรุณาตรวจสอบและตอบรับหรือจัดการคำขอ
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onTransferAlertClose}>
                ปิด
              </Button>
              <Button color="danger" onPress={goToTransferInbox}>
                ไปที่คำขอรับส่งต่อ
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <div className="max-w-[95rem] mx-auto w-full">
          <QuestionEditDrawer
            key={selectedKeys?.id ?? "closed"}
            canClaimCase={canClaimCases}
            data={selectedKeys!}
            isOpen={isOpen}
            mode={mode}
            viewerFacilityId={adminProfile?.healthcareFacilityId ?? null}
            onClose={onDrawerClose}
          />
          <div className="w-full flex flex-col gap-4 text-nowrap">
            <Table
              isStriped
              aria-label="รายการเคส"
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
                emptyContent={"ไม่พบเคส"}
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
