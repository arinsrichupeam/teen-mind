"use client";

import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon, LineIcon } from "@/components/icons";
import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@heroui/button";

export default function AuthPage() {
  const { data: session, status } = useSession();

  return (
    <section className="flex flex-col items-center justify-center gap-4 mx-6 py-8 pt-48 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <p className={title()}>เข้าสู่ระบบ</p>
      </div>

      <div className="flex gap-3">
        <Button className="w-16 h-16" isIconOnly aria-label="Like" color="warning" variant="faded" onPress={() => signIn("line")}>
          <LineIcon />
        </Button>
      </div>
    </section>
  );
}
