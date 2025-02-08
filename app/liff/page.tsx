"use client";

import { useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import Loading from "../loading";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const checkProfile = async (id: string) => {
    await fetch(`/api/profile/${id}`).then((res) =>
      res.json().then((val) => {
        if (val === null) {
          signOut();
        } else if (val.profile?.length === 0) {
          router.push("/liff/privacy");
        } else {
          if (val.questions?.length === 0) {
            router.push("/liff/question");
          } else {
            router.push("/liff/question/list");
          }
        }

        return val;
      })
    );
  };

  useEffect(() => {
    if (status !== "loading") {
      if (status === "unauthenticated") {
        signIn();
      } else {
        checkProfile(session?.user?.id as string);
      }
    }
  }, [session]);

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] w-screen">
      <Loading />
    </div>

    // <section className="flex flex-col h-[calc(100vh-48px)] items-center justify-center gap-4 px-6">
    //   <Suspense fallback={<Loading />}>
    //     <div className="inline-block max-w-xl text-center justify-center">
    //       <span className={title()}>Make&nbsp;</span>
    //       <span className={title({ color: "violet" })}>beautiful&nbsp;</span>
    //       <br />
    //       <span className={title()}>
    //         websites regardless of your design experience.
    //       </span>
    //       <div className={subtitle({ class: "mt-4" })}>
    //         Beautiful, fast and modern React UI library.
    //       </div>
    //       <div className={subtitle({ class: "mt-4" })}>{status}</div>
    //     </div>

    //     <div className="flex gap-3">
    //       <Link
    //         isExternal
    //         className={buttonStyles({
    //           color: "primary",
    //           radius: "full",
    //           variant: "shadow",
    //         })}
    //         href={siteConfig.links.docs}
    //       >
    //         Documentation
    //       </Link>
    //       <Link
    //         isExternal
    //         className={buttonStyles({ variant: "bordered", radius: "full" })}
    //         href={siteConfig.links.github}
    //       >
    //         <GithubIcon size={20} />
    //         GitHub
    //       </Link>
    //       <Button onPress={() => signOut()}>Sign Out</Button>
    //     </div>

    //     <div className="mt-8">
    //       <Snippet hideCopyButton hideSymbol variant="bordered">
    //         <span>
    //           Get started by editing <Code color="primary">app/page.tsx</Code>
    //         </span>
    //       </Snippet>
    //     </div>
    //   </Suspense>
    // </section>
  );
}
