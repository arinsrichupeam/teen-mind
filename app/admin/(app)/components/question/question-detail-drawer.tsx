import {
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";

import { subtitle } from "@/components/primitives";
import { q2, qPhqa } from "@/app/data";
import { QuestionsData } from "@/types";

interface Props {
  data: QuestionsData | undefined;
}

export const QuestionDetailDrawer = ({ data }: Props) => {
  return (
    <div>
      <div>
        <h2 className={subtitle()}>แบบประเมินภาวะซึมเศร้าในวัยรุ่น</h2>
        <div className="flex flex-col gap-4">
          <Table aria-label="Question Anwser PHQ-A">
            <TableHeader>
              <TableColumn>คำถาม</TableColumn>
              <TableColumn align="center">คำตอบ</TableColumn>
            </TableHeader>
            <TableBody>
              {qPhqa.map((val, index) => {
                return (
                  <TableRow key={index}>
                    <TableCell className="min-w-[250px]">
                      {index + 1} {val}
                    </TableCell>
                    <TableCell className="min-w-[250px]">
                      {data?.phqa.map((val) => {
                        return (
                          <RadioGroup
                            key={index}
                            className="items-center"
                            name={(index + 1).toString()}
                            orientation="horizontal"
                            value={Object.entries(val)
                              [index + 2].toString()
                              .substring(3)}
                          >
                            <Radio
                              className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                              value="0"
                            >
                              0
                            </Radio>
                            <Radio
                              className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                              value="1"
                            >
                              1
                            </Radio>
                            <Radio
                              className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                              value="2"
                            >
                              2
                            </Radio>
                            <Radio
                              className="inline-flex items-center text-nowrap justify-between max-w-full cursor-pointer pr-5"
                              value="3"
                            >
                              3
                            </Radio>
                          </RadioGroup>
                        );
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      <div>
        <h2 className={subtitle()}>คำถามแนบท้าย</h2>
        <Table aria-label="Question Anwser PHQ-A-Addon">
          <TableHeader>
            <TableColumn>คำถาม</TableColumn>
            <TableColumn align="center">คำตอบ</TableColumn>
          </TableHeader>
          <TableBody>
            {q2.map((val, index) => {
              return (
                <TableRow key={index}>
                  <TableCell className="min-w-[250px]">
                    {index + 1} {val}
                  </TableCell>
                  <TableCell className="min-w-[250px]">
                    {data?.q2.map((val) => {
                      return (
                        <RadioGroup
                          key={index}
                          className="items-center"
                          name={(index + 1).toString()}
                          orientation="horizontal"
                          value={Object.entries(val)
                            [index + 2].toString()
                            .substring(3)}
                        >
                          <Radio
                            className="inline-flex items-center justify-between max-w-full cursor-pointer pr-5"
                            value="1"
                          >
                            ใช่
                          </Radio>
                          <Radio
                            className="inline-flex items-center justify-between max-w-full cursor-pointer pr-5"
                            value="0"
                          >
                            ไม่ใช่
                          </Radio>
                        </RadioGroup>
                      );
                    })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
