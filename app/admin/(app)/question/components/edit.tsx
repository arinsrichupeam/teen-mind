import {
  Autocomplete,
  AutocompleteItem,
  Card,
  CardBody,
  DatePicker,
  Textarea,
} from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { Profile_Admin } from "@prisma/client";

import { subtitle } from "@/components/primitives";
import { Consultant, QuestionsData } from "@/types";

interface Props {
  masterId: string | undefined;
}

const ConsultantInitValue: Consultant[] = [
  {
    id: "",
    name: "",
  },
];

export const QuestionEdit = ({ masterId }: Props) => {
  const [Consultant, setConsultant] =
    useState<Consultant[]>(ConsultantInitValue);
  const [Master, setMaster] = useState<QuestionsData>();

  const GetConsultantList = useCallback(async () => {
    await fetch("/api/profile/admin")
      .then((res) => res.json())
      .then((val: Profile_Admin[]) => {
        setConsultant([
          {
            id: val[0].id,
            name: val[0].firstname + " " + val[0].lastname,
          },
        ]);
      });
  }, [Consultant]);

  const GetQuestionMaster = useCallback(async () => {
    await fetch("/api/question/" + masterId)
      .then((res) => res.json())
      .then((val) => {
        setMaster(val[0]);
      });
  }, [Master]);

  useEffect(() => {
    GetConsultantList();
    GetQuestionMaster();
  }, []);

  return (
    <div className="flex flex-col">
      <div>
        <h2 className={subtitle()}>Telemedicine</h2>
        <Card>
          <CardBody className="flex flex-row gap-5">
            <div className="w-full">
              <DatePicker
                label="Schedule Telemed"
                labelPlacement="outside"
                variant="bordered"
              />
            </div>
            <div className="w-full">
              <Autocomplete
                isRequired
                defaultItems={Consultant}
                defaultSelectedKey={Master?.consult}
                errorMessage="กรุณาระบุผู้ให้คำปรึกษา"
                label="Consultant"
                labelPlacement="outside"
                placeholder="Consultant"
                radius="md"
                variant="bordered"
                // onSelectionChange={(val) =>
                //   schoolChange({ target: { name: "districtId", value: val } })
                // }
              >
                {(item) => (
                  <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
                )}
              </Autocomplete>
            </div>
          </CardBody>
        </Card>
      </div>
      <div>
        <h2 className={subtitle()}>Discharge Summary</h2>
        <Card>
          <CardBody className="gap-5">
            <Textarea
              isClearable
              label="1.	Subjective data"
              labelPlacement="outside"
              minRows={4}
              name="subjective"
              placeholder="Description"
              value={Master?.subjective as string}
              variant="bordered"
            />
            <Textarea
              isClearable
              label="2.	Objective data"
              labelPlacement="outside"
              minRows={4}
              name="objective"
              placeholder="Description"
              value={Master?.objective as string}
              variant="bordered"
            />
            <Textarea
              isClearable
              label="3.	Assessment"
              labelPlacement="outside"
              minRows={4}
              name="assessment"
              placeholder="Description"
              value={Master?.assessment as string}
              variant="bordered"
            />
            <Textarea
              isClearable
              label="4.	Plan"
              labelPlacement="outside"
              minRows={4}
              name="plan"
              placeholder="Description"
              value={Master?.plan as string}
              variant="bordered"
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
