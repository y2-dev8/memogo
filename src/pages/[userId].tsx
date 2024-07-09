import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Heading, Text, Spinner, Avatar, Image, useToast } from '@chakra-ui/react';
import Head from 'next/head';
import { FiTwitter } from 'react-icons/fi';
import { Button, Empty } from "antd"

interface User {
    photoURL: string;
    displayName: string;
    bio: string;
    twitter?: string;
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
    const toast = useToast();

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
                    toast({
                        title: 'エラー',
                        description: 'ユーザーデータの取得に失敗しました。',
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                    });
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
                toast({
                    title: 'エラー',
                    description: 'メモの取得に失敗しました。',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
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
                    toast({
                        title: 'エラー',
                        description: 'フォロー状態の確認に失敗しました。',
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                    });
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
                    toast({
                        title: 'エラー',
                        description: 'フォロワー数の取得に失敗しました。',
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                    });
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
    }, [userId, currentUser, toast]);

    const handleFollow = async () => {
        if (currentUser && userId && typeof userId === 'string') {
            try {
                await addDoc(collection(db, 'follows'), {
                    followerId: currentUser.uid,
                    followingId: userId
                });
                setIsFollowing(true);
                setFollowerCount(prev => prev + 1); // Increase follower count locally
                toast({
                    title: 'フォローしました。',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            } catch (err) {
                setError('フォローに失敗しました。');
                toast({
                    title: 'エラー',
                    description: 'フォローに失敗しました。',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
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
                setFollowerCount(prev => prev - 1); // Decrease follower count locally
                toast({
                    title: 'フォロー解除しました。',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            } catch (err) {
                setError('フォロー解除に失敗しました。');
                toast({
                    title: 'エラー',
                    description: 'フォロー解除に失敗しました。',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
                console.error(err);
            }
        }
    };

    if (loading) return <div className="w-full min-h-screen flex justify-center items-center h-screen"><Spinner size="xl" /></div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!user) return <div>ユーザーが見つかりませんでした。</div>;

    return (
        <div className="container mx-auto my-10">
            <Head><title>{user.displayName}</title></Head>
            <Layout>
                {user.headerPhotoURL && (
                    <div className="rounded-md overflow-hidden border mb-5">
                        <Image src={user.headerPhotoURL} className="w-full h-auto"  />
                    </div>
                )}
                <div className="contents lg:flex items-center">
                    <Avatar src={user.photoURL} name={user.displayName} size="lg" />
                    <div className='mt-3 lg:mt-0 lg:ml-3 w-full'>
                        <div className="flex items-center w-full">
                            <div>
                                <Heading size="md">{user.displayName}</Heading>
                                <Text className="text-slate-500 lg:whitespace-pre-line">{user.bio}</Text>
                            </div>
                            <div className="ml-auto">
                                {!isCurrentUser && (
                                    <Button
                                        onClick={isFollowing ? handleUnfollow : handleFollow}
                                        className="lg:ml-3"
                                        type={`${isFollowing ? 'default' : "primary"}`}
                                    >
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </Button>
                                )}
                                {isCurrentUser && (
                                    <Button className='lg:ml-3' type="default">
                                        <Link href="/settings">Edit profile</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <Text className="text-slate-500 mt-3 text-sm">{followerCount} Followers</Text>
                {user.twitter && (
                    <div className="flex items-center mt-3">
                        <FiTwitter className='mr-1 text-lg' />
                        <Link href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer">
                            @{user.twitter}
                        </Link>
                    </div>
                )}
                <div className="mt-[30px]">
                    <ul className="space-y-3">
                        {memos.length > 0 ? (
                            memos.map((memo) => (
                                <li key={memo.uid} className="p-[15px] border rounded-md hover:bg-slate-50 transition-colors">
                                    <Link href={`/memo?id=${memo.uid}`}>
                                        <h2 className="text-lg font-bold">{memo.title}</h2>
                                        <p>{memo.description.length > 100 ? `${memo.description.substring(0, 100)}...` : memo.description}</p>
                                    </Link>
                                </li>
                            ))
                        ) : (
                            <div className="w-full flex justify-center">
                                <Empty description="No memos found for this user." />
                            </div>
                        )}
                    </ul>
                </div>
            </Layout>
        </div>
    );
};

export default UserPage;