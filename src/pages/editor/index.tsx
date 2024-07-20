import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import { db, auth, storage } from '@/firebase/firebaseConfig';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';
import {
    Input,
    Modal,
    Button,
    Tabs,
    message,
    Spin,
    Typography,
    Switch
} from 'antd';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Head from 'next/head';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import Body from '@/components/Body';
import { FiUpload, FiArrowRight } from 'react-icons/fi';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface MemoData {
    title: string;
    description: string;
    content: string;
    userId: string;
    imageUrl: string;
    visibility: string;
}

const Editor = () => {
    useAuthRedirect();
    const router = useRouter();
    const { id } = router.query;
    const [memoData, setMemoData] = useState<MemoData | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchMemo = async () => {
            if (typeof id === 'string') {
                setLoading(true);
                try {
                    const docRef = doc(db, 'memos', id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data() as MemoData;
                        if (data.userId !== currentUserId) {
                            router.push('/403');
                            return;
                        }
                        setMemoData(data);
                    } else {
                        console.log('No such document!');
                        setMemoData({
                            title: '',
                            description: '',
                            content: '',
                            userId: '',
                            imageUrl: '',
                            visibility: 'public'
                        });
                    }
                } catch (error) {
                    console.error('Error fetching memo:', error);
                    message.error('メモの取得中にエラーが発生しました。');
                } finally {
                    setLoading(false);
                }
            } else {
                setMemoData({
                    title: '',
                    description: '',
                    content: '',
                    userId: '',
                    imageUrl: '',
                    visibility: 'public'
                });
                setLoading(false);
            }
        };
        if (currentUserId) {
            fetchMemo();
        }
    }, [id, currentUserId]);

    const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        if (memoData) setMemoData({ ...memoData, content: e.target.value });
    };

    const handleTitleChange = (value: string) => {
        if (memoData) setMemoData({ ...memoData, title: value });
    };

    const handleDescriptionChange = (value: string) => {
        if (memoData) setMemoData({ ...memoData, description: value });
    };

    const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const image = e.target.files[0];
            const imageRef = ref(storage, `images/${uuidv4()}`);
            setIsUploading(true);
            try {
                await uploadBytes(imageRef, image);
                const url = await getDownloadURL(imageRef);
                if (memoData) setMemoData({ ...memoData, imageUrl: url });
                setIsImageModalOpen(true);
            } catch (error) {
                message.error('画像のアップロードに失敗しました。');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleVisibilityChange = (checked: boolean) => {
        if (memoData) setMemoData({ ...memoData, visibility: checked ? 'public' : 'private' });
    };

    const saveMemo = async () => {
        if (!memoData || !currentUserId) {
            message.error('ログインしてください。');
            return;
        }

        try {
            setIsSaving(true);
            if (id && typeof id === 'string' && memoData.userId) {
                // Update existing memo
                const docRef = doc(db, 'memos', id);
                await updateDoc(docRef, {
                    title: memoData.title,
                    description: memoData.description,
                    content: memoData.content,
                    imageUrl: memoData.imageUrl,
                    visibility: memoData.visibility,
                });
                message.success('メモが更新されました。');
            } else {
                // Create new memo
                await addDoc(collection(db, 'memos'), {
                    userId: currentUserId,
                    title: memoData.title,
                    description: memoData.description,
                    content: memoData.content,
                    imageUrl: memoData.imageUrl,
                    visibility: memoData.visibility ? 'public' : 'private',
                    createdAt: new Date(),
                });
                message.success('メモが保存されました。');
            }
            router.push(`/dashboard`);
        } catch (error) {
            console.error('メモの保存中にエラーが発生しました:', error);
            message.error('メモの保存中にエラーが発生しました。');
        } finally {
            setIsSaving(false);
        }
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const onCloseImageModal = () => {
        setIsImageModalOpen(false);
    };

    if (loading) return <div className="w-full min-h-screen flex justify-center items-center"><Spin size="large" /></div>;

    return (
        <Body>
            <Head>
                <title>Editor</title>
            </Head>
            {memoData && (
                <>
                    <div className="mb-5 flex items-center">
                        <div>
                            <Typography.Title
                                editable={{ onChange: handleTitleChange }}
                                level={1}
                                style={{ margin: 0 }}
                            >
                                {memoData.title || 'タイトルを編集'}
                            </Typography.Title>
                            <Typography.Title
                                editable={{ onChange: handleDescriptionChange }}
                                level={5}
                                style={{ margin: 0 }}
                            >
                                {memoData.description || '説明文を編集'}
                            </Typography.Title>
                        </div>
                        <div className="ml-auto hidden md:flex">
                            <Button onClick={saveMemo} className="w-full ml-1.5" type="primary">
                                保存する<FiArrowRight />
                            </Button>
                        </div>
                    </div>
                    <div className="mb-5 flex items-center space-x-1.5">
                        <Switch
                            checked={memoData.visibility === 'public'}
                            onChange={handleVisibilityChange}
                            defaultChecked
                        /><p>全体に公開する</p>
                    </div>
                    <div className="mb-5">
                        <Tabs defaultActiveKey="1">
                            <TabPane tab="マークダウン" key="1">
                                <TextArea
                                    value={memoData.content}
                                    onChange={handleContentChange}
                                    placeholder="マークダウンを入力..."
                                    className="markdown mb-2.5"
                                    autoSize={{ minRows: 10, maxRows: 20 }}
                                />
                                <Button onClick={openFileDialog} className="w-full" loading={isUploading} type="dashed" icon={<FiUpload />}>
                                    画像をアップロード
                                </Button>
                            </TabPane>
                            <TabPane tab="プレビュー" key="2">
                                <div className="markdown-body markdown">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {memoData.content}
                                    </ReactMarkdown>
                                </div>
                            </TabPane>
                        </Tabs>
                    </div>
                    <div className="flex md:hidden">
                        <Button onClick={saveMemo} className="w-full" type="primary">
                            {id ? '更新する' : '投稿する'}<FiArrowRight />
                        </Button>
                    </div>
                    <Modal
                        title="アップロードされた画像"
                        visible={isImageModalOpen}
                        onCancel={onCloseImageModal}
                        footer={null}
                        centered
                    >
                        <div className="flex">
                            <Input value={memoData.imageUrl} readOnly className="mr-2.5" />
                            <div className="ml-auto">
                                <Button onClick={() => navigator.clipboard.writeText(memoData.imageUrl)} type="primary">
                                    コピー
                                </Button>
                            </div>
                        </div>
                    </Modal>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        ref={fileInputRef}
                        className="hidden"
                    />
                </>
            )}
        </Body>
    );
};

export default Editor;