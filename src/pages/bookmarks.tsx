import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Head from 'next/head';
import { Heading, Spinner, Text } from '@chakra-ui/react';
import useAuthRedirect from '@/hooks/useAuthRedirect';

interface Memo {
    title: string;
    description: string;
    uid: string;
}

const BookmarkedMemos = () => {
    useAuthRedirect();
    const [memos, setMemos] = useState<Memo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

        onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchBookmarkedMemos(user.uid);
            } else {
                setLoading(false);
            }
        });
    }, []);

    if (loading) return <div className="w-full min-h-screen flex justify-center items-center"><Spinner size="xl" /></div>;

    return (
        <div className="container mx-auto my-10">
            <Head>
                <title>Bookmarks</title>
            </Head>
            <Layout>
                <Heading size="md" className='mb-5'>ブックマーク</Heading>
                <ul className="space-y-3">
                    {memos.length > 0 ? (
                        memos.map((memo, index) => (
                            <li key={memo.uid} className="p-[15px] border rounded-md hover:bg-slate-50 transition-colors">
                                <Link href={`/memo?id=${memo.uid}`}>
                                    <h2 className="text-lg font-bold">{memo.title}</h2>
                                    <p>{memo.description.length > 100 ? `${memo.description.substring(0, 100)}...` : memo.description}</p>
                                </Link>
                            </li>
                        ))
                    ) : (
                        <div className="w-full flex justify-center">
                            <Text className="text-slate-500 mb-5">ブックマークしたメモが見つかりませんでした。</Text>
                        </div>
                    )}
                </ul>
            </Layout>
        </div>
    );
};

export default BookmarkedMemos;