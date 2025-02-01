"use client"

import { title } from "@/components/primitives";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function QuestionPage() {
    const router = useRouter();

    useEffect(() => {
        router.push("/question/phqa");
    }, []);
}
