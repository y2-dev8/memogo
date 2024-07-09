import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/firebaseConfig';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, UserCredential } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { Button, Heading, Input, Link, Text, useToast, Box } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import NextLink from "next/link";
import { FaGoogle } from "react-icons/fa";
import Head from 'next/head';
import {
    Step,
    StepDescription,
    StepIcon,
    StepIndicator,
    StepNumber,
    StepSeparator,
    StepStatus,
    StepTitle,
    Stepper,
    useSteps
} from '@chakra-ui/react';

const steps = [
    { title: 'First', description: 'ユーザーネーム' },
    { title: 'Second', description: 'ユーザーID' },
    { title: 'Third', description: 'メールアドレスとパスワード' },
];

const Register = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [displayName, setDisplayName] = useState<string>('');
    const [userID, setUserID] = useState<string>('');
    const router = useRouter();
    const toast = useToast();

    const showToast = (title: string, status: "success" | "error") => {
        toast({
            title,
            status,
            duration: 5000,
            isClosable: true,
        });
    };

    const { activeStep, setActiveStep } = useSteps({
        index: 0,
        count: steps.length,
    });

    const forbiddenUserIDs: string[] = [
        'register', 'login', 'settings', 'support', 'memo',
        'feed', 'editor', 'search', 'index', 'following', 'bookmarks', 'router'
    ];

    const validateUserID = (userID: string): string | null => {
        const userIDPattern = /^[a-zA-Z0-9_.]+$/;
        if (!userIDPattern.test(userID)) {
            return 'ユーザーIDは、文字、数字、アンダースコア、ドットのみ使用できます。';
        }
        if (forbiddenUserIDs.includes(userID.toLowerCase())) {
            return `ユーザーID"${userID}"は使用できません。`;
        }
        return null;
    };

    const handleRegister = async () => {
        const validationError = validateUserID(userID);
        if (validationError) {
            toast({
                title: 'エラー',
                description: validationError,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        try {
            const userIDQuery = query(collection(db, 'users'), where('userID', '==', userID));
            const userIDSnapshot: QuerySnapshot<DocumentData> = await getDocs(userIDQuery);

            if (!userIDSnapshot.empty) {
                showToast("ユーザーIDは既に存在します。", "error");
                return;
            }

            const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
                displayName,
                email,
                userID
            });
            router.push('/');
        } catch (error) {
            showToast("登録中にエラーが発生しました。", "error");
        }
    };

    const handleGoogleSignIn = async () => {
        const validationError = validateUserID(userID);
        if (validationError) {
            showToast(validationError, "error");
            return;
        }

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            await setDoc(doc(db, 'users', user.uid), {
                displayName: user.displayName,
                email: user.email,
                userID: userID
            });
            router.push('/');
        } catch (error) {
            showToast("Googleでのサインアップ中にエラーが発生しました。", "error")
        }
    };

    const handleNextStep = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handlePreviousStep = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    return (
        <div className="container mx-auto my-10">
            <Head>
                <title>Register</title>
            </Head>
            <Layout>
                <Heading size="lg" className="mb-5">アカウント登録</Heading>
                <Box className='hidden md:block mb-5'>
                    <Stepper index={activeStep}>
                        {steps.map((step, index) => (
                            <Step key={index}>
                                <StepIndicator>
                                    <StepStatus
                                        complete={<StepIcon />}
                                        incomplete={<StepNumber />}
                                        active={<StepNumber />}
                                    />
                                </StepIndicator>

                                <Box flexShrink='0'>
                                    <StepTitle>{step.title}</StepTitle>
                                    <StepDescription>{step.description}</StepDescription>
                                </Box>

                                <StepSeparator />
                            </Step>
                        ))}
                    </Stepper>
                </Box>
                <div className="space-y-3 mb-5">
                    {activeStep === 0 && (
                        <Input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="ユーザーネーム"
                            className="w-full"
                        />
                    )}
                    {activeStep === 1 && (
                        <Input
                            type="text"
                            value={userID}
                            onChange={(e) => setUserID(e.target.value)}
                            placeholder="ユーザーID"
                            className="w-full"
                            isRequired
                        />
                    )}
                    {activeStep === 2 && (
                        <>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="メールアドレス"
                                className="w-full"
                            />
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="パスワード"
                                className="w-full"
                            />
                        </>
                    )}
                </div>
                <div className="flex flex-col md:flex-row mb-5">
                    <div className="flex mb-3 md:mb-0 space-x-3 md:mr-3">
                        {activeStep > 0 && (
                            <Button onClick={handlePreviousStep} variant="outline" className="w-full md:w-auto">
                                戻る
                            </Button>
                        )}
                        {activeStep < steps.length - 1 && (
                            <Button onClick={handleNextStep} colorScheme='teal' className="w-full md:w-auto">
                                次へ
                            </Button>
                        )}
                        {activeStep === steps.length - 1 && (
                            <Button onClick={handleRegister} colorScheme='teal' className="w-full md:w-auto">
                                登録
                            </Button>
                        )}
                    </div>
                    <Button onClick={handleGoogleSignIn} colorScheme='gray' leftIcon={<FaGoogle className="text-slate-300" />}>
                        Googleと連携する
                    </Button>
                </div>
                <Text>
                    既にアカウントを持っていますか？{' '}
                    <Link color="blue.500">
                        <NextLink href="/login">
                            ログイン
                        </NextLink>
                    </Link>
                </Text>
            </Layout>
        </div>
    );
};

export default Register;