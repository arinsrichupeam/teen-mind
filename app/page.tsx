import { title } from "@/components/primitives";
import { Button } from "@nextui-org/button";
import { Card, CardBody, CardFooter, CardHeader } from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import { Link } from "@nextui-org/link";

export default function IndexPage() {
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
          <Button className="w-full" variant="solid" color="primary" size="lg" radius="full" as={Link} href="/privacy">ถัดไป</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
