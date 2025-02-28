"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  getKeyValue,
} from "@heroui/react";
import { Pagination, useDisclosure } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";


// import TableSchool from "./components/table-scool";
// import TableSearch from "./components/search-scool";
import ModalFrom from "./components/modal-scool";
import { SchoolRenderCell } from "./components/rendercell-scool";
import { School } from "@prisma/client";




export default function schoolLists() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [schoolList, setSchoolList] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className=" text-small text-default-400">
          หน้า {1}/{10} ({200} รายการ)
        </span>
        <Pagination
          isCompact
          showControls
          // showShadow
          color="primary"
          page={1}
          total={10}
        // onChange={setPage}
        />
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small" />
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
            // defaultValue={rowsPerPage}
            // onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
        {/* <div className="hidden sm:flex w-[30%] justify-end gap-2">
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
        </div> */}
      </div>
    );
  }, []);


  useEffect(() => {
    fetch("/api/data/school")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched Data:", data); // Debug
        setSchoolList(data);
        // setIsLoading(false);
      })

  }, [isLoading]);

  return (
    <div className=" my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4 ">
      {/* บน */}
      <div className="flex justify-between items-end ">
        <h3 className="hidden md:block text-lg font-semibold">
          จัดการโรงเรียน
        </h3>

        <div className="flex gap-4">
          {/* <TableSearch /> */}
          <ModalFrom
            isOpen={isOpen}
            onOpen={onOpen}
            onOpenChange={onOpenChange}
          />
        </div>
      </div>

      {/* ล่าง */}
      <div className="">

        <Table bottomContent={bottomContent} bottomContentPlacement="outside">
          <TableHeader>
            <TableColumn key="id" className="">
              ลำดับที่
            </TableColumn>
            <TableColumn key="school" className="">
              ชื่อโรงเรียน
            </TableColumn>
            <TableColumn key="area" className="">
              เขต
            </TableColumn>
            <TableColumn key="status" className="">
              สถานะ
            </TableColumn>
            <TableColumn key="actions" className="">
              acation
            </TableColumn>
          </TableHeader>

          <TableBody emptyContent="ไม่มีข้อมูล" items={schoolList} >
            {(item =>
              <TableRow >
                {(columnKey) =>
                  <TableCell>
                    {SchoolRenderCell({
                      data: item,
                      columnKey: columnKey,
                      index: schoolList.findIndex((x) => x.id == item.id) + 1,
                      // selectKey: onRowPress,
                    })}
                  </TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
