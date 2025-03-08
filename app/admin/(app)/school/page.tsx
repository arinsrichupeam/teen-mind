"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  useDisclosure,
  Pagination,
  Spinner,
  Button,
  Modal,
  Autocomplete,
  AutocompleteItem,
  Form,
  Input,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
  Alert,
} from "@heroui/react";
import { School, Districts } from "@prisma/client";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

import { SchoolRenderCell } from "./components/rendercell-scool";
import { SchoolListColumnsName as columns } from "./data";

const schoolInitValue: School = {
  name: "",
  id: 0,
  districtId: 0,
  status: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function SchoolListPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [schoolList, setSchoolList] = useState<School[]>([]);
  const [districtData, setDistrictData] = useState<Districts[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School>(schoolInitValue);
  const [showAlert, setShowAlert] = useState(false);
  const [mode, setMode] = useState("View");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [sortDescriptor, setSortDescriptor] = useState<any>({
    column: "id",
    direction: "ascending",
  });

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return schoolList.slice(start, end);
  }, [page, schoolList, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: School, b: School) => {
      const first = a[sortDescriptor.column as keyof School] as number;
      const second = b[sortDescriptor.column as keyof School] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const onRowsPerPageChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(parseInt(e.target.value));
      setPages(Math.ceil(schoolList.length / parseInt(e.target.value)));
      setPage(1);
    },
    [pages, items]
  );

  const onRowViewPress = useCallback((e: any) => {
    fetch("/api/data/school/" + e)
      .then((res) => res.json())
      .then((val) => {
        setSelectedSchool(val[0]);
        setMode("View");
        onOpen();
      });
  }, []);

  const onRowEditPress = useCallback((e: any) => {
    fetch("/api/data/school/" + e)
      .then((res) => res.json())
      .then((val) => {
        setSelectedSchool(val[0]);
        setMode("Edit");
        onOpen();
      });
  }, []);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

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
            หน้า {page}/{pages} ({schoolList.length} รายการ)
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
  }, [items.length, page, pages]);

  const CreateSchool = () => {
    setMode("Create");
    setSelectedSchool(schoolInitValue);
    onOpen();
  };

  const schoolChange = useCallback((e: any) => {
    const name = e.target.name;
    const value = e.target.value;

    setSelectedSchool((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const onSubmit = useCallback(
    async (e: any) => {
      e.preventDefault();

      const data = JSON.stringify({ school_data: selectedSchool });

      await fetch("/api/data/school", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      }).then((res) => {
        if (res.status === 200) {
          handleAlert();
          GetSchool();
          onOpenChange();
        }
      });
    },
    [selectedSchool]
  );

  const handleAlert = () => {
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  const GetSchool = async () => {
    await fetch("/api/data/school")
      .then((res) => res.json())
      .then((val) => {
        setSchoolList(val);
        setPages(Math.ceil(val.length / rowsPerPage));
        setIsLoading(false);
      });
  };

  const GetDistrict = async (id: number) => {
    await fetch("/api/data/districts/" + id)
      .then((res) => res.json())
      .then((val) => {
        setDistrictData(val);
      });
  };

  useEffect(() => {
    // ข้อมูลโรงเรียน
    GetSchool();

    // ข้อมูลเขตใน กทม
    GetDistrict(1);
  }, [isLoading]);

  return (
    <div className=" my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4 ">
      <Modal
        backdrop="opaque"
        classNames={{
          body: "py-6",
          backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
          closeButton: "hover:bg-white/5 active:bg-white/10",
        }}
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        isOpen={isOpen}
        placement="center"
        radius="lg"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <Form validationBehavior="native" onSubmit={onSubmit}>
              <ModalHeader className="flex flex-col gap-1">
                {mode === "Create" ? "เพิ่มโรงเรียน" : "แก้ไขโรงเรียน"}
              </ModalHeader>
              <ModalBody className="flex w-full">
                <Input
                  isRequired
                  errorMessage="กรุณากรอกชื่อโรงเรียน"
                  label="ชื่อโรงเรียน"
                  labelPlacement="outside"
                  name="name"
                  placeholder="กรุณากรอกชื่อโรงเรียน"
                  value={selectedSchool.name}
                  variant="bordered"
                  onChange={schoolChange}
                />
                <Autocomplete
                  isRequired
                  defaultItems={districtData}
                  defaultSelectedKey={selectedSchool.districtId?.toString()}
                  errorMessage="กรุณาเลือกเขต"
                  label="เขต"
                  labelPlacement="outside"
                  placeholder="กรุณาเลือกเขต"
                  radius="md"
                  variant="bordered"
                  onSelectionChange={(val) =>
                    schoolChange({ target: { name: "districtId", value: val } })
                  }
                >
                  {(item) => (
                    <AutocompleteItem key={item.id}>
                      {item.nameInThai}
                    </AutocompleteItem>
                  )}
                </Autocomplete>
                <Switch
                  isSelected={selectedSchool.status}
                  name="status"
                  onValueChange={(val) =>
                    schoolChange({ target: { name: "status", value: val } })
                  }
                >
                  สถานะ
                </Switch>
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
      <Alert
        color={"success"}
        isVisible={showAlert}
        title={"บันทึกเรียบร้อย"}
      />

      {/* บน */}
      <div className="flex justify-between items-end ">
        <h3 className="text-lg font-semibold">จัดการโรงเรียน</h3>

        <div className="flex gap-4">
          <Button
            className="font-bold text-medium"
            color="primary"
            onPress={CreateSchool}
          >
            เพิ่ม
          </Button>
        </div>
      </div>

      {/* ล่าง */}
      <div className="text-nowrap">
        <Table
          isHeaderSticky
          aria-label="Question List Table"
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: "max-h-[calc(65vh)]",
          }}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
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
            emptyContent="ไม่มีข้อมูล"
            isLoading={isLoading}
            items={sortedItems}
            loadingContent={<Spinner label="Loading..." />}
          >
            {(item) => (
              <TableRow>
                {(columnKey) => (
                  <TableCell className="text-nowrap">
                    {SchoolRenderCell({
                      data: item,
                      columnKey,
                      index: schoolList.findIndex((x) => x.id == item.id) + 1,
                      district: districtData,
                      viewSchool: onRowViewPress,
                      editSchool: onRowEditPress,
                    })}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
