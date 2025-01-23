"use client"

import { title } from "@/components/primitives";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, Card, CardBody, CardFooter, CardHeader, Image } from "@heroui/react";

export default function IndexPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const CheckProfile = async () => {
    if (status !== "loading" && status === "unauthenticated") {
      signIn("line");
    }
    else {
      // console.log(session?.user);
      await fetch(`/api/profile/${session?.user?.id}`).then((res) => res.json().then(val => {
        // console.log(val);
        if (val.profile.length == 0) {
          // console.log("No profile found");
          router.push("/privacy");
        }
        else {
          // console.log(val.profile);
          router.push("/question/phqa");
        }
      }));
    }
  };

  useEffect(() => {

  }, []);

  return (
    <div className="flex flex-col gap-5 items-center">
      <h1 className={title()}>TEEN MIND</h1>
      <Card className="mt-4 pt-4 pb-4 px-4">
        <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
          <small className="text-default-500">12 Tracks</small>
          <h4 className="font-bold text-large">Frontend Radio</h4>
        </CardHeader>
        <CardBody className="overflow-visible py-2">
          <Image
            alt="Card background"
            className="object-cover rounded-xl"
            src="https://nextui.org/images/hero-card-complete.jpeg"
            width={270}
          />
        </CardBody>
        <CardFooter className="flex-col gap-4 items-start">
          <p className="text-tiny uppercase font-bold">คำอธิบายเกี่ยวกับแอพ</p>
          <Button className="w-full" variant="solid" color="primary" size="lg" radius="full" onPress={CheckProfile}>ถัดไป</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
