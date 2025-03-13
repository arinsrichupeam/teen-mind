"use client";

import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { Districts, Provinces, Subdistricts } from "@prisma/client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  addToast,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Image,
  Input,
  Link,
} from "@heroui/react";

import { QuestionDetail } from "./detail";
import { QuestionEdit } from "./edit";

import { prefix } from "@/utils/data";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { QuestionsData } from "@/types";

interface Props {
  isOpen: any;
  onClose: any;
  data: QuestionsData | undefined;
  mode: string;
}

export const QuestionDrawer = ({ isOpen, onClose, data, mode }: Props) => {
  const [distrince, setDistrince] = useState<Districts[]>();
  const [province, setProvince] = useState<Provinces[]>();
  const [subdistrince, setSubDistrince] = useState<Subdistricts[]>();

  const [textboxHN, setTextboxHN] = useState("");

  const latitude = data?.latitude != null ? data?.latitude : 0;
  const longitude = data?.longitude != null ? data?.longitude : 0;

  const ChangeHN = () => {
    const json = JSON.stringify({
      id: data?.user.profile[0].id,
      hn: textboxHN,
    });

    fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: json,
    }).then(() => {
      addToast({
        title: "Update HN Success",
        color: "success",
        description: "Update HN Success",
        timeout: 3000,
      });
    });
  };

  const txtHNChange = useCallback(
    (val: any) => {
      setTextboxHN(val.target.value);
    },
    [textboxHN]
  );

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

  useEffect(() => {
    GetProvinceList();
    GetDistrictList();
    GetSubdistrictList();
  }, []);

  return (
    <Drawer isOpen={isOpen} size={"4xl"} onClose={onClose}>
      <DrawerContent>
        {(onClose) => (
          <div>
            <DrawerHeader>
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
            <DrawerBody>
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
                        startContent={<p> HN:</p>}
                        variant="bordered"
                        onChange={txtHNChange}
                      />
                      <Button
                        color="primary"
                        isDisabled={mode == "View"}
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
                <QuestionEdit masterId={data?.id} />
              )}
            </DrawerBody>
            <DrawerFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                ปิด
              </Button>
              <Button color="primary" isDisabled={true} onPress={onClose}>
                บันทึก
              </Button>
            </DrawerFooter>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};
