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
  Progress,
} from "@heroui/react";
import { useState, useCallback, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { parseDate } from "@internationalized/date";
import useSWR from "swr";

import { prefix } from "@/utils/data";
import {
  calculateGradeLevelFromBirthday,
  formatThaiDate,
} from "@/utils/helper";
import { calculateAge } from "@/utils/helper";

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
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

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
      {
        key: "referentId",
        label: "รหัส อสท.",
        selected: true,
      },
      {
        key: "consultName",
        label: "นักจิตวิทยา",
        selected: true,
      },
      {
        key: "studentPhone",
        label: "เบอร์โทรนักเรียน",
        selected: true,
      },
      {
        key: "emergencyContact",
        label: "ข้อมูลผู้ติดต่อฉุกเฉิน",
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

  // ดึงข้อมูลเขตด้วย SWR
  const { data: districts, isLoading: districtsLoading } = useSWR(
    "/api/data/districts",
    async (url) => {
      try {
        const response = await fetch(url);

        if (!response.ok) throw new Error("Failed to fetch districts");

        return response.json();
      } catch (error) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลเขตได้: " + error,
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

  // ดึงข้อมูล profile_admin ด้วย SWR
  const { data: profileAdmins, isLoading: profileAdminsLoading } = useSWR(
    "/api/profile/admin",
    async (url) => {
      try {
        const response = await fetch(url);

        if (!response.ok) throw new Error("Failed to fetch profile admins");

        return response.json();
      } catch (error) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูล profile admin ได้: " + error,
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

  // ฟังก์ชันสำหรับหาชื่อเขตจากรหัสเขต
  const getDistrictName = useCallback(
    (districtId: number): string => {
      if (!districts || districtsLoading) {
        return `เขต ${districtId}`;
      }

      const district = districts.find((d: any) => d.id === districtId);

      return district ? district.nameInThai : `เขต ${districtId}`;
    },
    [districts, districtsLoading]
  );

  // ฟังก์ชันสำหรับหาชื่อนักจิตวิทยาจาก profile_admin
  const getConsultName = useCallback(
    (consultId: string): string => {
      if (!profileAdmins || profileAdminsLoading) {
        return `${consultId}`;
      }

      const profileAdmin = profileAdmins.find(
        (p: any) => p.userId === consultId
      );

      if (profileAdmin) {
        const prefixLabel =
          prefix.find((p) => p.key === profileAdmin.prefixId?.toString())
            ?.label || "";

        return `${prefixLabel} ${profileAdmin.firstname || ""} ${profileAdmin.lastname || ""}`.trim();
      }

      return `${consultId}`;
    },
    [profileAdmins, profileAdminsLoading]
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

    // Filter เฉพาะ Status = 3 เท่านั้น
    filteredData = filteredData.filter((item: any) => {
      return item.status === 3;
    });

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

      const age = calculateAge(
        item.profile.birthday,
        item.profile.school?.screeningDate
      );

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
          ? calculateAge(
              item.profile.birthday,
              item.profile.school?.screeningDate
            )
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
        return calculateGradeLevelFromBirthday(item.profile?.birthday);
      case "district":
        if (item.profile?.school?.districtId) {
          if (districtsLoading) {
            return "-";
          }
          // หาโรงเรียนเพื่อดึง districtId
          const school = schools?.find(
            (s: any) => s.id === item.profile.school.id
          );

          if (school && school.districtId) {
            // ดึงข้อมูลเขตจาก API
            return getDistrictName(school.districtId);
          }

          return `เขต ${item.profile.school.districtId}`;
        }

        return "-";
      case "serviceDate":
        return formatThaiDate(item.profile.school?.screeningDate);
      case "phqa":
        return item.result_text || "-";
      case "assessmentDate":
        return formatThaiDate(item.schedule_telemed);
      case "followUpDate1":
        return item.followUpDate1 ? formatThaiDate(item.follow_up) : "-";
      case "followUpDate2":
        return item.followUpDate2 ? formatThaiDate(item.follow_up2) : "-";
      case "followUpDate3":
        return item.followUpDate3 ? formatThaiDate(item.follow_up3) : "-";
      case "referralUnit":
        return item.referralUnit || "-";
      case "referentId":
        if (item.referentId) {
          // แปลงเป็น string และเติม 0 ข้างหน้าให้เป็น 3 หลัก
          return item.referentId.toString().padStart(3, "0");
        }

        return "-";
      case "consultName":
        return item.consult ? getConsultName(item.consult) : "-";
      case "studentPhone":
        return item.profile?.tel || "-";
      case "emergencyContact":
        const emergency = item.profile?.emergency?.[0];

        if (emergency) {
          const name = emergency.name || "";
          const relation = emergency.relation || "";
          const tel = emergency.tel || "";

          return (
            `${name} - ${relation ? `${relation}` : ""} - ${tel ? `${tel}` : ""}`.trim() ||
            "-"
          );
        }

        return "-";
      default:
        return item[field] || "-";
    }
  };

  // ฟังก์ชันสำหรับโหลดข้อมูลเพิ่มเมื่อ scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // เมื่อ scroll ถึง 80% ของความสูง
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      loadMoreData();
    }
  };

  // ฟังก์ชันสำหรับโหลดข้อมูลเพิ่ม
  const loadMoreData = useCallback(() => {
    const currentFilteredData = getFilteredData();

    if (displayedItems < currentFilteredData.length && !isLoadingMore) {
      setIsLoadingMore(true);

      // จำลองการโหลดข้อมูล
      setTimeout(() => {
        setDisplayedItems((prev) =>
          Math.min(prev + 10, currentFilteredData.length)
        );
        setIsLoadingMore(false);
      }, 500);
    }
  }, [displayedItems, isLoadingMore, getFilteredData]);

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

  const handleExport = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // ใช้ข้อมูลที่กรองแล้ว
      const filteredExportData = getFilteredData();

      if (filteredExportData.length === 0) {
        addToast({
          title: "ไม่พบข้อมูล",
          description: "ไม่มีข้อมูลสำหรับ export",
          color: "warning",
        });

        return;
      }

      // แสดง toast เริ่มต้น export
      addToast({
        title: "เริ่มต้น Export",
        description: `กำลังประมวลผลข้อมูล ${filteredExportData.length} รายการ...`,
        color: "primary",
      });

      // จำลองการประมวลผลแบบ batch เพื่อไม่ให้ UI freeze
      const batchSize = 100;
      const totalBatches = Math.ceil(filteredExportData.length / batchSize);
      let processedData: any[] = [];

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, filteredExportData.length);
        const batch = filteredExportData.slice(start, end);

        // ประมวลผลข้อมูลในแต่ละ batch
        const processedBatch = batch.map((item: any) => {
          const row: any = {};

          selectedFields.forEach((field) => {
            const fieldLabel =
              availableFields.find((f) => f.key === field)?.label || field;

            row[fieldLabel] = getFieldValue(item, field);
          });

          return row;
        });

        processedData.push(...processedBatch);

        // อัปเดต progress
        const progress = Math.round(((i + 1) / totalBatches) * 100);

        setExportProgress(progress);

        // ให้ UI มีโอกาสอัปเดต
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // สร้าง Excel file
      setExportProgress(90);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(processedData);

      // ตั้งค่าความกว้างคอลัมน์
      const colWidths = selectedFields.map((field) => {
        const fieldLabel =
          availableFields.find((f) => f.key === field)?.label || field;

        return { wch: Math.max(fieldLabel.length, 15) };
      });

      ws["!cols"] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, `${dataType}_data`);

      setExportProgress(95);

      const fileName = `${dataType}_export_${new Date().toISOString().split("T")[0]}.xlsx`;

      XLSX.writeFile(wb, fileName);

      setExportProgress(100);

      // แสดง toast สำเร็จ
      addToast({
        title: "Export สำเร็จ",
        description: `ส่งออกข้อมูล ${processedData.length} รายการเรียบร้อยแล้ว`,
        color: "success",
      });

      // ปิด modal หลังจาก delay เล็กน้อย
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      addToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถ export ข้อมูลได้: " + error,
        color: "danger",
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [
    selectedFields,
    filters,
    availableFields,
    handleClose,
    getFilteredData,
    isExporting,
  ]);

  // สร้างรายการ PHQA สำหรับ filter
  const phqaOptions = useMemo(() => {
    const uniquePhqa = Array.from(
      new Set(data.map((item: any) => item.result_text).filter(Boolean))
    );

    return uniquePhqa.sort();
  }, [data]);

  const filteredData = getFilteredData();

  return (
    <Modal
      hideCloseButton
      backdrop="blur"
      classNames={{
        base: "h-[95vh] max-w-[95vw]",
        body: "h-[calc(95vh-180px)] overflow-hidden",
      }}
      isOpen={isOpen}
      placement="center"
      size="5xl"
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
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">ตัวอย่างข้อมูลที่จะ Export</h4>
                  {filteredData.length > 0 && (
                    <span className="text-sm text-gray-600">
                      แสดง {displayedItems} จาก {filteredData.length} รายการ
                    </span>
                  )}
                </div>
                <div
                  className="flex-1 overflow-y-auto border shadow-sm rounded-lg max-h-[400px]"
                  onScroll={handleScroll}
                >
                  {selectedFields.length > 0 && availableFields.length > 0 ? (
                    schoolsLoading ||
                    districtsLoading ||
                    profileAdminsLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                          <span>กำลังโหลดข้อมูล...</span>
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

                {/* แสดงปุ่มโหลดข้อมูลเพิ่มเมื่อยังมีข้อมูลที่ไม่ได้แสดง */}
                {displayedItems < filteredData.length && !isLoadingMore && (
                  <div className="flex justify-center items-center py-4">
                    <Button
                      color="primary"
                      variant="bordered"
                      onPress={loadMoreData}
                    >
                      โหลดข้อมูลเพิ่ม ({displayedItems} / {filteredData.length})
                    </Button>
                  </div>
                )}

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

            {/* Export Progress */}
            {isExporting && (
              <Card>
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">กำลัง Export ข้อมูล...</h4>
                      <span className="text-sm text-gray-600">
                        {exportProgress}%
                      </span>
                    </div>
                    <Progress
                      className="w-full"
                      color="primary"
                      value={exportProgress}
                    />
                    <p className="text-sm text-gray-600">
                      กรุณารอสักครู่ อย่าปิดหน้าต่างนี้
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            isDisabled={isExporting}
            variant="light"
            onPress={handleClose}
          >
            ยกเลิก
          </Button>
          <Button
            color="primary"
            isDisabled={isExporting}
            isLoading={isExporting}
            onPress={handleExport}
          >
            {isExporting ? "กำลัง Export..." : "Export Excel"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
