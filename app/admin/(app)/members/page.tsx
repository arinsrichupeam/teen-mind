"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
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
  useDisclosure,
  Selection,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  Form,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Card,
  CardBody,
} from "@heroui/react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Affiliation, Employee_Type, Profile_Admin } from "@prisma/client";

import { QuestionColumnsName as columns, roles, statusOptions } from "./data";
import { RenderCell } from "./components/render-cell";

import { prefix, Profile_Admin_List } from "@/types";

export default function QuestionPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [filterValue, setFilterValue] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile_Admin_List>();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [profileAdminList, setProfileAdminList] = useState<Profile_Admin[]>([]);
  const [affiliationList, setAffiliationList] = useState<Affiliation[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<Employee_Type[]>([]);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<any>({
    column: "id",
    direction: "ascending",
  });
  const [mode, setMode] = useState("View");
  const { data: session, status } = useSession();
  const router = useRouter();

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = useMemo(() => {
    let filteredUsers = [...profileAdminList];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((val: Profile_Admin) => {
        val.firstname.toLowerCase().includes(filterValue.toLowerCase());
      });
    }
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredUsers = filteredUsers.filter((user) =>
        Array.from(statusFilter).includes(user.status.toString())
      );
    }

    return filteredUsers;
  }, [profileAdminList, filterValue, statusFilter]);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: Profile_Admin, b: Profile_Admin) => {
      const first = a[sortDescriptor.column as keyof Profile_Admin] as number;
      const second = b[sortDescriptor.column as keyof Profile_Admin] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const onRowsPerPageChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(parseInt(e.target.value));
      setPages(Math.ceil(sortedItems.length / parseInt(e.target.value)));
      setPage(1);
    },
    [pages, items]
  );

  // const onSearchChange = useCallback((value?: string) => {
  //   if (value) {
  //     setFilterValue(value);
  //     setPage(1);
  //   } else {
  //     setFilterValue("");
  //   }
  // }, []);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            classNames={{
              base: "w-full sm:max-w-[44%]",
              inputWrapper: "border-1",
            }}
            placeholder="Search by name..."
            size="md"
            startContent={
              <MagnifyingGlassIcon className="size-6 text-default-400" />
            }
            value={filterValue}
            variant="bordered"
            onClear={() => setFilterValue("")}
          // onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  size="sm"
                  variant="flat"
                >
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {status.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    // onSearchChange,
    onRowsPerPageChange,
    profileAdminList.length,
    hasSearchFilter,
  ]);

  const bottomContent = useMemo(() => {
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
            onChange={setPage}
          />
        </div>
        <div className="mt-4 md:mt-[-30px] px-2 flex justify-between items-center">
          <div className="w-[30%] text-small text-default-400">
            หน้า {page}/{pages} ({profileAdminList.length} รายการ)
          </div>
          <div className="flex justify-between items-center">
            <span className="text-default-400 text-small" />
            <label className="flex items-center text-default-400 text-small">
              Rows per page:
              <select
                className="bg-transparent outline-none text-default-400 text-small"
                defaultValue={rowsPerPage}
                onChange={onRowsPerPageChange}
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
  }, [selectedProfile, items.length, page, pages, hasSearchFilter]);

  const onRowDetailPress = useCallback(
    async (e: any) => {
      await fetch("/api/profile/admin/" + e)
        .then((res) => res.json())
        .then((val) => {
          setSelectedProfile(val);
          setMode("View");
          onOpen();
        });
    },
    [selectedProfile]
  );

  const onRowEditPress = useCallback(
    (e: any) => {
      fetch("/api/question/" + e)
        .then((res) => res.json())
        .then((val) => {
          setSelectedProfile(val[0]);
          setMode("Edit");
          onOpen();
        });
    },
    [selectedProfile]
  );

  const GetProfileAdminList = useCallback(async () => {
    await fetch("/api/profile/admin")
      .then((res) => res.json())
      .then((val) => {
        setProfileAdminList(val);
        setPages(Math.ceil(val.length / rowsPerPage));
        setIsLoading(false);
      });
  }, [profileAdminList]);

  const GetAffiliationList = useCallback(async () => {
    await fetch("/api/data/affiliation")
      .then((res) => res.json())
      .then((val) => {
        setAffiliationList(val);
      });
  }, [affiliationList]);

  const GetEmployeeList = useCallback(async () => {
    await fetch("/api/data/employee")
      .then((res) => res.json())
      .then((val) => {
        setEmployeeTypes(val);
      });
  }, [employeeTypes]);

  const HandleChange = useCallback(
    (e: any) => {
      // console.log(e);
      setProfileAdminList((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    },
    [selectedProfile]
  );


  useEffect(() => {
    if (status !== "loading" && status === "unauthenticated") {
      router.push("/admin/login");
    } else {
      GetProfileAdminList();
      GetAffiliationList();
      GetEmployeeList();
    }
  }, [isLoading]);

  return (
    <div className="my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4">
      <div className="max-w-[95rem] mx-auto w-full">
        <Modal
          hideCloseButton={true}
          isKeyboardDismissDisabled={true}
          isDismissable={false}
          backdrop="opaque"
          isOpen={isOpen}
          placement="center"
          radius="lg"
          size="sm"
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <Form validationBehavior="native">
                <ModalHeader className="flex flex-col gap-1">
                  {mode === "View"
                    ? "ดูข้อมูลผู้ใช้งาน"
                    : "แก้ไขข้อมูลผู้ใช้งาน"}
                </ModalHeader>
                <ModalBody className="flex w-full">
                  <div className="flex flex-col gap-4">
                    <Input
                      label="รหัสประชาชน"
                      labelPlacement="inside"
                      name="citizenId"
                      placeholder="รหัสประชาชน"
                      radius="md"
                      size="sm"
                      value={selectedProfile?.profile_admin[0].citizenId}
                      variant="bordered"
                      onChange={HandleChange}
                    />
                    <Select
                      className="max-w-xl"
                      errorMessage="กรุณาเลือกคำนำหน้า"
                      // isRequired={request}
                      label="คำนำหน้า"
                      labelPlacement="inside"
                      name="prefixId"
                      placeholder="คำนำหน้า"
                      radius="md"
                      // selectedKeys={
                      //   data?.profile_admin[0].prefixId === 0
                      //     ? ""
                      //     : data?.profile_admin[0].prefixId.toString()
                      // }
                      size="sm"
                      variant="bordered"
                    // onChange={HandleChange}
                    >
                      {prefix.map((prefix) => (
                        <SelectItem key={prefix.key}>
                          {prefix.label}
                        </SelectItem>
                      ))}
                    </Select>
                    <Input
                      label="ชื่อ"
                      labelPlacement="inside"
                      name="firstname"
                      placeholder="ชื่อ"
                      radius="md"
                      size="sm"
                      // value={data?.profile_admin[0].firstname}
                      variant="bordered"
                    // onChange={HandleChange}
                    />
                    <Input
                      label="นามสกุล"
                      labelPlacement="inside"
                      name="lastname"
                      placeholder="นามสกุล"
                      radius="md"
                      size="sm"
                      // value={data?.profile_admin[0].lastname}
                      variant="bordered"
                    // onChange={HandleChange}
                    />
                    <Select
                      className="max-w-xl"
                      label="สถานะ"
                      labelPlacement="inside"
                      name="status"
                      placeholder="สถานะ"
                      radius="md"
                      // selectedKeys={
                      //   data?.profile_admin[0].status === 0
                      //     ? ""
                      //     : data?.profile_admin[0].status.toString()
                      // }
                      size="sm"
                      variant="bordered"
                    // onChange={HandleChange}
                    >
                      {statusOptions.map((val) => {
                        return (
                          <SelectItem key={val.uid}>{val.name}</SelectItem>
                        );
                      })}
                    </Select>
                    <Select
                      className="max-w-xl"
                      label="สิทธิ์การใช้งาน"
                      labelPlacement="inside"
                      name="role"
                      placeholder="สิทธิ์การใช้งาน"
                      radius="md"
                      // selectedKeys={
                      //   data?.profile_admin[0].role[0].id === 0
                      //     ? ""
                      //     : data?.profile_admin[0].role[0].id.toString()
                      // }
                      size="sm"
                      variant="bordered"
                    // onChange={HandleChange}
                    >
                      {roles.map((val) => {
                        return (
                          <SelectItem key={val.id}>{val.name}</SelectItem>
                        );
                      })}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-4">
                    <Select
                      className="max-w-xl"
                      errorMessage="กรุณาเลือกสังกัด"
                      // isRequired={request}
                      label="สังกัด"
                      labelPlacement="inside"
                      name="affiliationId"
                      placeholder="สังกัด"
                      radius="md"
                      // selectedKeys={
                      //   data?.profile_admin[0].affiliationId === 0
                      //     ? ""
                      //     : data?.profile_admin[0].affiliationId.toString()
                      // }
                      size="sm"
                      variant="bordered"
                    // onChange={HandleChange}
                    >
                      {affiliationList.map((val) => {
                        return (
                          <SelectItem key={val.id}>{val.name}</SelectItem>
                        );
                      })}
                    </Select>
                    <Input
                      label="หน่วยงาน"
                      labelPlacement="inside"
                      name="agency"
                      placeholder="หน่วยงาน"
                      radius="md"
                      size="sm"
                      // value={data?.profile_admin[0].agency}
                      variant="bordered"
                    // onChange={HandleChange}
                    />
                    <Select
                      className="max-w-xl"
                      errorMessage="กรุณาเลือกประเภทการจ้าง"
                      // isRequired={request}
                      label="ประเภทการจ้าง"
                      labelPlacement="inside"
                      name="employeeTypeId"
                      placeholder="ประเภทการจ้าง"
                      radius="md"
                      // selectedKeys={
                      //   data?.profile_admin[0].employeeTypeId === 0
                      //     ? ""
                      //     : data?.profile_admin[0].employeeTypeId.toString()
                      // }
                      size="sm"
                      variant="bordered"
                    // onChange={HandleChange}
                    >
                      {employeeTypes.map((val) => {
                        return (
                          <SelectItem key={val.id}>{val.name}</SelectItem>
                        );
                      })}
                    </Select>
                    <Input
                      label="สาขาวิชาชีพ"
                      labelPlacement="inside"
                      name="professional"
                      placeholder="สาขาวิชาชีพ"
                      radius="md"
                      size="sm"
                      // value={data?.profile_admin[0].professional}
                      variant="bordered"
                    // onChange={HandleChange}
                    />

                    <Input
                      label="เลขที่ใบอนุญาติ"
                      labelPlacement="inside"
                      name="license"
                      placeholder="เลขที่ใบอนุญาติ"
                      radius="md"
                      size="sm"
                      // value={data?.profile_admin[0].license}
                      variant="bordered"
                    // onChange={HandleChange}
                    />
                  </div>
                </ModalBody>
                <ModalFooter className="flex w-full items-end">
                  <Button color="default" variant="bordered" onPress={onClose}>
                    ปิด
                  </Button>
                  <Button
                    className="bg-primary shadow-lg shadow-indigo-500/20 font-bold text-white "
                    type="submit"
                    variant="bordered"
                  >
                    {mode === "Create" ? "เพิ่ม" : "แก้ไข"}
                  </Button>
                </ModalFooter>
              </Form>
            )}
          </ModalContent>
        </Modal>
        <div className="w-full flex flex-col gap-4 text-nowrap">
          <Table
            isHeaderSticky
            aria-label="Question List Table"
            bottomContent={bottomContent}
            bottomContentPlacement="outside"
            classNames={{
              wrapper: "max-h-[calc(65vh)]",
            }}
            // sortDescriptor={sortDescriptor}
            topContent={topContent}
            topContentPlacement="outside"
          // onSortChange={setSortDescriptor}
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
              emptyContent={"No users found"}
              isLoading={isLoading}
              items={sortedItems}
              loadingContent={<Spinner label="Loading..." />}
            >
              {(item) => (
                <TableRow>
                  {(columnKey) => (
                    <TableCell className="text-nowrap">
                      {RenderCell({
                        data: item,
                        affiliationList: affiliationList,
                        columnKey: columnKey,
                        index:
                          profileAdminList.findIndex((x) => x.id == item.id) +
                          1,
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
