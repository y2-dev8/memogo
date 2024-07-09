import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import { db, auth, storage } from '@/firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';
import {
    Button,
    Input,
    Textarea,
    useClipboard,
    useToast,
    Spinner,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Text
} from '@chakra-ui/react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Layout from '@/components/Layout';
import Head from 'next/head';
import useAuthRedirect from '@/hooks/useAuthRedirect';

const Editor = () => {
    useAuthRedirect();
    const [content, setContent] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [userId, setUserId] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const { onCopy, hasCopied } = useClipboard(imageUrl);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const toast = useToast();
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const cancelRef = useRef<HTMLButtonElement>(null);

    const showToast = (title: string, status: "success" | "error") => {
        toast({
            title,
            status,
            duration: 5000,
            isClosable: true,
        });
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                setUserId(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const saveMemo = async () => {
        if (!userId) {
            showToast("ログインしてください。", "error");
            return;
        }

        try {
            setIsSaving(true);
            await addDoc(collection(db, 'memos'), {
                userId,
                title,
                description,
                content,
                imageUrl,
                createdAt: new Date(),
            });
            showToast("メモが保存されました!", "success");
            setTitle('');
            setDescription('');
            setContent('');
            setImageUrl('');
            setIsAlertOpen(false);
        } catch (e) {
            if (e instanceof FirebaseError) {
                showToast("メモの保存中にエラーが発生しました。", "error");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const handleDescriptionChange = (e: ChangeEvent<HTMLInputElement>) => {
        setDescription(e.target.value);
    };

    const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const image = e.target.files[0];
            const imageRef = ref(storage, `images/${uuidv4()}`);
            setIsUploading(true);
            await uploadBytes(imageRef, image);
            const url = await getDownloadURL(imageRef);
            setImageUrl(url);
            setIsUploading(false);
            setIsImageModalOpen(true);
        }
    };

    const handlePublishClick = () => {
        if (!title || !description || !content) {
            showToast("タイトル、説明欄、メモの中身が空欄です。", "error");
        } else {
            setIsAlertOpen(true);
        }
    };

    const onCloseAlert = () => {
        setIsAlertOpen(false);
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const onCloseImageModal = () => {
        setIsImageModalOpen(false);
    };

    if (loading) return <div className="w-full min-h-screen flex justify-center items-center"><Spinner size="xl" /></div>;

    return (
        <div className="container mx-auto my-10">
            <Head>
                <title>Editor</title>
            </Head>
            <Layout>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    className="hidden"
                />
                <h1 className="top-emoji">🥨</h1>
                <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    className="input-title"
                    placeholder="タイトルを入力..."
                />
                <input
                    value={description}
                    onChange={handleDescriptionChange}
                    className="input-description"
                    placeholder="説明を入力..."
                />
                <Tabs variant='soft-rounded' colorScheme='blue' size="sm">
                    <div className="flex items-center">
                        <TabList>
                            <Tab>マークダウン</Tab>
                            <Tab>プレビュー</Tab>
                        </TabList>
                    </div>
                    <TabPanels>
                        <TabPanel padding="15px 0">
                            <div className="space-y-3">
                                <textarea
                                    value={content}
                                    onChange={handleContentChange}
                                    placeholder="メモの内容を入力..."
                                    className="markdown"
                                />
                                <Button onClick={openFileDialog} className="w-full" disabled={isUploading} variant="outline">
                                    {isUploading ? <><Spinner size="sm" className="mr-2.5" />アップロード中...</> : '画像をアップロード'}
                                </Button>
                            </div>
                        </TabPanel>
                        <TabPanel padding="15px 0">
                            <div className="markdown-body markdown">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {content}
                                </ReactMarkdown>
                            </div>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
                <div className="w-auto flex">
                    <button onClick={handlePublishClick} disabled={isSaving} className="w-full blue-button">
                        {isSaving ? <Spinner size="sm" /> : '投稿する'}
                    </button>
                </div>
            </Layout>

            <AlertDialog
                isOpen={isAlertOpen}
                leastDestructiveRef={cancelRef}
                onClose={onCloseAlert}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            メモを投稿する
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            このメモを投稿してもよろしいですか？
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onCloseAlert}>
                                キャンセル
                            </Button>
                            <button className="ml-3 blue-button" onClick={saveMemo} disabled={isSaving}>
                                {isSaving ? <Spinner size="sm" /> : '投稿する'}
                            </button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            <Modal isOpen={isImageModalOpen} onClose={onCloseImageModal} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>アップロードされた画像</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <div className="flex">
                            <Input value={imageUrl} className="max-w-[70%]" isReadOnly/>
                            <div className="ml-auto">
                                <button onClick={onCopy} className="blue-button">
                                    {hasCopied ? 'コピー済み' : 'コピーする'}
                                </button>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Text className="text-red-500 text-xs">URLの悪用は禁止されています。</Text>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

export default Editor;