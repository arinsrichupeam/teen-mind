"use client";

import { Button, Image, Divider } from "@heroui/react";
import { signIn } from "next-auth/react";

import { title } from "@/components/primitives";
import { LineIcon } from "@/components/icons";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Image
        alt="BKK Logo"
        className="max-h-[calc(6vh)]"
        loading="lazy"
        src="/image/LogoBKK-Black.png"
      />
      <h1 className={title({ size: "sm" })}>เข้าสู่ระบบ</h1>
      <Divider />
      <Button
        isIconOnly
        aria-label="Line"
        className="w-14 h-14"
        color="warning"
        variant="faded"
        onPress={() => signIn("line")}
      >
        <LineIcon />
      </Button>
    </div>
  );
}
