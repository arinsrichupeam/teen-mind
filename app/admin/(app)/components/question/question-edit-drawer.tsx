"use client";

import moment from "moment";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Districts, Provinces, Subdistricts } from "@prisma/client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  addToast,
  Autocomplete,
  AutocompleteItem,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  DatePicker,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Form,
  Image,
  Input,
  Link,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";

import { questionStatusOptions as options } from "../../data/optionData";
import { ModalEditProfile } from "../modal/modal-edit-profile";

import { QuestionDetailDrawer } from "./question-detail-drawer";

import { prefix } from "@/utils/data";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { Consultant, QuestionsData } from "@/types";
import { subtitle } from "@/components/primitives";

interface Props {
  isOpen: any;
  onClose: any;
  data: QuestionsData;
  mode: string;
}

const ConsultantInitValue: Consultant[] = [
  {
    id: "",
    name: "",
  },
];

export const QuestionEditDrawer = ({ isOpen, onClose, data, mode }: Props) => {
  const [distrince, setDistrince] = useState<Districts[]>([]);
  const [province, setProvince] = useState<Provinces[]>([]);
  const [subdistrince, setSubDistrince] = useState<Subdistricts[]>([]);
  const [Consultant, setConsultant] =
    useState<Consultant[]>(ConsultantInitValue);
  const [questionData, setQuestionData] = useState<QuestionsData>(data);
  const [hnIsloading, setHnIsloading] = useState(false);
  const [formIsloading, setformIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const latitude = data?.latitude != null ? data?.latitude : 0;
  const longitude = data?.longitude != null ? data?.longitude : 0;

  const fetchData = async (url: string, setter: (data: any) => void) => {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Failed to fetch data from ${url}`);
      }
      const data = await res.json();

      setter(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล"
      );
      addToast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        color: "danger",
      });
    }
  };

  const GetDistrictList = useCallback(async () => {
    await fetchData("/api/data/districts", setDistrince);
  }, []);

  const GetProvinceList = useCallback(async () => {
    await fetchData("/api/data/provinces", setProvince);
  }, []);

  const GetSubdistrictList = useCallback(async () => {
    await fetchData("/api/data/subdistricts", setSubDistrince);
  }, []);

  const GetConsultantList = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/admin");

      if (!res.ok) throw new Error("Failed to fetch consultant list");

      const val = await res.json();
      const consult = val.filter((x: any) => x.status === 1 && x.role.id == 3);

      if (consult.length > 0) {
        setConsultant(
          consult.map((item: any) => ({
            id: item.userId,
            name: item.firstname + " " + item.lastname,
          }))
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการโหลดข้อมูลที่ปรึกษา"
      );
      addToast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการโหลดข้อมูลที่ปรึกษา",
        color: "danger",
      });
    }
  }, []);

  const ChangeHN = async () => {
    const json = JSON.stringify({
      id: data?.profile.id,
      hn: questionData.hn,
    });

    setHnIsloading(true);
    await fetch("/api/profile/user", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: json,
    }).then(() => {
      setTimeout(() => {
        setHnIsloading(false);
      }, 2000);
    });
  };

  const HandleChange = (e: any) => {
    const { name, value } = e.target;

    if (
      (name === "consult" && value !== "") ||
      (name === "status" && value !== 2)
    ) {
      setIsError(false);
    }

    if (name === "schedule_telemed") {
      setQuestionData((prev) => ({
        ...prev,
        schedule_telemed: new Date(value),
      }));
    } else if (name === "follow_up") {
      setQuestionData((prev) => ({
        ...prev,
        follow_up: new Date(value),
      }));
    } else {
      setQuestionData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setformIsLoading(true);
    setError(null);

    try {
      let updateData;

      if (mode === "edit-questionnaire") {
        updateData = {
          id: questionData.id,
          q2: questionData.q2,
          phqa: questionData.phqa,
          addon: questionData.addon,
          status: questionData.status,
        };
      } else {
        updateData = {
          id: questionData.id,
          consult: questionData.consult,
          schedule_telemed: questionData.schedule_telemed,
          subjective: questionData.subjective,
          objective: questionData.objective,
          assessment: questionData.assessment,
          plan: questionData.plan,
          follow_up: questionData.follow_up,
          status: questionData.status,
          q2: questionData.q2,
          phqa: questionData.phqa,
          addon: questionData.addon,
        };
      }

      await fetch("/api/question/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      }).then(() => {
        addToast({
          title: "Success",
          description: "บันทึกข้อมูลสำเร็จ",
          color: "success",
        });
        onClose();
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
      addToast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        color: "danger",
      });
    } finally {
      setformIsLoading(false);
    }
  };

  const handleQuestionChange = (field: string, value: any) => {
    setQuestionData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = useCallback(() => {
    // ตรวจสอบ consult และ status เฉพาะเมื่ออยู่ในโหมด edit-consultation
    if (mode === "edit-consultation") {
      if (questionData.status === 2 && questionData.consult === null) {
        setIsError(true);

        return false;
      }

      if (!questionData.schedule_telemed) {
        setError("กรุณาเลือกวันนัด Telemedicine");

        return false;
      }
    }

    return true;
  }, [questionData, setError, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
  };

  useEffect(() => {
    GetProvinceList();
    GetDistrictList();
    GetSubdistrictList();
    GetConsultantList();

    if (isOpen) {
      setQuestionData(data);
    }
  }, [isOpen]);

  return (
    <>
      <Drawer
        isKeyboardDismissDisabled={true}
        isOpen={isOpen}
        placement="right"
        size={"4xl"}
        onClose={onClose}
      >
        <DrawerContent>
          {(onClose) => (
            <Form onReset={onClose} onSubmit={handleSubmit}>
              <DrawerHeader className="w-full">
                <div className="flex flex-col lg:flex-row w-full justify-between gap-3 text-sm">
                  <div className="pt-2">
                    <span className="font-semibold">วันที่ประเมิน:</span>{" "}
                    <span>
                      {new Date(data?.createdAt as string).toLocaleDateString(
                        "th-TH",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex flex-row gap-5">
                    <div className="pt-2">
                      <span className="font-semibold">โหมด:</span> {mode}
                    </div>
                    <div className="pr-5">
                      <span className="font-semibold">ผลการประเมิน:</span>
                      <Chip
                        className="ml-3"
                        color={
                          data?.result === "Green"
                            ? "success"
                            : data?.result === "Red"
                              ? "danger"
                              : "warning"
                        }
                        size="lg"
                        variant="flat"
                      >
                        <span className="capitalize text-xs">
                          {data?.result}
                        </span>
                      </Chip>
                    </div>
                  </div>
                </div>
              </DrawerHeader>
              {error && (
                <div className="px-4 py-2 bg-red-100 text-red-700 rounded-md mx-4">
                  {error}
                </div>
              )}
              <DrawerBody className="w-full">
                {mode !== "edit-questionnaire" ? (
                  <div className="flex flex-col sm:flex-row gap-5 mx-auto justify-center w-full">
                    <>
                      <Card className="w-[400px]">
                        <CardHeader className="flex gap-3">
                          <Image
                            key={`image-${data.profile.id}-${data.id}`}
                            alt={`รูปภาพ ${data.profile.id}`}
                            className="object-cover rounded cursor-pointer hover:opacity-80 transition-opacity min-w-[100px] h-[100px]"
                            fallbackSrc="https://placehold.co/100x100?text=NO+IMAGE\\nAVAILABLE"
                            height={100}
                            loading="lazy"
                            src={
                              data?.profile.user
                                ? data?.profile.user.image
                                : undefined
                            }
                            width={100}
                          />
                          <div className="flex flex-col">
                            <p className="text-md">
                              {
                                prefix.find(
                                  (val) => val.key == data?.profile.prefixId
                                )?.label
                              }{" "}
                              {data?.profile.firstname} {data?.profile.lastname}
                            </p>
                            <p className="text-small">
                              เลขที่บัตรประชาชน :{" "}
                              <b>{data?.profile.citizenId}</b>
                            </p>
                            <p className="text-small">
                              วัน/เดือน/ปี เกิด :{" "}
                              <b>
                                {moment(data?.profile.birthday)
                                  .add(543, "year")
                                  .locale("th-TH")
                                  .format("DD/MM/YYYY")}
                              </b>
                            </p>
                            <p className="text-small">
                              เชื้อชาติ : <b>{data?.profile.ethnicity}</b>{" "}
                              สัญชาติ : <b>{data?.profile.nationality}</b>
                            </p>
                          </div>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                          <div>
                            <p className="text-small">
                              ที่อยู่ :{" "}
                              <b>{data?.profile.address[0].houseNo}</b> หมู่ที่
                              :{" "}
                              <b>
                                {data?.profile.address[0].villageNo == ""
                                  ? "-"
                                  : data?.profile.address[0].villageNo}
                              </b>{" "}
                              ซอย : <b>{data?.profile.address[0].soi}</b>
                            </p>
                            <p className="text-small">
                              ถนน : <b>{data?.profile.address[0].road}</b> ตำบล
                              :{" "}
                              <b>
                                {
                                  subdistrince?.find(
                                    (x) =>
                                      x.id ==
                                      data?.profile.address[0].subdistrict
                                  )?.nameInThai
                                }
                              </b>{" "}
                              อำเภอ :{" "}
                              <b>
                                {
                                  distrince?.find(
                                    (x) =>
                                      x.id == data?.profile.address[0].district
                                  )?.nameInThai
                                }
                              </b>
                            </p>
                            <p className="text-small">
                              จังหวัด :{" "}
                              <b>
                                {
                                  province?.find(
                                    (x) =>
                                      x.id == data?.profile.address[0].province
                                  )?.nameInThai
                                }
                              </b>{" "}
                              โทรศัพท์ : <b>{data?.profile.tel}</b>
                            </p>
                          </div>
                        </CardBody>
                        <Divider />
                        <CardBody>
                          <div>
                            <p className="text-small">
                              ชื่อผู้ติดต่อฉุกเฉิน :{" "}
                              <b>{data?.profile.emergency[0].name}</b>{" "}
                            </p>
                            <p className="text-small">
                              โทรศัพท์ : <b>{data?.profile.emergency[0].tel}</b>{" "}
                              ความสัมพันธ์ :{" "}
                              <b>{data?.profile.emergency[0].relation}</b>
                            </p>
                          </div>
                        </CardBody>
                        <Divider />
                        <CardFooter>
                          <div className="flex flex-row gap-4">
                            <Input
                              defaultValue={data?.profile.hn}
                              isDisabled={
                                mode == "view-questionnaire" ||
                                mode == "view-consultation" ||
                                mode == "edit-consultation"
                              }
                              name="hn"
                              startContent={<p> HN:</p>}
                              variant="bordered"
                              onChange={HandleChange}
                            />
                            <Button
                              color="primary"
                              isDisabled={
                                mode == "view-questionnaire" ||
                                mode == "view-consultation" ||
                                mode == "edit-consultation"
                              }
                              isLoading={hnIsloading}
                              onPress={() => ChangeHN()}
                            >
                              บันทึก
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                      <Card className="w-[400px]">
                        <CardBody>
                          <div className="mx-auto w-[352px] h-[265px]">
                            <MapContainer
                              center={[latitude, longitude]}
                              doubleClickZoom={false}
                              dragging={false}
                              scrollWheelZoom={false}
                              style={{ height: "100%", width: "100%" }}
                              zoom={17}
                              zoomControl={false}
                            >
                              <TileLayer
                                attribution=""
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <Marker
                                draggable={false}
                                position={[latitude, longitude]}
                              >
                                <Popup>Hey ! I study here</Popup>
                              </Marker>
                            </MapContainer>
                          </div>
                        </CardBody>
                        <Divider />
                        <CardFooter>
                          <Link
                            isExternal
                            showAnchorIcon
                            href={`https://www.google.co.th/maps/place/${data?.latitude},${data?.longitude}`}
                          >
                            ดูบนแผนที่
                          </Link>
                        </CardFooter>
                      </Card>
                    </>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-5 mx-auto justify-center w-full">
                    <>
                      <Card className="w-[400px]">
                        <CardHeader className="flex gap-3">
                          <Image
                            key={`image-${data.profile.id}-${data.id}`}
                            alt={`รูปภาพ ${data.profile.id}`}
                            className="object-cover rounded cursor-pointer hover:opacity-80 transition-opacity min-w-[100px] h-[100px]"
                            fallbackSrc="https://placehold.co/100x100?text=NO+IMAGE\\nAVAILABLE"
                            height={100}
                            loading="lazy"
                            src={
                              data?.profile.user
                                ? data?.profile.user.image
                                : undefined
                            }
                            width={100}
                          />
                          <div className="flex flex-col">
                            <p className="text-sm">
                              <span className="text-small">
                                HN : <b>{data?.profile.hn}</b>
                              </span>{" "}
                            </p>
                            <p className="text-sm">
                              <span className="text-small">ชื่อ : </span>
                              <b>
                                {
                                  prefix.find(
                                    (val) => val.key == data?.profile.prefixId
                                  )?.label
                                }{" "}
                                {data?.profile.firstname}{" "}
                                {data?.profile.lastname}
                              </b>
                            </p>
                            <p className="text-small">
                              เลขที่บัตรประชาชน :{" "}
                              <b>{data?.profile.citizenId}</b>
                            </p>
                            <p className="text-small">
                              วัน/เดือน/ปี เกิด :{" "}
                              <b>
                                {moment(data?.profile.birthday)
                                  .add(543, "year")
                                  .locale("th-TH")
                                  .format("DD/MM/YYYY")}
                              </b>
                            </p>
                            <p className="text-small">
                              เชื้อชาติ : <b>{data?.profile.ethnicity}</b>{" "}
                              สัญชาติ : <b>{data?.profile.nationality}</b>
                            </p>
                          </div>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                          <div>
                            <p className="text-small">
                              ที่อยู่ :{" "}
                              <b>{data?.profile.address[0].houseNo}</b> หมู่ที่
                              :{" "}
                              <b>
                                {data?.profile.address[0].villageNo == ""
                                  ? "-"
                                  : data?.profile.address[0].villageNo}
                              </b>{" "}
                              ซอย : <b>{data?.profile.address[0].soi}</b>
                            </p>
                            <p className="text-small">
                              ถนน : <b>{data?.profile.address[0].road}</b> ตำบล
                              :{" "}
                              <b>
                                {
                                  subdistrince?.find(
                                    (x) =>
                                      x.id ==
                                      data?.profile.address[0].subdistrict
                                  )?.nameInThai
                                }
                              </b>{" "}
                              อำเภอ :{" "}
                              <b>
                                {
                                  distrince?.find(
                                    (x) =>
                                      x.id == data?.profile.address[0].district
                                  )?.nameInThai
                                }
                              </b>
                            </p>
                            <p className="text-small">
                              จังหวัด :{" "}
                              <b>
                                {
                                  province?.find(
                                    (x) =>
                                      x.id == data?.profile.address[0].province
                                  )?.nameInThai
                                }
                              </b>{" "}
                              โทรศัพท์ : <b>{data?.profile.tel}</b>
                            </p>
                          </div>
                        </CardBody>
                        <Divider />
                        <CardBody>
                          <div>
                            <p className="text-small">
                              ชื่อผู้ติดต่อฉุกเฉิน :{" "}
                              <b>{data?.profile.emergency[0].name}</b>{" "}
                            </p>
                            <p className="text-small">
                              โทรศัพท์ : <b>{data?.profile.emergency[0].tel}</b>{" "}
                              ความสัมพันธ์ :{" "}
                              <b>{data?.profile.emergency[0].relation}</b>
                            </p>
                          </div>
                        </CardBody>
                        <Divider />
                        <CardFooter>
                          <div className="flex flex-row gap-4 justify-center w-full">
                            <Button
                              color="warning"
                              variant="flat"
                              onPress={() => setIsModalOpen(true)}
                            >
                              แก้ไขข้อมูลส่วนตัว
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                      <Card className="w-[400px]">
                        <CardBody>
                          <div className="mx-auto w-[352px] h-[265px]">
                            <MapContainer
                              center={[latitude, longitude]}
                              doubleClickZoom={false}
                              dragging={false}
                              scrollWheelZoom={false}
                              style={{ height: "100%", width: "100%" }}
                              zoom={17}
                              zoomControl={false}
                            >
                              <TileLayer
                                attribution=""
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <Marker
                                draggable={false}
                                position={[latitude, longitude]}
                              >
                                <Popup>Hey ! I study here</Popup>
                              </Marker>
                            </MapContainer>
                          </div>
                        </CardBody>
                        <Divider />
                        <CardFooter>
                          <Link
                            isExternal
                            showAnchorIcon
                            href={`https://www.google.co.th/maps/place/${data?.latitude},${data?.longitude}`}
                          >
                            ดูบนแผนที่
                          </Link>
                        </CardFooter>
                      </Card>
                    </>
                  </div>
                )}

                {mode === "view-questionnaire" ? (
                  <QuestionDetailDrawer data={data} />
                ) : mode === "view-consultation" ? (
                  <div className="flex flex-col">
                    <div>
                      <div className="flex flex-row pb-3">
                        <h2 className={subtitle()}>Telemedicine</h2>
                        <Select
                          className="max-w-xs"
                          defaultSelectedKeys={data?.status.toString()}
                          isDisabled={true}
                          label="สถานะ"
                          labelPlacement="outside-left"
                          name="status"
                          placeholder="สถานะ"
                          radius="md"
                          variant="bordered"
                        >
                          {options.map((item) => (
                            <SelectItem key={item.uid}>{item.name}</SelectItem>
                          ))}
                        </Select>
                      </div>
                      <Card>
                        <CardBody className="flex flex-row gap-5">
                          <div className="w-full">
                            <DatePicker
                              defaultValue={
                                data?.schedule_telemed
                                  ? parseDate(
                                      moment(data?.schedule_telemed).format(
                                        "YYYY-MM-DD"
                                      )
                                    )
                                  : null
                              }
                              isDisabled={true}
                              label="Schedule Telemed"
                              labelPlacement="outside"
                              name="schedule_telemed"
                              selectorButtonPlacement="start"
                              variant="bordered"
                            />
                          </div>
                          <div className="w-full">
                            <Autocomplete
                              defaultItems={Consultant}
                              defaultSelectedKey={data?.consult}
                              isDisabled={true}
                              label="Consultant"
                              labelPlacement="outside"
                              placeholder="Consultant"
                              radius="md"
                              variant="bordered"
                            >
                              {(item) => (
                                <AutocompleteItem key={item.id}>
                                  {item.name}
                                </AutocompleteItem>
                              )}
                            </Autocomplete>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                    <div>
                      <div className="flex flex-row py-3">
                        <h2 className={subtitle()}>Discharge Summary</h2>
                        <DatePicker
                          className="max-w-xs"
                          defaultValue={
                            data?.follow_up
                              ? parseDate(
                                  moment(data?.follow_up).format("YYYY-MM-DD")
                                )
                              : null
                          }
                          isDisabled={true}
                          label="Follow Up"
                          labelPlacement="outside-left"
                          name="follow_up"
                          selectorButtonPlacement="start"
                          variant="bordered"
                        />
                      </div>
                      <Card>
                        <CardBody className="gap-5">
                          <Textarea
                            defaultValue={data?.subjective}
                            isDisabled={true}
                            label="1.	Subjective data"
                            labelPlacement="outside"
                            minRows={3}
                            name="subjective"
                            placeholder="Description"
                            variant="bordered"
                          />
                          <Textarea
                            defaultValue={data?.objective}
                            isDisabled={true}
                            label="2.	Objective data"
                            labelPlacement="outside"
                            minRows={3}
                            name="objective"
                            placeholder="Description"
                            variant="bordered"
                          />
                          <Textarea
                            defaultValue={data?.assessment}
                            isDisabled={true}
                            label="3.	Assessment"
                            labelPlacement="outside"
                            minRows={3}
                            name="assessment"
                            placeholder="Description"
                            variant="bordered"
                          />
                          <Textarea
                            defaultValue={data?.plan}
                            isDisabled={true}
                            label="4.	Plan"
                            labelPlacement="outside"
                            minRows={3}
                            name="plan"
                            placeholder="Description"
                            variant="bordered"
                          />
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                ) : mode === "edit-questionnaire" ? (
                  <QuestionDetailDrawer
                    data={questionData}
                    mode={mode}
                    onQuestionChange={handleQuestionChange}
                  />
                ) : (
                  <div className="flex flex-col">
                    <div>
                      <div className="flex flex-row pb-3">
                        <h2 className={subtitle()}>Telemedicine</h2>
                        <Select
                          className="max-w-xs"
                          defaultSelectedKeys={data?.status.toString()}
                          label="สถานะ"
                          labelPlacement="outside-left"
                          name="status"
                          placeholder="สถานะ"
                          radius="md"
                          variant="bordered"
                          onChange={(val) => {
                            HandleChange({
                              target: {
                                name: "status",
                                value: parseInt(val.target.value),
                              },
                            });
                          }}
                        >
                          {options.map((item) => (
                            <SelectItem key={item.uid}>{item.name}</SelectItem>
                          ))}
                        </Select>
                      </div>
                      <Card>
                        <CardBody className="flex flex-row gap-5">
                          <div className="w-full">
                            <DatePicker
                              defaultValue={
                                data?.schedule_telemed
                                  ? parseDate(
                                      moment(data?.schedule_telemed).format(
                                        "YYYY-MM-DD"
                                      )
                                    )
                                  : null
                              }
                              isDisabled={true}
                              label="Schedule Telemed"
                              labelPlacement="outside"
                              name="schedule_telemed"
                              selectorButtonPlacement="start"
                              variant="bordered"
                            />
                          </div>
                          <div className="w-full">
                            <Autocomplete
                              defaultItems={Consultant}
                              defaultSelectedKey={data?.consult}
                              errorMessage="กรุณาระบุผู้ให้คำปรึกษา"
                              isInvalid={isError}
                              label="Consultant"
                              labelPlacement="outside"
                              placeholder="Consultant"
                              radius="md"
                              variant="bordered"
                              onSelectionChange={(val) =>
                                HandleChange({
                                  target: { name: "consult", value: val },
                                })
                              }
                            >
                              {(item) => (
                                <AutocompleteItem key={item.id}>
                                  {item.name}
                                </AutocompleteItem>
                              )}
                            </Autocomplete>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                    <div>
                      <div className="flex flex-row py-3">
                        <h2 className={subtitle()}>Discharge Summary</h2>
                        <DatePicker
                          className="max-w-xs"
                          defaultValue={
                            data?.follow_up
                              ? parseDate(
                                  moment(data?.follow_up).format("YYYY-MM-DD")
                                )
                              : null
                          }
                          isDisabled={true}
                          label="Follow Up"
                          labelPlacement="outside-left"
                          name="follow_up"
                          selectorButtonPlacement="start"
                          variant="bordered"
                        />
                      </div>
                      <Card>
                        <CardBody className="gap-5">
                          <Textarea
                            isClearable
                            defaultValue={data?.subjective}
                            label="1.	Subjective data"
                            labelPlacement="outside"
                            minRows={3}
                            name="subjective"
                            placeholder="Description"
                            variant="bordered"
                            onChange={HandleChange}
                            onClear={() =>
                              HandleChange({
                                target: { name: "subjective", value: null },
                              })
                            }
                          />
                          <Textarea
                            isClearable
                            defaultValue={data?.objective}
                            label="2.	Objective data"
                            labelPlacement="outside"
                            minRows={3}
                            name="objective"
                            placeholder="Description"
                            variant="bordered"
                            onChange={HandleChange}
                            onClear={() =>
                              HandleChange({
                                target: { name: "objective", value: null },
                              })
                            }
                          />
                          <Textarea
                            isClearable
                            defaultValue={data?.assessment}
                            label="3.	Assessment"
                            labelPlacement="outside"
                            minRows={3}
                            name="assessment"
                            placeholder="Description"
                            variant="bordered"
                            onChange={HandleChange}
                            onClear={() =>
                              HandleChange({
                                target: { name: "assessment", value: null },
                              })
                            }
                          />
                          <Textarea
                            isClearable
                            defaultValue={data?.plan}
                            label="4.	Plan"
                            labelPlacement="outside"
                            minRows={3}
                            name="plan"
                            placeholder="Description"
                            variant="bordered"
                            onChange={HandleChange}
                            onClear={() =>
                              HandleChange({
                                target: { name: "plan", value: null },
                              })
                            }
                          />
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                )}
              </DrawerBody>
              <DrawerFooter className="w-full">
                <Button color="danger" type="reset" variant="light">
                  ปิด
                </Button>
                {mode === "edit-questionnaire" && (
                  <Button
                    color="primary"
                    isDisabled={formIsloading}
                    isLoading={formIsloading}
                    type="submit"
                    variant="flat"
                  >
                    บันทึก
                  </Button>
                )}
                {mode === "edit-consultation" && (
                  <Button
                    color="primary"
                    isDisabled={formIsloading}
                    isLoading={formIsloading}
                    type="submit"
                  >
                    บันทึก
                  </Button>
                )}
              </DrawerFooter>
            </Form>
          )}
        </DrawerContent>
      </Drawer>

      <ModalEditProfile
        data={data}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onClose}
      />
    </>
  );
};
