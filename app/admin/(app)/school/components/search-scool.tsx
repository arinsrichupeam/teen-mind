"use client";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { Input } from "@heroui/react";

const TableSearch = () => {
  return (
    <div className="">
      <Input
        isClearable
        classNames={{
          base: "w-full",
          inputWrapper: "border-1",
        }}
        placeholder="ค้นหาโรงเรียน"
        size="md"
        startContent={
          <MagnifyingGlassIcon className="size-6 text-default-400" />
        }
      />
    </div>
  );
};

export default TableSearch;
