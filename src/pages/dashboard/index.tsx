import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import Head from 'next/head';
import { Spin, List, Card, Button, Input, Empty } from "antd";
import Body from '@/components/Body';
import { onAuthStateChanged } from 'firebase/auth';
import { FiPlus } from 'react-icons/fi';

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
    const [searchQuery, setSearchQuery] = useState<string>('');

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

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const filteredMemos = memos.filter(memo =>
        memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memo.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="w-full min-h-screen flex justify-center items-center h-screen"><Spin size="large" /></div>;

    return (
        <Body>
            <Head><title>Dashboard</title></Head>
            <div>
                {memos.length === 0 ? (
                    <>
                        <p className="text-[32px] font-bold border-b">記事の管理</p>
                        <div className="flex flex-col items-center justify-center text-center">
                            <img src="/m/open-book.png" className="w-64" />
                            <p className="text-xl opacity-50 font-semibold">最初の記事を作成しましょう</p>
                            <Button type="primary" className="mt-5">
                                <Link href="/editor">
                                    新しく作成
                                </Link>
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center mb-2.5">
                            <p className="text-[32px] font-bold">記事の管理</p>
                            <Button type="dashed" className="ml-auto" icon={<FiPlus />}>
                                <Link href="/editor">
                                    新しく作成
                                </Link>
                            </Button>
                        </div>
                        <Input
                            placeholder='キーワードを入力'
                            className="mb-5"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                        {filteredMemos.length === 0 ? (
                            <Empty description="記事が見つかりませんでした。" />
                        ) : (
                            <List
                                grid={{ gutter: 16, column: 1 }}
                                dataSource={filteredMemos}
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
                    </>
                )}
            </div>
        </Body>
    );
};

export default MyMemosPage;