"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@heroui/drawer";
import { Image } from "@heroui/image";
import { Link } from "@heroui/link";
import moment from "moment";
import { useEffect, useState } from "react";
import { Districts, Provinces, Subdistricts } from "@prisma/client";
import { Input } from "@heroui/input";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

import { prefix, QuestionsData } from "@/types";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

export const QuestionDrawer = ({
  isOpen,
  onClose,
  data,
}: {
  isOpen: any;
  onClose: any;
  data: QuestionsData | undefined;
}) => {
  const [distrince, setDistrince] = useState<Districts[]>();
  const [province, setProvince] = useState<Provinces[]>();
  const [subdistrince, setSubDistrince] = useState<Subdistricts[]>();

  useEffect(() => {
    fetch("/api/data/distrince")
      .then((res) => res.json())
      .then((val) => {
        setDistrince(val);
      });

    fetch("/api/data/province")
      .then((res) => res.json())
      .then((val) => {
        setProvince(val);
      });

    fetch("/api/data/subdistrince")
      .then((res) => res.json())
      .then((val) => {
        setSubDistrince(val);
      });
  }, []);

  const latitude = data?.latitude as number;
  const longitude = data?.longitude as number;

  return (
    <Drawer isOpen={isOpen} size={"4xl"} onClose={onClose}>
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">
              {/* QuestionID : {data?.} */}
            </DrawerHeader>
            <DrawerBody>
              <div className="flex flex-col sm:flex-row gap-5 mx-auto">
                <Card className="max-w-[400px]">
                  <CardHeader className="flex gap-3">
                    <Image
                      alt="user profile"
                      height={100}
                      radius="sm"
                      src={data?.User.image}
                      width={100}
                    />
                    <div className="flex flex-col">
                      <p className="text-md">
                        {
                          prefix[(data?.User.profile[0].prefix as number) - 1]
                            .label
                        }{" "}
                        {data?.User.profile[0].firstname}{" "}
                        {data?.User.profile[0].lastname}
                      </p>
                      <p className="text-small">
                        เลขที่บัตรประชาชน :{" "}
                        <b>{data?.User.profile[0].citizenId}</b>
                      </p>
                      <p className="text-small">
                        วัน/เดือน/ปี เกิด :{" "}
                        <b>
                          {moment(data?.User.profile[0].birthday)
                            .add(543, "year")
                            .locale("th-TH")
                            .format("DD/MM/YYYY")}
                        </b>
                      </p>
                      <p className="text-small">
                        เชื้อชาติ : <b>{data?.User.profile[0].ethnicity}</b>{" "}
                        สัญชาติ : <b>{data?.User.profile[0].nationality}</b>
                      </p>
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <div>
                      <p className="text-small">
                        ที่อยู่ :{" "}
                        <b>{data?.User.profile[0].address[0].houseNo}</b>{" "}
                        หมู่ที่ :{" "}
                        <b>
                          {data?.User.profile[0].address[0].villageNo == ""
                            ? "-"
                            : data?.User.profile[0].address[0].villageNo}
                        </b>{" "}
                        ซอย : <b>{data?.User.profile[0].address[0].soi}</b>
                      </p>
                      <p className="text-small">
                        ถนน : <b>{data?.User.profile[0].address[0].road}</b>{" "}
                        ตำบล :{" "}
                        <b>
                          {
                            subdistrince?.find(
                              (x) =>
                                x.id ==
                                data?.User.profile[0].address[0].subdistrict
                            )?.nameInThai
                          }
                        </b>{" "}
                        อำเภอ :{" "}
                        <b>
                          {
                            distrince?.find(
                              (x) =>
                                x.id ==
                                data?.User.profile[0].address[0].district
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
                                data?.User.profile[0].address[0].province
                            )?.nameInThai
                          }
                        </b>{" "}
                        โทรศัพท์ : <b>{data?.User.profile[0].tel}</b>
                      </p>
                    </div>
                  </CardBody>
                  <Divider />
                  <CardFooter>
                    <div className="flex flex-row gap-4">
                      <Input startContent={<p> HN:</p>} variant="bordered" />
                      <Button isDisabled color="primary">
                        บันทึก
                      </Button>
                    </div>
                    {/* <Link
                                            isExternal
                                            showAnchorIcon
                                            href="https://github.com/heroui-inc/heroui"
                                        >
                                            Visit source code on GitHub.
                                        </Link> */}
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
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
                      href="https://www.google.co.th/maps/@13.7129260,100.3635441,16z"
                    >
                      ดูบนแผนที่
                    </Link>
                  </CardFooter>
                </Card>
              </div>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
                pulvinar risus non risus hendrerit venenatis. Pellentesque sit
                amet hendrerit risus, sed porttitor quam.
              </p>
              <p>
                Magna exercitation reprehenderit magna aute tempor cupidatat
                consequat elit dolor adipisicing. Mollit dolor eiusmod sunt ex
                incididunt cillum quis. Velit duis sit officia eiusmod Lorem
                aliqua enim laboris do dolor eiusmod.
              </p>
            </DrawerBody>
            <DrawerFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
              <Button color="primary" onPress={onClose}>
                Action
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};
