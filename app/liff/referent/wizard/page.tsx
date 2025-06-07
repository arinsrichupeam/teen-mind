"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { Radio, RadioGroup } from "@heroui/radio";
import { Input } from "@heroui/input";

import { title, subtitle } from "@/components/primitives";
import Loading from "@/app/loading";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface AddressData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface SurveyData {
  answers: {
    [key: string]: string;
  };
}

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [addressData, setAddressData] = useState<AddressData>({
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [surveyData, setSurveyData] = useState<SurveyData>({
    answers: {},
  });

  const handleProfileSubmit = () => {
    setStep(2);
    setProgress(50);
  };

  const handleAddressSubmit = () => {
    setStep(3);
    setProgress(75);
  };

  const handleSurveySubmit = async () => {
    setProgress(100);
    try {
      // TODO: ส่งข้อมูลไปยัง API
    } finally {
      // catch (error) {
      //   console.error("Error submitting survey:", error);
      // }
      // router.push("/liff/referent/wizard/success");
    }
  };

  const BackStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setProgress((step - 2) * 25);
    } else {
      router.back();
    }
  };

  return (
    <section className="flex flex-col w-[calc(100vw)] items-center justify-center gap-4 pt-10 px-8 py-8 md:py-10">
      <Suspense fallback={<Loading />}>
        <h1 className={title({ size: "xs" })}>แบบสอบถามข้อมูล</h1>

        <Progress
          aria-label="Loading..."
          className="max-w-md"
          showValueLabel={true}
          value={progress}
        />

        <div className="flex flex-col w-full min-h-[calc(100vh_-_350px)]">
          <h2 className={subtitle()}>
            {step === 1
              ? "ข้อมูลส่วนตัว"
              : step === 2
                ? "ที่อยู่"
                : "แบบสอบถาม"}
          </h2>

          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <Input
                      label="ชื่อ"
                      placeholder="กรอกชื่อ"
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          firstName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Input
                      label="นามสกุล"
                      placeholder="กรอกนามสกุล"
                      value={profileData.lastName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          lastName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Input
                    label="อีเมล"
                    placeholder="กรอกอีเมล"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Input
                    label="เบอร์โทรศัพท์"
                    placeholder="กรอกเบอร์โทรศัพท์"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div>
                  <Input
                    label="ที่อยู่"
                    placeholder="กรอกที่อยู่"
                    type="textarea"
                    value={addressData.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAddressData({
                        ...addressData,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <Input
                      label="จังหวัด"
                      placeholder="กรอกจังหวัด"
                      value={addressData.city}
                      onChange={(e) =>
                        setAddressData({ ...addressData, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Input
                      label="รหัสไปรษณีย์"
                      placeholder="กรอกรหัสไปรษณีย์"
                      value={addressData.state}
                      onChange={(e) =>
                        setAddressData({
                          ...addressData,
                          state: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div>
                  <RadioGroup
                    label="คำถามที่ 1: คุณมีความพึงพอใจในการใช้งานแอปพลิเคชันนี้อย่างไร?"
                    value={surveyData.answers.q1 || ""}
                    onValueChange={(value) =>
                      setSurveyData({
                        ...surveyData,
                        answers: {
                          ...surveyData.answers,
                          q1: value,
                        },
                      })
                    }
                  >
                    <Radio className="mb-2" value="very_satisfied">
                      พึงพอใจมาก
                    </Radio>
                    <Radio className="mb-2" value="satisfied">
                      พึงพอใจ
                    </Radio>
                    <Radio className="mb-2" value="neutral">
                      ปานกลาง
                    </Radio>
                    <Radio className="mb-2" value="dissatisfied">
                      ไม่พึงพอใจ
                    </Radio>
                    <Radio value="very_dissatisfied">ไม่พึงพอใจมาก</Radio>
                  </RadioGroup>
                </div>
                <div>
                  <Input
                    label="คำถามที่ 2: คุณมีข้อเสนอแนะเพิ่มเติมหรือไม่?"
                    placeholder="กรอกข้อเสนอแนะ"
                    type="textarea"
                    value={surveyData.answers.q2 || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSurveyData({
                        ...surveyData,
                        answers: {
                          ...surveyData.answers,
                          q2: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          className="w-full"
          color="default"
          radius="full"
          size="lg"
          variant="bordered"
          onPress={BackStep}
        >
          ย้อนกลับ
        </Button>

        {step === 3 ? (
          <Button
            className="w-full"
            color="primary"
            radius="full"
            size="lg"
            variant="solid"
            onPress={handleSurveySubmit}
          >
            บันทึกผล
          </Button>
        ) : (
          <Button
            className="w-full"
            color="primary"
            radius="full"
            size="lg"
            variant="solid"
            onPress={step === 1 ? handleProfileSubmit : handleAddressSubmit}
          >
            ถัดไป
          </Button>
        )}
      </Suspense>
    </section>
  );
}
