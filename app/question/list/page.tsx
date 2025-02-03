"use client"

import { subtitle, title } from "@/components/primitives";
import { Button, Card, CardBody, ScrollShadow } from "@heroui/react";
import { Questions_Master } from "@prisma/client";
import moment from "moment";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function QuestionListPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [questionList, setQuestionList] = useState<Questions_Master[]>([]);

    useEffect(() => {
        if (status !== "loading" && status === "authenticated") {
            const userId = session?.user?.id;
            fetch(`/api/question/${userId}`).then((res) => res.json().then(val => {
                console.log(val);
                setQuestionList(val);
            }));
        }
    }, [session]);

    return (
        <div className="flex flex-col w-full gap-5">
            <h1 className={title({ size: "sm" })}>ผลประเมินภาวะซึมเศร้า</h1>
            <h2 className={subtitle()}>สำรวจตัวเองว่าคุณกำลังเคลียดมากแค่ไหน โดยทำแบบสำรวจซึ่งใช้เวลาประมาณ 4-5 นาที</h2>
            <Button className="w-full" variant="solid" color="primary" size="lg" radius="full" onPress={() => router.push("/question")}>ทำแบบสำรวจ</Button>
            <h2 className={title({ size: "xs" })}>ประวัติการทำรายการ</h2>
            <ScrollShadow className="w-[300px] h-[350px] w-full">
                <div className="flex flex-col gap-5">
                    {questionList.map((val, index) => {
                        return (
                            <Card key={index}>
                                <CardBody>
                                    <p>แบบทดสอบ ครั้งที่ {index + 1}</p>
                                    <p>วันที่ {moment(val.createdAt.toString()).add(543, "year").locale("th").format("d MMM yyyy")}</p>
                                    {val.result == "Green" ? <p>ไม่พบความเสี่ยง</p> : val.result == "Yellow" ? <p>พบความเสี่ยงระดับปานกลาง</p> : <p>พบอาการซึมเศร้าระดับรุนแรง</p>}
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            </ScrollShadow>
            <Button className="w-full" variant="solid" color="default" size="lg" radius="full" onPress={() => router.back()}>ย้อนกลับ</Button>
        </div>
    )
}