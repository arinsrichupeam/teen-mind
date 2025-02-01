"use client"

import { title } from "@/components/primitives";
import { Button, Card, CardBody, Form, Input } from "@heroui/react";
import { RadioGroup, Radio } from "@heroui/radio";
import { PHQA_1, PHQA_2, PHQA_3, PHQA_4, PHQA_5, PHQA_6, PHQA_7, PHQA_8, PHQA_9 } from "./components/phqa-icons";
import { Q1, Q2 } from "./components/q2-icons";
import { useEffect, useState } from "react";
import { Questions_2Q, Questions_PHQA } from "@prisma/client";
import { signIn, useSession } from "next-auth/react";

export default function PHQAPage() {

  const qPhqa = [
    "รู้สึกเศร้า หงุดหงิด หรือสิ้นหวัง",
    "เบื่อ ไม่ค่อยสนใจหรือไม่เพลิดเพลินเวลาทำสิ่งต่างๆ",
    "นอนหลับยาก รู้สึกง่วงทั้งวัน หรือนอนมากเกินไป",
    "ไม่อยากอาาหาร น้ำหนักลด หรือกินมากกว่าปกติ",
    "รู้สึกเหนื่อยล้า ไม่ค่อยมีพลัง",
    "รู้สึกแย่กับตัวเอง หรือรู้สึกว่าตัวเองล้มเหลวหรือทำให้ตัวเองหรือครอบครัวผิดหวัง",
    "จดจ่อกับสิ่งต่างๆได้ยากเช่น ทำการบ้าน อ่านหนังสือหรือดูโทรทัศน์",
    "พูดหรือทำอะไรช้าลงจนคนอื่นสังเกตเห็นได้ กระวนกระวาย จนต้องเคลื่อนไหวไปมา มากกว่าปกติ",
    "คิดว่าถ้าตายไปเสียจะดีว่า หรือคิดจะทำร้ายตัวเอง ด้วยวิธีใดวิธีหนึ่ง",
  ]

  const qPhqa_Image = [
    <PHQA_1 height={80} className='absolute right-10 bottom-5' />,
    <PHQA_2 height={80} className='absolute right-10 bottom-5' />,
    <PHQA_3 height={80} className='absolute right-10 bottom-5' />,
    <PHQA_4 height={80} className='absolute right-10 bottom-5' />,
    <PHQA_5 height={80} className='absolute right-10 bottom-5' />,
    <PHQA_6 height={80} className='absolute right-10 bottom-5' />,
    <PHQA_7 height={80} className='absolute right-10 bottom-5' />,
    <PHQA_8 height={80} className='absolute right-10 bottom-5' />,
    <PHQA_9 height={80} className='absolute right-10 bottom-5' />,
  ]

  const q2 = [
    "ใน 1 เดือนที่ผ่านมา มีช่วงไหนที่คุณมีความคิด อยากตาย หรือไม่อยากมีชีวิตอยู่ อย่างจริงจังหรือไม่",
    "ตลอดชีวิตที่ผ่านมา คุณเคยพยายามที่จะทำให้ตัวเองตาย หรือลงมือฆ่าตัวตายหรือไม"
  ]

  const q2_Image = [
    <Q1 height={80} className='absolute right-10 bottom-5' />,
    <Q2 height={80} className='absolute right-10 bottom-5' />,
  ]

  const phqaInitValue: Questions_PHQA = {
    id: "",
    questions_MasterId: "",
    q1: 1,
    q2: 1,
    q3: 1,
    q4: 1,
    q5: 1,
    q6: 1,
    q7: 1,
    q8: 1,
    q9: 1,
    sum: 0
  }

  const q2InitValue: Questions_2Q = {
    id: "",
    questions_MasterId: "",
    q1: 1,
    q2: 1,
  }

  const { data: session, status } = useSession();
  const [request, setRequest] = useState(false);
  const [phqa_data, setPHQA] = useState<Questions_PHQA>(phqaInitValue);
  const [q2_data, setQ2] = useState<Questions_2Q>(q2InitValue);

  const onSubmit = (e: any) => {
    e.preventDefault();
    SaveToDB();
  }

  const SaveToDB = async () => {
    await fetch("/api/question", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: session?.user?.id, phqa: phqa_data, q2: q2_data })
    }).then((res) => {
      if (res.status === 200) {
        console.log("Return Success");
      }
    });
  }

  const phqaChange = (e: any) => {
    setPHQA((prev: any) => ({
      ...prev,
      ["q" + e.target.name]: Number(e.target.value)
    }));
  }

  return (
    <div className="flex flex-col w-full  gap-5">
      <Form className="w-full items-center flex flex-col gap-4" validationBehavior="native" onSubmit={onSubmit}>
        <h1 className={title({ size: "xs" })}>แบบประเมินภาวะซึมเศร้าในวัยรุ่น (PHQ-A)</h1>
        {qPhqa.map((val, index) => {
          return (
            <Card key={index} className="w-full">
              <CardBody>
                <div className="flex flex-row"><p>{index + 1}.</p>&nbsp;<p>{val}</p></div>
                <div className="flex flex-row">
                  <RadioGroup isRequired={request} errorMessage="กรุณาระบุ" name={(index + 1).toString()} className="pl-5" label="ในช่วง 2 สัปดาห์ คุณมีอาการเหล่านี้บ่อยแค่ไหน" size="sm" onChange={(val) => phqaChange(val)}>
                    <Radio value="0">ไม่มีเลย</Radio>
                    <Radio value="1">มีบางวัน</Radio>
                    <Radio value="2">มีมากกว่า 7 วัน</Radio>
                    <Radio value="3">มีแทบทุกวัน</Radio>
                  </RadioGroup>
                  {qPhqa_Image[index]}
                </div>
              </CardBody>
            </Card>
          )
        })}

        <h1 className={title({ size: "xs" })}>แบบคัดกรองโรคซึมเศร้า (2Q)</h1>
        {q2.map((val, index) => {
          return (
            <Card key={index} className="w-full">
              <CardBody>
                <div className="flex flex-row"><p>{index + 1}.</p>&nbsp;<p>{val}</p></div>
                <div className="flex flex-row">
                  <RadioGroup isRequired={request} errorMessage="กรุณาระบุ" className="pl-5 pt-3" label="เลือกข้อที่รู้สึกตรงกับตัวเอง" size="sm">
                    <Radio className="" value="1">ใช่</Radio>
                    <Radio className="pb-6" value="0">ไม่ใช่</Radio>
                  </RadioGroup>
                  {q2_Image[index]}
                </div>
              </CardBody>
            </Card>
          );
        })}

        <div className="flex flex-col w-full gap-3 pt-5">
          <Button className="w-full" variant="solid" color="default" size="lg" radius="full" type="button">ย้อนกลับ</Button>
          <Button className="w-full" variant="solid" color="primary" size="lg" radius="full" type="submit">ถัดไป</Button>
        </div>
      </Form>
    </div>
  );
}
