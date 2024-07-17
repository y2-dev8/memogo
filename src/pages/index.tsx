import { useState, useEffect } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, query, getDocs, orderBy, doc, getDoc, startAfter, limit } from 'firebase/firestore';
import Link from 'next/link';
import { Box, VStack, Heading, Text, Flex } from '@chakra-ui/react';
import Body from '@/components/Body'
import { Button, Image, Avatar, Card } from "antd";
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale'; // 日本語のロケールをインポート

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
    visibility: string; // 記事の可視性を追加
}

const extractImageUrlFromMarkdown = (markdown: string) => {
    const regex = /!\[.*?\]\((.*?)\)/;
    const match = regex.exec(markdown);
    return match ? match[1] : null;
};

const Feed = () => {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadedMemoIds, setLoadedMemoIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    const fetchMemos = async (initial = false) => {
        setLoading(true);
        setError(null);

        try {
            let q = query(collection(db, 'memos'), orderBy('createdAt', 'desc'), limit(10));
            if (lastVisible && !initial) {
                q = query(collection(db, 'memos'), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(10));
            }

            const querySnapshot = await getDocs(q);
            const memosData: Memo[] = [];
            const newLoadedMemoIds = new Set(loadedMemoIds);

            for (const memoDoc of querySnapshot.docs) {
                const memoId = memoDoc.id;
                if (!newLoadedMemoIds.has(memoId)) {
                    newLoadedMemoIds.add(memoId);
                    const memoData = memoDoc.data();
                    if (memoData && memoData.userId && memoData.visibility !== 'private') {
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
            }

            if (initial) {
                setMemos(memosData);
            } else {
                setMemos((prevMemos) => [...prevMemos, ...memosData]);
            }
            setLoadedMemoIds(newLoadedMemoIds);
            setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        } catch (error) {
            setError('データの取得中にエラーが発生しました。');
            console.error("Error fetching memos: ", error);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchMemos(true);
    }, []);

    const truncateDescription = (description: string) => {
        return description.length > 100 ? description.substring(0, 100) + '...' : description;
    };

    const formatDate = (date: any) => {
        return formatDistanceToNow(date.toDate(), { addSuffix: true, locale: ja });
    };

    return (
        <Body>
            <div className="flex flex-col space-y-5">
                {memos.map((memo) => {
                    const imageUrl = extractImageUrlFromMarkdown(memo.content);
                    return (
                        <Link href={`/memo?id=${memo.id}`} key={memo.id}>
                            <Card title={memo.title}>
                                <div className="flex items-center">
                                    <Link href={`/u/${memo.userID}`} className="flex items-center mr-2.5">
                                        <Avatar src={memo.photoURL} size="default" />
                                        <p className="text-blue-500 ml-1.5">@{memo.userID}</p>
                                    </Link>
                                    <p className="text-gray-500 text-xs">{formatDate(memo.createdAt)}</p>
                                </div>
                                {/* {imageUrl && <div className="mt-5"><Image src={imageUrl} alt='Summary' /></div>} */}
                            </Card>
                        </Link>
                    );
                })}
                <div className='w-full flex justify-center'>
                    <Button onClick={() => fetchMemos()} loading={loading} type="link">読み込む</Button>
                </div>
            </div>
        </Body>
    );
};

export default Feed;