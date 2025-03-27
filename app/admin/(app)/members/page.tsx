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
  Modal,
  ModalContent,
  Form,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  User,
  Divider,
  ScrollShadow,
  addToast,
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

import { ProfileAdminData } from "@/types";
import { prefix } from "@/utils/data";
import Loading from "@/app/loading";

const ProfileAdminDataInitData: ProfileAdminData = {
  id: "",
  userId: "",
  providerAccountId: "",
  image: "",
  name: "",
  citizenId: "",
  prefixId: 0,
  firstname: "",
  lastname: "",
  tel: "",
  affiliationId: 0,
  agency: "",
  employeeTypeId: 0,
  professional: "",
  license: "",
  status: 0,
  createdAt: "",
  updatedAt: "",
  roleId: 0,
};

export default function QuestionPage() {
  const [isRequest] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [filterValue, setFilterValue] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileAdminData>(
    ProfileAdminDataInitData
  );
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
      setPages(Math.ceil(filteredItems.length / parseInt(e.target.value)));
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
            isDisabled
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
            หน้า {page}/{pages} ({filteredItems.length} รายการ)
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
      fetch("/api/profile/admin/" + e)
        .then((res) => res.json())
        .then((val) => {
          setSelectedProfile(val);
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
      if (mode === "Edit") {
        setSelectedProfile((prev) => ({
          ...prev,
          [e.target.name]: e.target.value,
        }));
      }
    },
    [selectedProfile]
  );

  const ModalSubmit = useCallback(
    async (e: any) => {
      e.preventDefault();
      const data = JSON.stringify({ profile_data: selectedProfile });

      await fetch("/api/profile/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      }).then(() => {
        GetProfileAdminList();
        onOpenChange();
        addToast({
          color: "success",
          title: "แก้ไขผู้ใช้งาน",
          description: "แก้ไขผู้ใช้งานสำเร็จ",
          timeout: 3000,
        });
      });
    },
    [selectedProfile]
  );

  useEffect(() => {
    if (status !== "loading") {
      if (status === "unauthenticated") {
        router.push("/admin/login");
      } else {
        GetProfileAdminList();
        GetAffiliationList();
        GetEmployeeList();
      }
    }
  }, [session, isLoading]);

  return (
    <Suspense fallback={<Loading />}>
      <div className="max-w-[95rem] my-10 px-4 lg:px-6 mx-auto w-full flex flex-col gap-4">
        <Modal
          backdrop="opaque"
          className="mx-6"
          isDismissable={false}
          isKeyboardDismissDisabled={true}
          isOpen={isOpen}
          placement="center"
          radius="lg"
          size="2xl"
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <Form validationBehavior="native" onSubmit={ModalSubmit}>
                <ModalHeader className="flex flex-col gap-1 w-full">
                  {mode === "View"
                    ? "ดูข้อมูลผู้ใช้งาน"
                    : "แก้ไขข้อมูลผู้ใช้งาน"}
                  <Divider className="mt-3" />
                </ModalHeader>
                <ModalBody className="flex w-full">
                  <div className="w-full">
                    <User
                      avatarProps={{
                        src: selectedProfile.image,
                        size: "lg",
                      }}
                      classNames={{ name: "font-semibold" }}
                      description={
                        <p>Line ID : {selectedProfile.providerAccountId}</p>
                      }
                      name={
                        <>
                          <p>หมายเลข ปชช : {selectedProfile.citizenId}</p>
                          <p>Line : {selectedProfile.name}</p>
                        </>
                      }
                    />
                  </div>
                  <ScrollShadow className="h-[600px]" size={20}>
                    <div className="flex flex-col gap-3 font-semibold">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="หมายเลขโทรศัพท์"
                          labelPlacement="outside"
                          name="tel"
                          placeholder="หมายเลขโทรศัพท์"
                          radius="sm"
                          size="md"
                          value={selectedProfile.tel}
                          variant="bordered"
                          onChange={HandleChange}
                        />
                        <Select
                          className="max-w-xl"
                          errorMessage="กรุณาเลือกคำนำหน้า"
                          isRequired={isRequest}
                          label="คำนำหน้า"
                          labelPlacement="outside"
                          name="prefixId"
                          placeholder="คำนำหน้า"
                          radius="sm"
                          selectedKeys={
                            selectedProfile.prefixId == 0
                              ? ""
                              : selectedProfile.prefixId.toString()
                          }
                          size="md"
                          variant="bordered"
                          onChange={HandleChange}
                        >
                          {prefix.map((prefix) => (
                            <SelectItem key={prefix.key}>
                              {prefix.label}
                            </SelectItem>
                          ))}
                        </Select>
                        <Input
                          isRequired={isRequest}
                          label="ชื่อ"
                          labelPlacement="outside"
                          name="firstname"
                          placeholder="ชื่อ"
                          radius="sm"
                          size="md"
                          value={selectedProfile.firstname}
                          variant="bordered"
                          onChange={HandleChange}
                        />
                        <Input
                          isRequired={isRequest}
                          label="นามสกุล"
                          labelPlacement="outside"
                          name="lastname"
                          placeholder="นามสกุล"
                          radius="sm"
                          size="md"
                          value={selectedProfile.lastname}
                          variant="bordered"
                          onChange={HandleChange}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <Select
                          errorMessage="กรุณาเลือกสังกัด"
                          isRequired={isRequest}
                          label="สังกัด"
                          labelPlacement="outside"
                          name="affiliationId"
                          placeholder="สังกัด"
                          radius="sm"
                          selectedKeys={
                            selectedProfile.affiliationId === 0
                              ? ""
                              : selectedProfile.affiliationId.toString()
                          }
                          size="md"
                          variant="bordered"
                          onChange={HandleChange}
                        >
                          {affiliationList.map((val) => {
                            return (
                              <SelectItem key={val.id}>{val.name}</SelectItem>
                            );
                          })}
                        </Select>
                        <Input
                          isRequired={isRequest}
                          label="หน่วยงาน"
                          labelPlacement="outside"
                          name="agency"
                          placeholder="หน่วยงาน"
                          radius="sm"
                          size="md"
                          value={selectedProfile.agency}
                          variant="bordered"
                          onChange={HandleChange}
                        />
                        <Select
                          errorMessage="กรุณาเลือกประเภทการจ้าง"
                          isRequired={isRequest}
                          label="ประเภทการจ้าง"
                          labelPlacement="outside"
                          name="employeeTypeId"
                          placeholder="ประเภทการจ้าง"
                          radius="sm"
                          selectedKeys={
                            selectedProfile.employeeTypeId === 0
                              ? ""
                              : selectedProfile.employeeTypeId.toString()
                          }
                          size="md"
                          variant="bordered"
                          onChange={HandleChange}
                        >
                          {employeeTypes.map((val) => {
                            return (
                              <SelectItem key={val.id}>{val.name}</SelectItem>
                            );
                          })}
                        </Select>
                        <Input
                          isRequired={false}
                          label="สาขาวิชาชีพ"
                          labelPlacement="outside"
                          name="professional"
                          placeholder="สาขาวิชาชีพ"
                          radius="sm"
                          size="md"
                          value={selectedProfile.professional}
                          variant="bordered"
                          onChange={HandleChange}
                        />

                        <Input
                          isRequired={false}
                          label="เลขที่ใบอนุญาติ"
                          labelPlacement="outside"
                          name="license"
                          placeholder="เลขที่ใบอนุญาติ"
                          radius="sm"
                          size="md"
                          value={selectedProfile.license}
                          variant="bordered"
                          onChange={HandleChange}
                        />
                      </div>
                      <Divider />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select
                          className="max-w-xl"
                          label="สิทธิ์การใช้งาน"
                          labelPlacement="outside"
                          name="roleId"
                          placeholder="สิทธิ์การใช้งาน"
                          radius="sm"
                          selectedKeys={
                            selectedProfile.roleId === 0
                              ? ""
                              : selectedProfile.roleId.toString()
                          }
                          size="md"
                          variant="bordered"
                          onChange={HandleChange}
                        >
                          {roles.map((val) => {
                            return (
                              <SelectItem key={val.id}>{val.name}</SelectItem>
                            );
                          })}
                        </Select>
                        <Select
                          className="max-w-xl"
                          label="สถานะ"
                          labelPlacement="outside"
                          name="status"
                          placeholder="สถานะ"
                          radius="sm"
                          selectedKeys={
                            selectedProfile.status === 0
                              ? ""
                              : selectedProfile.status.toString()
                          }
                          size="md"
                          variant="bordered"
                          onChange={HandleChange}
                        >
                          {statusOptions.map((val) => {
                            return (
                              <SelectItem key={val.uid}>{val.name}</SelectItem>
                            );
                          })}
                        </Select>
                      </div>
                    </div>
                  </ScrollShadow>
                </ModalBody>
                <ModalFooter className="flex w-full items-end">
                  <Button color="default" variant="bordered" onPress={onClose}>
                    ปิด
                  </Button>
                  <Button
                    className="bg-primary shadow-lg shadow-indigo-500/20 font-bold text-white "
                    isDisabled={mode === "View"}
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
    </Suspense>
  );
}
