import {
  Autocomplete,
  AutocompleteItem,
  Card,
  CardBody,
  DatePicker,
  Textarea,
} from "@heroui/react";

import { subtitle } from "@/components/primitives";
import { QuestionsData } from "@/types";

interface Props {
  data: QuestionsData | undefined;
}

export const QuestionEdit = ({ data }: Props) => {
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
                label="Consultant"
                labelPlacement="outside"
                placeholder="Search a Consultant"
                variant="bordered"
              >
                <AutocompleteItem key={data?.id} />
                {/* {(animal) => <AutocompleteItem key={animal.key}>{animal.label}</AutocompleteItem>} */}
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
              placeholder="Description"
              variant="bordered"
            />
            <Textarea
              isClearable
              label="2.	Objective data"
              labelPlacement="outside"
              minRows={4}
              placeholder="Description"
              variant="bordered"
            />
            <Textarea
              isClearable
              label="3.	Assessment"
              labelPlacement="outside"
              minRows={4}
              placeholder="Description"
              variant="bordered"
            />
            <Textarea
              isClearable
              label="4.	Plan"
              labelPlacement="outside"
              minRows={4}
              placeholder="Description"
              variant="bordered"
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
