import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from "@/firebase/firebaseConfig";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import Layout from '@/components/Layout';
import { Button, Heading, Input, Text, Link, useToast } from '@chakra-ui/react';
import NextLink from "next/link";
import { FaGoogle } from "react-icons/fa";
import Head from 'next/head';

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
                <Heading size="lg" className="mb-5">ログイン</Heading>
                <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="メールアドレス"
                    className="w-full mb-3"
                />
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワード"
                    className="w-full mb-5"
                />
                <div className="flex flex-col md:flex-row">
                    <Button onClick={handleLogin} colorScheme='blue' className="mb-5">
                        ログイン
                    </Button>
                    <Button onClick={handleGoogleSignIn} colorScheme='gray' className="md:ml-3 mb-5" leftIcon={<FaGoogle className="text-slate-300" />}>
                        Googleアカウントでログイン
                    </Button>
                </div>
                <Text>
                    アカウントを持っていませんか？{' '}
                    <Link color="blue.500">
                        <NextLink href="/register">
                            新規登録
                        </NextLink>
                    </Link>
                </Text>
            </Layout>
        </div>
    );
};

export default Login;