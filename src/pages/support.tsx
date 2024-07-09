import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import Layout from "@/components/Layout";
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Textarea,
    useToast,
} from "@chakra-ui/react";

export default function Support() {
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "forms"), {
                name,
                email,
                message,
                timestamp: new Date(),
            });
            toast({
                title: "フォームが送信されました。",
                description: "メッセージが送信されました。",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
            setName("");
            setEmail("");
            setMessage("");
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast({
                    title: "フォームの送信中にエラーが発生しました。",
                    description: error.message,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        }
    };

    return (
        <div className="container mx-auto my-10">
            <Layout>
                <Heading size="lg" className="mb-5">サポートフォーム</Heading>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-3">
                        <FormControl id="name" isRequired>
                            <FormLabel>名前</FormLabel>
                            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                        </FormControl>
                        <FormControl id="email" isRequired>
                            <FormLabel>メールアドレス</FormLabel>
                            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </FormControl>
                        <FormControl id="message" isRequired>
                            <FormLabel>内容</FormLabel>
                            <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
                        </FormControl>
                    </div>
                    <Button colorScheme="teal" type="submit" className="mt-5 w-full">送信</Button>
                </form>
            </Layout>
        </div>
    );
}