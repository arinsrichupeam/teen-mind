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
  addToast,
  DatePicker,
} from "@heroui/react";
import { School, Districts, School_Screening } from "@prisma/client";
import {
  ChangeEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import router from "next/router";
import { useSession } from "next-auth/react";

import { SchoolListColumnsName as columns } from "../data/tableColumn";
import { AuthGuard } from "../components/auth-guard";

import { SchoolRenderCell } from "./components/render-cell-school";

import { TableSortDescriptor } from "@/types";
import { safeParseDateForPicker } from "@/utils/helper";
import Loading from "@/app/loading";

type SchoolWithScreenings = School & {
  screenings?: School_Screening[];
};

type ScreeningFormRow = {
  round: number;
  startDate: Date | null;
  endDate: Date | null;
};

function toDatePickerValue(
  val: Date | string | null | undefined
): import("@internationalized/date").CalendarDate | null | undefined {
  const p = safeParseDateForPicker(val);

  return p != null && typeof p !== "string"
    ? (p as import("@internationalized/date").CalendarDate)
    : undefined;
}

function screeningsFromSchool(
  school: SchoolWithScreenings
): ScreeningFormRow[] {
  const rows = (school.screenings ?? [])
    .slice()
    .sort((a, b) => a.round - b.round)
    .map((s) => ({
      round: s.round,
      startDate: s.startDate ? new Date(s.startDate) : null,
      endDate: s.endDate ? new Date(s.endDate) : null,
    }));

  if (rows.length === 0 && school.screeningDate) {
    return [
      {
        round: 1,
        startDate: new Date(school.screeningDate),
        endDate: new Date(school.screeningDate),
      },
    ];
  }

  if (rows.length === 0) {
    return [
      { round: 1, startDate: null, endDate: null },
      { round: 2, startDate: null, endDate: null },
    ];
  }

  return rows;
}

const schoolInitValue: SchoolWithScreenings = {
  name: "",
  id: 0,
  districtId: 0,
  status: true,
  screeningDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  screenings: [],
};

export default function SchoolListPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [schoolList, setSchoolList] = useState<SchoolWithScreenings[]>([]);
  const [districtData, setDistrictData] = useState<Districts[]>([]);
  const [selectedSchool, setSelectedSchool] =
    useState<SchoolWithScreenings>(schoolInitValue);
  const [screeningRows, setScreeningRows] = useState<ScreeningFormRow[]>(
    screeningsFromSchool(schoolInitValue)
  );
  const [mode, setMode] = useState("View");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { data: session, status } = useSession();

  const [sortDescriptor, setSortDescriptor] = useState<TableSortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  const [searchQuery, setSearchQuery] = useState("");

  const filteredSchoolList = useMemo(() => {
    if (!searchQuery.trim()) {
      return schoolList;
    }

    return schoolList.filter((school) =>
      school.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [schoolList, searchQuery]);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredSchoolList.slice(start, end);
  }, [page, filteredSchoolList, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: School, b: School) => {
      const first = a[sortDescriptor.column as keyof School] as number;
      const second = b[sortDescriptor.column as keyof School] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const onRowsPerPageChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(parseInt(e.target.value));
      setPages(Math.ceil(filteredSchoolList.length / parseInt(e.target.value)));
      setPage(1);
    },
    [filteredSchoolList]
  );

  const openSchoolModal = useCallback(
    (school: SchoolWithScreenings, nextMode: string) => {
      setSelectedSchool(school);
      setScreeningRows(screeningsFromSchool(school));
      setMode(nextMode);
      onOpen();
    },
    [onOpen]
  );

  const onRowViewPress = useCallback(
    (schoolId: string | number) => {
      fetch("/api/data/school/" + schoolId)
        .then((res) => res.json())
        .then((val) => {
          openSchoolModal(val[0], "View");
        });
    },
    [openSchoolModal]
  );

  const onRowEditPress = useCallback(
    (schoolId: string | number) => {
      fetch("/api/data/school/" + schoolId)
        .then((res) => res.json())
        .then((val) => {
          openSchoolModal(val[0], "Edit");
        });
    },
    [openSchoolModal]
  );

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
            หน้า {page}/{pages} ({filteredSchoolList.length} รายการ)
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
  }, [
    filteredSchoolList.length,
    page,
    pages,
    rowsPerPage,
    onRowsPerPageChange,
  ]);

  const CreateSchool = () => {
    setMode("Create");
    setSelectedSchool(schoolInitValue);
    setScreeningRows(screeningsFromSchool(schoolInitValue));
    onOpen();
  };

  const schoolChange = useCallback(
    (
      e:
        | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
        | {
            target: {
              name: string;
              value: string | number | boolean | Date | null;
            };
          }
    ) => {
      const name = e.target.name;
      const value = e.target.value;

      setSelectedSchool((prev) => ({
        ...prev,
        [name]: name === "status" ? Boolean(value) : value,
      }));
    },
    []
  );

  const updateScreeningRow = useCallback(
    (index: number, field: "startDate" | "endDate", value: Date | null) => {
      setScreeningRows((prev) =>
        prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
      );
    },
    []
  );

  const addScreeningRound = useCallback(() => {
    setScreeningRows((prev) => {
      const nextRound =
        prev.length === 0 ? 1 : Math.max(...prev.map((r) => r.round)) + 1;

      return [...prev, { round: nextRound, startDate: null, endDate: null }];
    });
  }, []);

  const removeScreeningRound = useCallback((index: number) => {
    setScreeningRows((prev) => {
      const next = prev.filter((_, i) => i !== index);

      return next.map((row, i) => ({ ...row, round: i + 1 }));
    });
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const validScreenings = screeningRows
        .filter((row) => row.startDate != null)
        .map((row, index) => ({
          round: index + 1,
          startDate: row.startDate,
          endDate: row.endDate ?? row.startDate,
        }));

      if (validScreenings.length === 0) {
        addToast({
          title: "กรุณากรอกวันที่คัดกรอง",
          color: "danger",
          description: "ต้องมีอย่างน้อย 1 รอบคัดกรอง",
          timeout: 2500,
        });

        return;
      }

      const payload = {
        ...selectedSchool,
        screeningDate: validScreenings[0]?.startDate ?? null,
        screenings: validScreenings,
      };

      const data = JSON.stringify({ school_data: payload });

      await fetch("/api/data/school", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      }).then((res) => {
        if (res.status === 200) {
          GetData();
          onOpenChange();
          addToast({
            title: "บันทึกสำเร็จ",
            color: "success",
            description: "บันทึกสำเร็จ",
            timeout: 2000,
          });
        }
      });
    },
    [selectedSchool, screeningRows]
  );

  const GetData = useCallback(async () => {
    await fetch("/api/data/districts/1")
      .then((res) => res.json())
      .then((val) => {
        setDistrictData(val);
      });

    await fetch("/api/data/school")
      .then((res) => res.json())
      .then((val) => {
        setSchoolList(val);
        setPages(Math.ceil(val.length / rowsPerPage));
        setSearchQuery("");
      });
  }, [rowsPerPage]);

  useEffect(() => {
    if (status !== "loading") {
      if (status === "unauthenticated") {
        router.push("/admin/login");
      } else {
        if (!isOpen) {
          GetData().then(() => {
            setIsLoading(false);
          });
        }
      }
    }
  }, [session, isLoading]);

  return (
    <AuthGuard allowedRoles={[4]} redirectTo="/admin">
      <Suspense fallback={<Loading />}>
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
            size="2xl"
            onOpenChange={onOpenChange}
          >
            <ModalContent>
              {(onClose) => (
                <Form validationBehavior="native" onSubmit={onSubmit}>
                  <ModalHeader className="flex flex-col gap-1">
                    {mode === "Create" ? "เพิ่มโรงเรียน" : "แก้ไขโรงเรียน"}
                  </ModalHeader>
                  <ModalBody className="flex w-full gap-4">
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
                        schoolChange({
                          target: { name: "districtId", value: val },
                        })
                      }
                    >
                      {(item) => (
                        <AutocompleteItem key={item.id}>
                          {item.nameInThai}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          วันที่คัดกรอง (หลายรอบ/หลายปี)
                        </span>
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={addScreeningRound}
                        >
                          เพิ่มรอบ
                        </Button>
                      </div>
                      {screeningRows.map((row, index) => (
                        <div
                          key={`screening-${row.round}-${index}`}
                          className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_auto] gap-3 items-end border border-default-200 rounded-lg p-3"
                        >
                          <div className="text-sm text-default-500 pb-2">
                            รอบที่ {index + 1}
                          </div>
                          <DatePicker
                            key={`start-${selectedSchool.id}-${mode}-${index}`}
                            showMonthAndYearPickers
                            defaultValue={toDatePickerValue(
                              row.startDate ?? undefined
                            )}
                            isRequired={index === 0}
                            label="วันเริ่ม"
                            labelPlacement="outside"
                            variant="bordered"
                            onChange={(date) => {
                              updateScreeningRow(
                                index,
                                "startDate",
                                date ? new Date(date.toString()) : null
                              );
                            }}
                          />
                          <DatePicker
                            key={`end-${selectedSchool.id}-${mode}-${index}`}
                            showMonthAndYearPickers
                            defaultValue={toDatePickerValue(
                              row.endDate ?? undefined
                            )}
                            label="วันสิ้นสุด"
                            labelPlacement="outside"
                            variant="bordered"
                            onChange={(date) => {
                              updateScreeningRow(
                                index,
                                "endDate",
                                date ? new Date(date.toString()) : null
                              );
                            }}
                          />
                          <Button
                            isDisabled={screeningRows.length <= 1}
                            size="sm"
                            variant="light"
                            onPress={() => removeScreeningRound(index)}
                          >
                            ลบ
                          </Button>
                        </div>
                      ))}
                    </div>

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
                    <Button
                      color="default"
                      variant="bordered"
                      onPress={onClose}
                    >
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

          <div className="flex flex-col items-start gap-4">
            <h3 className="text-lg font-semibold">จัดการโรงเรียน</h3>

            <div className="flex gap-4 justify-between items-center w-full">
              <div className="flex-1 max-w-md">
                <Input
                  className="w-full"
                  placeholder="ค้นหาชื่อโรงเรียน..."
                  startContent={
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                    </svg>
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex-shrink-0">
                <Button
                  className="font-semibold text-md"
                  color="primary"
                  onPress={CreateSchool}
                >
                  เพิ่ม
                </Button>
              </div>
            </div>
          </div>

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
                          index:
                            schoolList.findIndex((x) => x.id == item.id) + 1,
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
      </Suspense>
    </AuthGuard>
  );
}
