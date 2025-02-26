"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  getKeyValue,
} from "@heroui/react";
import React from "react";

import { users } from "../data";

const TableSchool = ({ bottomContent }: { bottomContent: any }) => {
  return (
    <div className="">
      <Table bottomContent={bottomContent} bottomContentPlacement="outside">
        <TableHeader>
          <TableColumn key="id" className="">
            ลำดับที่
          </TableColumn>
          <TableColumn key="school" className="">
            ชื่อโรงเรียน
          </TableColumn>
          <TableColumn key="area" className="">
            เขต
          </TableColumn>
          <TableColumn key="status" className="">
            สถานะ
          </TableColumn>
          <TableColumn key="actions" className="">
            acation
          </TableColumn>
        </TableHeader>

        <TableBody items={users}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{getKeyValue(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableSchool;
