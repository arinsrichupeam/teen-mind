"use client";

import moment from "moment";
import { useEffect, useState } from "react";
import { Districts, Provinces, Subdistricts } from "@prisma/client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
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
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";

import { prefix, QuestionsData } from "@/types";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { qPhqa_addon, qPhqa } from "@/app/data";
import { subtitle } from "@/components/primitives";

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
          <div>
            <DrawerHeader className="flex flex-row justify-between gap-1">
              <div>
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
              <p className="pr-10">
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
              </p>
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
                          prefix.find(
                            (val) => val.key == data?.User.profile[0].prefix
                          )?.label
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
                      <Input
                        isDisabled
                        startContent={<p> HN:</p>}
                        variant="bordered"
                      />
                      <Button isDisabled color="primary">
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
              <div>
                <h2 className={subtitle()}>แบบประเมินภาวะซึมเศร้าในวัยรุ่น</h2>
                <div className="flex flex-col gap-4">
                  <Table>
                    <TableHeader>
                      <TableColumn>Question</TableColumn>
                      <TableColumn align="center">Anwser</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {qPhqa.map((val, index) => {
                        return (
                          <TableRow key={index}>
                            <TableCell className="min-w-[250px]">
                              {index + 1} {val}
                            </TableCell>
                            <TableCell className="min-w-[250px]">
                              {data?.phqa.map((val) => {
                                return (
                                  <RadioGroup
                                    key={index}
                                    className="items-center"
                                    name={(index + 1).toString()}
                                    orientation="horizontal"
                                    value={Object.entries(val)
                                      [index + 2].toString()
                                      .substring(3)}
                                  >
                                    <Radio
                                      className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                                      value="0"
                                    >
                                      0
                                    </Radio>
                                    <Radio
                                      className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                                      value="1"
                                    >
                                      1
                                    </Radio>
                                    <Radio
                                      className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                                      value="2"
                                    >
                                      2
                                    </Radio>
                                    <Radio
                                      className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                                      value="3"
                                    >
                                      3
                                    </Radio>
                                  </RadioGroup>
                                );
                              })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div>
                <h2 className={subtitle()}>คำถามแนบท้าย</h2>
                <Table>
                  <TableHeader>
                    <TableColumn>Question</TableColumn>
                    <TableColumn align="center">Anwser</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {qPhqa_addon.map((val, index) => {
                      return (
                        <TableRow key={index}>
                          <TableCell className="min-w-[250px]">
                            {index + 1} {val}
                          </TableCell>
                          <TableCell className="min-w-[250px]">
                            {data?.addon.map((val) => {
                              return (
                                <RadioGroup
                                  key={index}
                                  className="items-center"
                                  name={(index + 1).toString()}
                                  orientation="horizontal"
                                  value={Object.entries(val)
                                    [index + 2].toString()
                                    .substring(3)}
                                >
                                  <Radio
                                    className="inline-flex items-center justify-between max-w-full cursor-pointer pr-5"
                                    value="1"
                                  >
                                    ใช่
                                  </Radio>
                                  <Radio
                                    className="inline-flex items-center justify-between max-w-full cursor-pointer pr-5"
                                    value="0"
                                  >
                                    ไม่ใช่
                                  </Radio>
                                </RadioGroup>
                              );
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
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
