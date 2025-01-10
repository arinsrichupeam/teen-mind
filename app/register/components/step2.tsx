"use client"

import { Card, CardBody } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { Form } from "@nextui-org/form";
import { Button } from "@nextui-org/button";
import { useEffect, useState } from "react";
import { District, Province, SubDistrict } from "address";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";

export const Step2 = ({ NextStep, BackStep }: { NextStep: (val: any) => void, BackStep: () => void }) => {
    const [request, setRequest] = useState(false);
    const [province, setProvince] = useState<Province[]>([]);
    const [district, setDistrict] = useState<District[]>([]);
    const [subDistrict, setSubDistrict] = useState<SubDistrict[]>([]);

    useEffect(() => {
        fetch("https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json").then((res) => res.json().then((val) => {
            setProvince(val);
        }));
    }, [province]);

    const onProvinceChange = (e: any) => {
        setDistrict([]);
        if (e !== null) {
            fetch("https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_amphure.json").then((res) => res.json().then((val) => {
                val.filter((res: District) => {
                    if (res.province_id == e) {
                        setDistrict((district) => [...district, res]);
                    }
                })
            }));
        }
    }

    const onDistrictChange = (e: any) => {
        setSubDistrict([]);
        if (e !== null) {
            fetch("https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_tambon.json").then((res) => res.json().then((val) => {
                val.filter((res: SubDistrict) => {
                    if (res.amphure_id == e) {
                        setSubDistrict((district) => [...district, res]);
                    }
                })
            }));
        }
    }

    const onSubmit = (e: any) => {
        e.preventDefault()
        NextStep("Address");
    }

    return (
        <Card className="w-full">
            <CardBody>
                <Form className="w-full max-w-xs flex flex-col gap-4" validationBehavior="native" onSubmit={onSubmit}>
                    <div className="flex flex-row gap-4 w-full">
                        <Input label="เลขที่" placeholder="เลขที่" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกบ้านเลขที่" />
                        <Input label="หมู่ที่" placeholder="หมู่ที่" labelPlacement="inside" variant="bordered" size="sm" radius="md" />
                    </div>
                    <Input label="ซอย" placeholder="ซอย" labelPlacement="inside" variant="bordered" size="sm" radius="md" />
                    <Input label="ถนน" placeholder="ถนน" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกถนน" />
                    <Autocomplete className="max-w-xs" name="province" label="จังหวัด" placeholder="จังหวัด" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณาเลือกจังหวัด" onSelectionChange={onProvinceChange} >
                        {province.map((province) => (
                            <AutocompleteItem key={province.id}>{province.name_th}</AutocompleteItem>
                        ))}
                    </Autocomplete>
                    <Autocomplete className="max-w-xs" name="district" label="เขต/อำเภอ" placeholder="เขต/อำเภอ" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณาเลือกเขต/อำเภอ" onSelectionChange={onDistrictChange}>
                        {district.map((district) => (
                            <AutocompleteItem key={district.id}>{district.name_th}</AutocompleteItem>
                        ))}
                    </Autocomplete>
                    <Autocomplete className="max-w-xs" name="subdistrict" label="แขวง/ตำบล" placeholder="แขวง/ตำบล" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณาเลือกแขวง/ตำบล">
                        {subDistrict.map((subDistrict) => (
                            <AutocompleteItem key={subDistrict.id}>{subDistrict.name_th}</AutocompleteItem>
                        ))}
                    </Autocomplete>
                    <div className="flex flex-row gap-4 w-full">
                        <Button className="w-full" variant="solid" size="lg" radius="full" onPress={BackStep}>ย้อนกลับ</Button>
                        <Button className="w-full" variant="solid" color="primary" size="lg" radius="full" type="submit">ถัดไป</Button>
                    </div>

                </Form>
            </CardBody>
        </Card>
    );
}

