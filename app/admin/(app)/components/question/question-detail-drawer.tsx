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
import { q2, qPhqa, phqaAddon } from "@/app/data";
import { QuestionsData } from "@/types";

interface Props {
  data: QuestionsData | undefined;
}

export const QuestionDetailDrawer = ({ data }: Props) => {
  return (
    <div>
      <div>
        <h2 className={subtitle()}>แบบประเมิน 2Q</h2>
        <Table aria-label="Question Anwser 2Q">
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
                    {(data?.q2 && data.q2.length > 0
                      ? data.q2
                      : [undefined]
                    ).map((item, i) => {
                      return (
                        <RadioGroup
                          key={i}
                          className="items-center"
                          name={(index + 1).toString()}
                          orientation="horizontal"
                          value={
                            item
                              ? Object.entries(item)
                                  [index + 2]?.toString()
                                  .substring(3)
                              : undefined
                          }
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
      <div>
        <h2 className={subtitle()}>แบบประเมิน PHQ-A</h2>
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
                      {(data?.phqa && data.phqa.length > 0
                        ? data.phqa
                        : [undefined]
                      ).map((item, i) => {
                        return (
                          <RadioGroup
                            key={i}
                            className="items-center"
                            name={(index + 1).toString()}
                            orientation="horizontal"
                            value={
                              item
                                ? Object.entries(item)
                                    [index + 2]?.toString()
                                    .substring(3)
                                : undefined
                            }
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
        <h2 className={subtitle()}>แบบประเมิน PHQ-A Addon</h2>
        <Table aria-label="Question Anwser PHQ-A-Addon">
          <TableHeader>
            <TableColumn>คำถาม</TableColumn>
            <TableColumn align="center">คำตอบ</TableColumn>
          </TableHeader>
          <TableBody>
            {phqaAddon.map((val, index) => {
              return (
                <TableRow key={index}>
                  <TableCell className="min-w-[250px]">
                    {index + 1} {val}
                  </TableCell>
                  <TableCell className="min-w-[250px]">
                    {(data?.addon && data.addon.length > 0
                      ? data.addon
                      : [undefined]
                    ).map((item, i) => {
                      return (
                        <RadioGroup
                          key={i}
                          className="items-center"
                          name={(index + 1).toString()}
                          orientation="horizontal"
                          value={
                            item
                              ? Object.entries(item)
                                  [index + 2]?.toString()
                                  .substring(3)
                              : undefined
                          }
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
