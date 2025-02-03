"use client"

import React, { useEffect, useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@heroui/react";
import { useRouter } from "next/navigation";

export const QuestionMessage = ({ isOpen, onClose, score }: { isOpen: any, onClose: any, score: string }) => {
    const router = useRouter();
    const [title, setTitle] = useState("");

    useEffect(() => {
        switch (score) {
            case "Green":
                setTitle("ไม่พบความเสี่ยง");
                break;
            case "Yellow":
                setTitle("พบแนวโน้มความเสี่ยง");
                break;
            case "Red":
                setTitle("พบความเสี่ยง");
                break;
        }
    })

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} size="sm" placement="center">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
                            <ModalBody>

                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Close
                                </Button>
                                <Button color="primary" onPress={() => router.push("/question/list")}>
                                    Action
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}