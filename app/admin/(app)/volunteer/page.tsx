"use client";

import { useState, ChangeEvent, useEffect, useCallback } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import {
  Referent,
  Volunteer_Type,
  Employee_Type,
  Affiliation,
} from "@prisma/client";

import { VolunteerRenderCell } from "../components/volunteer/render-cell";

import { VolunteerColumnsName as columns } from "@/app/admin/(app)/data/tableColumn";

type ReferentWithRelations = Referent & {
  volunteer_type: Volunteer_Type;
  employee_type: Employee_Type;
  affiliation: Affiliation;
  prefix: string;
  question_count: number;
  status: boolean;
};

export default function VolunteerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [referents, setReferents] = useState<ReferentWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { onOpen } = useDisclosure();

  useEffect(() => {
    fetchReferents();
  }, []);

  const fetchReferents = async () => {
    try {
      const response = await fetch("/api/referent");
      const data = await response.json();

      setReferents(data);
    } finally {
      setIsLoading(false);
    }
  };

  const onRowDetailPress = useCallback(
    (id: string) => {
      const referent = referents.find((r) => r.id.toString() === id);

      if (referent) {
        onOpen();
      }
    },
    [referents]
  );

  const onRowEditPress = useCallback(
    (id: string) => {
      const referent = referents.find((r) => r.id.toString() === id);

      if (referent) {
        onOpen();
      }
    },
    [referents]
  );

  // กรองข้อมูลตามคำค้นหา
  const filteredReferents = referents.filter((referent) =>
    `${referent.firstname} ${referent.lastname}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const pages = Math.ceil(filteredReferents.length / rowsPerPage);
  const items = filteredReferents.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const bottomContent = (
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
          หน้า {page}/{pages} ({filteredReferents.length} รายการ)
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small" />
          <label className="flex items-center text-default-400 text-small">
            แสดงต่อหน้า:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              defaultValue={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
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

  return (
    <div className="my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4">
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-bold">รายชื่ออาสาสมัคร</h1>
        <div className="relative w-1/3">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
          </div>
          <input
            className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ค้นหาอาสาสมัคร..."
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      <div className="max-w-[95rem] mx-auto w-full">
        <div className="w-full flex flex-col gap-4 text-nowrap">
          <Table
            aria-label="Referent Table"
            bottomContent={bottomContent}
            bottomContentPlacement="outside"
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
              emptyContent={"ไม่พบข้อมูล"}
              isLoading={isLoading}
              items={items}
              loadingContent={<Spinner label="กำลังโหลด..." />}
            >
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => (
                    <TableCell>
                      {VolunteerRenderCell({
                        data: item,
                        columnKey,
                        index: referents.findIndex((x) => x.id === item.id) + 1,
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
