import { useState, useEffect } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, query, getDocs, orderBy, doc, getDoc, limit } from 'firebase/firestore';
import Link from 'next/link';
import Body from '@/components/Body';
import Head from 'next/head';
import Fuse from 'fuse.js';
import { Input, Tabs, Avatar, Empty, Card } from "antd";
import type { TabsProps } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Memo {
    id: string;
    userId: string;
    title: string;
    description: string;
    content: string;
    createdAt: any;
    photoURL: string;
    displayName: string;
    userID: string; // ユーザーIDを追加
}

interface User {
    userID: string;
    displayName: string;
    photoURL: string;
}

const extractImageUrlFromMarkdown = (markdown: string) => {
    const regex = /!\[.*?\]\((.*?)\)/;
    const match = regex.exec(markdown);
    return match ? match[1] : null;
};

const Search = () => {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [fuseMemos, setFuseMemos] = useState<Fuse<Memo> | null>(null);
    const [fuseUsers, setFuseUsers] = useState<Fuse<User> | null>(null);
    const [displayedMemos, setDisplayedMemos] = useState<Memo[]>([]);
    const [displayedUsers, setDisplayedUsers] = useState<User[]>([]);

    const fetchMemos = async () => {
        setLoading(true);
        const q = query(collection(db, 'memos'), orderBy('createdAt', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const memosData: Memo[] = [];

        for (const memoDoc of querySnapshot.docs) {
            const memoId = memoDoc.id;
            const memoData = memoDoc.data();
            if (memoData && memoData.userId) {
                const userDocRef = doc(db, 'users', memoData.userId);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    memosData.push({
                        id: memoId,
                        ...memoData,
                        photoURL: userData.photoURL || '/default-avatar.png',
                        displayName: userData.displayName || 'Anonymous',
                        userID: userData.userID // ユーザーIDを取得
                    } as Memo);
                }
            }
        }

        setMemos(memosData);
        setFuseMemos(new Fuse(memosData, {
            keys: ['title', 'description'],
            includeScore: true,
            threshold: 0.3,
        }));
        setLoading(false);
    };

    const fetchUsers = async () => {
        setLoading(true);
        const q = query(collection(db, 'users'), orderBy('userID'));
        const querySnapshot = await getDocs(q);
        const usersData: User[] = [];

        querySnapshot.forEach((userDoc) => {
            const userData = userDoc.data() as User;
            usersData.push({
                userID: userData.userID,
                displayName: userData.displayName || 'Anonymous',
                photoURL: userData.photoURL || '/default-avatar.png',
            });
        });

        setUsers(usersData);
        setFuseUsers(new Fuse(usersData, {
            keys: ['userID', 'displayName'],
            includeScore: true,
            threshold: 0.3,
        }));
        setLoading(false);
    };

    useEffect(() => {
        fetchMemos();
        fetchUsers();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setDisplayedMemos([]);
            setDisplayedUsers([]);
        } else {
            if (fuseMemos) {
                const memoResults = fuseMemos.search(searchQuery);
                setDisplayedMemos(memoResults.map(result => result.item));
            }
            if (fuseUsers) {
                const userResults = fuseUsers.search(searchQuery);
                setDisplayedUsers(userResults.map(result => result.item));
            }
        }
    }, [searchQuery, fuseMemos, fuseUsers]);

    const truncateDescription = (description: string) => {
        return description.length > 100 ? description.substring(0, 100) + '...' : description;
    };

    const formatDate = (date: any) => {
        return formatDistanceToNow(date.toDate(), { addSuffix: true, locale: ja });
    };

    const tabItems: TabsProps['items'] = [
        {
            key: 'articles',
            label: '記事',
            children: (
                <>
                    {searchQuery && (
                        <>
                            {displayedMemos.length === 0 && !loading && searchQuery && <Empty description="記事が見つかりませんでした。" />}
                            {displayedMemos.map((memo) => {
                                const imageUrl = extractImageUrlFromMarkdown(memo.content);
                                return (
                                    <Link href={`/article?id=${memo.id}`} key={memo.id}>
                                        <Card title={memo.title} key={memo.id}>
                                            <div className="flex items-center">
                                                <Link href={`/u/${memo.userID}`} className="flex items-center mr-2.5">
                                                    <Avatar src={memo.photoURL} size="default" />
                                                    <p className="text-blue-500 ml-1.5">@{memo.userID}</p>
                                                </Link>
                                                <p className="text-gray-500 text-xs">{formatDate(memo.createdAt)}</p>
                                            </div>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </>
                    )}
                </>
            ),
        },
        {
            key: 'users',
            label: 'ユーザー',
            children: (
                <div className="space-y-5">
                    {searchQuery && (
                        <>
                            {displayedUsers.length === 0 && !loading && searchQuery && <Empty description="ユーザーが見つかりませんでした。" />}
                            {displayedUsers.map((user) => (
                                <div key={user.userID} className="flex items-center space-x-2.5">
                                    <Link href={`/u/${user.userID}`}>
                                        <Avatar src={user.photoURL} size="large" />
                                    </Link>
                                    <div>
                                        <Link href={`/u/${user.userID}`} passHref>
                                            <p className="text-md font-bold text-black hover:text-black">{user.displayName}</p>
                                        </Link>
                                        <p className="text-gray-500 text-sm">@{user.userID}</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            ),
        }
    ];

    return (
        <Body>
            <Head>
                <title>Search</title>
            </Head>
            <p className="text-[32px] font-bold mb-2.5">検索</p>
            <Input type="text" placeholder="キーワードを入力" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="mb-2.5"/>
            <Tabs defaultActiveKey="articles" items={tabItems} />
        </Body>
    );
};

export default Search;