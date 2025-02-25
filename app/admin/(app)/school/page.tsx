"use client"

import { Button, Pagination, useDisclosure } from "@heroui/react";
import TableSchool from "./components/table-scool";
import TableSearch from "./components/search-scool";

import { useMemo } from "react";
import ModalFrom from "./components/modal-scool";
export default function School() {


  const { isOpen,onOpen,onClose } = useDisclosure();



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

  return (
    <div className=" my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4 ">
      {/* บน */}
      <div className="flex justify-between items-end ">
        <h3 className="hidden md:block text-lg font-semibold">
          จัดการโรงเรียน
        </h3>

        <div className="flex gap-4">
          <TableSearch />
          <ModalFrom isOpen={isOpen} onOpen={onOpen}/>
        </div>
      </div>

      {/* ล่าง */}
      <div className="">
        <TableSchool bottomContent={bottomContent} />
      </div>
    </div>
  );
}


