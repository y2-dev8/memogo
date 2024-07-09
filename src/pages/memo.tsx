import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { db, auth } from '@/firebase/firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import LikeButton from '../components/LikeButton';
import Comments from '../components/Comments';
import BookmarkButton from '../components/BookmarkButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Head from 'next/head';
import { DownOutlined } from '@ant-design/icons';
import {
    Heading,
    Text,
    Divider,
    Avatar,
    HStack,
    VStack,
    Spinner,
    Box
} from '@chakra-ui/react';
import { Menu, Dropdown, Button, Modal, Input, message } from 'antd';
import Layout from '@/components/Layout';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

const { TextArea } = Input;

interface MemoData {
    title: string;
    description: string;
    content: string;
    userId: string;
}

interface UserData {
    displayName: string;
    photoURL: string;
    userID: string;
}

const Memo = () => {
    const router = useRouter();
    const { id } = router.query;
    const [memoData, setMemoData] = useState<MemoData | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [authorData, setAuthorData] = useState<UserData | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editContent, setEditContent] = useState('');
    const [loading, setLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const showEditModal = () => {
        if (memoData) {
            setEditTitle(memoData.title);
            setEditDescription(memoData.description);
            setEditContent(memoData.content);
            setIsEditModalOpen(true);
        }
    };

    const handleEditOk = async () => {
        try {
            if (typeof id === 'string' && memoData) {
                setIsSaving(true);
                const docRef = doc(db, 'memos', id);
                await updateDoc(docRef, { title: editTitle, description: editDescription, content: editContent });
                setMemoData({ ...memoData, title: editTitle, description: editDescription, content: editContent });
                message.success('メモが更新されました。');
                setIsEditModalOpen(false);
            }
        } catch (error) {
            console.error('メモの更新中にエラーが発生しました:', error);
            message.error('メモの更新中にエラーが発生しました。');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditCancel = () => {
        setIsEditModalOpen(false);
    };

    const showDeleteModal = () => {
        setIsDeleteModalOpen(true);
    };

    const handleDeleteOk = async () => {
        try {
            if (typeof id === 'string') {
                setIsDeleting(true);
                const docRef = doc(db, 'memos', id);
                await deleteDoc(docRef);
                message.success('メモが削除されました。');
                setIsDeleteModalOpen(false);
                router.push('/feed');
            }
        } catch (error) {
            console.error('メモの削除中にエラーが発生しました:', error);
            message.error('メモの削除中にエラーが発生しました。');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalOpen(false);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchMemo = async () => {
            setLoading(true);
            try {
                if (typeof id === 'string') {
                    const docRef = doc(db, 'memos', id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data() as MemoData;
                        setMemoData(data);
                    } else {
                        console.log('No such document!');
                    }
                } else {
                    console.log('Invalid ID type');
                }
            } catch (error) {
                console.error('Error fetching memo:', error);
                message.error('メモの取得中にエラーが発生しました。');
            } finally {
                setLoading(false);
            }
        };
        fetchMemo();
    }, [id]);

    useEffect(() => {
        const fetchAuthorData = async () => {
            if (memoData && memoData.userId) {
                try {
                    const userDocRef = doc(db, 'users', memoData.userId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data() as UserData;
                        setAuthorData(userData);
                    } else {
                        console.log('No such user document!');
                    }
                } catch (error) {
                    console.error('Error fetching author data:', error);
                    message.error('著者情報の取得中にエラーが発生しました。');
                }
            }
        };
        fetchAuthorData();
    }, [memoData]);

    const menu = (
        <Menu>
            <Menu.Item onClick={showEditModal}>
                編集
            </Menu.Item>
            <Menu.Item onClick={showDeleteModal}>
                削除
            </Menu.Item>
        </Menu>
    );

    if (loading) return <div className="w-full min-h-screen flex justify-center items-center"><Spinner size="xl" /></div>;

    return (
        <>
            {memoData && (
                <Head>
                    <title>{memoData.title}</title>
                </Head>
            )}
            <div className='container mx-auto my-10'>
                {memoData && (
                    <Layout>
                        <div className="flex flex-col mb-5 justify-center text-center">
                            <Heading className="mb-2.5">{memoData.title}</Heading>
                            <Text>{memoData.description}</Text>
                            {memoData.userId !== currentUserId && authorData && (
                                <Box className="p-3 w-full rounded-md mt-5 border">
                                    <HStack spacing={3} align="center">
                                        <Link href={`/${authorData.userID}`} passHref>
                                            <Avatar src={authorData.photoURL} name={authorData.displayName} size="md" />
                                        </Link>
                                        <VStack align="start" spacing={0}>
                                            <Link href={`/${authorData.userID}`} passHref>
                                                <Text fontWeight="bold">{authorData.displayName}</Text>
                                            </Link>
                                        </VStack>
                                    </HStack>
                                </Box>
                            )}
                        </div>
                        {memoData.userId === currentUserId && (
                            <div className='my-5 flex justify-end'>
                                <Dropdown overlay={menu} trigger={['click']}>
                                    <Button>
                                        詳細<DownOutlined />
                                    </Button>
                                </Dropdown>
                                <Modal
                                    title="メモの編集"
                                    visible={isEditModalOpen}
                                    onOk={handleEditOk}
                                    onCancel={handleEditCancel}
                                    okButtonProps={{ loading: isSaving }}
                                    okText="Save"
                                >
                                    <div className="space-y-2.5">
                                        <Input
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            placeholder="タイトル"
                                        />
                                        <Input
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="説明"
                                        />
                                        <TextArea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            placeholder="内容"
                                            rows={10}
                                        />
                                    </div>
                                </Modal>
                                <Modal
                                    title="メモの削除"
                                    visible={isDeleteModalOpen}
                                    onOk={handleDeleteOk}
                                    onCancel={handleDeleteCancel}
                                    okButtonProps={{ danger: true, loading: isDeleting }}
                                    okText="Delete"
                                >
                                    本当にこのメモを削除してもよろしいですか？ この操作は取り消せません。
                                </Modal>
                            </div>
                        )}
                    </Layout>
                )}
                <Layout>
                    <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {memoData ? memoData.content : ''}
                        </ReactMarkdown>
                    </div>
                </Layout>
                <Divider className='my-10' />
                <Layout>
                    {typeof id === 'string' && (
                        <div>
                            <LikeButton memoId={id} />
                            <BookmarkButton memoId={id} />
                            <Comments memoId={id} />
                        </div>
                    )}
                </Layout>
            </div>
        </>
    );
};

export default Memo;