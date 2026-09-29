"use client";

import {
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import {
  DocumentTextIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
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

import {
  CHART_DOT_COLORS,
  getProfileAge,
  HistoryEntry,
  IndividualProfile,
  RESULT_COLOR_MAP,
} from "./individual-types";

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

export function HistoryModal({
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
    `${prefixLabel} ${profile.firstName} ${profile.lastName}`.trim();

  const age = getProfileAge(
    profile.birthDate,
    typeof profile.school === "object" ? profile.school : null,
    profile.latestDate
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
