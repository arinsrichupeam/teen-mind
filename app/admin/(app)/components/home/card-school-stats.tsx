import React, { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@heroui/react";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

type SchoolStat = {
  schoolName: string;
  total: number;
  green: number;
  greenLow: number;
  yellow: number;
  orange: number;
  red: number;
};

type props = {
  data: SchoolStat[];
  summary: SchoolStat;
};

type SortKey =
  | "schoolName"
  | "total"
  | "green"
  | "greenLow"
  | "yellow"
  | "orange"
  | "red";
type SortDirection = "asc" | "desc";

export const CardSchoolStats = ({ data, summary }: props) => {
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue, "th")
          : bValue.localeCompare(aValue, "th");
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [data, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;

    return sortDirection === "asc" ? (
      <ChevronUpIcon className="w-4 h-4" />
    ) : (
      <ChevronDownIcon className="w-4 h-4" />
    );
  };

  const tableRows = sortedData.map((school, index) => (
    <TableRow key={school.schoolName}>
      <TableCell>{index + 1}</TableCell>
      <TableCell className="text-nowrap">{school.schoolName}</TableCell>
      <TableCell>{school.total}</TableCell>
      <TableCell>{school.green}</TableCell>
      <TableCell>{school.greenLow}</TableCell>
      <TableCell>{school.yellow}</TableCell>
      <TableCell>{school.orange}</TableCell>
      <TableCell>{school.red}</TableCell>
    </TableRow>
  ));

  tableRows.push(
    <TableRow key="summary" className="font-bold bg-default-100">
      <TableCell>{""}</TableCell>
      <TableCell>รวมทั้งหมด</TableCell>
      <TableCell>{summary.total}</TableCell>
      <TableCell>{summary.green}</TableCell>
      <TableCell>{summary.greenLow}</TableCell>
      <TableCell>{summary.yellow}</TableCell>
      <TableCell>{summary.orange}</TableCell>
      <TableCell>{summary.red}</TableCell>
    </TableRow>
  );

  return (
    <Card className="w-full">
      <CardBody className="max-h-[400px] overflow-y-auto p-0">
        <div className="relative">
          <Table isHeaderSticky isStriped aria-label="School Statistics Table">
            <TableHeader className="sticky top-0 z-20 bg-white shadow-sm">
              <TableColumn>ลำดับ</TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-foreground"
                  variant="light"
                  onClick={() => handleSort("schoolName")}
                >
                  ชื่อโรงเรียน
                  {getSortIcon("schoolName")}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-foreground"
                  variant="light"
                  onClick={() => handleSort("total")}
                >
                  ผู้รับบริการ
                  {getSortIcon("total")}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-foreground"
                  variant="light"
                  onClick={() => handleSort("green")}
                >
                  ไม่พบความเสี่ยง
                  {getSortIcon("green")}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-foreground"
                  variant="light"
                  onClick={() => handleSort("greenLow")}
                >
                  เสี่ยงเล็กน้อย
                  {getSortIcon("greenLow")}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-foreground"
                  variant="light"
                  onClick={() => handleSort("yellow")}
                >
                  เสี่ยงปานกลาง
                  {getSortIcon("yellow")}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-foreground"
                  variant="light"
                  onClick={() => handleSort("orange")}
                >
                  เสี่ยงมาก
                  {getSortIcon("orange")}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-foreground"
                  variant="light"
                  onClick={() => handleSort("red")}
                >
                  เสี่ยงรุนแรง
                  {getSortIcon("red")}
                </Button>
              </TableColumn>
            </TableHeader>
            <TableBody>{tableRows}</TableBody>
          </Table>
        </div>
      </CardBody>
    </Card>
  );
};
