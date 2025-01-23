import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

export default function Home() {
  return (
    <section className="flex flex-col h-full items-center justify-center gap-4 py-8 md:py-10" >
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>TEEN MIND</span>
      </div>
    </section>
  );
}
