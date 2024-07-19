import { useState, useEffect } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, query, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import Body from '@/components/Body';
import { Avatar, Card, Alert } from "antd";
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
    visibility: string; // 記事の可視性を追加
}

const extractImageUrlFromMarkdown = (markdown: string) => {
    const regex = /!\[.*?\]\((.*?)\)/;
    const match = regex.exec(markdown);
    return match ? match[1] : null;
};

const Feed = () => {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMemos = async () => {
        setLoading(true);
        setError(null);

        try {
            const q = query(collection(db, 'memos'), orderBy('createdAt', 'desc'), limit(10));
            const querySnapshot = await getDocs(q);
            const memosData: Memo[] = [];

            for (const memoDoc of querySnapshot.docs) {
                const memoId = memoDoc.id;
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

            setMemos(memosData);
        } catch (error) {
            setError('データの取得中にエラーが発生しました。');
            console.error("Error fetching memos: ", error);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchMemos();
    }, []);

    const truncateDescription = (description: string) => {
        return description.length > 100 ? description.substring(0, 100) + '...' : description;
    };

    const formatDate = (date: any) => {
        return formatDistanceToNow(date.toDate(), { addSuffix: true, locale: ja });
    };

    return (
        <Body>
            <Alert message="20日以降、記事の説明文機能が廃止されます。" type="info" showIcon />
            <div className="flex flex-col space-y-5 mt-5">
                {memos.map((memo) => {
                    return (
                        <Link href={`/article?id=${memo.id}`} key={memo.id}>
                            <Card title={memo.title}>
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
            </div>
        </Body>
    );
};

export default Feed;