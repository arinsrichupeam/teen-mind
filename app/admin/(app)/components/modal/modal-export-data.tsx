"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Card,
  CardBody,
  Input,
} from "@heroui/react";
import { useState, useCallback, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";

import { prefix } from "@/utils/data";

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
  filteredData?: any[];
}

export const ModalExportData = ({
  isOpen,
  onClose,
  data,
  dataType,
  filteredData,
}: ExportModalProps) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
  });

  // กำหนดฟิลด์ที่สามารถ export ได้ตามประเภทข้อมูล
  const getAvailableFields = (): ExportField[] => {
    switch (dataType) {
      case "question":
        return [
          { key: "id", label: "ลำดับ", selected: true },
          { key: "province", label: "จังหวัด", selected: true },
          { key: "hospitalCode", label: "รหัสหน่วยบริการ", selected: true },
          { key: "hospitalName", label: "ชื่อหน่วยบริการ", selected: true },
          { key: "name", label: "ชื่อ-สกุล ผู้รับบริกา", selected: true },
          { key: "citizenId", label: "เลขบัตรประชาชน", selected: true },
          { key: "age", label: "อายุ (นับปี)", selected: true },
          { key: "gender", label: "เพศ", selected: true },
          { key: "insurance", label: "สิทธิ์การรักษา", selected: true },
          { key: "school", label: "โรงเรียน", selected: true },
          { key: "grade", label: "ระดับชั้น", selected: true },
          { key: "district", label: "เขต", selected: true },
          { key: "serviceDate", label: "วดป.ที่เข้ารับบริการ", selected: true },
          { key: "phqa", label: "ระดับภาวะซึมเศร้า", selected: true },
          {
            key: "assessmentDate",
            label: "วดป.ที่เข้ารับบริการ",
            selected: true,
          },
        ];
      case "user":
        return [
          { key: "id", label: "ลำดับ", selected: true },
          { key: "name", label: "ชื่อ-นามสกุล", selected: true },
          { key: "school", label: "โรงเรียน", selected: true },
          { key: "questionCount", label: "จำนวนแบบสอบถาม", selected: true },
          { key: "citizenId", label: "เลขบัตรประชาชน", selected: false },
          { key: "tel", label: "เบอร์โทรศัพท์", selected: false },
        ];
      case "school":
        return [
          { key: "id", label: "ลำดับ", selected: true },
          { key: "schoolName", label: "ชื่อโรงเรียน", selected: true },
          { key: "total", label: "ผู้รับบริการ", selected: true },
          { key: "green", label: "สีเขียว", selected: true },
          { key: "greenLow", label: "สีเขียวอ่อน", selected: true },
          { key: "yellow", label: "สีเหลือง", selected: true },
          { key: "orange", label: "สีส้ม", selected: true },
          { key: "red", label: "สีแดง", selected: true },
        ];
      default:
        return [];
    }
  };

  const availableFields = useMemo(() => getAvailableFields(), [dataType]);

  // ตั้งค่าเริ่มต้นสำหรับ selectedFields - เลือกฟิลด์ทั้งหมด
  useEffect(() => {
    const allFields = availableFields.map((field) => field.key);

    setSelectedFields(allFields);
  }, [dataType]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const calculateAge = (birthday: string): number => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const getFieldValue = (item: any, field: string): any => {
    switch (field) {
      case "id":
        return data.findIndex((x) => x.id === item.id) + 1;
      case "province":
        return item.profile?.school?.province || "-";
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
        return item.profile?.citizenId || "-";
      case "age":
        return item.profile?.birthday
          ? calculateAge(item.profile.birthday)
          : "-";
      case "gender":
        return item.profile?.gender === "male"
          ? "ชาย"
          : item.profile?.gender === "female"
            ? "หญิง"
            : "-";
      case "insurance":
        return "";
      case "school":
        return item.profile?.school?.name || "-";
      case "grade":
        return "";
      case "district":
        return item.profile?.school?.district || "-";
      case "serviceDate":
        return "";
      case "phqa":
        return item.phqa?.[0]?.sum || "-";
      case "assessmentDate":
        return "";
      case "result":
        return item.phqa?.[0]?.result || "-";
      case "q2":
        return item.q2?.[0] ? `${item.q2[0].q1},${item.q2[0].q2}` : "-";
      case "addon":
        return item.addon?.[0]
          ? `${item.addon[0].q1},${item.addon[0].q2}`
          : "-";
      case "date":
        return new Date(item.createdAt).toLocaleDateString("th-TH");
      case "status":
        return item.status ? "เสร็จสิ้น" : "รอดำเนินการ";
      case "tel":
        return item.profile?.tel || "-";
      case "referent":
        return item.referent
          ? `${item.referent.firstname} ${item.referent.lastname}`
          : "-";
      case "questionCount":
        return item.questions?.length || 0;
      default:
        return item[field] || "-";
    }
  };

  const handleExport = useCallback(() => {
    // ใช้ข้อมูลที่กรองแล้วหรือข้อมูลทั้งหมด
    let exportData = filteredData || data;

    // กรองข้อมูลตามวันที่ตรวจ
    if (filters.dateFrom && filters.dateTo) {
      exportData = exportData.filter((item: any) => {
        const itemDate = new Date(item.createdAt);
        const fromDate = new Date(filters.dateFrom);
        const toDate = new Date(filters.dateTo);

        return itemDate >= fromDate && itemDate <= toDate;
      });
    }

    // สร้างข้อมูลสำหรับ export
    const excelData = exportData.map((item: any) => {
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

    onClose();
  }, [selectedFields, filters, data, filteredData, availableFields, onClose]);

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      placement="center"
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader>
          <h3 className="text-lg font-semibold">Export ข้อมูล</h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* กรองวันที่ตรวจ */}
            <Card>
              <CardBody>
                <h4 className="font-medium mb-3">กรองวันที่ตรวจ</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium" htmlFor="dateFrom">
                      วันที่เริ่มต้น
                    </label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) =>
                        handleFilterChange("dateFrom", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="dateTo">
                      วันที่สิ้นสุด
                    </label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) =>
                        handleFilterChange("dateTo", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">ยืนยันการ Export ข้อมูล</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Chip color="primary" variant="flat">
                  จำนวนฟิลด์: {selectedFields.length}
                </Chip>
                <Chip color="secondary" variant="flat">
                  จำนวนข้อมูล:{" "}
                  {(() => {
                    let exportData = filteredData || data;

                    if (filters.dateFrom && filters.dateTo) {
                      exportData = exportData.filter((item: any) => {
                        const itemDate = new Date(item.createdAt);
                        const fromDate = new Date(filters.dateFrom);
                        const toDate = new Date(filters.dateTo);

                        return itemDate >= fromDate && itemDate <= toDate;
                      });
                    }

                    return exportData.length;
                  })()}
                </Chip>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
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
