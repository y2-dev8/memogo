import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/firebaseConfig';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, UserCredential } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { Form, Input, Button, Typography, message, Steps, Card, Divider } from 'antd';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';
import Head from 'next/head';

const { Title, Text } = Typography;
const { Step } = Steps;

const steps = [
    { title: 'First', description: 'ユーザーID' },
    { title: 'Second', description: 'メールアドレスとパスワード' },
    { title: 'Third', description: 'ユーザーネーム' },
];

const Register = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [displayName, setDisplayName] = useState<string>('');
    const [userID, setUserID] = useState<string>('');
    const [current, setCurrent] = useState<number>(0);
    const router = useRouter();
    const [form] = Form.useForm();

    const showToast = (content: string, type: "success" | "error") => {
        message[type](content);
    };

    const forbiddenUserIDs: string[] = [
        'register', 'login', 'settings', 'support', 'memo',
        'feed', 'editor', 'search', 'index', 'following', 'bookmarks', 'router'
    ];

    const validateUserID = async (userID: string): Promise<string | null> => {
        const userIDPattern = /^[a-zA-Z0-9_.]+$/;
        if (!userIDPattern.test(userID)) {
            return 'ユーザーIDは、文字、数字、アンダースコア、ドットのみ使用できます。';
        }
        if (forbiddenUserIDs.includes(userID.toLowerCase())) {
            return `ユーザーID"${userID}"は使用できません。`;
        }

        const userIDQuery = query(collection(db, 'users'), where('userID', '==', userID));
        const userIDSnapshot: QuerySnapshot<DocumentData> = await getDocs(userIDQuery);

        if (!userIDSnapshot.empty) {
            return "ユーザーIDは既に存在します。";
        }

        return null;
    };

    const handleNext = async () => {
        if (current === 0) {
            const validationError = await validateUserID(userID);
            if (validationError) {
                showToast(validationError, "error");
                return;
            }
        }
        setCurrent(current + 1);
    };

    const handleRegister = async () => {
        try {
            const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
                displayName,
                email,
                userID
            });
            router.push(`/users/${userID}`);
        } catch (error) {
            showToast("登録中にエラーが発生しました。", "error");
        }
    };

    const handleGoogleSignIn = async () => {
        const validationError = await validateUserID(userID);
        if (validationError) {
            showToast(validationError, "error");
            return;
        }

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            setDisplayName(user.displayName || '');
            await setDoc(doc(db, 'users', user.uid), {
                displayName: user.displayName,
                email: user.email,
                userID: userID
            });
            router.push(`/users/${userID}`);
        } catch (error) {
            showToast("Googleでのサインアップ中にエラーが発生しました。", "error");
        }
    };

    const prev = () => {
        setCurrent(current - 1);
    };

    const stepsContent = [
        {
            title: 'ユーザーID',
            content: (
                <Form.Item
                    name="userID"
                    rules={[{ required: true, message: 'ユーザーIDを入力してください。' }]}
                >
                    <Input
                        value={userID}
                        onChange={(e) => setUserID(e.target.value)}
                        placeholder="ユーザーID"
                    />
                </Form.Item>
            )
        },
        {
            title: 'メールアドレスとパスワード',
            content: (
                <>
                    <Form.Item
                        name="email"
                        rules={[{ required: true, message: 'メールアドレスを入力してください。' }]}
                    >
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="メールアドレス"
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'パスワードを入力してください。' }]}
                    >
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="パスワード"
                        />
                    </Form.Item>
                </>
            )
        },
        {
            title: 'ユーザーネーム',
            content: (
                <Form.Item
                    name="displayName"
                    rules={[{ required: true, message: 'ユーザーネームを入力してください。' }]}
                >
                    <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="ユーザーネーム"
                    />
                </Form.Item>
            )
        }
    ];

    return (
        <div className="container mx-auto flex justify-center items-center min-h-screen">
            <Head>
                <title>Register</title>
            </Head>
            <Layout>
                <Card className="max-w-[400px]">
                    <Title level={3} className="mb-5 text-center">Register with</Title>
                    <Button onClick={handleGoogleSignIn} type="dashed" className="w-full" icon={<FcGoogle className="text-lg" />}>
                        Google
                    </Button>
                    <Divider><p className="font-normal text-sm text-gray-500">or</p></Divider>
                    <Steps current={current} className="mb-5">
                        {steps.map((item) => (
                            <Step key={item.title} title={item.title} description={item.description} />
                        ))}
                    </Steps>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleRegister}
                    >
                        {stepsContent[current].content}
                        <div className="flex justify-between mt-5">
                            {current > 0 && (
                                <Button onClick={prev} type="default">
                                    戻る
                                </Button>
                            )}
                            {current < steps.length - 1 && (
                                <Button onClick={handleNext} type="primary">
                                    次へ
                                </Button>
                            )}
                            {current === steps.length - 1 && (
                                <Button type="primary" htmlType="submit">
                                    登録
                                </Button>
                            )}
                        </div>
                    </Form>
                    <div className="mt-5 w-full text-center">
                        <p>
                            既にアカウントを持っていますか？
                            <Link href="/login" className="text-blue-500 hover:text-blue-500 hover:underline">
                                ログイン
                            </Link>
                        </p>
                    </div>
                </Card>
            </Layout>
        </div>
    );
};

export default Register;