import { memo, useEffect, useState } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import Head from 'next/head';
import { Spin, List, Card } from "antd";
import Body from '@/components/Body';
import { onAuthStateChanged } from 'firebase/auth';

interface Memo {
    content: string;
    uid: string;
    title: string;
    description: string;
    visibility: string;
    userId: string;
}

const MyMemosPage = () => {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchMemos = async () => {
            if (currentUser) {
                setLoading(true);
                try {
                    const memosQuery = query(
                        collection(db, 'memos'),
                        where('userId', '==', currentUser.uid)
                    );
                    const querySnapshot = await getDocs(memosQuery);
                    if (!querySnapshot.empty) {
                        setMemos(querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as Memo)));
                    } else {
                        setMemos([]);
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchMemos();
    }, [currentUser]);

    if (loading) return <div className="w-full min-h-screen flex justify-center items-center h-screen"><Spin size="large" /></div>;

    return (
        <Body>
            <Head><title>My Memos</title></Head>
            <div>
                {memos.length === 0 ? (
                    <div className="flex justify-center text-center">
                        <p className="text-lg text-gray-500 opacity-50 font-semibold">メモが見つかりませんでした</p>
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
            </div>
        </Body>
    );
};

export default MyMemosPage;