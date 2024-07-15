import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from "@/firebase/firebaseConfig";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import Layout from '@/components/Layout';
import { useToast } from '@chakra-ui/react';
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import Head from 'next/head';
import { Button, Input, Card, Typography, Divider } from "antd";

const { Title, Text } = Typography;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const toast = useToast();

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
        } catch (error) {
            console.error('ログインエラー:', error);
            toast({
                title: 'エラー',
                description: 'ログイン中にエラーが発生しました。',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            router.push('/');
        } catch (error) {
            console.error('Googleログインエラー:', error);
            toast({
                title: 'エラー',
                description: 'Googleログイン中にエラーが発生しました。',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <div className="container mx-auto flex justify-center items-center min-h-screen">
            <Head>
                <title>Login</title>
            </Head>
            <Layout>
                <Card className="max-w-[400px]">
                    <Title level={3} className="mb-5 text-center">Login with</Title>
                    <Button onClick={handleGoogleSignIn} type="dashed" className="w-full" icon={<FcGoogle className="text-lg" />}>
                        Google
                    </Button>
                    <Divider><p className="font-normal text-sm text-gray-500">or</p></Divider>
                    <div className="flex flex-col space-y-3">
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="メールアドレス"
                        />
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="パスワード"
                        />
                    </div>
                    <Button onClick={handleLogin} type="primary" className="w-full mt-5">
                        ログイン
                    </Button>
                    <div className="mt-5 w-full text-center">
                        <p>
                            アカウントを持っていませんか？
                            <Link href="/register" className="ml-0.5 text-blue-500 hover:text-blue-500 hover:underline">
                                新規登録
                            </Link>
                        </p>
                    </div>
                </Card>
            </Layout>
        </div>
    );
};

export default Login;