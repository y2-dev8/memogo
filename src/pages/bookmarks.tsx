import { useState, useEffect } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import Body from '@/components/Body';
import Head from 'next/head';
import { Typography, Spin, List, Card, Empty } from 'antd';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import useAuthState from '@/hooks/useAuthState';

const { Title, Text } = Typography;

interface Memo {
    title: string;
    description: string;
    uid: string;
}

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
                    <div className="flex flex-col justify-center text-center">
                        <img src="https://opendoodles.s3-us-west-1.amazonaws.com/reading.svg" className="h-60 opacity-50 mb-5" />
                        <p className="text-lg opacity-50 font-semibold">メモをブックマークしましょう</p>
                    </div>
                ) : (
                    <List
                        grid={{ gutter: 16, column: 1 }}
                        dataSource={memos}
                        renderItem={memo => (
                            <List.Item>
                                <Link href={`/article?id=${memo.uid}`}>
                                    <Card title={memo.title}>
                                        <Card.Meta
                                            description={memo.description.length > 100 ? `${memo.description.substring(0, 100)}...` : memo.description}
                                        />
                                    </Card>
                                </Link>
                            </List.Item>
                        )}
                    />
                )}
        </Body>
    );
};

export default BookmarkedMemos;