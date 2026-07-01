"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  addToast,
  Autocomplete,
  AutocompleteItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Selection,
  Card,
  CardBody,
  Pagination,
} from "@heroui/react";
import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";

import { QuestionsData } from "@/types";
import { calculatePhqaRiskLevel, getNineQRiskLevel } from "@/utils/helper";
import { prefix } from "@/utils/data";

interface ModalStatusUpdateProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdate?: () => void;
}

export const ModalStatusUpdate = ({
  isOpen,
  onClose,
  onDataUpdate,
}: ModalStatusUpdateProps) => {
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedResult, setSelectedResult] = useState<string>("");
  const [selectedQ2, setSelectedQ2] = useState<string>("");
  const [selectedQ8, setSelectedQ8] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [newStatus, setNewStatus] = useState<string>("");
  const [committedFilters, setCommittedFilters] = useState<{
    school: string;
    result: string;
    q2Risk: string;
    q8Risk: string;
  } | null>(null);

  const PAGE_SIZE = 100;
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [useFilterSelection, setUseFilterSelection] = useState(false);

  const resultOptions = [
    { label: "ไม่พบความเสี่ยง", value: "Green" },
    { label: "พบความเสี่ยงเล็กน้อย", value: "Green-Low" },
  ];

  const statusUpdateKey = (() => {
    if (!isOpen || !committedFilters) return null;
    const params = new URLSearchParams();

    if (committedFilters.school) params.set("school", committedFilters.school);
    if (committedFilters.result) params.set("result", committedFilters.result);
    if (committedFilters.q2Risk) params.set("q2Risk", committedFilters.q2Risk);
    if (committedFilters.q8Risk) params.set("q8Risk", committedFilters.q8Risk);
    params.set("page", page.toString());
    params.set("limit", PAGE_SIZE.toString());

    const qs = params.toString();

    return `/api/question/status-update-list${qs ? `?${qs}` : ""}`;
  })();

  const { data: apiData, isLoading: isLoadingQuestions } = useSWR<{
    questionsList: QuestionsData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(
    statusUpdateKey,
    async (url) => {
      const res = await fetch(url);

      if (!res.ok) throw new Error("Failed to fetch questions");

      return res.json();
    },
    { revalidateOnFocus: false, dedupingInterval: 0 }
  );

  const filteredData = apiData?.questionsList ?? [];
  const totalPages = apiData?.pagination?.totalPages ?? 1;

  const handleSearch = () => {
    setCommittedFilters({
      school: selectedSchool,
      result: selectedResult,
      q2Risk: selectedQ2,
      q8Risk: selectedQ8,
    });
    setSelectedKeys(new Set([]));
    setNewStatus("");
    setPage(1);
    setUseFilterSelection(false);
  };

  useEffect(() => {
    if (!isOpen) setCommittedFilters(null);
  }, [isOpen]);

  useEffect(() => {
    if (apiData?.pagination?.total !== undefined) {
      setTotalCount(apiData.pagination.total);
    }
  }, [apiData?.pagination?.total]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedKeys(new Set([]));
    setUseFilterSelection(false);
  };

  // ดึงข้อมูลโรงเรียน
  const { data: schoolsData } = useSWR(
    "/api/data/school",
    async (url) => {
      try {
        const res = await fetch(url);

        if (!res.ok) throw new Error("Failed to fetch schools");

        return res.json();
      } catch (error) {
        addToast({
          title: "Error fetching schools",
          description: error as string,
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

  const handleStatusUpdate = async () => {
    const hasSelection =
      useFilterSelection ||
      selectedKeys === "all" ||
      (selectedKeys instanceof Set && selectedKeys.size > 0);

    if (!hasSelection) {
      addToast({
        title: "ไม่พบข้อมูลที่เลือก",
        description: "กรุณาเลือกข้อมูลที่ต้องการอัปเดตสถานะ",
        color: "warning",
      });

      return;
    }

    if (!newStatus) {
      addToast({
        title: "ไม่พบสถานะใหม่",
        description: "กรุณาเลือกสถานะใหม่ที่ต้องการอัปเดต",
        color: "warning",
      });

      return;
    }

    setIsLoading(true);

    try {
      let requestBody: Record<string, unknown>;

      if (useFilterSelection) {
        requestBody = {
          useFilter: true,
          filter: committedFilters,
          newStatus: parseInt(newStatus),
        };
      } else {
        const selectedItems =
          selectedKeys === "all"
            ? filteredData
            : filteredData.filter(
                (item) =>
                  selectedKeys instanceof Set &&
                  selectedKeys.has(item.id.toString())
              );

        const selectedIds = selectedItems.map((item) => item.id.toString());

        requestBody = {
          selectedIds,
          newStatus: parseInt(newStatus),
        };
      }

      const response = await fetch("/api/question/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          title: "สำเร็จ",
          description: result.message,
          color: "success",
        });

        if (onDataUpdate) {
          onDataUpdate();
        } else {
          mutate("/api/question");
        }

        onClose();
        setSelectedSchool("");
        setSelectedResult("");
        setSelectedQ2("");
        setSelectedQ8("");
        setSelectedKeys(new Set([]));
        setNewStatus("");
      } else {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถอัปเดตสถานะได้",
          color: "danger",
        });
      }
    } catch (error) {
      addToast({
        title: "เกิดข้อผิดพลาด",
        description:
          "ไม่สามารถอัปเดตสถานะได้: " +
          (error instanceof Error ? error.message : "ไม่ระบุ"),
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasSelection =
    useFilterSelection ||
    selectedKeys === "all" ||
    (selectedKeys instanceof Set && selectedKeys.size > 0);

  const handleClose = () => {
    setSelectedSchool("");
    setSelectedResult("");
    setSelectedQ2("");
    setSelectedQ8("");
    setSelectedKeys(new Set([]));
    setNewStatus("");
    setCommittedFilters(null);
    setPage(1);
    setTotalCount(0);
    setUseFilterSelection(false);
    onClose();
  };

  return (
    <Modal
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
        {(_onClose) => (
          <>
            <ModalHeader className="flex flex-col">
              <div>
                <h3 className="text-lg font-semibold">ปรับสถานะ</h3>
              </div>
            </ModalHeader>
            <ModalBody className="h-full overflow-hidden">
              <div className="h-full flex flex-col gap-3">
                {/* Filter section */}
                <Card>
                  <CardBody className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Autocomplete
                          className="w-full"
                          label="โรงเรียน"
                          labelPlacement="outside"
                          placeholder="เลือกโรงเรียน"
                          selectedKey={selectedSchool}
                          size="md"
                          variant="bordered"
                          onSelectionChange={(key) => {
                            setSelectedSchool(key as string);
                          }}
                        >
                          {schoolsData?.map(
                            (school: { id: number; name: string }) => (
                              <AutocompleteItem key={school.name}>
                                {school.name}
                              </AutocompleteItem>
                            )
                          )}
                        </Autocomplete>

                        <Select
                          className="w-full"
                          label="ระดับความเสี่ยง"
                          labelPlacement="outside"
                          placeholder="ทั้งหมด"
                          selectedKeys={selectedResult ? [selectedResult] : []}
                          size="md"
                          variant="bordered"
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0] as string;

                            setSelectedResult(selected || "");
                          }}
                        >
                          {resultOptions.map((option) => (
                            <SelectItem key={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </Select>

                        <Select
                          className="w-full"
                          label="2Q"
                          labelPlacement="outside"
                          placeholder="ทั้งหมด"
                          selectedKeys={selectedQ2 ? [selectedQ2] : []}
                          size="md"
                          variant="bordered"
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0] as string;

                            setSelectedQ2(selected || "");
                          }}
                        >
                          <SelectItem key="risk">พบความเสี่ยง</SelectItem>
                          <SelectItem key="no-risk">ไม่พบความเสี่ยง</SelectItem>
                        </Select>

                        <Select
                          className="w-full"
                          label="8Q"
                          labelPlacement="outside"
                          placeholder="ทั้งหมด"
                          selectedKeys={selectedQ8 ? [selectedQ8] : []}
                          size="md"
                          variant="bordered"
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0] as string;

                            setSelectedQ8(selected || "");
                          }}
                        >
                          <SelectItem key="risk">พบความเสี่ยง</SelectItem>
                          <SelectItem key="no-risk">ไม่พบความเสี่ยง</SelectItem>
                        </Select>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          color="primary"
                          size="md"
                          onPress={handleSearch}
                        >
                          ค้นหา
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Content section */}
                {!committedFilters && (
                  <div className="flex-1 flex flex-col items-center justify-center text-default-400">
                    <svg
                      className="h-10 w-10 mb-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="text-sm">เลือกตัวกรองแล้วกดค้นหา</p>
                  </div>
                )}

                {committedFilters && isLoadingQuestions && (
                  <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    <span className="ml-3 text-sm text-default-500">
                      กำลังโหลดข้อมูล...
                    </span>
                  </div>
                )}

                {committedFilters &&
                  !isLoadingQuestions &&
                  filteredData.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-default-400">
                      <svg
                        className="h-10 w-10 mb-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          clipRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          fillRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm font-medium">ไม่พบข้อมูล</p>
                      <p className="text-xs mt-1">
                        ไม่พบข้อมูลที่มีระดับความเสี่ยงต่ำ
                        {committedFilters.school &&
                          ` ในโรงเรียน ${committedFilters.school}`}
                        {committedFilters.result &&
                          ` ระดับ ${resultOptions.find((opt) => opt.value === committedFilters.result)?.label}`}
                      </p>
                    </div>
                  )}

                {committedFilters &&
                  !isLoadingQuestions &&
                  filteredData.length > 0 && (
                    <Card className="flex-1 min-h-0">
                      <CardBody className="h-full flex flex-col">
                        <div className="h-full flex flex-col">
                          <div className="flex justify-between items-center mb-3 shadow-sm">
                            <div>
                              <h5 className="font-medium text-blue-800">
                                รายการที่มีระดับความเสี่ยงต่ำ
                              </h5>
                              <span className="text-sm text-gray-600">
                                {filteredData.length} รายการ
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasSelection && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">
                                    {useFilterSelection
                                      ? `เลือกแล้ว: ${totalCount} รายการ (ทั้งหมด)`
                                      : `เลือกแล้ว: ${selectedKeys === "all" ? filteredData.length : selectedKeys instanceof Set ? selectedKeys.size : 0} รายการ`}
                                  </span>
                                  <Select
                                    className="w-48"
                                    placeholder="เลือกสถานะใหม่"
                                    selectedKeys={newStatus ? [newStatus] : []}
                                    size="md"
                                    variant="bordered"
                                    onSelectionChange={(keys) => {
                                      const selected = Array.from(
                                        keys
                                      )[0] as string;

                                      setNewStatus(selected || "");
                                    }}
                                  >
                                    <SelectItem key="1">
                                      รอให้คำปรึกษา
                                    </SelectItem>
                                    <SelectItem key="2">
                                      รอสรุปผลการให้คำปรึกษา
                                    </SelectItem>
                                    <SelectItem key="3">เสร็จสิ้น</SelectItem>
                                  </Select>
                                </div>
                              )}
                            </div>
                          </div>

                          {selectedKeys === "all" &&
                            !useFilterSelection &&
                            totalPages > 1 && (
                              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm">
                                <span className="text-blue-700">
                                  เลือก {PAGE_SIZE} รายการในหน้านี้แล้ว
                                </span>
                                <Button
                                  color="warning"
                                  size="sm"
                                  variant="solid"
                                  onPress={() => setUseFilterSelection(true)}
                                >
                                  เลือกทั้งหมด {totalCount} รายการที่ตรงเงื่อนไข
                                </Button>
                              </div>
                            )}
                          {useFilterSelection && (
                            <div className="flex items-center justify-between bg-blue-100 border border-blue-300 rounded-lg px-4 py-2 text-sm">
                              <span className="text-blue-800 font-medium">
                                เลือกทั้งหมด {totalCount}{" "}
                                รายการที่ตรงเงื่อนไขแล้ว
                              </span>
                              <Button
                                color="primary"
                                size="sm"
                                variant="light"
                                onPress={() => {
                                  setUseFilterSelection(false);
                                  setSelectedKeys(new Set([]));
                                }}
                              >
                                ยกเลิก
                              </Button>
                            </div>
                          )}

                          <div className="flex-1 min-h-0 overflow-y-auto border rounded-2xl scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            <Table
                              isStriped
                              aria-label="รายการที่เลือก"
                              className="w-full"
                              selectedKeys={selectedKeys}
                              selectionMode="multiple"
                              onSelectionChange={setSelectedKeys}
                            >
                              <TableHeader>
                                <TableColumn className="text-center">
                                  ลำดับ
                                </TableColumn>
                                <TableColumn className="text-center">
                                  ชื่อ-นามสกุล
                                </TableColumn>
                                <TableColumn className="text-center">
                                  โรงเรียน
                                </TableColumn>
                                <TableColumn className="text-center">
                                  ผลการประเมิน
                                </TableColumn>
                                <TableColumn className="text-center">
                                  2Q
                                </TableColumn>
                                <TableColumn className="text-center">
                                  8Q
                                </TableColumn>
                                <TableColumn className="text-center">
                                  สถานะ
                                </TableColumn>
                              </TableHeader>
                              <TableBody>
                                {filteredData.map((item, index) => {
                                  const getSchoolName = (
                                    row: QuestionsData
                                  ) => {
                                    const itemSchool = row.profile?.school;

                                    if (
                                      typeof itemSchool === "object" &&
                                      itemSchool !== null
                                    ) {
                                      return itemSchool.name;
                                    }
                                    if (typeof itemSchool === "string") {
                                      return itemSchool;
                                    }

                                    return "ไม่ระบุ";
                                  };

                                  const isNineQItem =
                                    Array.isArray(item.q9) &&
                                    item.q9.length > 0;

                                  const renderMainResult = (
                                    row: QuestionsData
                                  ) => {
                                    const getRiskColor = (level: string) => {
                                      switch (level) {
                                        case "Green":
                                        case "Green-Low":
                                          return "success";
                                        case "Yellow":
                                        case "Orange":
                                          return "warning";
                                        case "Red":
                                          return "danger";
                                        default:
                                          return "default";
                                      }
                                    };

                                    if (isNineQItem) {
                                      const sum = row.q9[0]?.sum ?? 0;
                                      const level = getNineQRiskLevel(sum);
                                      const labels: Record<string, string> = {
                                        Green: "ไม่มีอาการ/น้อยมาก",
                                        Yellow: "ระดับน้อย",
                                        Orange: "ระดับปานกลาง",
                                        Red: "ระดับรุนแรง",
                                      };

                                      return (
                                        <Chip
                                          className="capitalize text-xs"
                                          color={getRiskColor(level)}
                                          size="sm"
                                          variant="flat"
                                        >
                                          {labels[level] ?? level}
                                        </Chip>
                                      );
                                    }

                                    const phqaLevel =
                                      calculatePhqaRiskLevel(row);
                                    const labels: Record<string, string> = {
                                      Green: "ไม่พบความเสี่ยง",
                                      "Green-Low": "พบความเสี่ยงเล็กน้อย",
                                      Yellow: "พบความเสี่ยงปานกลาง",
                                      Orange: "พบความเสี่ยงมาก",
                                      Red: "พบความเสี่ยงรุนแรง",
                                    };

                                    return (
                                      <Chip
                                        className="capitalize text-xs"
                                        color={getRiskColor(phqaLevel)}
                                        size="sm"
                                        variant="flat"
                                      >
                                        {labels[phqaLevel] ?? phqaLevel}
                                      </Chip>
                                    );
                                  };

                                  const render2Q = (item: QuestionsData) => {
                                    if (
                                      Array.isArray(item.q2) &&
                                      item.q2.length > 0
                                    ) {
                                      const q2Data = item.q2[0];
                                      const hasRisk =
                                        q2Data.q1 === 1 || q2Data.q2 === 1;

                                      return (
                                        <Chip
                                          className="capitalize text-xs"
                                          color={hasRisk ? "danger" : "success"}
                                          size="sm"
                                          variant="flat"
                                        >
                                          {hasRisk
                                            ? "พบความเสี่ยง"
                                            : "ไม่พบความเสี่ยง"}
                                        </Chip>
                                      );
                                    }

                                    return "-";
                                  };

                                  const renderQ8 = (row: QuestionsData) => {
                                    if (
                                      Array.isArray(row.q8) &&
                                      row.q8.length > 0
                                    ) {
                                      const hasRisk = row.q8[0].sum > 0;

                                      return (
                                        <Chip
                                          className="capitalize text-xs"
                                          color={hasRisk ? "danger" : "success"}
                                          size="sm"
                                          variant="flat"
                                        >
                                          {hasRisk
                                            ? "พบความเสี่ยง"
                                            : "ไม่พบความเสี่ยง"}
                                        </Chip>
                                      );
                                    }

                                    return "-";
                                  };

                                  const renderStatus = (status: number) => {
                                    const getStatusLabel = (status: number) => {
                                      switch (status) {
                                        case 0:
                                          return "รอระบุ HN";
                                        case 1:
                                          return "รอให้คำปรึกษา";
                                        case 2:
                                          return "รอสรุปผลการให้คำปรึกษา";
                                        case 3:
                                          return "เสร็จสิ้น";
                                        default:
                                          return (
                                            status?.toString() || "ไม่ระบุ"
                                          );
                                      }
                                    };

                                    const getStatusColor = (status: number) => {
                                      switch (status) {
                                        case 0:
                                          return "default";
                                        case 1:
                                          return "primary";
                                        case 2:
                                          return "warning";
                                        case 3:
                                          return "success";
                                        default:
                                          return "default";
                                      }
                                    };

                                    return (
                                      <Chip
                                        className="capitalize text-xs"
                                        color={getStatusColor(status)}
                                        size="sm"
                                        variant="flat"
                                      >
                                        {getStatusLabel(status)}
                                      </Chip>
                                    );
                                  };

                                  return (
                                    <TableRow key={item.id || index}>
                                      <TableCell className="text-center whitespace-nowrap">
                                        {(page - 1) * PAGE_SIZE + index + 1}
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap">
                                        {(() => {
                                          const firstname =
                                            item.profile?.firstname ?? "";
                                          const lastname =
                                            item.profile?.lastname ?? "";
                                          const prefixId =
                                            item.profile?.prefixId;

                                          const prefixLabel =
                                            prefix.find(
                                              (p) =>
                                                p.key === prefixId?.toString()
                                            )?.label || "";

                                          const fullName =
                                            `${prefixLabel} ${firstname} ${lastname}`.trim();

                                          return fullName || "ไม่ระบุ";
                                        })()}
                                      </TableCell>
                                      <TableCell className="text-center whitespace-nowrap">
                                        {getSchoolName(item)}
                                      </TableCell>
                                      <TableCell className="text-center whitespace-nowrap">
                                        {renderMainResult(item)}
                                      </TableCell>
                                      <TableCell className="text-center whitespace-nowrap">
                                        {render2Q(item)}
                                      </TableCell>
                                      <TableCell className="text-center whitespace-nowrap">
                                        {renderQ8(item)}
                                      </TableCell>
                                      <TableCell className="text-center whitespace-nowrap">
                                        {renderStatus(item.status)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>

                          {totalPages > 1 && (
                            <div className="flex justify-center pt-3">
                              <Pagination
                                page={page}
                                total={totalPages}
                                onChange={handlePageChange}
                              />
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleClose}>
                ยกเลิก
              </Button>
              <Button
                color="primary"
                isDisabled={!hasSelection || !newStatus}
                isLoading={isLoading}
                onPress={handleStatusUpdate}
              >
                ยืนยัน
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
