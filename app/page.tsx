"use client";

import { redirect } from "next/navigation";
import Loading from "./loading";

export default function Home() {
  return redirect("/liff");
  // return <Loading />;
}
