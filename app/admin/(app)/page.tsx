"use client";

import { useDisclosure } from "@heroui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ModalUserStatus } from "./components/modal/modal-User-status";

export default function AdminHome() {
  const { data: session, status } = useSession();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading") {
      if (status !== "authenticated") {
        router.push("/admin/login");
      } else {
        fetch(`/api/profile/admin/${session.user?.id}`)
          .then((res) => res.json())
          .then((val) => {
            if (!val.profile_admin!!) {
              router.push("/admin/register");
            }
          });
      }
    }
  }, [session, router]);

  return (
    <div className="h-full lg:px-6">
      <ModalUserStatus />
      <div className="flex justify-center gap-4 xl:gap-6 pt-3 px-4 lg:px-0  flex-wrap xl:flex-nowrap sm:pt-10 max-w-[90rem] mx-auto w-full">
        <div className="mt-6 gap-6 flex flex-col w-full">
          {/* Card Section Top */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold">Available Balance</h3>
            <div className="grid md:grid-cols-2 grid-cols-1 2xl:grid-cols-3 gap-5  justify-center w-full">
              {/* <CardBalance1 />
                            <CardBalance2 />
                            <CardBalance3 /> */}
            </div>
          </div>

          {/* Chart */}
          <div className="h-full flex flex-col gap-2">
            <h3 className="text-xl font-semibold">Statistics</h3>
            <div className="w-full bg-default-50 shadow-lg rounded-2xl p-6 ">
              {/* <Chart /> */}
            </div>
          </div>
        </div>

        {/* Left Section */}
        <div className="mt-4 gap-2 flex flex-col xl:max-w-md w-full">
          <h3 className="text-xl font-semibold">Section</h3>
          <div className="flex flex-col justify-center gap-4 flex-wrap md:flex-nowrap md:flex-col">
            {/* <CardAgents />
                        <CardTransactions /> */}
          </div>
        </div>
      </div>

      {/* Table Latest Users */}
      <div className="flex flex-col justify-center w-full py-5 px-4 lg:px-0  max-w-[90rem] mx-auto gap-3">
        <div className="flex  flex-wrap justify-between">
          <h3 className="text-center text-xl font-semibold">Latest Users</h3>
          {/* <Link
                        href="/accounts"
                        as={NextLink}
                        color="primary"
                        className="cursor-pointer"
                    >
                        View All
                    </Link> */}
        </div>
        {/* <TableWrapper /> */}
      </div>
    </div>
  );
}
