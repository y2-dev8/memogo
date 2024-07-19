import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import LikeButton from '@/components/LikeButton';
import Comments from '@/components/Comments';
import BookmarkButton from '@/components/BookmarkButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Head from 'next/head';
import { FiMoreVertical, FiTrash, FiType } from "react-icons/fi";
import { Menu, Dropdown, Button, Modal, Input, message, Spin, Avatar, Card, Alert } from 'antd';
import { onAuthStateChanged } from 'firebase/auth';
import Body from '@/components/Body';
import Link from 'next/link';

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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [isDeleting, setIsDeleting] = useState(false);

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
                router.push('/dashboard');
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
            <Menu.Item icon={<FiType />}>
                <Link href={`/editor?id=${id}`}>
                    編集
                </Link>
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
                    <Card className="mb-10">
                        <div className="flex items-center justify-between">
                            <p className="text-[32px] font-semibold">{memoData.title}</p>
                            <div>
                            {memoData.userId === currentUserId && (
                                <Dropdown overlay={menu} trigger={['click']}>
                                    <Button icon={<FiMoreVertical />} className="ml-1.5" />
                                </Dropdown>
                            )}
                            </div>
                        </div>
                        {memoData.userId !== currentUserId && authorData && (
                            <Link href={`/u/${authorData.userID}`} className="flex items-center mt-2.5">
                                <Avatar src={authorData.photoURL} size="small" />
                                <p className="text-sm ml-1.5 text-blue-500">@{authorData.userID}</p>
                            </Link>
                        )}
                        <p className="text-md mt-1.5 mb-[32px]">{memoData.description}</p>
                        <div className="markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {memoData.content}
                            </ReactMarkdown>
                        </div>
                        <div className="flex items-center mt-[32px]">
                            <LikeButton memoId={id as string} />
                            <BookmarkButton memoId={id as string} />
                        </div>
                    </Card>
                )}
                <Card title="コメント">
                    {/* <div className="mb-5 flex flex-col md:flex-row text-center items-center justify-center opacity-50">
                        <img src="https://opendoodles.s3-us-west-1.amazonaws.com/jumping.svg" className="w-64" />
                        <p className="text-xl font-bold">記事に関するコメントをしましょう</p>
                    </div> */}
                    {typeof id === 'string' && (
                        <>
                            <Comments memoId={id} />
                        </>
                    )}
                </Card>
            </Body>
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