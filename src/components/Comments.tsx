import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Avatar, VStack, HStack, Divider, Spinner } from '@chakra-ui/react';
import NextLink from 'next/link';
import { Empty, Input, Button, message } from 'antd';

interface Comment {
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

    const showMessage = (content: string, type: "success" | "error") => {
        message[type](content);
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
            const fetchedComments: Comment[] = querySnapshot.docs.map(doc => doc.data() as Comment);
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
            <div className="space-y-[10px]">
                {commentsLoaded && comments.length === 0 ? (
                    <div className="w-full flex justify-center">
                        <Empty description="No comments yet." />
                    </div>
                ) : (
                    comments.map((c, index) => (
                        <>
                        <div key={index}>
                            <div className="w-full flex">
                                <div className="flex items-center mr-2.5">
                                    <NextLink href={`/${c.userID}`} passHref>
                                        <Avatar src={c.photoURL} name={c.displayName} size="md" />
                                    </NextLink>
                                </div>
                                <div>
                                    <div className="flex items-center">
                                        <NextLink href={`/${c.userID}`} passHref>
                                            <p className="font-bold text-sm">{c.displayName}</p>
                                        </NextLink>
                                        <p className="ml-2.5 text-xs text-gray-500 opacity-50">{new Date(c.createdAt.seconds * 1000).toLocaleString()}</p>
                                    </div>
                                    <p>{c.text}</p>
                                </div>
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