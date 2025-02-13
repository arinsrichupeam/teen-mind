"use client";

import { Spinner } from "@heroui/spinner";
import {
  SortDescriptor,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { useAsyncList } from "@react-stately/data";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Pagination } from "@heroui/pagination";

import { RenderCell } from "../components/render-cell";

// export function capitalize(s: string) {
//   return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
// }

export const columns = [
  { name: "ลำดับที่", uid: "id" },
  { name: "ชื่อ", uid: "name", sortable: true },
  { name: "อายุ", uid: "age" },
  { name: "โรงเรียน", uid: "school" },
  { name: "ผลการประเมิน", uid: "result" },
  { name: "วันที่ประเมิน", uid: "date" },
  { name: "สถานะ", uid: "status" },
  { name: "", uid: "actions" },
];

export const statusOptions = [
  { name: "Active", uid: "active" },
  { name: "Paused", uid: "paused" },
  { name: "Vacation", uid: "vacation" },
];

export default function App() {
  // const [isLoading, setIsLoading] = useState(true);
  // const [filterValue, setFilterValue] = useState("");
  // const [selectedKeys, setSelectedKeys] = useState([]);
  // const [statusFilter, setStatusFilter] = useState(["all"]);
  // const [data, setData] = useState<QuestionsData[]>([]);
  // const [page, setPage] = useState(2);
  // const [rowsPerPage, setRowsPerPage] = useState(5);
  // const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
  //   column: "age",
  //   direction: "ascending",
  // });

  // const list = useAsyncList({
  //   async load({ signal }) {
  //     return fetch("/api/question", { signal })
  //       .then((res) => res.json())
  //       .then((val) => {
  //         setIsLoading(false);
  //         setPage(page - 1);

  //         return { items: val.questions_data };
  //       });
  //   },
  //   // async sort({ items, sortDescriptor }) {
  //   //   return {
  //   //     items: items.sort((a, b) => {
  //   //       const first = (a as any)[sortDescriptor.column];
  //   //       const second = (b as any)[sortDescriptor.column];
  //   //       let cmp = (parseInt(first) || first) < (parseInt(second) || second) ? -1 : 1;

  //   //       if (sortDescriptor.direction === "descending") {
  //   //         cmp *= -1;
  //   //       }

  //   //       return cmp;
  //   //     }),
  //   //   };
  //   // },
  // });

  // const hasSearchFilter = Boolean(filterValue);

  // const filteredItems = useMemo(() => {
  //   let filteredUsers = [...data];

  //   if (hasSearchFilter) {
  //     filteredUsers = filteredUsers.filter((user) =>
  //       user.User.profile[0].firstname
  //         .toLowerCase()
  //         .includes(filterValue.toLowerCase())
  //     );
  //   }
  //   if (
  //     statusFilter[0] !== "all" &&
  //     Array.from(statusFilter).length !== statusOptions.length
  //   ) {
  //     filteredUsers = filteredUsers.filter((user) =>
  //       Array.from(statusFilter).includes(user.status.toString())
  //     );
  //   }

  //   return filteredUsers;
  // }, [data, filterValue, statusFilter]);

  // const pages = Math.ceil(filteredItems.length / rowsPerPage);
  // const pages = useMemo(() => {
  //   return list.items.length ? Math.ceil(list.items.length / rowsPerPage) : 0;
  // }, [list.items.length, rowsPerPage]);

  // const items = useMemo(() => {
  //   const start = (page - 1) * rowsPerPage;
  //   const end = start + rowsPerPage;

  //   return filteredItems.slice(start, end);
  // }, [page, filteredItems, rowsPerPage]);

  // const sortedItems = useMemo(() => {
  //   return [...items].sort((a: QuestionsData, b: QuestionsData) => {
  //     const first = a[sortDescriptor.column as keyof QuestionsData] as number;
  //     const second = b[sortDescriptor.column as keyof QuestionsData] as number;
  //     const cmp = first < second ? -1 : first > second ? 1 : 0;

  //     return sortDescriptor.direction === "descending" ? -cmp : cmp;
  //   });
  // }, [sortDescriptor, items]);

  // const onNextPage = useCallback(() => {
  //   if (page < pages) {
  //     setPage(page + 1);
  //   }
  // }, [page, pages]);

  // const onPreviousPage = useCallback(() => {
  //   if (page > 1) {
  //     setPage(page - 1);
  //   }
  // }, [page]);

  // const onRowsPerPageChange = useCallback(
  //   (e: ChangeEvent<HTMLSelectElement>) => {
  //     setRowsPerPage(Number(e.target.value));
  //     setPage(1);
  //   },
  //   []
  // );

  // const onSearchChange = useCallback((value?: string) => {
  //   if (value) {
  //     setFilterValue(value);
  //     setPage(1);
  //   } else {
  //     setFilterValue("");
  //   }
  // }, []);

  // const onClear = useCallback(() => {
  //   setFilterValue("");
  //   setPage(1);
  // }, []);

  // const topContent = useMemo(() => {
  //   return (
  //     <div className="flex flex-col gap-4">
  //       <div className="flex justify-between gap-3 items-end">
  //         <p>{pages}</p>
  //         {/* <Input
  //           isClearable
  //           className="w-full sm:max-w-[44%]"
  //           placeholder="Search by name..."
  //           startContent={<SearchIcon />}
  //           value={filterValue}
  //           onClear={() => onClear()}
  //           onValueChange={onSearchChange}
  //         /> */}
  //         <div className="flex gap-3">
  //           <Dropdown>
  //             <DropdownTrigger className="hidden sm:flex">
  //               <Button
  //                 endContent={<ChevronDownIcon className="size-4 text-small" />}
  //                 variant="flat"
  //               >
  //                 Status
  //               </Button>
  //             </DropdownTrigger>
  //             <DropdownMenu
  //               disallowEmptySelection
  //               aria-label="Table Columns"
  //               closeOnSelect={false}
  //               selectedKeys={statusFilter}
  //               selectionMode="multiple"
  //               onSelectionChange={(val) => setStatusFilter([val.toString()])}
  //             >
  //               {statusOptions.map((status) => (
  //                 <DropdownItem key={status.uid} className="capitalize">
  //                   {capitalize(status.name)}
  //                 </DropdownItem>
  //               ))}
  //             </DropdownMenu>
  //           </Dropdown>
  //         </div>
  //       </div>
  //       <div className="flex justify-end items-center">
  //         <label className="flex items-center text-default-400 text-small">
  //           Rows per page:
  //           <select
  //             className="bg-transparent outline-none text-default-400 text-small"
  //             defaultValue={rowsPerPage}
  //             onChange={onRowsPerPageChange}
  //           >
  //             <option value="5">5</option>
  //             <option value="10">10</option>
  //             <option value="15">15</option>
  //           </select>
  //         </label>
  //       </div>
  //     </div>
  //   );
  // }, [
  //   filterValue,
  //   statusFilter,
  //   onSearchChange,
  //   onRowsPerPageChange,
  //   data.length,
  //   hasSearchFilter,
  // ]);

  // const bottomContent = useMemo(() => {
  //   return (
  //     <div className="py-2 px-2 flex justify-between items-center">
  //       <span className="w-[30%] text-small text-default-400">
  //         หน้า {page}/{pages} ({list.items.length} รายการ)
  //       </span>
  //       <Pagination
  //         isCompact
  //         showControls
  //         showShadow
  //         color="primary"
  //         page={page}
  //         total={pages}
  //         onChange={setPage}
  //       />
  //       <div className="hidden sm:flex w-[30%] justify-end gap-2">
  //         <Button
  //           isDisabled={pages === 1}
  //           size="sm"
  //           variant="flat"
  //           onPress={onPreviousPage}
  //         >
  //           Previous
  //         </Button>
  //         <Button
  //           isDisabled={pages === 1}
  //           size="sm"
  //           variant="flat"
  //           onPress={onNextPage}
  //         >
  //           Next
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }, [list.items.length, page, pages]);

  // useEffect(() => {
  //   fetch("/api/question")
  //     .then((res) => res.json())
  //     .then((val) => {
  //       setData(val.questions_data);
  //     });
  // }, []);

  // const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <div className="my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4">
      <div className="max-w-[95rem] mx-auto w-full">
        <div className=" w-full flex flex-col gap-4">
          <Table
            isHeaderSticky
            aria-label="Example table with custom cells, pagination and sorting"
            // bottomContent={bottomContent}
            // bottomContentPlacement="outside"
            classNames={{
              wrapper: "max-h-[calc(65vh)]",
            }}
            // selectedKeys={selectedKeys}
            // selectionMode="multiple"
            // sortDescriptor={sortDescriptor}
            // topContent={topContent}
            // topContentPlacement="outside"
            // onSelectionChange={() => setSelectedKeys}
            // onSortChange={list.sort}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.uid}>{column.name}</TableColumn>
              )}
            </TableHeader>
            <TableBody
              emptyContent={"No users found"}
              // isLoading={isLoading}
              // items={list.items}
              loadingContent={<Spinner label="Loading..." />}
            >
              {[]}
              {/* {(item) => (
                <TableRow>
                  {(columnKey) => (
                    <TableCell>
                      {RenderCell({ data: item, columnKey: columnKey })}
                    </TableCell>
                  )}
                </TableRow>
              )} */}
            </TableBody>
          </Table>

          {/* <Drawer isOpen={isOpen} size={"4xl"} onClose={onClose}>
            <DrawerContent>
              {(onClose) => (
                <>
                  <DrawerHeader className="flex flex-col gap-1">
                    Drawer Title
                  </DrawerHeader>
                  <DrawerBody>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Nullam pulvinar risus non risus hendrerit venenatis.
                      Pellentesque sit amet hendrerit risus, sed porttitor quam.
                    </p>
                    <p>
                      Magna exercitation reprehenderit magna aute tempor
                      cupidatat consequat elit dolor adipisicing. Mollit dolor
                      eiusmod sunt ex incididunt cillum quis. Velit duis sit
                      officia eiusmod Lorem aliqua enim laboris do dolor
                      eiusmod.
                    </p>
                  </DrawerBody>
                  <DrawerFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Close
                    </Button>
                    <Button color="primary" onPress={onClose}>
                      Action
                    </Button>
                  </DrawerFooter>
                </>
              )}
            </DrawerContent>
          </Drawer> */}
        </div>
      </div>
    </div>
  );
}
