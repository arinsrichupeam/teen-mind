"use client";

import {
  Button,
  Card,
  CardBody,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { useMemo, useState } from "react";

type UsageStatRow = {
  yearBe: number;
  monthLabel: string;
  totalUse: number;
  totalUsers: number;
  green: number;
  greenLow: number;
  yellow: number;
  orange: number;
  red: number;
};

type CardUsageStatsProps = {
  data: UsageStatRow[];
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const getUsageStatRowSortKey = (row: UsageStatRow): number => {
  const monthIndex = THAI_MONTHS.indexOf(
    row.monthLabel as (typeof THAI_MONTHS)[number]
  );

  if (monthIndex < 0) return 0;

  const gregorianYear = row.yearBe - 543;

  return Date.UTC(gregorianYear, monthIndex, 1);
};

export const CardUsageStats = ({ data }: CardUsageStatsProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  type RiskLogItem = { iso: string; name: string };
  type RiskLevel = "Green" | "Green-Low" | "Yellow" | "Orange" | "Red";
  const PAGE_SIZE = 10;

  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [items, setItems] = useState<RiskLogItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [activeQuery, setActiveQuery] = useState<{
    start: number;
    end: number;
    risk: RiskLevel;
  } | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>("all");

  const riskLabels = useMemo(
    () => ({
      Green: "ไม่พบความเสี่ยง",
      "Green-Low": "ความเสี่ยงเล็กน้อย",
      Yellow: "ความเสี่ยงปานกลาง",
      Orange: "ความเสี่ยงมาก",
      Red: "ความเสี่ยงรุนแรง",
    }),
    []
  );

  const sortedData = useMemo(
    () =>
      [...data].sort(
        (a, b) => getUsageStatRowSortKey(b) - getUsageStatRowSortKey(a)
      ),
    [data]
  );

  const monthOptions = useMemo(
    () => [
      { key: "all", label: "ทุกเดือน" },
      ...sortedData.map((row) => ({
        key: `${row.yearBe}-${THAI_MONTHS.indexOf(
          row.monthLabel as (typeof THAI_MONTHS)[number]
        )}`,
        label: `${row.monthLabel} ${row.yearBe}`,
      })),
    ],
    [sortedData]
  );

  const filteredData = useMemo(() => {
    if (selectedMonthKey === "all") return sortedData;

    return sortedData.filter((row) => {
      const monthIndex = THAI_MONTHS.indexOf(
        row.monthLabel as (typeof THAI_MONTHS)[number]
      );

      return `${row.yearBe}-${monthIndex}` === selectedMonthKey;
    });
  }, [sortedData, selectedMonthKey]);

  const summary = filteredData.reduce(
    (acc, row) => {
      acc.totalUse += row.totalUse;
      acc.totalUsers += row.totalUsers;

      acc.green += row.green;
      acc.greenLow += row.greenLow;
      acc.yellow += row.yellow;
      acc.orange += row.orange;
      acc.red += row.red;

      return acc;
    },
    {
      totalUse: 0,
      totalUsers: 0,
      green: 0,
      greenLow: 0,
      yellow: 0,
      orange: 0,
      red: 0,
    }
  );

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / PAGE_SIZE) : 0;

  const tableRows = filteredData.map((row) => (
    <TableRow key={`${row.yearBe}-${row.monthLabel}`}>
      <TableCell className="text-nowrap">
        {row.yearBe} {row.monthLabel}
      </TableCell>
      <TableCell className="text-center whitespace-nowrap">
        {formatNumber(row.totalUse)}
      </TableCell>
      <TableCell className="text-center whitespace-nowrap">
        {formatNumber(row.totalUsers)}
      </TableCell>
      <TableCell
        className="text-center whitespace-nowrap text-green-700 font-semibold cursor-pointer hover:underline"
        onClick={() => handleRiskLogs(row, "Green")}
      >
        {formatNumber(row.green)}
      </TableCell>
      <TableCell
        className="text-center whitespace-nowrap text-emerald-700 font-semibold cursor-pointer hover:underline"
        onClick={() => handleRiskLogs(row, "Green-Low")}
      >
        {formatNumber(row.greenLow)}
      </TableCell>
      <TableCell
        className="text-center whitespace-nowrap text-yellow-700 font-semibold cursor-pointer hover:underline"
        onClick={() => handleRiskLogs(row, "Yellow")}
      >
        {formatNumber(row.yellow)}
      </TableCell>
      <TableCell
        className="text-center whitespace-nowrap text-orange-700 font-semibold cursor-pointer hover:underline"
        onClick={() => handleRiskLogs(row, "Orange")}
      >
        {formatNumber(row.orange)}
      </TableCell>
      <TableCell
        className="text-center whitespace-nowrap text-red-700 font-semibold cursor-pointer hover:underline"
        onClick={() => handleRiskLogs(row, "Red")}
      >
        {formatNumber(row.red)}
      </TableCell>
    </TableRow>
  ));

  async function handleRiskLogs(row: UsageStatRow, risk: RiskLevel) {
    const monthIndex = THAI_MONTHS.indexOf(
      row.monthLabel as (typeof THAI_MONTHS)[number]
    );
    const gregorianYear = row.yearBe - 543;

    if (monthIndex < 0 || !Number.isFinite(gregorianYear)) return;

    const start = Date.UTC(gregorianYear, monthIndex, 1);
    const end = Date.UTC(gregorianYear, monthIndex + 1, 1);

    setSelectedTitle(`${row.yearBe} ${row.monthLabel} - ${riskLabels[risk]}`);
    setActiveQuery({ start, end, risk });
    setPage(1);
    setTotalItems(0);
    setIsLoadingLogs(true);
    setItems([]);
    onOpen();

    try {
      const res = await fetch(
        `/api/dashboard/usage-stats/risk-logs?start=${start}&end=${end}&risk=${risk}&page=1&pageSize=${PAGE_SIZE}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        setItems([]);

        return;
      }

      const data = (await res.json()) as {
        items?: Array<{ createdAt?: string; name?: string }>;
        total?: number;
        page?: number;
      };

      setTotalItems(data.total ?? 0);
      setPage(data.page ?? 1);
      setItems(
        (data.items ?? [])
          .map((i) => ({
            iso: i.createdAt ?? "",
            name: i.name ?? "",
          }))
          .filter((v) => v.iso !== "" && typeof v.iso === "string")
      );
    } finally {
      setIsLoadingLogs(false);
    }
  }

  async function loadRiskLogsPage(nextPage: number) {
    if (!activeQuery) return;

    setIsLoadingLogs(true);
    try {
      const res = await fetch(
        `/api/dashboard/usage-stats/risk-logs?start=${activeQuery.start}&end=${activeQuery.end}&risk=${activeQuery.risk}&page=${nextPage}&pageSize=${PAGE_SIZE}`,
        { credentials: "include" }
      );

      if (!res.ok) return;

      const data = (await res.json()) as {
        items?: Array<{ createdAt?: string; name?: string }>;
        total?: number;
        page?: number;
      };

      setTotalItems(data.total ?? 0);
      setPage(data.page ?? nextPage);
      setItems(
        (data.items ?? [])
          .map((i) => ({
            iso: i.createdAt ?? "",
            name: i.name ?? "",
          }))
          .filter((v) => v.iso !== "" && typeof v.iso === "string")
      );
    } finally {
      setIsLoadingLogs(false);
    }
  }

  tableRows.push(
    <TableRow key="summary" className="font-bold bg-default-100">
      <TableCell>รวมทั้งหมด</TableCell>
      <TableCell className="text-center whitespace-nowrap">
        {formatNumber(summary.totalUse)}
      </TableCell>
      <TableCell className="text-center whitespace-nowrap">
        {formatNumber(summary.totalUsers)}
      </TableCell>
      <TableCell className="text-center whitespace-nowrap text-green-700 font-semibold">
        {formatNumber(summary.green)}
      </TableCell>
      <TableCell className="text-center whitespace-nowrap text-emerald-700 font-semibold">
        {formatNumber(summary.greenLow)}
      </TableCell>
      <TableCell className="text-center whitespace-nowrap text-yellow-700 font-semibold">
        {formatNumber(summary.yellow)}
      </TableCell>
      <TableCell className="text-center whitespace-nowrap text-orange-700 font-semibold">
        {formatNumber(summary.orange)}
      </TableCell>
      <TableCell className="text-center whitespace-nowrap text-red-700 font-semibold">
        {formatNumber(summary.red)}
      </TableCell>
    </TableRow>
  );

  return (
    <Card className="w-full">
      <div className="px-3 pt-3">
        <Select
          aria-label="เลือกเดือนสำหรับตารางสถิติการเข้าใช้งาน"
          className="max-w-xs"
          placeholder="เลือกเดือน"
          selectedKeys={[selectedMonthKey]}
          size="sm"
          variant="bordered"
          onSelectionChange={(keys) => {
            if (keys === "all") {
              setSelectedMonthKey("all");

              return;
            }

            const selectedKey = Array.from(keys)[0] as string | undefined;

            setSelectedMonthKey(selectedKey ?? "all");
          }}
        >
          {monthOptions.map((option) => (
            <SelectItem key={option.key}>{option.label}</SelectItem>
          ))}
        </Select>
      </div>
      <CardBody className="max-h-[400px] overflow-y-auto p-0">
        <Table isHeaderSticky isStriped aria-label="Usage Statistics Table">
          <TableHeader className="sticky top-0 z-20 bg-white shadow-sm">
            <TableColumn>ปี-เดือน</TableColumn>
            <TableColumn className="text-center">เข้าใช้งาน</TableColumn>
            <TableColumn className="text-center">ผู้ทำแบบประเมิน</TableColumn>
            <TableColumn className="text-center">
              <span className="text-green-700 font-semibold">
                ไม่พบความเสี่ยง
              </span>
            </TableColumn>
            <TableColumn className="text-center">
              <span className="text-emerald-700 font-semibold">
                ความเสี่ยงเล็กน้อย
              </span>
            </TableColumn>
            <TableColumn className="text-center">
              <span className="text-yellow-700 font-semibold">
                ความเสี่ยงปานกลาง
              </span>
            </TableColumn>
            <TableColumn className="text-center">
              <span className="text-orange-700 font-semibold">
                ความเสี่ยงมาก
              </span>
            </TableColumn>
            <TableColumn className="text-center">
              <span className="text-red-700 font-semibold">
                ความเสี่ยงรุนแรง
              </span>
            </TableColumn>
          </TableHeader>
          <TableBody>{tableRows}</TableBody>
        </Table>
      </CardBody>

      <Modal
        backdrop={"blur"}
        hideCloseButton={false}
        isDismissable={false}
        isOpen={isOpen}
        placement={"center"}
        size="3xl"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">{selectedTitle}</h3>
          </ModalHeader>
          <ModalBody>
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-default-500">ไม่พบข้อมูล</p>
            ) : (
              <>
                <div className="max-h-[55vh] overflow-y-auto pr-2">
                  <Table isHeaderSticky aria-label="Risk Logs Table">
                    <TableHeader className="bg-white">
                      <TableColumn className="text-center">ลำดับ</TableColumn>
                      <TableColumn>ชื่อ</TableColumn>
                      <TableColumn className="text-center">
                        วันเวลาที่ทำแบบประเมิน
                      </TableColumn>
                    </TableHeader>
                    <TableBody>
                      {items.map((log, idx) => (
                        <TableRow key={`${log.iso}-${log.name}-${idx}`}>
                          <TableCell className="text-center">
                            {(page - 1) * PAGE_SIZE + idx + 1}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {log.name?.trim() ? log.name : "ไม่ระบุชื่อ"}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {formatDateTime(log.iso)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Button
                    isDisabled={page <= 1 || totalPages <= 1}
                    size="sm"
                    variant="light"
                    onPress={() => loadRiskLogsPage(page - 1)}
                  >
                    ก่อนหน้า
                  </Button>
                  <div className="text-sm text-default-600">
                    หน้า {page} / {totalPages}
                  </div>
                  <Button
                    isDisabled={totalPages <= 1 || page >= totalPages}
                    size="sm"
                    variant="light"
                    onPress={() => loadRiskLogsPage(page + 1)}
                  >
                    ถัดไป
                  </Button>
                </div>
              </>
            )}
            <div className="mt-4 flex justify-end">
              <Button size="sm" variant="light" onPress={() => onOpenChange()}>
                ปิด
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Card>
  );
};
