import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { db, auth } from '@/firebase/firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import LikeButton from '@/components/LikeButton';
import Comments from '@/components/Comments';
import BookmarkButton from '@/components/BookmarkButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Head from 'next/head';
import { FiMoreVertical, FiTrash, FiType } from "react-icons/fi";
import { Menu, Dropdown, Button, Modal, Input, message, Spin, Divider, Avatar } from 'antd';
import Layout from '@/components/Layout';
import { onAuthStateChanged } from 'firebase/auth';
import Body from '@/components/Body';
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
            <Menu.Item onClick={showEditModal} icon={<FiType />}>
                編集
            </Menu.Item>
            <Menu.Item onClick={showDeleteModal} icon={<FiTrash />} danger>
                削除
            </Menu.Item>
        </Menu>
    );

    if (loading) return <div className="w-full min-h-screen flex justify-center items-center"><Spin size="large" /></div>;

    return (
        <>
            {memoData && (
                <Head>
                    <title>{memoData.title}</title>
                </Head>
            )}
            <Body>
                {memoData && (
                    <>
                        <div className="flex flex-col space-y-1.5">
                            <div className="flex items-center">
                                <p className="text-[32px] font-semibold">{memoData.title}</p>
                                {memoData.userId === currentUserId && (
                                    <div className='ml-auto'>
                                        <Dropdown overlay={menu} trigger={['click']}>
                                            <Button icon={<FiMoreVertical />} />
                                        </Dropdown>
                                    </div>
                                )}
                            </div>
                            {memoData.userId !== currentUserId && authorData && (
                                <Link href={`/u/${authorData.userID}`} className="flex items-center">
                                    <Avatar src={authorData.photoURL} size="small" />
                                    <p className="text-sm ml-1.5 text-blue-500">@{authorData.userID}</p>
                                </Link>
                            )}
                            <p className="text-md">{memoData.description}</p>
                        </div>

                    </>
                )}
                    <Divider />
                    <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {memoData ? memoData.content : ''}
                        </ReactMarkdown>
                    </div>
                <Divider />
                <>
                    {typeof id === 'string' && (
                        <>
                            <div className="flex items-center">
                                <LikeButton memoId={id} />
                                <BookmarkButton memoId={id} />
                            </div>
                            <Comments memoId={id} />
                        </>
                    )}
                </>
            </Body>
            <Modal
                title="メモの編集"
                visible={isEditModalOpen}
                onOk={handleEditOk}
                onCancel={handleEditCancel}
                okButtonProps={{ loading: isSaving }}
                okText="Save"
                centered
            >
                <div className="space-y-2.5">
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="タイトル"/>
                    <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="説明"/>
                    <TextArea value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="内容" rows={10}/>
                </div>
            </Modal>
            <Modal
                title="メモを削除する"
                visible={isDeleteModalOpen}
                onOk={handleDeleteOk}
                onCancel={handleDeleteCancel}
                okButtonProps={{ danger: true, loading: isDeleting }}
                okText="Delete"
                centered
            >
                この操作は取り消せません。
            </Modal>
        </>
    );
};

export default Memo;