import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Avatar, VStack, HStack, Divider, Spinner } from '@chakra-ui/react';
import NextLink from 'next/link';
import { Empty, Input, Button, message, Dropdown, Menu, Space } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';

interface Comment {
    id: string;
    memoId: string;
    userId: string;
    text: string;
    createdAt: any;
    displayName?: string;
    photoURL?: string;
    userID?: string;
}

interface CommentsProps {
    memoId: string;
}

const Comments = ({ memoId }: CommentsProps) => {
    const [comment, setComment] = useState<string>('');
    const [comments, setComments] = useState<Comment[]>([]);
    const [displayName, setDisplayName] = useState<string>('匿名');
    const [photoURL, setPhotoURL] = useState<string>('/default-avatar.png');
    const [loading, setLoading] = useState<boolean>(false);
    const [commentsLoaded, setCommentsLoaded] = useState<boolean>(false);
    const currentUser = auth.currentUser;

    const showMessage = (content: string, type: "success" | "error" | "loading") => {
        if (type === "loading") {
            return message.loading(content, 0);
        } else {
            message[type](content);
        }
    };

    const fetchUserDetails = async (userId: string) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                    displayName: userData.displayName || '匿名',
                    photoURL: userData.photoURL || '/default-avatar.png',
                    userID: userData.userID || userId
                };
            }
        } catch (error) {
            console.error("ユーザー情報の取得中にエラーが発生しました。", error);
        }
        return {
            displayName: '匿名',
            photoURL: '/default-avatar.png',
            userID: userId
        };
    };

    const fetchComments = async () => {
        try {
            const q = query(collection(db, 'comments'), where('memoId', '==', memoId));
            const querySnapshot = await getDocs(q);
            const fetchedComments: Comment[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }) as Comment);
            const commentsWithUserDetails = await Promise.all(fetchedComments.map(async (comment) => {
                const userDetails = await fetchUserDetails(comment.userId);
                return {
                    ...comment,
                    ...userDetails
                };
            }));
            setComments(commentsWithUserDetails);
            setCommentsLoaded(true);
        } catch (error) {
            showMessage("コメントの取得中にエラーが発生しました。", "error");
        }
    };

    useEffect(() => {
        if (currentUser) {
            const setUserDetails = async () => {
                const userDetails = await fetchUserDetails(currentUser.uid);
                setDisplayName(userDetails.displayName);
                setPhotoURL(userDetails.photoURL);
            };
            setUserDetails();
        }
        fetchComments();
    }, [memoId, currentUser]);

    const handleComment = async () => {
        if (!comment.trim()) {
            showMessage("コメントを入力してください。", "error");
            return;
        }

        setLoading(true);
        try {
            if (!currentUser) return;
            await addDoc(collection(db, 'comments'), {
                memoId,
                userId: currentUser.uid,
                text: comment,
                createdAt: serverTimestamp()
            });
            setComment('');
            fetchComments();
            showMessage("コメントが送信されました。", "success");
        } catch (error) {
            showMessage("コメントの送信中にエラーが発生しました。", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        const hide = showMessage("コメントを削除中...", "loading");
        if (typeof hide === 'function') {
            try {
                await deleteDoc(doc(db, 'comments', commentId));
                setComments(comments.filter(c => c.id !== commentId));
                hide(); // Hide the loading message
            } catch (error) {
                hide(); // Hide the loading message even if there's an error
                showMessage("コメントの削除中にエラーが発生しました。", "error");
            }
        }
    };

    return (
        <div className="w-full">
            {currentUser && (
                <div className="flex space-x-2.5 my-5">
                    <Input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="コメントを入力"
                    />
                    <Button onClick={handleComment} type="primary" loading={loading}>
                        送信する
                    </Button>
                </div>
            )}
            <div className="space-y-2.5">
                {commentsLoaded && comments.length === 0 ? (
                    <div className="w-full flex justify-center">
                        <Empty description="No comments yet." />
                    </div>
                ) : (
                    comments.map((c, index) => (
                        <>
                            <div key={c.id} className="w-full flex">
                                <div className="flex items-center mr-2.5">
                                    <NextLink href={`/${c.userID}`} passHref>
                                        <Avatar src={c.photoURL} name={c.displayName} size="md" />
                                    </NextLink>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <NextLink href={`/${c.userID}`} passHref>
                                                <p className="font-bold text-sm">{c.displayName}</p>
                                            </NextLink>
                                            <p className="ml-2.5 text-xs text-gray-500 opacity-50">{new Date(c.createdAt.seconds * 1000).toLocaleString()}</p>
                                        </div>
                                        {currentUser?.uid === c.userId && (
                                            <Dropdown
                                                overlay={(
                                                    <Menu>
                                                        <Menu.Item onClick={() => handleDeleteComment(c.id)}>
                                                            削除
                                                        </Menu.Item>
                                                    </Menu>
                                                )}
                                                trigger={['click']}
                                            >
                                                <Button type="text" icon={<EllipsisOutlined />} className="ml-auto" />
                                            </Dropdown>
                                        )}
                                    </div>
                                    <p className="text-sm">{c.text}</p>
                                </div>
                            </div>
                            {index < comments.length - 1 && <Divider />}
                        </>
                    ))
                )}
            </div>
        </div>
    );
};

export default Comments;