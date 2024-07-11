import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Head from 'next/head';
import { Button, Empty, Spin, Image, List, Card } from "antd";
import { Avatar } from "@chakra-ui/react";

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
                        router.push('/404');
                    }
                } catch (err) {
                    console.error(err);
                    router.push('/500');
                }
            }
        };

        const fetchMemos = async (uid: string) => {
            try {
                const memosQuery = query(
                    collection(db, 'memos'), 
                    where('userId', '==', uid)
                );
                const querySnapshot = await getDocs(memosQuery);
                if (!querySnapshot.empty) {
                    setMemos(querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as Memo)));
                }
            } catch (err) {
                console.error(err);
                router.push('/500');
            }
        };

        const checkFollowingStatus = async () => {
            if (currentUser && userId && typeof userId === 'string') {
                try {
                    const followQuery = query(collection(db, 'follows'), where('followerId', '==', currentUser.uid), where('followingId', '==', userId));
                    const followSnapshot = await getDocs(followQuery);
                    if (!followSnapshot.empty) setIsFollowing(true);
                } catch (err) {
                    console.error(err);
                    router.push('/500');
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
                    console.error(err);
                    router.push('/500');
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
    }, [userId, currentUser, router]);

    const handleFollow = async () => {
        if (currentUser && userId && typeof userId === 'string') {
            try {
                await addDoc(collection(db, 'follows'), {
                    followerId: currentUser.uid,
                    followingId: userId
                });
                setIsFollowing(true);
                setFollowerCount(prev => prev + 1);
            } catch (err) {
                console.error(err);
                router.push('/500');
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
            } catch (err) {
                console.error(err);
                router.push('/500');
            }
        }
    };

    if (loading) return <div className="w-full min-h-screen flex justify-center items-center h-screen"><Spin size="large" /></div>;

    const avatarSrc = user?.photoURL || `https://api.dicebear.com/9.x/thumbs/svg?seed=${user?.displayName.length}`;

    return (
        <div className="container mx-auto my-10">
            <Head><title>{user?.displayName}</title></Head>
            <Layout>
                {user?.headerPhotoURL && (
                    <div className="mb-5">
                        <Image src={user.headerPhotoURL} className="w-full h-auto" />
                    </div>
                )}
                <div className="contents lg:flex items-center space-y-5 lg:space-y-0 lg:space-x-5">
                    <Avatar src={avatarSrc} name={user?.displayName} size="xl" />
                        <div className="w-full flex items-center">
                            <div>
                                <p className="text-lg font-bold">{user?.displayName}</p>
                                <p className="mt-1.5 text-sm text-gray-500 lg:whitespace-pre-line">{user?.bio}</p>
                                <p className="text-gray-500 mt-1.5 text-sm"><strong className="font-semibold text-black">{followerCount}</strong> Followers</p>
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
                                    <Button className='ml-3' type="dashed">
                                        <Link href="/settings">Edit profile</Link>
                                    </Button>
                                )}
                        </div>
                    </div>
                </div>
                <div className="mt-10">
                    {memos.length === 0 ? (
                        <div className="w-full flex justify-center">
                            <Empty description="No memos found for this user." />
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
            </Layout>
        </div>
    );
};

export default UserPage;