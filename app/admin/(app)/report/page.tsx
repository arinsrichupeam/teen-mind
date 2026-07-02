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
  Chip,
  Input,
  Listbox,
  ListboxItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
  addToast,
  Selection,
  SortDescriptor,
} from "@heroui/react";
import {
  DocumentTextIcon,
  DevicePhoneMobileIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  XMarkIcon,
  ChartBarSquareIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import moment from "moment";
import * as XLSX from "xlsx";

import { prefix } from "@/utils/data";
import { getAgeAtAssessment } from "@/lib/assessment-scale";
import { formatThaiDateTime } from "@/utils/helper";
import Loading from "@/app/loading";

// ─── Types ────────────────────────────────────────────────────────────────────

type HistoryEntry = {
  id: string;
  date: string;
  scale: string;
  score: number | null;
  result: string | null;
  result_text: string | null;
  q2Risk: boolean | null;
  q8Score: number | null;
};

type IndividualProfile = {
  profileId: string;
  prefixId: number;
  firstname: string;
  lastname: string;
  citizenId: string | null;
  birthday: string;
  userId: string | null;
  school: { id: number; name: string; screeningDate?: string | null } | null;
  assessmentCount: number;
  latestResult: string | null;
  latestResultText: string | null;
  latestScore: number | null;
  latestDate: string | null;
  history: HistoryEntry[];
};

interface School {
  id: number;
  name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AGE_RANGE_OPTIONS = [
  { key: "all", label: "ทุกช่วงอายุ" },
  { key: "under18", label: "น้อยกว่า 18 ปี (PHQ-A)" },
  { key: "18plus", label: "18 ปีขึ้นไป (9Q)" },
];

const RESULT_COLOR_MAP: Record<
  string,
  "success" | "warning" | "danger" | "default"
> = {
  Green: "success",
  "Green-Low": "success",
  Yellow: "warning",
  Orange: "warning",
  Red: "danger",
};

const CHART_DOT_COLORS: Record<string, string> = {
  Green: "#17c964",
  "Green-Low": "#06b6d4",
  Yellow: "#f5a524",
  Orange: "#f97316",
  Red: "#f31260",
};

const MAIN_TABLE_COLUMNS = [
  {
    key: "name",
    label: "ชื่อ - สกุล",
    align: "start" as const,
    allowsSorting: true,
  },
  { key: "age", label: "อายุ", align: "center" as const, allowsSorting: false },
  {
    key: "school",
    label: "โรงเรียน",
    align: "start" as const,
    allowsSorting: false,
  },
  {
    key: "count",
    label: "จำนวนครั้ง",
    align: "center" as const,
    allowsSorting: true,
  },
  {
    key: "latestResult",
    label: "ผลล่าสุด",
    align: "center" as const,
    allowsSorting: false,
  },
  {
    key: "latestDate",
    label: "วันที่ล่าสุด",
    align: "center" as const,
    allowsSorting: false,
  },
  { key: "actions", label: "", align: "center" as const, allowsSorting: false },
];

// ─── Chart helpers ────────────────────────────────────────────────────────────

function CustomChartDot(props: {
  cx?: number;
  cy?: number;
  payload?: { result: string };
}) {
  const { cx, cy, payload } = props;

  if (cx == null || cy == null) return null;
  const color = CHART_DOT_COLORS[payload?.result ?? ""] ?? "#71717a";

  return (
    <circle cx={cx} cy={cy} fill={color} r={6} stroke="#fff" strokeWidth={2} />
  );
}

function CustomChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: HistoryEntry & { session: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-content1 border border-divider rounded-lg p-3 shadow-md text-sm min-w-40">
      <p className="font-semibold mb-1.5">ครั้งที่ {d.session}</p>
      <p className="text-default-500">
        วันที่:{" "}
        {moment(d.date).format("DD/MM/") + (moment(d.date).year() + 543)}
      </p>
      <p className="text-default-500">ชุด: {d.scale}</p>
      <p className="text-default-500">คะแนน: {d.score ?? "-"}</p>
      <p className="text-default-500">ผล: {d.result_text || d.result || "-"}</p>
      {d.q2Risk !== null && (
        <p className="text-default-500">
          2Q: {d.q2Risk ? "พบความเสี่ยง" : "ไม่พบ"}
        </p>
      )}
      {d.q8Score !== null && (
        <p className="text-default-500">8Q: {d.q8Score}</p>
      )}
    </div>
  );
}

// ─── History Modal ────────────────────────────────────────────────────────────

function HistoryModal({
  profile,
  isOpen,
  onClose,
  prefixMap,
}: {
  profile: IndividualProfile | null;
  isOpen: boolean;
  onClose: () => void;
  prefixMap: Map<string, string>;
}) {
  if (!profile) return null;

  const prefixLabel = prefixMap.get(String(profile.prefixId)) ?? "";
  const fullName =
    `${prefixLabel} ${profile.firstname} ${profile.lastname}`.trim();

  const screeningDate =
    typeof profile.school === "object" && profile.school !== null
      ? profile.school.screeningDate
      : undefined;
  const age = getAgeAtAssessment(
    profile.birthday,
    screeningDate,
    profile.latestDate ?? undefined
  );

  const chartData = profile.history.map((entry, idx) => ({
    ...entry,
    session: idx + 1,
  }));

  const HISTORY_COLUMNS = [
    { key: "session", label: "ครั้งที่" },
    { key: "date", label: "วันที่" },
    { key: "scale", label: "ชุดประเมิน" },
    { key: "score", label: "คะแนน" },
    { key: "result", label: "ผลประเมิน" },
    { key: "q2", label: "2Q" },
    { key: "q8", label: "8Q" },
  ];

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="4xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-center gap-2">
            {profile.userId ? (
              <DevicePhoneMobileIcon className="size-5 text-success-500 shrink-0" />
            ) : (
              <DocumentTextIcon className="size-5 text-primary-500 shrink-0" />
            )}
            <span>ประวัติการประเมิน — {fullName}</span>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-normal text-default-500 mt-0.5">
            {age !== null && <span>อายุ {age} ปี</span>}
            {profile.school && typeof profile.school === "object" && (
              <span>{profile.school.name}</span>
            )}
            <span>
              ทั้งหมด{" "}
              <strong className="text-foreground">
                {profile.assessmentCount}
              </strong>{" "}
              ครั้ง
            </span>
          </div>
        </ModalHeader>
        <ModalBody className="gap-4 pb-6">
          {/* Trend Chart */}
          {profile.history.length >= 2 && (
            <div>
              <p className="text-sm font-medium text-default-600 mb-2">
                แนวโน้มคะแนน
              </p>
              <ResponsiveContainer height={200} width="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: -8, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    strokeOpacity={0.4}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="session"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `ครั้ง ${v}`}
                  />
                  <YAxis domain={[0, 27]} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Line
                    dataKey="score"
                    dot={<CustomChartDot />}
                    stroke="#a1a1aa"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {Object.entries(CHART_DOT_COLORS).map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span
                      className="inline-block size-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-default-500">
                      {label === "Green"
                        ? "ปกติ"
                        : label === "Green-Low"
                          ? "เฝ้าระวัง"
                          : label === "Yellow"
                            ? "เสี่ยงต่ำ"
                            : label === "Orange"
                              ? "เสี่ยงสูง"
                              : "วิกฤต"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Table */}
          <div>
            <p className="text-sm font-medium text-default-600 mb-2">
              รายละเอียดแต่ละครั้ง
            </p>
            <Table
              isStriped
              removeWrapper
              aria-label="ประวัติการประเมินรายครั้ง"
            >
              <TableHeader columns={HISTORY_COLUMNS}>
                {(col) => (
                  <TableColumn
                    key={col.key}
                    align={
                      col.key === "date" || col.key === "session"
                        ? "start"
                        : "center"
                    }
                    className="text-xs"
                  >
                    {col.label}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody emptyContent="ไม่พบประวัติ" items={chartData}>
                {(item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-center font-medium text-sm">
                      {item.session}
                    </TableCell>
                    <TableCell className="text-sm text-nowrap">
                      {moment(item.date).format("DD/MM/") +
                        (moment(item.date).year() + 543)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Chip color="primary" size="sm" variant="flat">
                        {item.scale}
                      </Chip>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-sm">
                      {item.score ?? "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.result ? (
                        <Chip
                          color={RESULT_COLOR_MAP[item.result] ?? "default"}
                          size="sm"
                          variant="flat"
                        >
                          {item.result_text || item.result}
                        </Chip>
                      ) : (
                        <span className="text-default-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.q2Risk !== null ? (
                        <Chip
                          color={item.q2Risk ? "danger" : "success"}
                          size="sm"
                          variant="flat"
                        >
                          {item.q2Risk ? "พบความเสี่ยง" : "ไม่พบ"}
                        </Chip>
                      ) : (
                        <span className="text-default-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.q8Score !== null ? (
                        <Chip
                          color={item.q8Score > 0 ? "danger" : "success"}
                          size="sm"
                          variant="flat"
                        >
                          {item.q8Score > 0
                            ? `พบความเสี่ยง (${item.q8Score})`
                            : "ไม่พบ (0)"}
                        </Chip>
                      ) : (
                        <span className="text-default-400 text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// ─── Preview Export Modal ─────────────────────────────────────────────────────

function PreviewExportModal({
  isOpen,
  onClose,
  profiles,
  isLoading,
  page1,
  onPage1Change,
  onDownload,
  prefixMap,
}: {
  isOpen: boolean;
  onClose: () => void;
  profiles: IndividualProfile[];
  isLoading: boolean;
  page1: number;
  onPage1Change: (p: number) => void;
  onDownload: () => void;
  prefixMap: Map<string, string>;
}) {
  const [blindNames, setBlindNames] = useState(true);
  const maskName = (name: string) => {
    const parts = name.split(" ");

    if (parts.length <= 1) return parts[0][0] + "xxx";
    const last = parts[parts.length - 1];

    return [...parts.slice(0, -1), last[0] + "xxx"].join(" ");
  };
  const PER_PAGE = 10;
  const MAX_PREVIEW_YEARS = 4;

  const fmtDate = (d: string) =>
    `${moment(d).format("DD/MM/")}${moment(d).year() + 543}`;

  // Collect all unique Thai Buddhist years across all loaded profiles, sorted asc
  const allYears: number[] = Array.from(
    new Set(
      profiles.flatMap((p) => p.history.map((h) => moment(h.date).year() + 543))
    )
  ).sort((a, b) => a - b);

  const previewYears = allYears.slice(-MAX_PREVIEW_YEARS);

  const latestInYear = (
    history: HistoryEntry[],
    year: number
  ): HistoryEntry | null => {
    const inYear = history.filter((h) => moment(h.date).year() + 543 === year);

    return inYear.length > 0 ? inYear[inYear.length - 1] : null;
  };

  const summaryRows = profiles.map((p, i) => {
    const name =
      `${prefixMap.get(String(p.prefixId)) ?? ""} ${p.firstname} ${p.lastname}`.trim();
    const school =
      typeof p.school === "object" && p.school ? p.school.name : "-";
    const screeningDate =
      typeof p.school === "object" && p.school
        ? p.school.screeningDate
        : undefined;
    const age = getAgeAtAssessment(
      p.birthday,
      screeningDate,
      p.latestDate ?? undefined
    );

    return {
      idx: i + 1,
      name,
      citizenId: p.citizenId ?? "-",
      age,
      school,
      count: p.assessmentCount,
      history: p.history,
    };
  });

  const total1 = Math.max(1, Math.ceil(summaryRows.length / PER_PAGE));
  const visibleSummary = summaryRows.slice(
    (page1 - 1) * PER_PAGE,
    page1 * PER_PAGE
  );

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-0.5 pb-2">
          <div className="flex items-center justify-between">
            <span>ตัวอย่างข้อมูลก่อน Export</span>
            <Button
              color={blindNames ? "warning" : "default"}
              size="sm"
              variant="flat"
              onPress={() => setBlindNames((v) => !v)}
            >
              {blindNames ? "แสดงชื่อ" : "ซ่อนชื่อ"}
            </Button>
          </div>
          <span className="text-sm font-normal text-default-500">
            {isLoading
              ? "กำลังโหลด..."
              : `${profiles.length} คน${allYears.length > MAX_PREVIEW_YEARS ? ` · แสดง ${MAX_PREVIEW_YEARS} ปีล่าสุด (จาก ${allYears.length} ปี)` : ""}`}
          </span>
        </ModalHeader>
        <ModalBody className="px-4 pb-2">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner label="กำลังโหลดข้อมูล..." />
            </div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <Table
                isStriped
                removeWrapper
                aria-label="สรุปรายบุคคล"
                className="min-w-full text-nowrap"
              >
                <TableHeader>
                  <TableColumn className="text-xs">ลำดับ</TableColumn>
                  <TableColumn className="text-xs">ชื่อ-สกุล</TableColumn>
                  <TableColumn align="center" className="text-xs">
                    อายุ
                  </TableColumn>
                  <TableColumn className="text-xs">โรงเรียน</TableColumn>
                  {
                    previewYears.flatMap((year, i) => [
                      <TableColumn
                        key={`d${year}`}
                        align="center"
                        className="text-xs"
                      >
                        วันที่คัดกรอง ครั้งที่ {i + 1}
                      </TableColumn>,
                      <TableColumn
                        key={`r${year}`}
                        align="center"
                        className="text-xs"
                      >
                        ผล ครั้งที่ {i + 1}
                      </TableColumn>,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ]) as any
                  }
                </TableHeader>
                <TableBody emptyContent="ไม่พบข้อมูล" items={visibleSummary}>
                  {(row) => (
                    <TableRow key={row.idx}>
                      <TableCell className="text-xs text-center">
                        {row.idx}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        <div>{blindNames ? maskName(row.name) : row.name}</div>
                        <div className="text-default-400">
                          {blindNames && row.citizenId !== "-"
                            ? row.citizenId.slice(0, 3) +
                              "xxxxxx" +
                              row.citizenId.slice(-4)
                            : row.citizenId}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-center whitespace-nowrap">
                        {row.age !== null ? `${row.age} ปี` : "-"}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {row.school}
                      </TableCell>
                      {
                        previewYears.flatMap((year) => {
                          const h = latestInYear(row.history, year);

                          return [
                            <TableCell
                              key={`d${year}`}
                              className="text-xs text-center"
                            >
                              {h ? fmtDate(h.date) : ""}
                            </TableCell>,
                            <TableCell
                              key={`r${year}`}
                              className="text-xs text-center"
                            >
                              {h?.result ? (
                                <Chip
                                  color={
                                    RESULT_COLOR_MAP[h.result] ?? "default"
                                  }
                                  size="sm"
                                  variant="flat"
                                >
                                  {h.result_text || h.result}
                                </Chip>
                              ) : (
                                ""
                              )}
                            </TableCell>,
                          ];
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        }) as any
                      }
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          {summaryRows.length > PER_PAGE && (
            <div className="flex justify-center mt-3">
              <Pagination
                isCompact
                showControls
                color="primary"
                page={page1}
                total={total1}
                onChange={onPage1Change}
              />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            ปิด
          </Button>
          <Button
            color="success"
            isDisabled={isLoading || profiles.length === 0}
            startContent={<ArrowDownTrayIcon className="size-4" />}
            variant="flat"
            onPress={onDownload}
          >
            ดาวน์โหลด Excel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();
  const { status } = useSession();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [selectedProfile, setSelectedProfile] =
    useState<IndividualProfile | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterValue, setFilterValue] = useState("");
  const [ageRange, setAgeRange] = useState("all");
  const [selectedSchools, setSelectedSchools] = useState<Selection>(
    new Set([])
  );
  const [schoolSearch, setSchoolSearch] = useState("");
  const [repeatedOnly, setRepeatedOnly] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewProfiles, setPreviewProfiles] = useState<IndividualProfile[]>(
    []
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPage1, setPreviewPage1] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "latestDate",
    direction: "descending",
  });

  const prefixMap = useMemo(
    () => new Map(prefix.map((p) => [String(p.key), p.label])),
    []
  );

  const { data: schoolList } = useSWR<School[]>(
    "/api/data/school",
    (url: string) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  );

  const filteredSchoolList = useMemo(() => {
    if (!schoolList) return [];
    const q = schoolSearch.trim().toLowerCase();

    return q
      ? schoolList.filter((s) => s.name.toLowerCase().includes(q))
      : schoolList;
  }, [schoolList, schoolSearch]);

  const selectedSchoolNames = useMemo(
    () =>
      selectedSchools === "all"
        ? []
        : Array.from(selectedSchools as Set<string>),
    [selectedSchools]
  );

  const sortByParam = useMemo(() => {
    if (sortDescriptor.column === "name") return "name";
    if (sortDescriptor.column === "count") return "count";

    return "date";
  }, [sortDescriptor.column]);

  const sortDirParam =
    sortDescriptor.direction === "ascending" ? "asc" : "desc";

  const filterKey = useMemo(
    () => ({
      search: filterValue,
      ageRange,
      schools: selectedSchoolNames.join(","),
      repeated: repeatedOnly,
      sortBy: sortByParam,
      sortDir: sortDirParam,
    }),
    [
      filterValue,
      ageRange,
      selectedSchoolNames,
      repeatedOnly,
      sortByParam,
      sortDirParam,
    ]
  );

  const { data: statsData } = useSWR<{
    total: number;
    repeatedCount: number;
    years: number[];
  }>(
    ["/api/report/individual/stats", filterKey] as const,
    async ([url, key]: [string, typeof filterKey]) => {
      const params = new URLSearchParams();

      if (key.search) params.set("search", key.search);
      if (key.ageRange && key.ageRange !== "all")
        params.set("ageRange", key.ageRange);
      if (key.schools) params.set("schools", key.schools);
      const res = await fetch(`${url}?${params}`);

      if (!res.ok) throw new Error("Failed to fetch stats");

      return res.json();
    },
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  const { data, isLoading } = useSWR(
    ["/api/report/individual", page, rowsPerPage, filterKey],
    async ([url, apiPage, apiLimit, key]) => {
      try {
        const params = new URLSearchParams({
          page: String(apiPage),
          limit: String(apiLimit),
        });

        if (key.search) params.set("search", key.search);
        if (key.ageRange && key.ageRange !== "all")
          params.set("ageRange", key.ageRange);
        if (key.schools) params.set("schools", key.schools);
        if (key.repeated) params.set("repeated", "true");
        params.set("sortBy", key.sortBy);
        params.set("sortDir", key.sortDir);

        const res = await fetch(`${url}?${params}`);

        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();

        return {
          profiles: (json.profiles ?? []) as IndividualProfile[],
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
            "ไม่สามารถดึงข้อมูล" +
            (error instanceof Error ? `: ${error.message}` : ""),
          color: "danger",
        });

        return {
          profiles: [],
          pagination: {
            page: 1,
            limit: Number(apiLimit),
            total: 0,
            totalPages: 0,
          },
        };
      }
    },
    { keepPreviousData: true, revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  const profiles = data?.profiles ?? [];
  const serverPagination = data?.pagination;
  const pages = serverPagination?.totalPages ?? 1;

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

  const onSchoolSelectionChange = useCallback((keys: Selection) => {
    setSelectedSchools(keys);
    setPage(1);
  }, []);

  const onSortChange = useCallback((descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
    setPage(1);
  }, []);

  const onViewHistory = useCallback(
    (profile: IndividualProfile) => {
      setSelectedProfile(profile);
      onOpen();
    },
    [onOpen]
  );

  useEffect(() => {
    if (status !== "loading" && status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  useEffect(() => {
    const raw = sessionStorage.getItem("adminProfile");

    if (raw) {
      const p = JSON.parse(raw);

      if (p.roleId !== 4) router.replace("/admin");
    }
  }, [router]);

  const renderCell = useCallback(
    (item: IndividualProfile, columnKey: string) => {
      switch (columnKey) {
        case "name": {
          const prefixLabel = prefixMap.get(String(item.prefixId)) ?? "";

          return (
            <div className="flex items-center gap-2">
              {item.userId ? (
                <DevicePhoneMobileIcon className="size-5 text-success-500 shrink-0" />
              ) : (
                <DocumentTextIcon className="size-5 text-primary-500 shrink-0" />
              )}
              <p className="text-bold text-small">
                {prefixLabel} {item.firstname} {item.lastname}
              </p>
            </div>
          );
        }
        case "age": {
          const screeningDate =
            typeof item.school === "object" && item.school !== null
              ? item.school.screeningDate
              : undefined;

          return (
            <p className="text-small text-center">
              {item.birthday
                ? `${getAgeAtAssessment(item.birthday, screeningDate, item.latestDate ?? undefined) ?? "-"} ปี`
                : "-"}
            </p>
          );
        }
        case "school": {
          const schoolName =
            typeof item.school === "object" && item.school !== null
              ? item.school.name
              : "-";

          return <p className="text-small">{schoolName}</p>;
        }
        case "count":
          return (
            <p className="text-small font-semibold text-center">
              {item.assessmentCount}
            </p>
          );
        case "latestResult":
          return item.latestResult ? (
            <Chip
              color={RESULT_COLOR_MAP[item.latestResult] ?? "default"}
              size="sm"
              variant="flat"
            >
              {item.latestResultText || item.latestResult}
            </Chip>
          ) : (
            <span className="text-small text-default-400">-</span>
          );
        case "latestDate":
          return (
            <p className="text-small text-center">
              {item.latestDate
                ? formatThaiDateTime(String(item.latestDate))
                : "-"}
            </p>
          );
        case "actions":
          return (
            <Button
              isIconOnly
              size="sm"
              title="ดูประวัติการประเมิน"
              variant="light"
              onPress={() => onViewHistory(item)}
            >
              <ChartBarSquareIcon className="size-5 text-primary-400" />
            </Button>
          );
        default:
          return null;
      }
    },
    [prefixMap, onViewHistory]
  );

  const generateAndDownload = useCallback(
    (profiles: IndividualProfile[]) => {
      try {
        const formatDate = (dateStr: string) =>
          `${moment(dateStr).format("DD/MM/")}${moment(dateStr).year() + 543}`;

        // Collect all unique Thai Buddhist years across all profiles, sorted asc
        const allYears: number[] = Array.from(
          new Set(
            profiles.flatMap((p) =>
              p.history.map((h) => moment(h.date).year() + 543)
            )
          )
        ).sort((a, b) => a - b);

        const latestInYear = (
          history: HistoryEntry[],
          year: number
        ): HistoryEntry | null => {
          const inYear = history.filter(
            (h) => moment(h.date).year() + 543 === year
          );

          return inYear.length > 0 ? inYear[inYear.length - 1] : null;
        };

        // Build header row
        const headerRow: string[] = [
          "ลำดับ",
          "ชื่อ-สกุล",
          "เลขบัตรประชาชน",
          "อายุ",
          "โรงเรียน",
        ];

        for (let i = 0; i < allYears.length; i++) {
          headerRow.push(
            `วันที่คัดกรอง ครั้งที่ ${i + 1}`,
            `ผล ครั้งที่ ${i + 1}`
          );
        }

        // Build data rows
        const dataRows = profiles.map((p, idx) => {
          const name =
            `${prefixMap.get(String(p.prefixId)) ?? ""} ${p.firstname} ${p.lastname}`.trim();
          const schoolName =
            typeof p.school === "object" && p.school !== null
              ? p.school.name
              : "-";
          const screeningDate =
            typeof p.school === "object" && p.school !== null
              ? p.school.screeningDate
              : undefined;
          const age =
            getAgeAtAssessment(
              p.birthday,
              screeningDate,
              p.latestDate ?? undefined
            ) ?? "-";

          const row: (string | number)[] = [
            idx + 1,
            name,
            p.citizenId ?? "-",
            age,
            schoolName,
          ];

          for (const year of allYears) {
            const h = latestInYear(p.history, year);

            row.push(
              h ? formatDate(h.date) : "",
              h ? h.result_text || h.result || "-" : ""
            );
          }

          return row;
        });

        const colWidths: { wch: number }[] = [
          { wch: 8 }, // ลำดับ
          { wch: 24 }, // ชื่อ-สกุล
          { wch: 16 }, // เลขบัตรประชาชน
          { wch: 8 }, // อายุ
          { wch: 24 }, // โรงเรียน
        ];

        for (let i = 0; i < allYears.length; i++) {
          colWidths.push({ wch: 14 }, { wch: 18 }); // วันที่คัดกรอง, ผล
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

        ws["!cols"] = colWidths;
        XLSX.utils.book_append_sheet(wb, ws, "สรุปรายบุคคล");

        const today = moment().format("YYYY-MM-DD");

        XLSX.writeFile(wb, `individual_report_${today}.xlsx`);

        addToast({
          title: "Export สำเร็จ",
          description: `ดาวน์โหลด individual_report_${today}.xlsx เรียบร้อย`,
          color: "success",
        });
      } catch (error) {
        addToast({
          title: "Export ไม่สำเร็จ",
          description:
            error instanceof Error
              ? error.message
              : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
          color: "danger",
        });
      }
    },
    [prefixMap]
  );

  const handleOpenPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewOpen(true);
    setPreviewPage1(1);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "9999",
        sortBy: "count",
        sortDir: "desc",
      });

      if (filterKey.search) params.set("search", filterKey.search);
      if (filterKey.ageRange && filterKey.ageRange !== "all")
        params.set("ageRange", filterKey.ageRange);
      if (filterKey.schools) params.set("schools", filterKey.schools);
      if (filterKey.repeated) params.set("repeated", "true");
      const res = await fetch(`/api/report/individual?${params}`);

      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      const json = await res.json();

      setPreviewProfiles(json.profiles ?? []);
    } catch (error) {
      addToast({
        title: "โหลดไม่สำเร็จ",
        description: String(error),
        color: "danger",
      });
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  }, [filterKey]);

  const schoolChips = useMemo(() => {
    if (selectedSchoolNames.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {selectedSchoolNames.map((name) => (
          <Chip
            key={name}
            endContent={
              <XMarkIcon
                className="size-3 cursor-pointer"
                onClick={() => {
                  const next = new Set(
                    selectedSchoolNames.filter((s) => s !== name)
                  );

                  setSelectedSchools(next);
                  setPage(1);
                }}
              />
            }
            size="sm"
            variant="flat"
          >
            {name}
          </Chip>
        ))}
        <Button
          className="h-6 text-xs"
          size="sm"
          variant="light"
          onPress={() => {
            setSelectedSchools(new Set([]));
            setPage(1);
          }}
        >
          ล้างทั้งหมด
        </Button>
      </div>
    );
  }, [selectedSchoolNames]);

  const topContent = useMemo(
    () => (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-col gap-2 w-full bg-white rounded-lg p-2 shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              aria-label="ค้นหาชื่อ-สกุล"
              classNames={{
                base: "flex-1 min-w-40 shadow-sm",
                input: "text-small",
                inputWrapper: "min-h-9 h-9",
              }}
              placeholder="ค้นหาชื่อ-สกุล..."
              size="sm"
              startContent={
                <MagnifyingGlassIcon className="size-4 text-default-400 shrink-0" />
              }
              value={filterValue}
              variant="bordered"
              onValueChange={onSearchChange}
            />
            <Select
              aria-label="ช่วงอายุ"
              classNames={{
                base: "flex-1 min-w-36 shadow-sm",
                trigger: "min-h-9 h-9",
                value: "text-small",
              }}
              placeholder="ช่วงอายุ"
              selectedKeys={new Set([ageRange])}
              size="sm"
              variant="bordered"
              onSelectionChange={(keys) => {
                const val = Array.from(keys as Set<string>)[0] ?? "all";

                setAgeRange(val);
                setPage(1);
              }}
            >
              {AGE_RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.key}>{opt.label}</SelectItem>
              ))}
            </Select>
            <Popover placement="bottom-start">
              <PopoverTrigger>
                <Button
                  className="flex-1 min-w-36 min-h-9 h-9 border border-default-200 shadow-sm text-small font-normal text-default-500"
                  endContent={<ChevronDownIcon className="size-4 shrink-0" />}
                  size="sm"
                  startContent={
                    <BuildingOfficeIcon className="size-4 shrink-0 text-default-400" />
                  }
                  variant="bordered"
                >
                  {selectedSchoolNames.length > 0
                    ? `โรงเรียน (${selectedSchoolNames.length})`
                    : "โรงเรียน"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-72">
                <div className="p-2 border-b border-divider">
                  <Input
                    placeholder="ค้นหาโรงเรียน..."
                    size="sm"
                    startContent={
                      <MagnifyingGlassIcon className="size-4 text-default-400" />
                    }
                    value={schoolSearch}
                    onValueChange={setSchoolSearch}
                  />
                </div>
                <Listbox
                  aria-label="เลือกโรงเรียน"
                  className="max-h-64 overflow-y-auto"
                  selectedKeys={selectedSchools}
                  selectionMode="multiple"
                  onSelectionChange={onSchoolSelectionChange}
                >
                  {filteredSchoolList.map((s) => (
                    <ListboxItem key={s.name}>{s.name}</ListboxItem>
                  ))}
                </Listbox>
              </PopoverContent>
            </Popover>
            <Button
              color={repeatedOnly ? "primary" : "default"}
              size="sm"
              variant={repeatedOnly ? "solid" : "flat"}
              onPress={() => {
                setRepeatedOnly((v) => !v);
                setPage(1);
              }}
            >
              ประเมินต่อเนื่อง ≥ 2 ปี
            </Button>
            <Button
              color="success"
              isDisabled={previewLoading}
              isLoading={previewLoading}
              size="sm"
              startContent={
                !previewLoading ? (
                  <ArrowDownTrayIcon className="size-4" />
                ) : null
              }
              variant="flat"
              onPress={handleOpenPreview}
            >
              {previewLoading ? "กำลังโหลด..." : "Export Excel"}
            </Button>
          </div>
          {schoolChips && <div className="px-1">{schoolChips}</div>}
        </div>
        <div className="flex justify-between items-center px-1">
          <span className="text-small text-default-400">
            ทั้งหมด {serverPagination?.total ?? 0} คน
          </span>
          <label className="flex items-center text-small text-default-400 gap-1">
            แสดงต่อหน้า:
            <select
              className="bg-transparent outline-none text-small"
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
    ),
    [
      filterValue,
      onSearchChange,
      ageRange,
      selectedSchools,
      selectedSchoolNames,
      onSchoolSelectionChange,
      schoolSearch,
      filteredSchoolList,
      schoolChips,
      serverPagination?.total,
      rowsPerPage,
      onRowsPerPageChange,
      handleOpenPreview,
      previewLoading,
      repeatedOnly,
    ]
  );

  const bottomContent = useMemo(
    () => (
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
    ),
    [page, pages]
  );

  return (
    <Suspense fallback={<Loading />}>
      <div className="my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4">
        <h3 className="text-lg font-semibold">รายงานผลการประเมินรายบุคคล</h3>

        <PreviewExportModal
          isLoading={previewLoading}
          isOpen={previewOpen}
          page1={previewPage1}
          prefixMap={prefixMap}
          profiles={previewProfiles}
          onClose={() => setPreviewOpen(false)}
          onDownload={() => {
            generateAndDownload(previewProfiles);
            setPreviewOpen(false);
          }}
          onPage1Change={setPreviewPage1}
        />
        <HistoryModal
          isOpen={isOpen}
          prefixMap={prefixMap}
          profile={selectedProfile}
          onClose={onClose}
        />

        <div className="flex gap-3">
          <div className="flex-1 rounded-xl border border-default-200 bg-white shadow-sm p-4">
            <p className="text-xs text-default-400">ผู้รับการประเมินทั้งหมด</p>
            <p className="text-2xl font-bold mt-1">
              {statsData?.total ?? "-"}{" "}
              <span className="text-sm font-normal text-default-400">คน</span>
            </p>
          </div>
          <div className="flex-1 rounded-xl border border-primary-200 bg-primary-50 shadow-sm p-4">
            <p className="text-xs text-primary-400">
              ประเมินต่อเนื่อง (≥ 2 ปี)
            </p>
            <p className="text-2xl font-bold text-primary-600 mt-1">
              {statsData?.repeatedCount ?? "-"}{" "}
              <span className="text-sm font-normal text-primary-400">คน</span>
            </p>
            {statsData?.years && statsData.years.length > 0 && (
              <p className="text-xs text-primary-300 mt-1">
                ปี {statsData.years.join(", ")}
              </p>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col gap-4 text-nowrap">
          <Table
            isStriped
            aria-label="รายงานผลการประเมินรายบุคคล"
            bottomContent={bottomContent}
            bottomContentPlacement="outside"
            sortDescriptor={sortDescriptor}
            topContent={topContent}
            topContentPlacement="outside"
            onSortChange={onSortChange}
          >
            <TableHeader columns={MAIN_TABLE_COLUMNS}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  align={column.align}
                  allowsSorting={column.allowsSorting}
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              emptyContent="ไม่พบข้อมูล"
              items={profiles}
              loadingContent={<Spinner label="กำลังโหลด..." />}
              loadingState={isLoading ? "loading" : "idle"}
            >
              {(item: IndividualProfile) => (
                <TableRow key={item.profileId}>
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
    </Suspense>
  );
}
