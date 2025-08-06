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
  addToast,
} from "@heroui/react";
import { useState, useCallback, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { parseDate } from "@internationalized/date";

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
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    school: "",
    phqa: "",
  });
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

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

  // ดึงข้อมูลโรงเรียน
  useEffect(() => {
    const fetchSchools = async () => {
      setSchoolsLoading(true);
      try {
        const response = await fetch("/api/data/school");

        if (response.ok) {
          const data = await response.json();

          setSchools(data);
        }
      } catch (error) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลโรงเรียนได้" + error,
          color: "danger",
        });
      } finally {
        setSchoolsLoading(false);
      }
    };

    fetchSchools();
  }, []);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
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
    if (filters.phqa) {
      filteredData = filteredData.filter((item: any) => {
        return item.result_text === filters.phqa;
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
          const school = schools.find((s) => s.id === item.profile.school.id);

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

  const handleClose = useCallback(() => {
    // Clear ข้อมูลทั้งหมด
    setSelectedFields([]);
    setFilters({
      dateFrom: "",
      dateTo: "",
      school: "",
      phqa: "",
    });

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

  // สร้างข้อมูลตัวอย่างสำหรับแสดงในตาราง
  const getSampleData = useCallback(() => {
    // ตรวจสอบว่ามีข้อมูลและ selectedFields หรือไม่
    if (!data || data.length === 0 || selectedFields.length === 0) {
      return [];
    }

    // ถ้ายังกำลังโหลดข้อมูลโรงเรียน ให้รอก่อน
    if (schoolsLoading) {
      return [];
    }

    const filteredSampleData = getFilteredData();

    // ใช้ข้อมูล 5 รายการแรกเป็นตัวอย่าง
    return filteredSampleData.slice(0, 5).map((item: any) => {
      const row: any = {};

      selectedFields.forEach((field) => {
        const fieldLabel =
          availableFields.find((f) => f.key === field)?.label || field;

        row[fieldLabel] = getFieldValue(item, field);
      });

      return row;
    });
  }, [selectedFields, data, availableFields, schoolsLoading, getFilteredData]);

  const sampleData = useMemo(() => getSampleData(), [getSampleData]);

  // สร้างรายการ PHQA สำหรับ filter
  const phqaOptions = useMemo(() => {
    const uniquePhqa = Array.from(
      new Set(data.map((item) => item.result_text).filter(Boolean))
    );

    return uniquePhqa.sort();
  }, [data]);

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      placement="center"
      size="4xl"
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader>
          <h3 className="text-lg font-semibold">Export ข้อมูล</h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
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
                      {schools.map((school) => (
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
                      selectedKeys={filters.phqa ? [filters.phqa] : []}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;

                        handleFilterChange("phqa", selectedKey || "");
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
            <Card>
              <CardBody>
                <h4 className="font-medium mb-3">ตัวอย่างข้อมูลที่จะ Export</h4>
                <div className="overflow-x-auto border rounded-lg">
                  {selectedFields.length > 0 && availableFields.length > 0 ? (
                    schoolsLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                          <span>กำลังโหลดข้อมูลโรงเรียน...</span>
                        </div>
                      </div>
                    ) : (
                      <table className="min-w-full border border-gray-300 text-sm">
                        <thead>
                          <tr>
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
                                <th
                                  key={field}
                                  className="bg-gray-50 border border-gray-300 text-center font-semibold"
                                >
                                  {label}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {sampleData.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              {selectedFields.map((field) => {
                                const fieldLabel =
                                  availableFields.find((f) => f.key === field)
                                    ?.label || field;

                                // แสดงข้อมูลแยกกันสำหรับทุกคอลัมน์
                                return (
                                  <td
                                    key={field}
                                    className="px-4 py-3 border border-gray-300 text-center max-w-[200px] truncate"
                                    title={row[fieldLabel] || "-"}
                                  >
                                    {row[fieldLabel] || "-"}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {availableFields.length === 0
                        ? "ไม่พบข้อมูลสำหรับประเภทนี้"
                        : "กำลังโหลดข้อมูล..."}
                    </div>
                  )}
                </div>
                {selectedFields.length > 0 &&
                  sampleData.length === 0 &&
                  !schoolsLoading && (
                    <div className="text-center py-8 text-gray-500">
                      ไม่มีข้อมูลตัวอย่าง
                    </div>
                  )}
                {sampleData.length > 0 && !schoolsLoading && (
                  <div className="mt-3 text-xs text-gray-500 text-center">
                    แสดงตัวอย่าง {sampleData.length} รายการแรกจากทั้งหมด{" "}
                    {getFilteredData().length} รายการ
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
