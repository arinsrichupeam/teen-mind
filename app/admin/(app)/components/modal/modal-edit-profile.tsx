"use client";

import { useEffect, useState } from "react";
import { Districts, Provinces, Subdistricts } from "@prisma/client";
import {
  addToast,
  Button,
  Divider,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
  DatePicker,
} from "@heroui/react";
import {
  CalendarDate,
  parseDate,
  CalendarDateTime,
  ZonedDateTime,
} from "@internationalized/date";
import moment from "moment";

import { gradeYearLevels, prefix } from "@/utils/data";
import {
  validateCitizen,
  validateBirthday,
  parseThaiDateToISO,
  calculateThaiYear,
  formatDateForDisplay,
  safeParseDateForPicker,
} from "@/utils/helper";

interface EditProfileData {
  hn: string;
  citizenId: string;
  prefixId: string;
  sex: string;
  firstname: string;
  lastname: string;
  birthday: string;
  thaiYear: string;
  ethnicity: string;
  nationality: string;
  address: {
    houseNo: string;
    villageNo: string;
    soi: string;
    road: string;
    subdistrict: string;
    district: string;
    province: string;
  };
  tel: string;
  emergency: {
    name: string;
    tel: string;
    relation: string;
  };
  school: string;
  gradeYear: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  mode?: "create" | "edit";
  onSuccess?: () => void;
}

