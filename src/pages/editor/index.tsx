import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import { db, auth, storage } from '@/firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';
import {
    Input,
    Modal,
    Button,
    Tabs,
    message,
    Spin,
    Radio,
    Row,
    Col,
    RadioChangeEvent,
} from 'antd';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Layout from '@/components/Layout';
import Head from 'next/head';
import useAuthRedirect from '@/hooks/useAuthRedirect';

const { TextArea } = Input;
const { TabPane } = Tabs;

const Editor = () => {
    useAuthRedirect();
    const [content, setContent] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [userId, setUserId] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [visibility, setVisibility] = useState<string>('public');

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
            message.error("ログインしてください。");
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
                visibility,
                createdAt: new Date(),
            });
            message.success("メモが保存されました。");
            setTitle('');
            setDescription('');
            setContent('');
            setImageUrl('');
            setVisibility('public');
            setIsAlertOpen(false);
        } catch (e) {
            if (e instanceof FirebaseError) {
                message.error("メモの保存中にエラーが発生しました。");
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
            try {
                await uploadBytes(imageRef, image);
                const url = await getDownloadURL(imageRef);
                setImageUrl(url);
                setIsImageModalOpen(true);
            } catch (error) {
                message.error("画像のアップロードに失敗しました。");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handlePublishClick = () => {
        if (!title || !description || !content) {
            message.error("タイトル、説明欄、メモの中身が空欄です。");
        } else {
            setIsAlertOpen(true);
        }
    };

    const onCloseAlert = () => {
        setIsAlertOpen(false);
    };

    const onCloseImageModal = () => {
        setIsImageModalOpen(false);
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const handleVisibilityChange = (e: RadioChangeEvent) => {
        setVisibility(e.target.value);
    };

    if (loading) return <div className="w-full min-h-screen flex justify-center items-center"><Spin size="large" /></div>;

    return (
        <div className="container mx-auto my-10">
            <Head>
                <title>Editor</title>
            </Head>
            <Layout>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Input
                            type="text"
                            value={title}
                            onChange={handleTitleChange}
                            placeholder="タイトルを入力"
                        />
                    </Col>
                    <Col span={24}>
                        <Input
                            value={description}
                            onChange={handleDescriptionChange}
                            placeholder="説明を入力"
                            className="mb-5"
                        />
                    </Col>
                    <Col span={24}>
                        <Radio.Group onChange={handleVisibilityChange} value={visibility}>
                            <Radio value="public">Public</Radio>
                            <Radio value="private">Private</Radio>
                        </Radio.Group>
                    </Col>
                    <Col span={24}>
                        <Tabs defaultActiveKey="1">
                            <TabPane tab="マークダウン" key="1">
                                <div className="space-y-3">
                                    <TextArea
                                        value={content}
                                        onChange={handleContentChange}
                                        placeholder="メモの内容を入力..."
                                        className="markdown"
                                        autoSize={{ minRows: 10, maxRows: 20 }}
                                    />
                                    <Button onClick={openFileDialog} className="w-full" loading={isUploading} type="dashed">
                                        Upload Image
                                    </Button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        ref={fileInputRef}
                                        className="hidden"
                                    />
                                </div>
                            </TabPane>
                            <TabPane tab="プレビュー" key="2">
                                <div className="markdown-body markdown">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {content}
                                    </ReactMarkdown>
                                </div>
                            </TabPane>
                        </Tabs>
                    </Col>
                    <Col span={24}>
                        <Button onClick={handlePublishClick} className="w-full mt-5" type="primary">
                            Publish
                        </Button>
                    </Col>
                </Row>
            </Layout>

            <Modal
                title="メモを投稿する"
                visible={isAlertOpen}
                onOk={saveMemo}
                onCancel={onCloseAlert}
                okButtonProps={{ loading: isSaving }}
                okText="Publish"
                centered
            >
                <p>このメモを投稿しますか？</p>
            </Modal>

            <Modal
                title="アップロードされた画像"
                visible={isImageModalOpen}
                onCancel={onCloseImageModal}
                footer={null}
                centered
            >
                <div className="flex">
                    <Input value={imageUrl} readOnly className="mr-2.5" />
                    <div className="ml-auto">
                        <Button onClick={() => navigator.clipboard.writeText(imageUrl)} type="primary">
                            Copy
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Editor;