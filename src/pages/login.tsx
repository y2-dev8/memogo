import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from "@/firebase/firebaseConfig";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import Layout from '@/components/Layout';
import { Heading, Text, Link, useToast } from '@chakra-ui/react';
import NextLink from "next/link";
import { FcGoogle } from "react-icons/fc";
import Head from 'next/head';
import { Button, Input } from "antd"

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
        <div className="container mx-auto my-10">
            <Head>
                <title>Login</title>
            </Head>
            <Layout>
                <div className="flex justify-center mb-5">
                    <p className="text-2xl font-bold">ログイン</p>
                </div>
                <div className="flex flex-col space-y-5">
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
                    <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
                        <Button onClick={handleLogin} type="primary">
                            ログイン
                        </Button>
                        <Button onClick={handleGoogleSignIn} type="dashed">
                            <FcGoogle className='text-lg' />
                            Googleでログイン
                        </Button>
                    </div>
                    <p className="text-sm">
                        アカウントを持っていませんか？
                        <NextLink href="/register" className="text-blue-500 hover:underline">
                            新規登録
                        </NextLink>
                    </p>
                </div>
            </Layout>
        </div>
    );
};

export default Login;