export const ModalEditProfile = ({
  isOpen,
  onClose,
  data,
  mode,
  onSuccess,
}: Props) => {
  const [distrince, setDistrince] = useState<Districts[]>([]);
  const [province, setProvince] = useState<Provinces[]>([]);
  const [subdistrince, setSubDistrince] = useState<Subdistricts[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [birthdayDate, setBirthdayDate] = useState<
    CalendarDate | CalendarDateTime | ZonedDateTime | null
  >(null);
  const [editProfileData, setEditProfileData] = useState<EditProfileData>({
    hn: "",
    citizenId: "",
    prefixId: "",
    sex: "",
    firstname: "",
    lastname: "",
    birthday: "",
    thaiYear: "",
    ethnicity: "",
    nationality: "",
    address: {
      houseNo: "",
      villageNo: "",
      soi: "",
      road: "",
      subdistrict: "",
      district: "",
      province: "",
    },
    tel: "",
    emergency: {
      name: "",
      tel: "",
      relation: "",
    },
    school: "",
    gradeYear: "",
  });
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [citizenIdError, setCitizenIdError] = useState<string>("");
  const [birthdayError, setBirthdayError] = useState<string>("");
  const [currentData, setCurrentData] = useState<any>(null);

  const fetchData = async (url: string, setter: (data: any) => void) => {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Failed to fetch data from ${url}`);
      }
      const data = await res.json();

      setter(data);
    } catch (err) {
      addToast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        color: "danger",
      });
    }
  };

  const GetDistrictList = async () => {
    await fetchData("/api/data/districts", setDistrince);
  };

  const GetProvinceList = async () => {
    await fetchData("/api/data/provinces", setProvince);
  };

  const GetSubdistrictList = async () => {
    await fetchData("/api/data/subdistricts", setSubDistrince);
  };

  const GetSchoolList = async () => {
    await fetchData("/api/data/school", setSchools);
  };

  const handleEditProfileChange = (e: any) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const field = name.split(".")[1];

      setEditProfileData((prev) => {
        const newData = {
          ...prev,
          address: {
            ...prev.address,
            [field]: value,
          },
        };

        return newData;
      });
    } else if (name.startsWith("emergency.")) {
      const field = name.split(".")[1];

      setEditProfileData((prev) => {
        const newData = {
          ...prev,
          emergency: {
            ...prev.emergency,
            [field]: value,
          },
        };

        return newData;
      });
    } else {
      let processedValue = value;

      // จัดการการกรอกวันเกิด - ใช้ placeholder แทน auto format
      if (name === "birthday") {
        // จำกัดความยาวสูงสุดที่ 10 ตัวอักษร (dd/mm/yyyy)
        if (value.length > 10) {
          processedValue = value.slice(0, 10);
        }
      }

      // ตรวจสอบโทรศัพท์ให้รับเฉพาะตัวเลขเท่านั้น
      if (name === "tel" || name === "emergency.tel") {
        // อนุญาตให้กรอกได้แค่ตัวเลขเท่านั้น
        const onlyNumbers = /^[0-9]*$/;

        if (!onlyNumbers.test(value)) {
          return; // ไม่ทำอะไรถ้าไม่ใช่ตัวเลข
        }
        processedValue = value;
      }

      setEditProfileData((prev) => {
        const newData = {
          ...prev,
          [name]: processedValue,
        };

        return newData;
      });

      // Validate citizenId ทั้งในโหมด create และ edit
      if (name === "citizenId") {
        if (value.length === 13) {
          validateCitizenIdAsync(value);
        } else if (value.length > 0) {
          setCitizenIdError("เลขบัตรประชาชนต้องมี 13 หลัก");
        } else {
          setCitizenIdError("");
        }
      }

      // Validate birthday แบบ real-time
      if (name === "birthday") {
        const error = validateBirthday(processedValue);

        setBirthdayError(error);
      }
    }
  };

  const handleEditProfileSelectChange = (name: string, value: string) => {
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];

      setEditProfileData((prev) => {
        const newData = {
          ...prev,
          address: {
            ...prev.address,
            [field]: value,
          },
        };

        return newData;
      });
    } else {
      setEditProfileData((prev) => {
        const newData: EditProfileData = {
          ...prev,
          [name]: value,
        };

        // เมื่อล้างสถานศึกษา ให้ล้างชั้นปีด้วย
        if (name === "school" && !value) {
          newData.gradeYear = "";
        }

        return newData;
      });
    }
  };

  const validateCitizenIdAsync = async (
    citizenId: string
  ): Promise<boolean> => {
    try {
      // ในโหมด edit ให้ส่งข้อมูล user ID ปัจจุบันเพื่อยกเว้นการตรวจสอบซ้ำ
      const currentUserId = mode === "edit" ? data?.profile?.id : null;

      const response = await validateCitizen(citizenId, "user", currentUserId);
      const responseData = await response.json();

      if (responseData.error) {
        setCitizenIdError(responseData.error);

        return false;
      }

      setCitizenIdError("");

      return true;
    } catch (error) {
      setCitizenIdError(
        "เกิดข้อผิดพลาดในการตรวจสอบเลขบัตรประชาชน" +
          (error instanceof Error ? error.message : "ไม่ระบุข้อมูล")
      );

      return false;
    }
  };

  const initializeEditProfileData = () => {
    // รีเซ็ต error message
    setCitizenIdError("");
    setBirthdayError("");

    if (mode === "create") {
      // รีเซ็ตข้อมูลสำหรับการสร้างใหม่
      setEditProfileData({
        hn: "",
        citizenId: "",
        prefixId: "",
        sex: "",
        firstname: "",
        lastname: "",
        birthday: "",
        thaiYear: "",
        ethnicity: "",
        nationality: "",
        address: {
          houseNo: "",
          villageNo: "",
          soi: "",
          road: "",
          subdistrict: "",
          district: "",
          province: "",
        },
        tel: "",
        emergency: {
          name: "",
          tel: "",
          relation: "",
        },
        school: "",
        gradeYear: "",
      });
      setBirthdayDate(null);

      return;
    }

    if (data?.profile) {
      const currentProvince = province.find(
        (x) => x.id == data?.profile.address[0].province
      );
      const currentDistrict = distrince.find(
        (x) => x.id == data?.profile.address[0].district
      );
      const currentSubdistrict = subdistrince.find(
        (x) => x.id == data?.profile.address[0].subdistrict
      );

      let birthdayDate = "";
      let parsedBirthdayDate = null;

      if (data.profile.birthday) {
        try {
          const date = new Date(data.profile.birthday);

          if (!isNaN(date.getTime())) {
            birthdayDate = formatDateForDisplay(
              date.toISOString().split("T")[0]
            );
            // แปลงวันที่สำหรับ DatePicker
            parsedBirthdayDate = safeParseDateForPicker(date);
          }
        } catch (error) {
          addToast({
            title: "ผิดพลาด",
            description:
              "ไม่สามารถดึงข้อมูลจากระบบ" +
              (error instanceof Error ? error.message : "ไม่ระบุข้อมูล"),
            color: "danger",
          });
        }
      }

      const thaiYear = birthdayDate
        ? calculateThaiYear(parseThaiDateToISO(birthdayDate))
        : "";

      const initialData = {
        hn: data.profile.hn || "",
        citizenId: data.profile.citizenId || "",
        prefixId: data.profile.prefixId?.toString() || "",
        sex: data.profile.sex?.toString() || "",
        firstname: data.profile.firstname || "",
        lastname: data.profile.lastname || "",
        birthday: birthdayDate || "",
        thaiYear: thaiYear,
        ethnicity: data.profile.ethnicity || "",
        nationality: data.profile.nationality || "",
        address: {
          houseNo: data.profile.address[0]?.houseNo || "",
          villageNo: data.profile.address[0]?.villageNo || "",
          soi: data.profile.address[0]?.soi || "",
          road: data.profile.address[0]?.road || "",
          subdistrict: currentSubdistrict?.id?.toString() || "",
          district: currentDistrict?.id?.toString() || "",
          province: currentProvince?.id?.toString() || "",
        },
        tel: data.profile.tel || "",
        emergency: {
          name: data.profile.emergency[0]?.name || "",
          tel: data.profile.emergency[0]?.tel || "",
          relation: data.profile.emergency[0]?.relation || "",
        },
        school: data.profile.school?.id?.toString() || "",
        gradeYear: data.profile.gradeYear
          ? data.profile.gradeYear.toString()
          : "",
      };

      setEditProfileData(initialData);
      setBirthdayDate(parsedBirthdayDate);
    }
  };

  const handleSaveProfileData = async () => {
    // ตรวจสอบ validation เลขบัตรประชาชนทั้งในโหมด create และ edit
    const isValid = await validateCitizenIdAsync(editProfileData.citizenId);

    if (!isValid) {
      addToast({
        title: "ข้อผิดพลาด",
        description: "กรุณาตรวจสอบเลขบัตรประชาชน",
        color: "danger",
      });

      return;
    }

    // ตรวจสอบวันเกิด
    const birthdayError = validateBirthday(editProfileData.birthday);

    if (birthdayError) {
      addToast({
        title: "ข้อผิดพลาด",
        description: birthdayError,
        color: "danger",
      });

      return;
    }

    setIsProfileSaving(true);
    try {
      const profileData = {
        hn: editProfileData.hn,
        citizenId: editProfileData.citizenId,
        prefixId: parseInt(editProfileData.prefixId),
        sex: parseInt(editProfileData.sex),
        firstname: editProfileData.firstname,
        lastname: editProfileData.lastname,
        birthday:
          editProfileData.birthday &&
          editProfileData.birthday !== "" &&
          editProfileData.birthday.includes("/")
            ? new Date(parseThaiDateToISO(editProfileData.birthday))
            : null,
        ethnicity: editProfileData.ethnicity,
        nationality: editProfileData.nationality,
        schoolId: editProfileData.school
          ? parseInt(editProfileData.school)
          : null,
        gradeYear: editProfileData.gradeYear
          ? parseInt(editProfileData.gradeYear)
          : null,
        address: {
          houseNo: editProfileData.address.houseNo,
          villageNo: editProfileData.address.villageNo,
          soi: editProfileData.address.soi,
          road: editProfileData.address.road,
          subdistrict: parseInt(editProfileData.address.subdistrict),
          district: parseInt(editProfileData.address.district),
          province: parseInt(editProfileData.address.province),
        },
        tel: editProfileData.tel,
        emergency: {
          name: editProfileData.emergency.name,
          tel: editProfileData.emergency.tel,
          relation: editProfileData.emergency.relation,
        },
      };

      let response;

      if (mode === "create") {
        // สร้าง profile ใหม่
        response = await fetch("/api/profile/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
        });
      } else {
        // แก้ไข profile ที่มีอยู่ (ส่ง user id ตาม semantics ของ API)
        const userId = data?.profile?.userId;

        if (!userId) {
          addToast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่พบข้อมูล user id",
            color: "danger",
          });
          setIsProfileSaving(false);

          return;
        }
        const updateData = {
          id: data?.profile.id,
          ...profileData,
        };

        response = await fetch(`/api/profile/user/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });
      }

      if (response.ok) {
        addToast({
          title: "สำเร็จ",
          description:
            mode === "create"
              ? "สร้างข้อมูลผู้ประเมินสำเร็จ"
              : "บันทึกข้อมูลผู้ประเมินสำเร็จ",
          color: "success",
        });

        // เรียก onSuccess ก่อนปิด modal เพื่อให้ parent component อัปเดตข้อมูล
        if (onSuccess) {
          await onSuccess();
        }

        onClose();
      } else {
        throw new Error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error) {
      addToast({
        title: "ข้อผิดพลาด",
        description:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        color: "danger",
      });
    } finally {
      setIsProfileSaving(false);
    }
  };

  useEffect(() => {
    GetProvinceList();
    GetDistrictList();
    GetSubdistrictList();
    GetSchoolList();
  }, []);

  useEffect(() => {
    if (
      isOpen &&
      province.length > 0 &&
      distrince.length > 0 &&
      subdistrince.length > 0 &&
      schools.length > 0
    ) {
      // อัปเดตข้อมูลทุกครั้งที่ modal เปิดและมีข้อมูลครบ
      setCurrentData(data);
      initializeEditProfileData();
    }
  }, [isOpen, data, province, distrince, subdistrince, schools, mode]);

  // เพิ่ม useEffect เพื่ออัปเดตข้อมูลเมื่อ data เปลี่ยน
  useEffect(() => {
    if (
      isOpen &&
      data &&
      currentData &&
      JSON.stringify(data) !== JSON.stringify(currentData)
    ) {
      // อัปเดตข้อมูลเมื่อ data เปลี่ยน
      setCurrentData(data);
      initializeEditProfileData();
    }
  }, [data, isOpen, currentData]);

  // รีเซ็ตข้อมูลเมื่อ modal ปิด
  useEffect(() => {
    if (!isOpen) {
      setCurrentData(null);
      // รีเซ็ต error messages เมื่อปิด modal
      setCitizenIdError("");
      setBirthdayError("");
    }
  }, [isOpen]);

  return (
    <Modal
      hideCloseButton
      backdrop="blur"
      closeButton={false}
      isOpen={isOpen}
      radius="md"
      scrollBehavior="inside"
      shadow="lg"
      size="2xl"
    >
      <ModalContent>
        <ModalHeader className="flex flex-row justify-center">
          <h2 className="text-2xl font-bold">
            {mode === "create"
              ? "เพิ่มข้อมูลผู้ประเมิน"
              : "แก้ไขข้อมูลผู้ประเมิน"}
          </h2>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-2">
            <p className="text-md font-bold">ข้อมูลส่วนตัว</p>
            <div className="flex flex-row gap-2">
              <Input
                label="HN"
                name="hn"
                size="sm"
                value={editProfileData.hn}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
              <Input
                errorMessage={citizenIdError}
                isInvalid={citizenIdError !== ""}
                isRequired={true}
                label="เลขที่บัตรประชาชน"
                maxLength={13}
                name="citizenId"
                placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
                size="sm"
                value={editProfileData.citizenId}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
            </div>
            <div className="flex flex-row gap-2">
              <Select
                isRequired={true}
                label="คำนำหน้า"
                name="prefixId"
                placeholder="เลือกคำนำหน้า"
                selectedKeys={
                  editProfileData.prefixId ? [editProfileData.prefixId] : []
                }
                size="sm"
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  handleEditProfileSelectChange("prefixId", selectedKey);
                }}
              >
                {prefix.map((item) => (
                  <SelectItem key={item.key}>{item.label}</SelectItem>
                ))}
              </Select>
              <Input
                isRequired={true}
                label="ชื่อ"
                name="firstname"
                size="sm"
                value={editProfileData.firstname}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
              <Input
                isRequired={true}
                label="นามสกุล"
                name="lastname"
                size="sm"
                value={editProfileData.lastname}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
            </div>
            <div className="flex flex-row gap-2">
              <Select
                isRequired={true}
                label="เพศ"
                name="sex"
                placeholder="เลือกเพศ"
                selectedKeys={editProfileData.sex ? [editProfileData.sex] : []}
                size="sm"
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  handleEditProfileSelectChange("sex", selectedKey);
                }}
              >
                <SelectItem key="1">ชาย</SelectItem>
                <SelectItem key="2">หญิง</SelectItem>
                <SelectItem key="3">ไม่ระบุ</SelectItem>
              </Select>
              <Input
                isRequired={true}
                label="เชื้อชาติ"
                name="ethnicity"
                size="sm"
                value={editProfileData.ethnicity}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
              <Input
                isRequired={true}
                label="สัญชาติ"
                name="nationality"
                size="sm"
                value={editProfileData.nationality}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
            </div>
            <div className="flex flex-row gap-2">
              <DatePicker
                errorMessage={birthdayError}
                isInvalid={!!birthdayError}
                isRequired={true}
                label="วันเกิด (พ.ศ.)"
                maxValue={parseDate(moment().format("YYYY-MM-DD"))}
                minValue={parseDate(
                  moment().subtract(100, "years").format("YYYY-MM-DD")
                )}
                name="birthday"
                selectorButtonPlacement="start"
                showMonthAndYearPickers={true}
                size="sm"
                value={birthdayDate}
                variant="bordered"
                onChange={(
                  date: CalendarDate | CalendarDateTime | ZonedDateTime | null
                ) => {
                  if (date) {
                    const isoDate = date.toString();
                    const thaiDate = formatDateForDisplay(isoDate);

                    setEditProfileData((prev) => ({
                      ...prev,
                      birthday: thaiDate,
                    }));
                    setBirthdayDate(date); // อัพเดท state สำหรับจัดการค่าเริ่มต้น

                    // Validate วันเกิดแบบ real-time
                    const error = validateBirthday(thaiDate);

                    setBirthdayError(error);

                    // คำนวณปีไทยเมื่อกรอกครบและไม่มี error
                    if (
                      thaiDate.length === 10 &&
                      thaiDate.includes("/") &&
                      !error
                    ) {
                      const parts = thaiDate.split("/");

                      if (
                        parts.length === 3 &&
                        parts[0].length === 2 &&
                        parts[1].length === 2 &&
                        parts[2].length === 4
                      ) {
                        try {
                          const parsedIsoDate = parseThaiDateToISO(thaiDate);
                          const thaiYear = calculateThaiYear(parsedIsoDate);

                          setEditProfileData((prev) => ({
                            ...prev,
                            thaiYear: thaiYear,
                          }));
                        } catch {
                          // กรณีที่แปลงวันที่ไม่สำเร็จ
                          setEditProfileData((prev) => ({
                            ...prev,
                            thaiYear: "",
                          }));
                        }
                      }
                    } else {
                      // รีเซ็ตปีไทยเมื่อกรอกไม่ครบหรือมี error
                      setEditProfileData((prev) => ({
                        ...prev,
                        thaiYear: "",
                      }));
                    }
                  } else {
                    // เมื่อล้างค่า
                    setEditProfileData((prev) => ({
                      ...prev,
                      birthday: "",
                      thaiYear: "",
                    }));
                    setBirthdayDate(null); // ล้าง state สำหรับจัดการค่าเริ่มต้น
                    setBirthdayError("");
                  }
                }}
              />
              <Autocomplete
                defaultItems={schools}
                isRequired={true}
                label="สถานศึกษา"
                name="school"
                placeholder="เลือกสถานศึกษา"
                selectedKey={editProfileData.school || ""}
                size="sm"
                variant="bordered"
                onSelectionChange={(key) => {
                  const selectedKey = key as string;

                  handleEditProfileSelectChange("school", selectedKey);
                }}
              >
                {(item) => (
                  <AutocompleteItem key={item.id} textValue={item.name}>
                    {item.name}
                  </AutocompleteItem>
                )}
              </Autocomplete>
              {editProfileData.school && (
                <Select
                  isRequired={false}
                  label="ชั้นปี"
                  name="gradeYear"
                  placeholder="เลือกชั้นปี"
                  selectedKeys={
                    editProfileData.gradeYear ? [editProfileData.gradeYear] : []
                  }
                  size="sm"
                  variant="bordered"
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;

                    handleEditProfileSelectChange("gradeYear", selectedKey);
                  }}
                >
                  {gradeYearLevels.map((level) => (
                    <SelectItem key={level.key.toString()}>
                      {level.label}
                    </SelectItem>
                  ))}
                </Select>
              )}
            </div>
          </div>
          <Divider className="my-1" />
          <p className="text-md font-bold">ที่อยู่</p>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <Input
                isRequired={true}
                label="บ้านเลขที่"
                name="address.houseNo"
                size="sm"
                value={editProfileData.address.houseNo}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
              <Input
                label="หมู่ที่"
                name="address.villageNo"
                size="sm"
                value={editProfileData.address.villageNo}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
            </div>
            <div className="flex flex-row gap-2">
              <Input
                label="ซอย"
                name="address.soi"
                size="sm"
                value={editProfileData.address.soi}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
              <Input
                isRequired={true}
                label="ถนน"
                name="address.road"
                size="sm"
                value={editProfileData.address.road}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
            </div>
            <div className="flex flex-row gap-2">
              <Autocomplete
                defaultItems={province}
                isRequired={true}
                label="จังหวัด"
                name="address.province"
                placeholder="เลือกจังหวัด"
                selectedKey={editProfileData.address.province || ""}
                size="sm"
                variant="bordered"
                onSelectionChange={(key) => {
                  const selectedKey = key as string;

                  handleEditProfileSelectChange(
                    "address.province",
                    selectedKey
                  );
                  // รีเซ็ตอำเภอและตำบลเมื่อเปลี่ยนจังหวัด
                  handleEditProfileSelectChange("address.district", "");
                  handleEditProfileSelectChange("address.subdistrict", "");
                }}
              >
                {(item) => (
                  <AutocompleteItem
                    key={item.id.toString()}
                    textValue={item.nameInThai}
                  >
                    {item.nameInThai}
                  </AutocompleteItem>
                )}
              </Autocomplete>
              <Autocomplete
                defaultItems={distrince.filter(
                  (item) =>
                    item.provinceId.toString() ===
                    editProfileData.address.province
                )}
                isDisabled={!editProfileData.address.province}
                isRequired={true}
                label="อำเภอ"
                name="address.district"
                placeholder="เลือกอำเภอ"
                selectedKey={editProfileData.address.district || ""}
                size="sm"
                variant="bordered"
                onSelectionChange={(key) => {
                  const selectedKey = key as string;

                  handleEditProfileSelectChange(
                    "address.district",
                    selectedKey
                  );
                  // รีเซ็ตตำบลเมื่อเปลี่ยนอำเภอ
                  handleEditProfileSelectChange("address.subdistrict", "");
                }}
              >
                {(item) => (
                  <AutocompleteItem
                    key={item.id.toString()}
                    textValue={item.nameInThai}
                  >
                    {item.nameInThai}
                  </AutocompleteItem>
                )}
              </Autocomplete>
            </div>
            <div className="flex flex-row gap-2">
              <Autocomplete
                defaultItems={subdistrince.filter(
                  (item) =>
                    item.districtId.toString() ===
                    editProfileData.address.district
                )}
                isDisabled={!editProfileData.address.district}
                isRequired={true}
                label="ตำบล"
                name="address.subdistrict"
                placeholder="เลือกตำบล"
                selectedKey={editProfileData.address.subdistrict || ""}
                size="sm"
                variant="bordered"
                onSelectionChange={(key) => {
                  const selectedKey = key as string;

                  handleEditProfileSelectChange(
                    "address.subdistrict",
                    selectedKey
                  );
                }}
              >
                {(item) => (
                  <AutocompleteItem
                    key={item.id.toString()}
                    textValue={item.nameInThai}
                  >
                    {item.nameInThai}
                  </AutocompleteItem>
                )}
              </Autocomplete>
              <Input
                isRequired={true}
                label="โทรศัพท์"
                maxLength={10}
                name="tel"
                size="sm"
                value={editProfileData.tel}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
            </div>
          </div>
          <Divider className="my-1" />
          <p className="text-md font-bold">ข้อมูลผู้ติดต่อฉุกเฉิน</p>
          <div className="flex flex-row gap-2">
            <Input
              isRequired={true}
              label="ชื่อผู้ติดต่อฉุกเฉิน"
              name="emergency.name"
              size="sm"
              value={editProfileData.emergency.name}
              variant="bordered"
              onChange={handleEditProfileChange}
            />
            <Input
              isRequired={true}
              label="โทรศัพท์"
              maxLength={10}
              name="emergency.tel"
              size="sm"
              value={editProfileData.emergency.tel}
              variant="bordered"
              onChange={handleEditProfileChange}
            />
            <Input
              isRequired={true}
              label="ความสัมพันธ์"
              name="emergency.relation"
              size="sm"
              value={editProfileData.emergency.relation}
              variant="bordered"
              onChange={handleEditProfileChange}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            isDisabled={isProfileSaving}
            variant="light"
            onPress={onClose}
          >
            ปิด
          </Button>
          <Button
            color="primary"
            isDisabled={isProfileSaving}
            isLoading={isProfileSaving}
            onPress={handleSaveProfileData}
          >
            {isProfileSaving
              ? "กำลังบันทึก..."
              : mode === "create"
                ? "สร้าง"
                : "บันทึก"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
