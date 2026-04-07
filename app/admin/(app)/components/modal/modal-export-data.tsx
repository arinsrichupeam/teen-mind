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
  DateRangePicker,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  addToast,
  Progress,
} from "@heroui/react";
import { useState, useCallback, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { parseDate } from "@internationalized/date";
import useSWR from "swr";

import { QuestionsData } from "@/types";
import { gradeYearLevels, prefix } from "@/utils/data";
import { formatThaiDate, calculateAge } from "@/utils/helper";

interface ExportField {
  key: string;
  label: string;
  selected: boolean;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: QuestionsData[];
  dataType: "question" | "user" | "school" | "volunteer";
}

export const ModalExportData = ({
  isOpen,
  onClose,
  data,
  dataType,
}: ExportModalProps) => {
  const [sourceData, setSourceData] = useState<QuestionsData[]>(data);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<{
    dateFrom: string;
    dateTo: string;
    school: string;
    mainScale: "" | "nineq" | "phqa";
    phqa: string[];
  }>({
    dateFrom: "",
    dateTo: "",
    school: "",
    mainScale: "",
    phqa: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const rowsPerPage = 10;

  useEffect(() => {
    setSourceData(data);
  }, [data]);

  useEffect(() => {
    const fetchAllQuestionData = async () => {
      if (!isOpen || dataType !== "question") return;

      try {
        const firstRes = await fetch("/api/question?page=1&limit=2000", {
          credentials: "include",
        });

        if (!firstRes.ok) {
          throw new Error("Failed to fetch questions page 1");
        }

        const firstJson = await firstRes.json();
        const allQuestions: QuestionsData[] = firstJson.questionsList ?? [];
        const totalPages = Number(firstJson.pagination?.totalPages ?? 1);

        if (totalPages > 1) {
          for (let page = 2; page <= totalPages; page++) {
            const res = await fetch(`/api/question?page=${page}&limit=2000`, {
              credentials: "include",
            });

            if (!res.ok) {
              throw new Error(`Failed to fetch questions page ${page}`);
            }

            const json = await res.json();

            allQuestions.push(...(json.questionsList ?? []));
          }
        }

        setSourceData(allQuestions);
      } catch (error) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description:
            "ไม่สามารถดึงข้อมูลทั้งหมดได้ ใช้ข้อมูลหน้าปัจจุบันแทน: " + error,
          color: "warning",
        });
      }
    };

    fetchAllQuestionData();
  }, [isOpen, dataType]);

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

      const district = districts.find(
        (d: { id: number; nameInThai?: string }) => d.id === districtId
      );

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
        (p: {
          userId: string;
          prefixId?: number;
          firstname?: string;
          lastname?: string;
        }) => p.userId === consultId
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

  const handleFilterChange = useCallback(
    (key: string, value: string | string[]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
      setCurrentPage(1);
    },
    []
  );

  const getMainScaleKey = useCallback(
    (item: QuestionsData): "nineq" | "phqa" => {
      return item.q9 != null && item.q9.length > 0 ? "nineq" : "phqa";
    },
    []
  );

  // ฟังก์ชันสำหรับ filter ข้อมูล
  const getFilteredData = useCallback(() => {
    let filteredData = [...sourceData];

    if (filters.dateFrom && filters.dateTo) {
      filteredData = filteredData.filter((item: QuestionsData) => {
        const itemDate = new Date(item.createdAt);
        const fromDate = new Date(filters.dateFrom);
        const toDate = new Date(filters.dateTo);

        return itemDate >= fromDate && itemDate <= toDate;
      });
    }

    if (filters.school) {
      filteredData = filteredData.filter((item: QuestionsData) => {
        const school = item.profile?.school;
        const schoolId =
          typeof school === "object" && school !== null
            ? school.id?.toString()
            : undefined;

        return schoolId === filters.school;
      });
    }

    if (filters.mainScale) {
      filteredData = filteredData.filter(
        (item: QuestionsData) => getMainScaleKey(item) === filters.mainScale
      );
    }

    if (filters.phqa && filters.phqa.length > 0) {
      filteredData = filteredData.filter((item: QuestionsData) => {
        return filters.phqa.includes(item.result_text);
      });
    }

    return filteredData;
  }, [sourceData, filters, getMainScaleKey]);

  const getFieldValue = (
    item: QuestionsData,
    field: string
  ): string | number => {
    switch (field) {
      case "id": {
        const filteredData = getFilteredData();
        const itemIndex = filteredData.findIndex(
          (dataItem: QuestionsData) => dataItem.id === item.id
        );

        return itemIndex !== -1 ? itemIndex + 1 : "-";
      }
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
      case "age": {
        const school = item.profile?.school;
        const screeningDate =
          typeof school === "object" && school !== null
            ? school.screeningDate
            : undefined;

        return item.profile?.birthday
          ? calculateAge(item.profile.birthday, screeningDate)
          : "-";
      }
      case "sex": {
        const sex = String(item.profile?.sex ?? "");

        return sex === "1" ? "ชาย" : sex === "2" ? "หญิง" : "-";
      }
      case "insurance":
        return "";
      case "school": {
        const school = item.profile?.school;

        return typeof school === "object" && school !== null
          ? school.name || "-"
          : typeof school === "string"
            ? school
            : "-";
      }
      case "grade":
        if (
          item.profile?.gradeYear == null ||
          Number.isNaN(Number(item.profile.gradeYear))
        ) {
          return "-";
        }

        return (
          gradeYearLevels.find((level) => level.key === item.profile.gradeYear)
            ?.label || "-"
        );
      case "district":
        if (item.profile?.school) {
          const profileSchool = item.profile.school;

          if (
            typeof profileSchool !== "object" ||
            profileSchool === null ||
            !("id" in profileSchool)
          ) {
            return "-";
          }
          if (districtsLoading) {
            return "-";
          }
          const school = schools?.find(
            (s: { id: number; districtId?: number }) =>
              s.id === profileSchool.id
          );

          if (school && school.districtId) {
            return getDistrictName(school.districtId);
          }

          const schoolWithDistrict = profileSchool as { districtId?: number };

          return schoolWithDistrict.districtId != null
            ? `เขต ${schoolWithDistrict.districtId}`
            : "-";
        }

        return "-";
      case "serviceDate": {
        return item.createdAt ? formatThaiDate(item.createdAt) : "-";
      }
      case "phqa":
        return item.result_text || "-";
      case "assessmentDate":
        return item.schedule_telemed != null
          ? formatThaiDate(item.schedule_telemed)
          : "-";
      case "followUpDate1":
        return item.follow_up != null ? formatThaiDate(item.follow_up) : "-";
      case "followUpDate2":
        return item.follow_up2 != null ? formatThaiDate(item.follow_up2) : "-";
      case "followUpDate3":
        return item.follow_up3 != null ? formatThaiDate(item.follow_up3) : "-";
      case "referralUnit":
        return (item as Record<string, unknown>).referralUnit != null
          ? String((item as Record<string, unknown>).referralUnit)
          : "-";
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
        return (item as Record<string, unknown>)[field] != null
          ? String((item as Record<string, unknown>)[field])
          : "-";
    }
  };

  const handleClose = useCallback(() => {
    // Clear ข้อมูลทั้งหมด
    setSelectedFields([]);
    setFilters({
      dateFrom: "",
      dateTo: "",
      school: "",
      mainScale: "",
      phqa: [],
    });
    setCurrentPage(1);

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
      let processedData: Record<string, string | number>[] = [];

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, filteredExportData.length);
        const batch = filteredExportData.slice(start, end);

        const processedBatch = batch.map((item: QuestionsData) => {
          const row: Record<string, string | number> = {};

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
    const scaleFiltered = filters.mainScale
      ? sourceData.filter((item) => getMainScaleKey(item) === filters.mainScale)
      : sourceData;

    const uniquePhqa = Array.from(
      new Set(
        scaleFiltered
          .map((item: QuestionsData) => item.result_text)
          .filter(Boolean)
      )
    );

    return uniquePhqa.sort();
  }, [sourceData, filters.mainScale, getMainScaleKey]);

  const filteredData = getFilteredData();
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);

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
                  {/* ช่วงวันที่ */}
                  <div className="lg:col-span-1">
                    <label className="text-sm font-medium" htmlFor="dateRange">
                      ช่วงวันที่
                    </label>
                    <DateRangePicker
                      value={
                        filters.dateFrom && filters.dateTo
                          ? {
                              start: parseDate(filters.dateFrom),
                              end: parseDate(filters.dateTo),
                            }
                          : null
                      }
                      onChange={(range) => {
                        if (!range) {
                          handleFilterChange("dateFrom", "");
                          handleFilterChange("dateTo", "");

                          return;
                        }

                        handleFilterChange(
                          "dateFrom",
                          range.start ? range.start.toString() : ""
                        );
                        handleFilterChange(
                          "dateTo",
                          range.end ? range.end.toString() : ""
                        );
                      }}
                    />
                  </div>

                  {/* ประเภทแบบประเมิน */}
                  <div>
                    <label className="text-sm font-medium" htmlFor="mainScale">
                      ประเภทแบบประเมิน
                    </label>
                    <Select
                      placeholder="เลือกประเภทแบบประเมิน"
                      selectedKeys={
                        filters.mainScale ? [filters.mainScale] : []
                      }
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as
                          | ""
                          | "nineq"
                          | "phqa"
                          | undefined;

                        setFilters((prev) => ({
                          ...prev,
                          mainScale: selectedKey || "",
                          phqa: [],
                        }));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectItem key="nineq">9Q</SelectItem>
                      <SelectItem key="phqa">PHQ-A</SelectItem>
                    </Select>
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
                      {schools?.map((school: { id: number; name: string }) => (
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
                      แสดง {(currentPage - 1) * rowsPerPage + 1}-
                      {Math.min(currentPage * rowsPerPage, filteredData.length)}{" "}
                      จาก {filteredData.length} รายการ
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto border shadow-sm rounded-lg max-h-[400px]">
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
                          {paginatedData.map((item, index) => (
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
                                      title={
                                        value != null ? String(value) : "-"
                                      }
                                    >
                                      {value != null ? String(value) : "-"}
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
                {filteredData.length > 0 && (
                  <div className="flex justify-center pt-4">
                    <Pagination
                      isCompact
                      showControls
                      color="primary"
                      page={currentPage}
                      total={totalPages}
                      onChange={setCurrentPage}
                    />
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
