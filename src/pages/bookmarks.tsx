import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Head from 'next/head';
import { Typography, Spin, List, Card, Empty } from 'antd';
import useAuthRedirect from '@/hooks/useAuthRedirect';

const { Title, Text } = Typography;

interface Memo {
    title: string;
    description: string;
    uid: string;
}

const BookmarkedMemos = () => {
    useAuthRedirect();
    const [memos, setMemos] = useState<Memo[]>([]);
    const [loading, setLoading] = useState(true);

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
        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setLoading(true);
                fetchBookmarkedMemos(user.uid);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    if (loading) return <div className="w-full min-h-screen flex justify-center items-center"><Spin size="large" /></div>;

    return (
        <div className="container mx-auto my-10">
            <Head>
                <title>Bookmarks</title>
            </Head>
            <Layout>
                {memos.length === 0 ? (
                    <div className="w-full flex justify-center">
                        <Empty description="No bookmarked memos found." />
                    </div>
                ) : (
                    <List
                        grid={{ gutter: 16, column: 1 }}
                        dataSource={memos}
                        renderItem={memo => (
                            <List.Item>
                                <Link href={`/memo?id=${memo.uid}`}>
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
            </Layout>
        </div>
    );
};

export default BookmarkedMemos;