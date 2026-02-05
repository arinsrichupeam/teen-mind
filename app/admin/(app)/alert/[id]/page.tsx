"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Spinner,
} from "@heroui/react";
import { ArrowLeftIcon, PhoneIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { prefix } from "@/utils/data";
import { formatThaiDateTime } from "@/utils/helper";

interface AlertQuestionProfile {
  id: string;
  firstname: string;
  lastname: string;
  prefixId: number;
  tel: string;
  citizenId: string;
  birthday: string;
  sex: number;
  school?: { id: number; name: string } | null;
  emergency?: Array<{ name: string; tel: string; relation: string }>;
}

interface AlertQuestionData {
  id: string;
  result: string;
  result_text?: string | null;
  createdAt: string;
  profile: AlertQuestionProfile;
  phqa?: Array<{ sum: number }>;
}

export default function AlertCasePage() {
  const params = useParams();
  const router = useRouter();
  const questionId = typeof params.id === "string" ? params.id : "";

  const [data, setData] = useState<AlertQuestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestion = useCallback(async () => {
    if (!questionId) {
      setError("ไม่พบรหัสเคส");
      setLoading(false);

      return;
    }

    try {
      const res = await fetch(`/api/question/${questionId}`);

      if (!res.ok) {
        throw new Error("โหลดข้อมูลไม่สำเร็จ");
      }
      const raw = await res.json();
      const question =
        raw && typeof raw === "object" && !Array.isArray(raw) ? raw : null;

      if (!question) {
        setError("ไม่พบข้อมูลเคส");
        setData(null);
      } else {
        setData(question);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const prefixLabel =
    prefix.find((p) => Number(p.key) === data?.profile?.prefixId)?.label ?? "";
  const fullName = data?.profile
    ? `${prefixLabel}${data.profile.firstname} ${data.profile.lastname}`.trim()
    : "-";
  const tel = data?.profile?.tel ?? "-";
  const phqaSum = data?.phqa?.[0]?.sum ?? 0;
  const schoolName =
    data?.profile?.school && typeof data.profile.school === "object"
      ? ((data.profile.school as { name?: string }).name ?? "-")
      : "-";

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <Card>
          <CardBody className="gap-4 p-4 sm:p-6">
            <p className="text-default-500">{error ?? "ไม่พบข้อมูล"}</p>
            <Button
              as={Link}
              className="w-full sm:w-auto"
              href="/admin/question"
              startContent={<ArrowLeftIcon className="size-5 shrink-0" />}
              variant="flat"
            >
              กลับหน้ารายการแบบประเมิน
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-6 md:py-5">
      {/* ปุ่มกลับ / ไปหน้ารายการ - responsive: แถวเดียวบน sm ขึ้นไป, เต็มความกว้างบนมือถือ */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 md:mb-4">
        <Button
          className="w-full shrink-0 sm:w-auto"
          startContent={<ArrowLeftIcon className="size-5 shrink-0" />}
          variant="light"
          onPress={() => router.back()}
        >
          กลับ
        </Button>
        <Button
          as={Link}
          className="w-full sm:w-auto"
          color="primary"
          href="/admin/question"
          variant="flat"
        >
          ไปหน้ารายการแบบประเมิน
        </Button>
      </div>

      <Card className="overflow-hidden border-l-4 border-l-red-500">
        {/* Desktop: หัวการ์ดหนึ่งแถว กระชับ | Mobile: แยก 2 บรรทัด */}
        <CardHeader className="flex flex-col items-start gap-2 p-4 pb-2 sm:p-5 sm:pb-2 md:flex-row md:items-center md:justify-between md:gap-4 md:py-4 md:pb-2">
          <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 md:w-auto md:flex-1 md:flex-nowrap md:justify-start">
            <h1 className="min-w-0 truncate text-base font-semibold sm:text-xl">
              เคสแจ้งเตือน Red
            </h1>
            <Chip
              className="shrink-0 md:ml-2"
              color="danger"
              size="sm"
              variant="flat"
            >
              {data.result_text ?? data.result}
            </Chip>
          </div>
          <p className="text-small text-default-500 break-words md:shrink-0 md:text-right">
            วันที่ทำแบบประเมิน: {formatThaiDateTime(data.createdAt)}
          </p>
        </CardHeader>
        <CardBody className="gap-4 p-4 sm:gap-5 sm:p-5 md:gap-3 md:p-5">
          {/* Desktop: ข้อมูลผู้ประเมิน + คะแนน PHQA แถวเดียวกัน | Mobile: แนวตั้ง */}
          <div className="grid gap-4 md:grid-cols-2 md:gap-6 md:gap-x-8">
            <section>
              <h2 className="mb-1.5 text-sm font-semibold text-default-600 md:mb-1">
                ข้อมูลผู้ประเมิน
              </h2>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm sm:gap-x-4 md:gap-y-0.5">
                <span className="shrink-0 text-default-500">ชื่อ-นามสกุล:</span>
                <span className="min-w-0 break-words font-medium">
                  {fullName}
                </span>
                <span className="shrink-0 text-default-500">เลข ปชช:</span>
                <span className="min-w-0 break-all">
                  {data.profile.citizenId}
                </span>
                <span className="shrink-0 text-default-500">เบอร์โทร:</span>
                <span className="min-w-0 break-all">
                  <a
                    className="text-primary underline"
                    href={`tel:${tel.replace(/\s/g, "")}`}
                  >
                    {tel}
                  </a>
                </span>
                {schoolName !== "-" && (
                  <>
                    <span className="shrink-0 text-default-500">
                      สถานศึกษา:
                    </span>
                    <span className="min-w-0 break-words">{schoolName}</span>
                  </>
                )}
              </div>
              <div className="mt-2 md:mt-1.5">
                <Button
                  as="a"
                  className="w-full sm:w-auto"
                  color="danger"
                  href={`tel:${tel.replace(/\s/g, "")}`}
                  size="sm"
                  startContent={<PhoneIcon className="size-4 shrink-0" />}
                  variant="flat"
                >
                  โทรติดต่อ
                </Button>
              </div>
            </section>

            <section className="md:border-l md:border-default-200 md:pl-6 md:flex md:flex-col md:gap-4">
              <div>
                <h2 className="mb-1.5 text-sm font-semibold text-default-600 md:mb-1">
                  คะแนน PHQA
                </h2>
                <p className="text-sm break-words">
                  รวมคะแนน: <strong>{phqaSum}</strong> (
                  {data.result_text ?? data.result})
                </p>
              </div>
              {data.profile.emergency && data.profile.emergency.length > 0 && (
                <div>
                  <h2 className="mb-1.5 text-sm font-semibold text-default-600 md:mb-1">
                    ผู้ติดต่อฉุกเฉิน
                  </h2>
                  <div className="space-y-1.5">
                    {data.profile.emergency.map((em, i) => (
                      <div key={i} className="text-sm break-words">
                        <p className="font-medium">
                          {em.name}{" "}
                          <span className="text-default-500">
                            ({em.relation})
                          </span>
                        </p>
                        <p className="mt-0.5 md:mt-0">
                          <a
                            className="text-primary underline break-all text-sm"
                            href={`tel:${em.tel.replace(/\s/g, "")}`}
                          >
                            {em.tel}
                          </a>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          <Divider className="my-2 md:my-1.5" />

          <div className="flex flex-wrap gap-2">
            <Button
              as={Link}
              className="w-full sm:w-auto"
              color="primary"
              href="/admin/question"
            >
              หน้ารายการแบบประเมิน
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
