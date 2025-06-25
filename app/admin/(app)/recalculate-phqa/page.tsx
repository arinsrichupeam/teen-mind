import { Suspense } from "react";
import RecalculatePHQAPage from "../components/recalculate-phqa";
import Loading from "@/app/loading";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <RecalculatePHQAPage />
    </Suspense>
  );
} 