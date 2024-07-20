import { useState, useEffect } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import Body from '@/components/Body';
import Head from 'next/head';
import { Spin, Avatar, Button } from 'antd';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import useAuthState from '@/hooks/useAuthState';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { FiEye } from 'react-icons/fi';

interface Memo {
    title: string;
    description: string;
    uid: string;
    userId: string;
    createdAt: any;
    photoURL: string;
    displayName: string;
}

const getEmojiForTitle = (title: string) => {
    const length = title.length;
    if (length <= 5) return '😃';
    if (length <= 10) return '😄';
    if (length <= 15) return '😁';
    if (length <= 20) return '😊';
    if (length <= 25) return '😇';
    if (length <= 30) return '😉';
    if (length <= 35) return '😍';
    if (length <= 40) return '😘';
    if (length <= 45) return '😗';
    if (length <= 50) return '🤗';
    if (length <= 55) return '🤔';
    if (length <= 60) return '😐';
    if (length <= 65) return '😑';
    if (length <= 70) return '😶';
    if (length <= 75) return '😏';
    if (length <= 80) return '😒';
    if (length <= 85) return '😞';
    if (length <= 90) return '😔';
    if (length <= 95) return '😕';
    return '😢';
};

const BookmarkedMemos = () => {
    useAuthRedirect();
    const { user, loading, error } = useAuthState();
    const [memos, setMemos] = useState<Memo[]>([]);
    const [loadingMemos, setLoadingMemos] = useState(true);

    const fetchBookmarkedMemos = async (userId: string) => {
        const q = query(collection(db, 'bookmarks'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const bookmarkedMemos: Memo[] = [];

        for (let bookmarkDoc of querySnapshot.docs) {
            const memoId = bookmarkDoc.data().memoId;
            const memoDocRef = doc(db, 'memos', memoId);
            const memoDoc = await getDoc(memoDocRef);
            if (memoDoc.exists()) {
                const memoData = memoDoc.data() as Memo;
                memoData.uid = memoId;

                if (memoData.userId) {
                    const userDocRef = doc(db, 'users', memoData.userId);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        memoData.photoURL = userData.photoURL || '/default-avatar.png';
                        memoData.displayName = userData.displayName || 'Anonymous';
                    }
                }
                bookmarkedMemos.push(memoData);
            }
        }

        setMemos(bookmarkedMemos);
        setLoadingMemos(false);
    };

    useEffect(() => {
        if (user) {
            setLoadingMemos(true);
            fetchBookmarkedMemos(user.uid);
        }
    }, [user]);

    const formatDate = (date: any) => {
        return formatDistanceToNow(date.toDate(), { addSuffix: true, locale: ja });
    };

    if (loading || loadingMemos) return <div className="w-full min-h-screen flex justify-center items-center"><Spin size="large" /></div>;

    if (error) {
        return <div className="w-full min-h-screen flex justify-center items-center">{error}</div>;
    }

    return (
        <Body>
            <Head>
                <title>Bookmarks</title>
            </Head>
            {memos.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center">
                    <img src="/m/books2.png" className="w-64" />
                    <p className="text-xl opacity-50 font-bold">記事をブックマークしましょう</p>
                    <Button type="dashed" className="mt-5">
                        <Link href="/search">
                            記事を検索
                        </Link>
                    </Button>
                </div>
            ) : (
                <>
                <p className="text-[32px] font-bold mb-5">ブックマーク</p>
                <div className="space-y-5">
                    {memos.map((memo, index) => (
                        <div className="flex" key={index}>
                            <div>
                            <Link href={`/article?id=${memo.uid}`} className="select-none mr-2.5 bg-blue-100 w-20 h-20 rounded-xl flex items-center justify-center text-[32px]">
                                {getEmojiForTitle(memo.title)}
                            </Link>
                            </div>
                            <div>
                                <Link href={`/article?id=${memo.uid}`}>
                                    <p className="text-lg font-semibold text-black hover:text-black">{memo.title}</p>
                                </Link>
                                <div className="flex mt-1.5 space-x-[10px] items-center">
                                    <Link href={`/u/${memo.userId}`} className="flex items-center">
                                        <Avatar src={memo.photoURL} size="default" />
                                        <p className="text-xs ml-[5px] text-black hover:text-black">{memo.displayName}</p>
                                    </Link>
                                    <p className="text-xs">{formatDate(memo.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                </>
            )}
        </Body>
    );
};

export default BookmarkedMemos;