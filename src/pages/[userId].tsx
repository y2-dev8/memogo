import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Head from 'next/head';
import { Button, Empty, message, Spin, Image, Typography, List, Card } from "antd";
import { Avatar } from "@chakra-ui/react"

const { Title, Text } = Typography;

interface User {
    photoURL: string;
    displayName: string;
    bio: string;
    headerPhotoURL?: string;
    userID: string;
}

interface Memo {
    content: string;
    uid: string;
    title: string;
    description: string;
}

const UserPage = () => {
    const router = useRouter();
    const { userId } = router.query;
    const [user, setUser] = useState<User | null>(null);
    const [memos, setMemos] = useState<Memo[]>([]);
    const [isFollowing, setIsFollowing] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [followerCount, setFollowerCount] = useState<number>(0);
    const currentUser = auth.currentUser;
    const [isCurrentUser, setIsCurrentUser] = useState<boolean>(false);

    useEffect(() => {
        const fetchUser = async () => {
            if (userId && typeof userId === 'string') {
                try {
                    const userQuery = query(collection(db, 'users'), where('userID', '==', userId));
                    const userSnapshot = await getDocs(userQuery);
                    if (!userSnapshot.empty) {
                        const userData = userSnapshot.docs[0].data() as User;
                        setUser(userData);
                        setIsCurrentUser(currentUser?.uid === userSnapshot.docs[0].id);
                        await fetchMemos(userSnapshot.docs[0].id);
                    } else {
                        setError('ユーザーが見つかりませんでした。');
                    }
                } catch (err) {
                    setError('ユーザーデータの取得に失敗しました。');
                    message.error('ユーザーデータの取得に失敗しました。');
                    console.error(err);
                }
            }
        };

        const fetchMemos = async (uid: string) => {
            try {
                const memosQuery = query(collection(db, 'memos'), where('userId', '==', uid));
                const querySnapshot = await getDocs(memosQuery);
                if (!querySnapshot.empty) {
                    setMemos(querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as Memo)));
                }
            } catch (err) {
                setError('メモの取得に失敗しました。');
                message.error('メモの取得に失敗しました。');
                console.error(err);
            }
        };

        const checkFollowingStatus = async () => {
            if (currentUser && userId && typeof userId === 'string') {
                try {
                    const followQuery = query(collection(db, 'follows'), where('followerId', '==', currentUser.uid), where('followingId', '==', userId));
                    const followSnapshot = await getDocs(followQuery);
                    if (!followSnapshot.empty) setIsFollowing(true);
                } catch (err) {
                    setError('フォロー状態の確認に失敗しました。');
                    message.error('フォロー状態の確認に失敗しました。');
                    console.error(err);
                }
            }
        };

        const fetchFollowerCount = async () => {
            if (userId && typeof userId === 'string') {
                try {
                    const countQuery = query(collection(db, 'follows'), where('followingId', '==', userId));
                    const querySnapshot = await getDocs(countQuery);
                    setFollowerCount(querySnapshot.size);
                } catch (err) {
                    setError('フォロワー数の取得に失敗しました。');
                    message.error('フォロワー数の取得に失敗しました。');
                    console.error(err);
                }
            }
        };

        const fetchData = async () => {
            setLoading(true);
            await fetchUser();
            await checkFollowingStatus();
            await fetchFollowerCount();
            setLoading(false);
        };

        fetchData();
    }, [userId, currentUser]);

    const handleFollow = async () => {
        if (currentUser && userId && typeof userId === 'string') {
            try {
                await addDoc(collection(db, 'follows'), {
                    followerId: currentUser.uid,
                    followingId: userId
                });
                setIsFollowing(true);
                setFollowerCount(prev => prev + 1);
                message.success('フォローしました。');
            } catch (err) {
                setError('フォローに失敗しました。');
                message.error('フォローに失敗しました。');
                console.error(err);
            }
        }
    };

    const handleUnfollow = async () => {
        if (currentUser && userId && typeof userId === 'string') {
            try {
                const unfollowQuery = query(collection(db, 'follows'), where('followerId', '==', currentUser.uid), where('followingId', '==', userId));
                const querySnapshot = await getDocs(unfollowQuery);
                querySnapshot.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                });
                setIsFollowing(false);
                setFollowerCount(prev => prev - 1);
                message.success('フォロー解除しました。');
            } catch (err) {
                setError('フォロー解除に失敗しました。');
                message.error('フォロー解除に失敗しました。');
                console.error(err);
            }
        }
    };

    if (loading) return <div className="w-full min-h-screen flex justify-center items-center h-screen"><Spin size="large" /></div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!user) return <div>ユーザーが見つかりませんでした。</div>;

    return (
        <div className="container mx-auto my-10">
            <Head><title>{user.displayName}</title></Head>
            <Layout>
                {user.headerPhotoURL && (
                    <div className="mb-5">
                        <Image src={user.headerPhotoURL} className="w-full h-auto" />
                    </div>
                )}
                <div className="contents lg:flex items-center">
                    <Avatar src={user.photoURL} name={user.displayName} size="lg" />
                    <div className='mt-3 lg:mt-0 lg:ml-3 w-full'>
                        <div className="flex items-center">
                            <div>
                                <p className="text-lg font-bold">{user.displayName}</p>
                                <p className="text-sm text-slate-500 lg:whitespace-pre-line">{user.bio}</p>
                            </div>
                            <div className="ml-auto">
                                {!isCurrentUser && (
                                    <Button
                                        onClick={isFollowing ? handleUnfollow : handleFollow}
                                        className="ml-3"
                                        type={isFollowing ? 'default' : "primary"}
                                    >
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </Button>
                                )}
                                {isCurrentUser && (
                                    <Button className='ml-3' type="default">
                                        <Link href="/settings">Edit profile</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-slate-500 mt-3 text-sm">{followerCount} Followers</p>
                <div className="mt-[30px]">
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
                    {memos.length === 0 && (
                        <div className="w-full flex justify-center">
                            <Empty description="No memos found for this user." />
                        </div>
                    )}
                </div>
            </Layout>
        </div>
    );
};

export default UserPage;