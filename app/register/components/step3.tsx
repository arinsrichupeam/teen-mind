import { title } from "@/components/primitives";
import { Address, Districts, Profile, Provinces, Subdistricts } from "@prisma/client";
import { prefix, sex } from "@/types/systemmodel";
import { useEffect, useState } from "react";
import { Button, Card, CardBody, Form } from "@heroui/react";
import moment from "moment";

export const Step3 = ({ NextStep, BackStep, Profile, Address }: { NextStep: (val: any) => void; BackStep: (val: any) => void; Profile: Profile; Address: Address }) => {
    const onSubmit = (e: any) => {
        e.preventDefault()
        NextStep("Confirm");
    }

    const [province, setProvince] = useState<Provinces[]>();
    const [distrince, setDistrince] = useState<Districts[]>();
    const [subdistrince, setSubDistrict] = useState<Subdistricts[]>();

    useEffect(() => {
        fetch("/api/data/province").then(res => res.json()).then(val => {
            setProvince(val);
        });
        fetch(`/api/data/distrince/${Address.province}`).then(res => res.json()).then(val => {
            setDistrince(val);
        });
        fetch(`/api/data/subdistrince/${Address.district}`).then(res => res.json()).then(val => {
            setSubDistrict(val);
        });

    }, []);

    return (
        <Card className="w-full">
            <CardBody>
                <Form className="w-full max-w-xs flex flex-col gap-4 px-5" validationBehavior="native" onSubmit={onSubmit}>
                    <div className="flex flex-col gap-2 text-sm">
                        <h2 className={title({ size: "xs" })}>ข้อมูลส่วนตัว</h2>
                        <label><b>เลขบัตรประชาชน</b> : <span>{Profile.citizenId}</span></label>
                        <div className="grid grid-cols-2 gap-2">
                            <label><b>คำนำหน้า</b> : <span>{prefix.find(val => val.key === Profile.prefix.toString())?.label}</span></label>
                            <label><b>เพศ</b>: <span>{sex.find(val => val.key == Profile.sex.toString())?.label}</span></label>
                            <label><b>ชื่อ</b> : <span>{Profile.firstname}</span></label>
                            <label><b>นามสกุล</b> : <span>{Profile.lastname}</span></label>
                            <label><b>อายุ</b> : <span>{moment(Profile.birthday.toLocaleDateString(), "MM/dd/yyyy").fromNow().substring(0, 2)}</span></label>
                            <label><b>วันเกิด</b> : <span>{moment(Profile.birthday.toLocaleDateString(), "MM/dd/yyyy").add(543, "year").locale("th").format("d MMM yyyy")}</span></label>
                            <label><b>สัญชาติ</b> : <span>{Profile.ethnicity}</span></label>
                            <label><b>เชื้อชาติ</b> : <span>{Profile.nationality}</span></label>
                        </div>
                        <label><b>เบอร์โทรศัพท์</b> : <span>{Profile.tel}</span></label>
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                        <h2 className={title({ size: "xs" })}>ข้อมูลที่อยู่</h2>
                        <div className="grid grid-cols-2 gap-2">
                            <label><b>บ้านเลขที่</b> : <span>{Address.houseNo}</span></label>
                            <label><b>หมู่ที่</b> : <span>{Address.villageNo}</span></label>
                            <label><b>ซอย</b> : <span>{Address.soi}</span></label>
                            <label><b>ถนน</b> : <span>{Address.road}</span></label>
                            <label><b>เขต/อำเภอ</b> : <br /><span>{distrince?.find(val => val.id === Address.district)?.nameInThai}</span></label>
                            <label><b>แขวง/ตำบล</b> : <br /><span>{subdistrince?.find(val => val.id === Address.subdistrict)?.nameInThai}</span></label>
                        </div>
                        <label><b>จังหวัด</b> : <br /><span>{province?.find(val => val.id === Address.province)?.nameInThai}</span></label>
                    </div>
                    <div className="flex flex-col pt-5 gap-2 w-full">
                        <Button className="w-full" variant="solid" color="primary" size="lg" radius="full" type="submit">บันทึกข้อมูล</Button>
                        <Button className="w-full" variant="solid" size="lg" radius="full" onPress={() => BackStep("Confirm")}>ย้อนกลับ</Button>
                    </div>
                </Form>
            </CardBody>
        </Card>
    );
}