"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  DatePicker,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  addToast,
} from "@heroui/react";
import { useState, useCallback, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { parseDate } from "@internationalized/date";
import useSWR from "swr";

import { prefix } from "@/utils/data";
import { formatThaiDate } from "@/utils/helper";

interface ExportField {
  key: string;
  label: string;
  selected: boolean;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  dataType: "question" | "user" | "school" | "volunteer";
}

export const ModalExportData = ({
  isOpen,
  onClose,
  data,
  dataType,
}: ExportModalProps) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<{
    dateFrom: string;
    dateTo: string;
    school: string;
    phqa: string[];
  }>({
    dateFrom: "",
    dateTo: "",
    school: "",
    phqa: [],
  });
  const [displayedItems, setDisplayedItems] = useState<number>(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // กำหนดฟิลด์ที่สามารถ export ได้สำหรับข้อมูลแบบสอบถาม
  const getAvailableFields = (): ExportField[] => {
    return [
      { key: "id", label: "ลำดับ", selected: true },
      { key: "province", label: "จังหวัด", selected: true },
      { key: "hospitalCode", label: "รหัสหน่วยบริการ", selected: true },
      { key: "hospitalName", label: "ชื่อหน่วยบริการ", selected: true },
      { key: "name", label: "ชื่อ-สกุล ผู้รับบริการ", selected: true },
      { key: "citizenId", label: "เลขบัตรประชาชน", selected: true },
      { key: "age", label: "อายุ", selected: true },
      { key: "sex", label: "เพศ", selected: true },
      { key: "insurance", label: "สิทธิ์การรักษา", selected: true },
      { key: "school", label: "โรงเรียน", selected: true },
      { key: "grade", label: "ระดับชั้น", selected: true },
      { key: "district", label: "เขต", selected: true },
      {
        key: "serviceDate",
        label: "วันที่เข้ารับบริการคัดกรอง",
        selected: true,
      },
      { key: "phqa", label: "ระดับภาวะซึมเศร้า", selected: true },
      {
        key: "assessmentDate",
        label: "วันที่เข้ารับบริการพบนักจิตวิทยา",
        selected: true,
      },
      { key: "followUpDate1", label: "วันที่ติดตามครั้งที่ 1", selected: true },
      { key: "followUpDate2", label: "วันที่ติดตามครั้งที่ 2", selected: true },
      { key: "followUpDate3", label: "วันที่ติดตามครั้งที่ 3", selected: true },
      {
        key: "referralUnit",
        label: "หน่วยบริการส่งต่อพบแพทย์",
        selected: true,
      },
    ];
  };

  const availableFields = useMemo(() => getAvailableFields(), [dataType]);

  // ตั้งค่าเริ่มต้นสำหรับ selectedFields ทันทีเมื่อ availableFields มีข้อมูล
  useEffect(() => {
    if (availableFields.length > 0 && selectedFields.length === 0) {
      const allFields = availableFields.map((field) => field.key);

      setSelectedFields(allFields);
    }
  }, [availableFields, selectedFields.length]);

  // ดึงข้อมูลโรงเรียนด้วย SWR
  const { data: schools, isLoading: schoolsLoading } = useSWR(
    "/api/data/school",
    async (url) => {
      try {
        const response = await fetch(url);

        if (!response.ok) throw new Error("Failed to fetch schools");

        return response.json();
      } catch (error) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลโรงเรียนได้: " + error,
          color: "danger",
        });

        return [];
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    // รีเซ็ต displayedItems เมื่อมีการเปลี่ยน filter
    setDisplayedItems(10);
  }, []);

  // ฟังก์ชันสำหรับ filter ข้อมูล
  const getFilteredData = useCallback(() => {
    let filteredData = [...data];

    // Filter ตามวันที่
    if (filters.dateFrom && filters.dateTo) {
      filteredData = filteredData.filter((item: any) => {
        const itemDate = new Date(item.createdAt);
        const fromDate = new Date(filters.dateFrom);
        const toDate = new Date(filters.dateTo);

        return itemDate >= fromDate && itemDate <= toDate;
      });
    }

    // Filter ตามโรงเรียน
    if (filters.school) {
      filteredData = filteredData.filter((item: any) => {
        return item.profile?.school?.id?.toString() === filters.school;
      });
    }

    // Filter ตามระดับภาวะซึมเศร้า
    if (filters.phqa && filters.phqa.length > 0) {
      filteredData = filteredData.filter((item: any) => {
        return filters.phqa.includes(item.result_text);
      });
    }

    // Filter ตามอายุ 12-18 ปี (อัตโนมัติ)
    filteredData = filteredData.filter((item: any) => {
      if (!item.profile?.birthday) return false;

      const birthDate = new Date(item.profile.birthday);
      const assessmentDate = new Date(item.createdAt);

      // คำนวณอายุ ณ วันที่ตรวจ
      let age = assessmentDate.getFullYear() - birthDate.getFullYear();
      const monthDiff = assessmentDate.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && assessmentDate.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age >= 12 && age <= 18;
    });

    // Filter ให้แสดงเฉพาะแบบประเมินล่าสุดของแต่ละคน
    const latestAssessments = new Map();

    filteredData.forEach((item: any) => {
      const profileId = item.profile?.id;

      if (profileId) {
        const existingItem = latestAssessments.get(profileId);

        if (
          !existingItem ||
          new Date(item.createdAt) > new Date(existingItem.createdAt)
        ) {
          latestAssessments.set(profileId, item);
        }
      }
    });

    filteredData = Array.from(latestAssessments.values());

    return filteredData;
  }, [data, filters]);

  const calculateAge = (birthday: string, assessmentDate?: string): number => {
    const birthDate = new Date(birthday);
    const targetDate = assessmentDate ? new Date(assessmentDate) : new Date();
    let age = targetDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = targetDate.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && targetDate.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const getFieldValue = (item: any, field: string): any => {
    switch (field) {
      case "id":
        // ใช้ index + 1 เพื่อให้เป็นลำดับ 1, 2, 3, 4
        const filteredData = getFilteredData();
        const itemIndex = filteredData.findIndex(
          (dataItem: any) => dataItem.id === item.id
        );

        return itemIndex !== -1 ? itemIndex + 1 : "-";
      case "province":
        return "กรุงเทพมหานคร";
      case "hospitalCode":
        return "141641";
      case "hospitalName":
        return "โรงพยาบาลราชพิพัฒน์";
      case "name":
        const prefixLabel =
          prefix.find((p) => p.key === item.profile?.prefixId?.toString())
            ?.label || "";

        return `${prefixLabel} ${item.profile?.firstname || ""} ${item.profile?.lastname || ""}`;
      case "citizenId":
        return item.profile?.citizenId;
      case "age":
        return item.profile?.birthday
          ? calculateAge(item.profile.birthday, item.createdAt)
          : "-";
      case "sex":
        return item.profile?.sex === 1
          ? "ชาย"
          : item.profile?.sex === 2
            ? "หญิง"
            : "-";
      case "insurance":
        return "";
      case "school":
        return item.profile?.school?.name || "-";
      case "grade":
        return "";
      case "district":
        if (item.profile?.school?.districtId) {
          if (schoolsLoading) {
            return "-";
          }
          const school = schools?.find(
            (s: any) => s.id === item.profile.school.id
          );

          return school ? school.name : `โรงเรียน ${item.profile.school.id}`;
        }

        return "-";
      case "serviceDate":
        return formatThaiDate(item.createdAt);
      case "phqa":
        return item.result_text || "-";
      case "assessmentDate":
        return formatThaiDate(item.createdAt);
      case "followUpDate1":
        return item.followUpDate1 ? formatThaiDate(item.followUpDate1) : "-";
      case "followUpDate2":
        return item.followUpDate2 ? formatThaiDate(item.followUpDate2) : "-";
      case "followUpDate3":
        return item.followUpDate3 ? formatThaiDate(item.followUpDate3) : "-";
      case "referralUnit":
        return item.referralUnit || "-";
      default:
        return item[field] || "-";
    }
  };

  // ฟังก์ชันสำหรับโหลดข้อมูลเพิ่มเมื่อ scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // เมื่อ scroll ถึง 80% ของความสูง
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      const filteredData = getFilteredData();

      if (displayedItems < filteredData.length && !isLoadingMore) {
        setIsLoadingMore(true);

        // จำลองการโหลดข้อมูล
        setTimeout(() => {
          setDisplayedItems((prev) => Math.min(prev + 10, filteredData.length));
          setIsLoadingMore(false);
        }, 500);
      }
    }
  };

  const handleClose = useCallback(() => {
    // Clear ข้อมูลทั้งหมด
    setSelectedFields([]);
    setFilters({
      dateFrom: "",
      dateTo: "",
      school: "",
      phqa: [],
    });
    setDisplayedItems(10);

    // เรียก onClose จาก props
    onClose();
  }, [onClose]);

  const handleExport = useCallback(() => {
    // ใช้ข้อมูลที่กรองแล้ว
    const filteredExportData = getFilteredData();

    // สร้างข้อมูลสำหรับ export
    const excelData = filteredExportData.map((item: any) => {
      const row: any = {};

      selectedFields.forEach((field) => {
        const fieldLabel =
          availableFields.find((f) => f.key === field)?.label || field;

        row[fieldLabel] = getFieldValue(item, field);
      });

      return row;
    });

    // สร้าง Excel file
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // ตั้งค่าความกว้างคอลัมน์
    const colWidths = selectedFields.map((field) => {
      const fieldLabel =
        availableFields.find((f) => f.key === field)?.label || field;

      return { wch: Math.max(fieldLabel.length, 15) };
    });

    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, `${dataType}_data`);

    const fileName = `${dataType}_export_${new Date().toISOString().split("T")[0]}.xlsx`;

    XLSX.writeFile(wb, fileName);

    handleClose();
  }, [selectedFields, filters, availableFields, handleClose, getFilteredData]);

  // สร้างรายการ PHQA สำหรับ filter
  const phqaOptions = useMemo(() => {
    const uniquePhqa = Array.from(
      new Set(data.map((item) => item.result_text).filter(Boolean))
    );

    return uniquePhqa.sort();
  }, [data]);

  const filteredData = getFilteredData();

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "h-[90vh] max-w-[95vw]",
        body: "h-[calc(90vh-120px)] overflow-hidden",
      }}
      isOpen={isOpen}
      placement="center"
      size="4xl"
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader>
          <h3 className="text-lg font-semibold">Export ข้อมูล</h3>
        </ModalHeader>
        <ModalBody className="h-full overflow-hidden">
          <div className="h-full flex flex-col space-y-4">
            {/* Filter Options */}
            <Card>
              <CardBody>
                <h4 className="font-medium mb-3">ตัวกรองข้อมูล</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* วันที่เริ่มต้น */}
                  <div>
                    <label className="text-sm font-medium" htmlFor="dateFrom">
                      วันที่เริ่มต้น
                    </label>
                    <DatePicker
                      value={
                        filters.dateFrom ? parseDate(filters.dateFrom) : null
                      }
                      onChange={(date) =>
                        handleFilterChange(
                          "dateFrom",
                          date ? date.toString() : ""
                        )
                      }
                    />
                  </div>

                  {/* วันที่สิ้นสุด */}
                  <div>
                    <label className="text-sm font-medium" htmlFor="dateTo">
                      วันที่สิ้นสุด
                    </label>
                    <DatePicker
                      value={filters.dateTo ? parseDate(filters.dateTo) : null}
                      onChange={(date) =>
                        handleFilterChange(
                          "dateTo",
                          date ? date.toString() : ""
                        )
                      }
                    />
                  </div>

                  {/* โรงเรียน */}
                  <div>
                    <label className="text-sm font-medium" htmlFor="school">
                      โรงเรียน
                    </label>
                    <Select
                      placeholder="เลือกโรงเรียน"
                      selectedKeys={filters.school ? [filters.school] : []}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;

                        handleFilterChange("school", selectedKey || "");
                      }}
                    >
                      {schools?.map((school: any) => (
                        <SelectItem key={school.id.toString()}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* ระดับภาวะซึมเศร้า */}
                  <div>
                    <label className="text-sm font-medium" htmlFor="phqa">
                      ระดับภาวะซึมเศร้า
                    </label>
                    <Select
                      placeholder="เลือกระดับ"
                      selectedKeys={new Set(filters.phqa)}
                      selectionMode="multiple"
                      onSelectionChange={(keys) => {
                        const selectedKeys = Array.from(keys) as string[];

                        handleFilterChange("phqa", selectedKeys);
                      }}
                    >
                      {phqaOptions.map((phqa) => (
                        <SelectItem key={phqa}>{phqa}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* ตัวอย่างตาราง */}
            <Card className="flex-1">
              <CardBody className="h-full flex flex-col">
                <h4 className="font-medium mb-3">ตัวอย่างข้อมูลที่จะ Export</h4>
                <div
                  className="flex-1 overflow-y-auto border shadow-sm rounded-lg"
                  onScroll={handleScroll}
                >
                  {selectedFields.length > 0 && availableFields.length > 0 ? (
                    schoolsLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                          <span>กำลังโหลดข้อมูลโรงเรียน...</span>
                        </div>
                      </div>
                    ) : (
                      <Table
                        isStriped
                        aria-label="ตัวอย่างข้อมูลที่จะ Export"
                        className="w-full"
                        selectionMode="none"
                      >
                        <TableHeader>
                          {selectedFields.map((field) => {
                            const fieldLabel =
                              availableFields.find((f) => f.key === field)
                                ?.label || field;
                            const numberMatch =
                              fieldLabel.match(/^\((\d+)\)\s*(.+)$/);
                            const label = numberMatch
                              ? numberMatch[2]
                              : fieldLabel;

                            return (
                              <TableColumn key={field} className="text-center">
                                {label}
                              </TableColumn>
                            );
                          })}
                        </TableHeader>
                        <TableBody>
                          {filteredData
                            .slice(0, displayedItems)
                            .map((item, index) => (
                              <TableRow key={item.id || index}>
                                {selectedFields.map((field) => {
                                  const value = getFieldValue(item, field);

                                  return (
                                    <TableCell
                                      key={field}
                                      className="text-center whitespace-nowrap"
                                    >
                                      <div
                                        className="truncate"
                                        title={value || "-"}
                                      >
                                        {value || "-"}
                                      </div>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {availableFields.length === 0
                        ? "ไม่พบข้อมูลสำหรับประเภทนี้"
                        : "กำลังโหลดข้อมูล..."}
                    </div>
                  )}
                </div>

                {/* แสดง loading indicator เมื่อกำลังโหลดข้อมูลเพิ่ม */}
                {isLoadingMore && (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    <span className="ml-2 text-sm text-gray-600">
                      กำลังโหลดข้อมูลเพิ่ม...
                    </span>
                  </div>
                )}

                {/* แสดงข้อความเมื่อโหลดข้อมูลครบแล้ว */}
                {displayedItems >= filteredData.length &&
                  filteredData.length > 0 && (
                    <div className="text-center py-2 text-sm text-gray-500">
                      แสดงข้อมูลครบทั้งหมดแล้ว ({filteredData.length} รายการ)
                    </div>
                  )}

                {selectedFields.length > 0 &&
                  filteredData.length === 0 &&
                  !schoolsLoading && (
                    <div className="text-center py-8 text-gray-500">
                      ไม่มีข้อมูลตัวอย่าง
                    </div>
                  )}
              </CardBody>
            </Card>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={handleClose}>
            ยกเลิก
          </Button>
          <Button color="primary" onPress={handleExport}>
            Export Excel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
