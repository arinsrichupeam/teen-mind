"use client";

import { signIn } from "next-auth/react";
import { Button } from "@heroui/button";

import { title } from "@/components/primitives";
import { LineIcon } from "@/components/icons";

export default function AuthPage() {
  return (
    <section className="flex flex-col w-[calc(100vw)] h-[calc(100vh-48px)] items-center justify-center gap-4">
      <div className="text-center justify-center">
        <p className={title()}>เข้าสู่ระบบ</p>
      </div>

      <div className="flex gap-3">
        <Button
          isIconOnly
          aria-label="Like"
          className="w-16 h-16"
          color="warning"
          variant="faded"
          onPress={() => signIn("line")}
        >
          <LineIcon />
        </Button>
      </div>
    </section>
  );
}
