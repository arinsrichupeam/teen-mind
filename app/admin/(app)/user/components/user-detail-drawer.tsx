"use client";

import {
    Button,
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    Divider,
    Chip,
    Card,
    CardBody,
    CardFooter,
} from "@heroui/react";
import { PencilIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { prefix } from "@/utils/data";
import { useEffect, useState } from "react";
import { ModalEditProfile } from "../../components/modal/modal-edit-profile";

interface Provinces {
    id: number;
    nameInThai: string;
}

interface Districts {
    id: number;
    nameInThai: string;
    provinceId: number;
}

interface Subdistricts {
    id: number;
    nameInThai: string;
    districtId: number;
}

interface UserData {
    id: string;
    firstname: string;
    lastname: string;
    prefixId: number;
    citizenId: string;
    tel: string;
    school: {
        id: number;
        name: string;
    } | null;
    questions: {
        id: string;
        createdAt: string;
        result: string;
        result_text?: string;
    }[];
    birthday?: string;
    ethnicity?: string;
    nationality?: string;
    address?: {
        houseNo?: string;
        villageNo?: string;
        soi?: string;
        road?: string;
        subdistrict?: string;
        district?: string;
        province?: string;
    };
    emergency?: {
        name?: string;
        tel?: string;
        relation?: string;
    };
}

interface UserDetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserData | null;
    mode?: "view" | "edit";
    onRefresh?: () => void;
}

