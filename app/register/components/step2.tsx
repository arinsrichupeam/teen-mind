"use client"
import { useEffect, useState } from "react";
import { Autocomplete, AutocompleteItem, Button, Card, CardBody, Form, Input } from "@heroui/react";
import { Address, Districts, Provinces, Subdistricts } from "@prisma/client";

export const Step2 = ({ NextStep, BackStep, Result, HandleChange }: { NextStep: (val: any) => void; BackStep: (val: any) => void; Result: Address | undefined; HandleChange: (val: any) => void }) => {
    const [request, setRequest] = useState(true);
    const [province, setProvince] = useState<Provinces[]>([]);
    const [district, setDistrict] = useState<Districts[]>([]);
    const [subDistrict, setSubDistrict] = useState<Subdistricts[]>([]);

    useEffect(() => {
        fetch("/api/data/province").then(res => res.json()).then(val => {
            setProvince(val);
        });

        onProvinceChange(Result?.province);
        onDistrictChange(Result?.district);
    }, []);

    const onProvinceChange = async (e: any) => {
        setDistrict([]);
        if (e !== null) {
            await fetch(`/api/data/distrince/${e}`).then(res => res.json()).then(val => {
                setDistrict(val);
            })
            HandleChange({ target: { name: "province", value: parseInt(e) } });
        }
    }

    const onDistrictChange = async (e: any) => {
        setSubDistrict([]);
        if (e !== null) {
            await fetch(`/api/data/subdistrince/${e}`).then(res => res.json()).then(val => {
                setSubDistrict(val);
            })
            HandleChange({ target: { name: "district", value: parseInt(e) } });
        }
    }

    const onSubDistrictChange = (e: any) => {
        HandleChange({ target: { name: "subdistrict", value: parseInt(e) } });
    };

    const onSubmit = (e: any) => {
        e.preventDefault()
        NextStep("Address");
    }

    return (
        <Card className="w-full">
            <CardBody>
                <Form className="w-full max-w-xs flex flex-col gap-4" validationBehavior="native" onSubmit={onSubmit}>
                    <div className="flex flex-row gap-4 w-full">
                        <Input value={Result?.houseNo} name="houseNo" onChange={HandleChange} label="เลขที่" placeholder="เลขที่" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกบ้านเลขที่" />
                        <Input value={Result?.villageNo} name="villageNo" onChange={HandleChange} label="หมู่ที่" placeholder="หมู่ที่" labelPlacement="inside" variant="bordered" size="sm" radius="md" />
                    </div>
                    <Input value={Result?.soi} name="soi" onChange={HandleChange} label="ซอย" placeholder="ซอย" labelPlacement="inside" variant="bordered" size="sm" radius="md" />
                    <Input value={Result?.road} name="road" onChange={HandleChange} label="ถนน" placeholder="ถนน" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกถนน" />
                    <Autocomplete className="max-w-xs" defaultSelectedKey={Result?.province.toString()} name="province" onSelectionChange={onProvinceChange} label="จังหวัด" placeholder="จังหวัด" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณาเลือกจังหวัด"  >
                        {province.map((province) => (
                            <AutocompleteItem key={province.id}>{province.nameInThai}</AutocompleteItem>
                        ))}
                    </Autocomplete>
                    <Autocomplete className="max-w-xs" defaultSelectedKey={Result?.district.toString()} name="district" onSelectionChange={onDistrictChange} label="เขต/อำเภอ" placeholder="เขต/อำเภอ" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณาเลือกเขต/อำเภอ" >
                        {district.map((district) => (
                            <AutocompleteItem key={district.id}>{district.nameInThai}</AutocompleteItem>
                        ))}
                    </Autocomplete>
                    <Autocomplete className="max-w-xs" defaultSelectedKey={Result?.subdistrict.toString()} name="subdistrict" onSelectionChange={onSubDistrictChange} label="แขวง/ตำบล" placeholder="แขวง/ตำบล" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณาเลือกแขวง/ตำบล">
                        {subDistrict.map((subDistrict) => (
                            <AutocompleteItem key={subDistrict.id}>{subDistrict.nameInThai}</AutocompleteItem>
                        ))}
                    </Autocomplete>
                    <div className="flex flex-col pt-5 gap-2 w-full">
                        <Button className="w-full" variant="solid" color="primary" size="lg" radius="full" type="submit">ถัดไป</Button>
                        <Button className="w-full" variant="solid" size="lg" radius="full" onPress={() => BackStep("Address")}>ย้อนกลับ</Button>
                    </div>

                </Form>
            </CardBody>
        </Card>
    );
}

