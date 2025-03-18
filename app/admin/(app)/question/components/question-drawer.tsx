"use client";

import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { Districts, Provinces, Subdistricts } from "@prisma/client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
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

import { statusOptions } from "../data";

import { QuestionDetail } from "./detail";

import { prefix } from "@/utils/data";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { Consultant, QuestionsData } from "@/types";
import { subtitle } from "@/components/primitives";
import { XMarkIcon } from "@heroicons/react/24/outline";

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

const tabs = [
  {
    id: "photos",
    label: "Photos",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  {
    id: "music",
    label: "Music",
    content:
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
  {
    id: "videos",
    label: "Videos",
    content:
      "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  },
];

export const QuestionDrawer = ({ isOpen, onClose, data, mode }: Props) => {
  const [distrince, setDistrince] = useState<Districts[]>();
  const [province, setProvince] = useState<Provinces[]>();
  const [subdistrince, setSubDistrince] = useState<Subdistricts[]>();
  const [Consultant, setConsultant] =
    useState<Consultant[]>(ConsultantInitValue);
  const [questionData, setQuestionData] = useState<QuestionsData>(data);
  const [textboxHN, setTextboxHN] = useState("");
  const [hnIsloading, setHnIsloading] = useState(false);
  const [formIsloading, setformIsLoading] = useState(false);

  const latitude = data?.latitude != null ? data?.latitude : 0;
  const longitude = data?.longitude != null ? data?.longitude : 0;

  const GetDistrictList = useCallback(async () => {
    await fetch("/api/data/districts")
      .then((res) => res.json())
      .then((val) => {
        setDistrince(val);
      });
  }, [distrince]);

  const GetProvinceList = useCallback(async () => {
    await fetch("/api/data/provinces")
      .then((res) => res.json())
      .then((val) => {
        setProvince(val);
      });
  }, [province]);

  const GetSubdistrictList = useCallback(async () => {
    await fetch("/api/data/subdistricts")
      .then((res) => res.json())
      .then((val) => {
        setSubDistrince(val);
      });
  }, [subdistrince]);

  const GetConsultantList = useCallback(async () => {
    await fetch("/api/profile/admin")
      .then((res) => res.json())
      .then((val: any) => {
        const consult = val.filter(
          (x: any) => x.status === 1 && x.role[0].id == 4
        );

        if (consult != 0) {
          setConsultant([
            {
              id: consult[0].id,
              name: consult[0].firstname + " " + consult[0].lastname,
            },
          ]);
        }
      });
  }, [Consultant]);

  const ChangeHN = async () => {
    const json = JSON.stringify({
      id: data?.user.profile[0].id,
      hn: textboxHN,
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

  const HandleChange = useCallback(
    (e: any) => {
      const value = e.target.value;

      if (e.target.name === "txtHN") {
        setTextboxHN(value);
      } else if (e.target.name === "ConsultId") {
        setQuestionData((prev) => ({
          ...prev,
          consult: value,
        }));
      } else if (e.target.name === "schedule_telemed") {
        const date = new Date(value);

        setQuestionData((prev) => ({
          ...prev,
          schedule_telemed: date,
        }));
      } else {
        setQuestionData((prev) => ({
          ...prev,
          [e.target.name]: value,
        }));
      }
    },
    [textboxHN, questionData]
  );

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setformIsLoading(true);
    const data = JSON.stringify({
      questionData: questionData,
    });

    await fetch("/api/question", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    }).then(() => {
      setTimeout(() => {
        setformIsLoading(false);
      }, 2000);
    });
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
    <Drawer
      isKeyboardDismissDisabled={true}
      isOpen={isOpen}
      size={"4xl"}
      onClose={onClose}
    >
      <DrawerContent>
        {(onClose) => (
          <Form onReset={onClose} onSubmit={onSubmit}>
            <DrawerHeader className="w-full">
              <div className="flex flex-col lg:flex-row w-full justify-between gap-3 text-sm">
                <div className="pt-2">
                  วันที่ประเมิน :{" "}
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
                  <div className="pt-2">โหมด : {mode}</div>
                  <div className="pr-5">
                    ผลการประเมิน :
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
                      <span className="capitalize text-xs">{data?.result}</span>
                    </Chip>
                  </div>
                </div>
              </div>
            </DrawerHeader>
            <DrawerBody className="w-full">
              <div className="flex flex-col sm:flex-row gap-5 mx-auto">
                <Card className="max-w-[400px]">
                  <CardHeader className="flex gap-3">
                    <Image
                      alt="user profile"
                      height={100}
                      radius="sm"
                      src={data?.user.image}
                      width={100}
                    />
                    <div className="flex flex-col">
                      <p className="text-md">
                        {
                          prefix.find(
                            (val) => val.key == data?.user.profile[0].prefixId
                          )?.label
                        }{" "}
                        {data?.user.profile[0].firstname}{" "}
                        {data?.user.profile[0].lastname}
                      </p>
                      <p className="text-small">
                        เลขที่บัตรประชาชน :{" "}
                        <b>{data?.user.profile[0].citizenId}</b>
                      </p>
                      <p className="text-small">
                        วัน/เดือน/ปี เกิด :{" "}
                        <b>
                          {moment(data?.user.profile[0].birthday)
                            .add(543, "year")
                            .locale("th-TH")
                            .format("DD/MM/YYYY")}
                        </b>
                      </p>
                      <p className="text-small">
                        เชื้อชาติ : <b>{data?.user.profile[0].ethnicity}</b>{" "}
                        สัญชาติ : <b>{data?.user.profile[0].nationality}</b>
                      </p>
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <div>
                      <p className="text-small">
                        ที่อยู่ :{" "}
                        <b>{data?.user.profile[0].address[0].houseNo}</b>{" "}
                        หมู่ที่ :{" "}
                        <b>
                          {data?.user.profile[0].address[0].villageNo == ""
                            ? "-"
                            : data?.user.profile[0].address[0].villageNo}
                        </b>{" "}
                        ซอย : <b>{data?.user.profile[0].address[0].soi}</b>
                      </p>
                      <p className="text-small">
                        ถนน : <b>{data?.user.profile[0].address[0].road}</b>{" "}
                        ตำบล :{" "}
                        <b>
                          {
                            subdistrince?.find(
                              (x) =>
                                x.id ==
                                data?.user.profile[0].address[0].subdistrict
                            )?.nameInThai
                          }
                        </b>{" "}
                        อำเภอ :{" "}
                        <b>
                          {
                            distrince?.find(
                              (x) =>
                                x.id ==
                                data?.user.profile[0].address[0].district
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
                                x.id ==
                                data?.user.profile[0].address[0].province
                            )?.nameInThai
                          }
                        </b>{" "}
                        โทรศัพท์ : <b>{data?.user.profile[0].tel}</b>
                      </p>
                    </div>
                  </CardBody>
                  <Divider />
                  <CardFooter>
                    <div className="flex flex-row gap-4">
                      <Input
                        defaultValue={data?.user.profile[0].hn}
                        isDisabled={mode == "View"}
                        name="txtHN"
                        startContent={<p> HN:</p>}
                        variant="bordered"
                        onChange={HandleChange}
                      />
                      <Button
                        color="primary"
                        isDisabled={mode == "View"}
                        isLoading={hnIsloading}
                        onPress={() => ChangeHN()}
                      >
                        บันทึก
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
                <Card className="max-w-[400px]">
                  <CardBody>
                    <div className="mx-auto w-[352px] h-[200px]">
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
              </div>
              {mode == "View" ? (
                <QuestionDetail data={data} />
              ) : (
                <div className="flex flex-col">
                  {/* <div className="flex flex-row pb-3">
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
                      {statusOptions.map((item) => (
                        <SelectItem key={item.uid}>{item.name}</SelectItem>
                      ))}
                    </Select>
                  </div>
                  <Tabs
                    aria-label="Dynamic tabs"
                    color="primary"
                    items={tabs}
                    variant="underlined"
                  >
                    {(item) => (
                      <Tab key={item.id} title={item.label}>
                        <Card>
                          <CardBody>{item.content}</CardBody>
                        </Card>
                      </Tab>
                    )}
                  </Tabs> */}

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
                        {statusOptions.map((item) => (
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
                            label="Schedule Telemed"
                            labelPlacement="outside"
                            name="schedule_telemed"
                            selectorButtonPlacement="start"
                            variant="bordered"
                            onChange={(val) =>
                              HandleChange({
                                target: {
                                  name: "schedule_telemed",
                                  value: val,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="w-full">
                          <Autocomplete
                            defaultItems={Consultant}
                            defaultSelectedKey={data?.consult}
                            errorMessage="กรุณาระบุผู้ให้คำปรึกษา"
                            label="Consultant"
                            labelPlacement="outside"
                            placeholder="Consultant"
                            radius="md"
                            variant="bordered"
                            onSelectionChange={(val) =>
                              HandleChange({
                                target: { name: "ConsultId", value: val },
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
                              moment(data?.follow_up).format(
                                "YYYY-MM-DD"
                              )
                            )
                            : null
                        }
                        label="Follow Up"
                        labelPlacement="outside-left"
                        name="schedule_telemed"
                        selectorButtonPlacement="start"
                        variant="bordered"
                        // endContent={
                        //   <Button isIconOnly variant="light" radius="full" onPress={
                        //     (val) => {
                        //       // console.log(val);
                        //       HandleChange({
                        //         target: {
                        //           name: "schedule_telemed",
                        //           value: null,
                        //         },
                        //       })
                        //     }
                        //   }
                        //   ><XMarkIcon className="size-4" /></Button>
                        // }
                        onChange={(val) =>
                          HandleChange({
                            target: {
                              name: "schedule_telemed",
                              value: val,
                            },
                          })
                        }
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
              <Button
                color="primary"
                isDisabled={mode === "View"}
                isLoading={formIsloading}
                type="submit"
              >
                บันทึก
              </Button>
            </DrawerFooter>
          </Form>
        )}
      </DrawerContent>
    </Drawer>
  );
};
