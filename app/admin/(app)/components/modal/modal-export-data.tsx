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
  DatePicker,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { useState, useCallback, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";

import { prefix } from "@/utils/data";
import { parseDate } from "@internationalized/date";
import { formatThaiDate } from "@/utils/helper";

interface District {
  id: number;
  nameInThai: string;
}

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
  const [districts, setDistricts] = useState<District[]>([]);

  // กำหนดฟิลด์ที่สามารถ export ได้ตามประเภทข้อมูล
  const getAvailableFields = (): ExportField[] => {
    switch (dataType) {
      case "question":
        return [
          { key: "id", label: "ลำดับ", selected: true },
          { key: "province", label: "จังหวัด", selected: true },
          { key: "hospitalCode", label: "รหัสหน่วยบริการ", selected: true },
          { key: "hospitalName", label: "ชื่อหน่วยบริการ", selected: true },
          { key: "name", label: "ชื่อ-สกุล ผู้รับบริการ", selected: true },
          { key: "citizenId", label: "เลขบัตรประชาชน", selected: true },
          { key: "age", label: "อายุ (นับปี)", selected: true },
          { key: "sex", label: "เพศ", selected: true },
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

  // ตั้งค่าเริ่มต้นสำหรับ selectedFields ทันทีเมื่อ availableFields มีข้อมูล
  useEffect(() => {
    if (availableFields.length > 0 && selectedFields.length === 0) {
      const allFields = availableFields.map((field) => field.key);
      setSelectedFields(allFields);
    }
  }, [availableFields, selectedFields.length]);

  // ดึงข้อมูลเขต
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await fetch('/api/data/districts');
        if (response.ok) {
          const data = await response.json();
          setDistricts(data);
        }
      } catch (error) {
        console.error('Error fetching districts:', error);
      }
    };

    fetchDistricts();
  }, []);



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
        // ใช้ index + 1 เพื่อให้เป็นลำดับ 1, 2, 3, 4
        const dataIndex = (filteredData || data).findIndex((dataItem: any) => dataItem.id === item.id);
        return dataIndex !== -1 ? dataIndex + 1 : "-";
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
          ? calculateAge(item.profile.birthday)
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
          const district = districts.find(d => d.id === item.profile.school.districtId);
          return district ? district.nameInThai : `เขต ${item.profile.school.districtId}`;
        }
        return "-";
      case "serviceDate":
        return formatThaiDate(item.createdAt);
      case "phqa":
        return item.phqa?.[0]?.sum || "-";
      case "assessmentDate":
        return formatThaiDate(item.profile?.school?.screeningDate);
      case "result":
        return item.phqa?.[0]?.result || "-";
      case "q2":
        return item.q2?.[0] ? `${item.q2[0].q1},${item.q2[0].q2}` : "-";
      case "addon":
        return item.addon?.[0]
          ? `${item.addon[0].q1},${item.addon[0].q2}`
          : "-";
      case "date":
        return formatThaiDate(item.createdAt);
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

  const handleClose = useCallback(() => {
    // Clear ข้อมูลทั้งหมด
    setSelectedFields([]);
    setFilters({
      dateFrom: "",
      dateTo: "",
    });
    
    // เรียก onClose จาก props
    onClose();
  }, [onClose]);

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

    handleClose();
  }, [selectedFields, filters, data, filteredData, availableFields, handleClose]);

  // สร้างข้อมูลตัวอย่างสำหรับแสดงในตาราง
  const getSampleData = useCallback(() => {
    // ตรวจสอบว่ามีข้อมูลและ selectedFields หรือไม่
    if (!data || data.length === 0 || selectedFields.length === 0) {
      return [];
    }

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

    // ใช้ข้อมูล 5 รายการแรกเป็นตัวอย่าง
    return exportData.slice(0, 5).map((item: any) => {
      const row: any = {};

      selectedFields.forEach((field) => {
        const fieldLabel =
          availableFields.find((f) => f.key === field)?.label || field;

        row[fieldLabel] = getFieldValue(item, field);
      });

      return row;
    });
  }, [selectedFields, filters, data, filteredData, availableFields]);

  const sampleData = useMemo(() => getSampleData(), [getSampleData]);

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
            {/* กรองวันที่ตรวจ */}
            <Card>
              <CardBody>
                <h4 className="font-medium mb-3">กรองวันที่ตรวจ</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium" htmlFor="dateFrom">
                      วันที่เริ่มต้น
                    </label>
                    <DatePicker
                      value={filters.dateFrom ? parseDate(filters.dateFrom) : null}
                      onChange={(date) =>
                        handleFilterChange("dateFrom", date ? date.toString() : "")
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="dateTo">
                      วันที่สิ้นสุด
                    </label>
                    <DatePicker
                      value={filters.dateTo ? parseDate(filters.dateTo) : null}
                      onChange={(date) =>
                        handleFilterChange("dateTo", date ? date.toString() : "")
                      }
                    />
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
                     <Table 
                       aria-label="ตัวอย่างข้อมูล"
                       classNames={{
                         wrapper: "min-h-[200px]",
                         table: "min-w-full",
                       }}
                     >
                       <TableHeader>
                         {selectedFields.map((field) => {
                           const fieldLabel =
                             availableFields.find((f) => f.key === field)?.label || field;
                           return (
                             <TableColumn key={field} className="text-sm font-medium bg-gray-50 px-4 py-3">
                               {fieldLabel}
                             </TableColumn>
                           );
                         })}
                       </TableHeader>
                       <TableBody>
                         {sampleData.map((row, index) => (
                           <TableRow key={index} className="hover:bg-gray-50">
                             {selectedFields.map((field) => {
                               const fieldLabel =
                                 availableFields.find((f) => f.key === field)?.label || field;
                               return (
                                 <TableCell key={field} className="text-sm px-4 py-3 border-b">
                                   <div className="max-w-[200px] truncate" title={row[fieldLabel] || "-"}>
                                     {row[fieldLabel] || "-"}
                                   </div>
                                 </TableCell>
                               );
                             })}
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   ) : (
                     <div className="text-center py-8 text-gray-500">
                       {availableFields.length === 0 ? "ไม่พบข้อมูลสำหรับประเภทนี้" : "กำลังโหลดข้อมูล..."}
                     </div>
                   )}
                 </div>
                                 {selectedFields.length > 0 && sampleData.length === 0 && (
                   <div className="text-center py-8 text-gray-500">
                     ไม่มีข้อมูลตัวอย่าง
                   </div>
                 )}
                {sampleData.length > 0 && (
                  <div className="mt-3 text-xs text-gray-500 text-center">
                    แสดงตัวอย่าง {sampleData.length} รายการแรกจากทั้งหมด {(() => {
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
                    })()} รายการ
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