export default function UserDetailDrawer({
    isOpen,
    onClose,
    user,
    mode,
    onRefresh,
}: UserDetailDrawerProps) {
    const [provinces, setProvinces] = useState<Provinces[]>([]);
    const [districts, setDistricts] = useState<Districts[]>([]);
    const [subdistricts, setSubdistricts] = useState<Subdistricts[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // ดึงข้อมูลจังหวัด
                const provincesRes = await fetch('/api/data/provinces');
                const provincesData = await provincesRes.json();
                setProvinces(provincesData);

                // ดึงข้อมูลอำเภอ
                const districtsRes = await fetch('/api/data/districts');
                const districtsData = await districtsRes.json();
                setDistricts(districtsData);

                // ดึงข้อมูลตำบล
                const subdistrictsRes = await fetch('/api/data/subdistricts');
                const subdistrictsData = await subdistrictsRes.json();
                setSubdistricts(subdistrictsData);
            } catch (error) {
                console.error('Error fetching address data:', error);
            }
        };

        fetchData();
    }, []);

    // ฟังก์ชันสำหรับหาชื่อจากรหัส
    const getProvinceName = (provinceId: string | number) => {
        const province = provinces.find(p => p.id === parseInt(provinceId.toString()));
        return province?.nameInThai || provinceId;
    };

    const getDistrictName = (districtId: string | number) => {
        const district = districts.find(d => d.id === parseInt(districtId.toString()));
        return district?.nameInThai || districtId;
    };

    const getSubdistrictName = (subdistrictId: string | number) => {
        const subdistrict = subdistricts.find(s => s.id === parseInt(subdistrictId.toString()));
        return subdistrict?.nameInThai || subdistrictId;
    };

    if (!user) return null;

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            placement="right"
            size="4xl"
            closeButton={false}
        >
            <DrawerContent>
                <DrawerHeader className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                        {mode === "view" ? "รายละเอียดผู้ใช้งาน" : "แก้ไขข้อมูลผู้ใช้งาน"}
                    </h3>
                </DrawerHeader>
                <Divider />
                <DrawerBody>
                    <div className="space-y-6">
                        {/* ข้อมูลส่วนตัว */}
                        <Card className="mb-4">
                            <CardBody>
                                <h4 className="text-md font-semibold mb-3 text-primary">ข้อมูลส่วนตัว</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                    <div>
                                        <span className="text-default-500">ชื่อ-นามสกุล:</span>
                                        <span className="font-medium ml-2">
                                            {prefix.find((val) => val.key == user.prefixId.toString())?.label} {user.firstname} {user.lastname}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-default-500">เลขบัตรประชาชน:</span>
                                        <span className="font-medium ml-2">{user.citizenId}</span>
                                    </div>
                                    <div>
                                        <span className="text-default-500">วัน/เดือน/ปี เกิด:</span>
                                        <span className="font-medium ml-2">{user.birthday ? new Date(user.birthday).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-default-500">เชื้อชาติ:</span>
                                        <span className="font-medium ml-2">{user.ethnicity || '-'}</span>
                                        <span className="text-default-500 ml-4">สัญชาติ:</span>
                                        <span className="font-medium ml-2">{user.nationality || '-'}</span>
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className="text-default-500">ที่อยู่:</span>
                                        {user.address && Array.isArray(user.address) && user.address[0] ? (
                                            <span className="font-medium ml-2">
                                                {user.address[0].houseNo ? `${user.address[0].houseNo} ` : ''}
                                                {user.address[0].villageNo ? `หมู่ที่ ${user.address[0].villageNo} ` : ''}
                                                {user.address[0].soi ? `ซอย ${user.address[0].soi} ` : ''}
                                                {user.address[0].road ? `ถนน ${user.address[0].road} ` : ''}
                                                {user.address[0].subdistrict ? `ตำบล${getSubdistrictName(user.address[0].subdistrict)} ` : ''}
                                                {user.address[0].district ? `อำเภอ${getDistrictName(user.address[0].district)} ` : ''}
                                                {user.address[0].province ? `จังหวัด${getProvinceName(user.address[0].province)}` : ''}
                                            </span>
                                        ) : (
                                            <span className="font-medium ml-2">-</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-default-500">เบอร์โทรศัพท์:</span>
                                        <span className="font-medium ml-2">{user.tel || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-default-500">โรงเรียน:</span>
                                        <span className="font-medium ml-2">{user.school?.name || '-'}</span>
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className="text-default-500">ผู้ติดต่อฉุกเฉิน:</span>
                                        {user.emergency && Array.isArray(user.emergency) && user.emergency[0] ? (
                                            <>
                                                <span className="font-medium ml-2">{user.emergency[0].name || '-'}</span>
                                                <span className="text-default-500 ml-4">โทรศัพท์:</span>
                                                <span className="font-medium ml-2">{user.emergency[0].tel || '-'}</span>
                                                <span className="text-default-500 ml-4">ความสัมพันธ์:</span>
                                                <span className="font-medium ml-2">{user.emergency[0].relation || '-'}</span>
                                            </>
                                        ) : (
                                            <span className="font-medium ml-2">-</span>
                                        )}
                                    </div>
                                </div>
                            </CardBody>
                            {mode === "edit" && (
                                <CardFooter className="flex justify-end">
                                    <Button
                                        color="warning"
                                        variant="flat"
                                        onClick={() => {
                                            setIsModalOpen(true);
                                        }}
                                        size="md"
                                    >
                                        แก้ไขข้อมูล
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>

                        <Divider />

                        {/* ข้อมูลแบบสอบถาม */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-md font-semibold mb-3 text-primary">
                                    ข้อมูลแบบสอบถาม
                                </h4>
                                <Button
                                    startContent={<PlusIcon className="size-6 text-success-500" />}
                                    size="md"
                                    variant="flat"
                                    color="success"
                                    onClick={() => {
                                        console.log("add");
                                    }}
                                >
                                    เพิ่มแบบสอบถาม
                                </Button>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-default-500">จำนวนแบบสอบถาม:</span>
                                <Chip
                                    color={user.questions.length > 0 ? "primary" : "default"}
                                    size="sm"
                                    variant="flat"
                                >
                                    {user.questions.length} รายการ
                                </Chip>
                            </div>
                            <div className="flex flex-col gap-2 mt-3">
                                {user.questions.length > 0 ? (
                                    user.questions.map((question, idx) => {
                                        const assessmentDate = question.createdAt ? new Date(question.createdAt) : null;
                                        const formattedDate = assessmentDate && !isNaN(assessmentDate.getTime())
                                            ? assessmentDate.toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                            : "-";
                                        const getResultColor = (result: string) => {
                                            switch (result) {
                                                case 'Green':
                                                case 'Green-Low':
                                                    return 'success';
                                                case 'Yellow':
                                                case 'Orange':
                                                    return 'warning';
                                                case 'Red':
                                                    return 'danger';
                                                default:
                                                    return 'default';
                                            }
                                        };
                                        return (
                                            <div
                                                key={question.id}
                                                className="flex flex-col md:flex-row items-center justify-between gap-2 p-2 bg-default-100 rounded-md border border-default-200"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center flex-1 gap-2">
                                                    <span className="text-sm text-default-600">{formattedDate}</span>
                                                    <Chip
                                                        color={getResultColor(question.result)}
                                                        size="sm"
                                                        variant="flat"
                                                        className="text-sm"
                                                    >
                                                        {question.result_text || question.result}
                                                    </Chip>
                                                </div>
                                                {mode === "edit" && (
                                                    <Button
                                                        isIconOnly
                                                        variant="light"
                                                        className="text-default-400"
                                                        onClick={() => {
                                                            console.log(question);
                                                        }}
                                                    >
                                                        <PencilIcon className="size-6 text-warning-400" />
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <span className="text-default-400 italic">ไม่มีแบบสอบถาม</span>
                                )}
                            </div>
                        </div>
                    </div>
                </DrawerBody>
                <DrawerFooter>
                    <Button
                        color="danger"
                        variant="flat"
                        onClick={onClose}
                        size="md"
                    >
                        ปิด
                    </Button>
                </DrawerFooter>
            </DrawerContent>
            <ModalEditProfile
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                }}
                data={{
                    profile: {
                        ...user,
                        // แปลง address เป็น array ตามที่ ModalEditProfile คาดหวัง
                        address: user.address ? 
                            (Array.isArray(user.address) ? user.address : [user.address]) : [],
                        // แปลง emergency เป็น array ตามที่ ModalEditProfile คาดหวัง
                        emergency: user.emergency ? 
                            (Array.isArray(user.emergency) ? user.emergency : [user.emergency]) : []
                    }
                }}
                onSuccess={() => {
                    // รีเฟรชข้อมูลหลังจากบันทึกสำเร็จ
                    if (onRefresh) {
                        onRefresh();
                    }
                }}
            />
        </Drawer>
    );
} 