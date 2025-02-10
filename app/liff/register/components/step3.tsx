"use client";
import { EmergencyContact } from "@prisma/client";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";

export const Step3 = ({
  NextStep,
  BackStep,
  Result,
  HandleChange,
}: {
  NextStep: (val: any) => void;
  BackStep: (val: any) => void;
  Result: EmergencyContact | undefined;
  HandleChange: (val: any) => void;
}) => {
  const request = true;

  const onSubmit = (e: any) => {
    e.preventDefault();
    NextStep("Emergency");
  };

  return (
    <Form
      className="flex flex-col gap-4 text-start"
      validationBehavior="native"
      onSubmit={onSubmit}
    >
      <Input
        isRequired={request}
        label="ชื่อผู้ติดต่อในกรณีฉุกเฉิน"
        labelPlacement="inside"
        name="name"
        placeholder="ชื่อผู้ติดต่อในกรณีฉุกเฉิน"
        radius="md"
        size="sm"
        value={Result?.name}
        variant="faded"
        onChange={HandleChange}
      />
      <div className="flex flex-row gap-4 w-full">
        <Input
          errorMessage="กรุณากรอกบ้านเลขที่"
          isRequired={request}
          label="เบอร์โทรศัพท์"
          labelPlacement="inside"
          name="tel"
          placeholder="เบอร์โทรศัพท์"
          radius="md"
          size="sm"
          type="number"
          value={Result?.tel}
          variant="faded"
          onChange={HandleChange}
        />
        <Input
          isRequired={request}
          label="ความสัมพันธ์"
          labelPlacement="inside"
          name="relation"
          placeholder="ความสัมพันธ์"
          radius="md"
          size="sm"
          value={Result?.relation}
          variant="faded"
          onChange={HandleChange}
        />
      </div>

      <div className="flex flex-col pt-5 gap-2 w-full">
        <Button
          className="w-full"
          radius="full"
          size="lg"
          variant="solid"
          onPress={() => BackStep("Emergency")}
        >
          ย้อนกลับ
        </Button>
        <Button
          className="w-full"
          color="primary"
          radius="full"
          size="lg"
          type="submit"
          variant="solid"
        >
          ถัดไป
        </Button>
      </div>
    </Form>
  );
};
