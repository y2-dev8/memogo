import { useState, useEffect } from "react";
import { collection, getDocs, QuerySnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { useRouter } from 'next/router';
import Layout from "@/components/Layout";
import { Box, Heading, Text, VStack, Input, Button, useToast } from "@chakra-ui/react";
import Head from 'next/head';

export default function ViewSubmissions() {
    const [submissions, setSubmissions] = useState<DocumentData[]>([]);
    const [pin, setPin] = useState<string>('');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const router = useRouter();
    const toast = useToast();

    const correctPin = "221125";

    const checkPin = () => {
        if (pin === correctPin) {
            setIsAuthenticated(true);
            toast({
                title: '認証成功',
                description: 'PINコードが正しいです。',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
        } else {
            toast({
                title: '認証エラー',
                description: 'PINコードが間違っています。',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    useEffect(() => {
        const fetchSubmissions = async () => {
            const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, "forms"));
            const submissionsList = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setSubmissions(submissionsList);
        };

        if (isAuthenticated) {
            fetchSubmissions();
        }
    }, [isAuthenticated]);

    return (
        <div className="container mx-auto my-10">
            <Head>
                <title>Developer Portal</title>
            </Head>
            <Layout>
                {!isAuthenticated ? (
                    <div className="space-y-5">
                        <Heading size="lg">PINコード</Heading>
                        <Input
                            type="number"
                            placeholder="PINコードを入力..."
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            maxLength={6}
                        />
                        <Button onClick={checkPin} colorScheme="teal" className="w-full">認証</Button>
                    </div>
                ) : (
                    <>
                        <Heading size="lg" className="mb-5">サポートフォーム</Heading>
                        <VStack spacing={5}>
                            {submissions.length === 0 ? (
                                <div className="w-full flex justify-center">
                                    <Text className="text-slate-500 mb-5">送信された内容はありません。</Text>
                                </div>
                            ) : (
                                submissions.map((submission) => (
                                    <div key={submission.id} className="w-full rounded-md border p-5 shadow-sm">
                                        <div className="flex items-center">
                                            <Heading size="sm">{submission.name}</Heading>
                                            <Text className="ml-2.5 text-xs text-slate-500">{new Date(submission.timestamp.seconds * 1000).toLocaleString()}</Text>
                                        </div>
                                        <Text className="mt-1 text-blue-500 text-sm">{submission.email}</Text>
                                        <Text className="mt-3 whitespace-pre-line">{submission.message}</Text>
                                    </div>
                                ))
                            )}
                        </VStack>
                    </>
                )}
            </Layout>
        </div>
    );
}