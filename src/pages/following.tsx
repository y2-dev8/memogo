import { useState, useEffect } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Spin, message, Divider, Empty, Button, Avatar } from 'antd';
import Head from 'next/head';
import Body from '@/components/Body';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import useAuthState from '@/hooks/useAuthState';
import { Flex } from "@chakra-ui/react";

interface User {
    uid: string;
    photoURL: string;
    displayName: string;
    bio: string;
    userID: string;
}

const Following = () => {
    useAuthRedirect();
    const { user, loading, error } = useAuthState();
    const [following, setFollowing] = useState<User[]>([]);
    const [loadingFollowing, setLoadingFollowing] = useState<boolean>(true);

    const fetchFollowing = async (userId: string) => {
        try {
            const followsQuery = query(collection(db, 'follows'), where('followerId', '==', userId));
            const followsSnapshot = await getDocs(followsQuery);
            const followedUsers: User[] = [];

            for (const docSnap of followsSnapshot.docs) {
                const followingId = docSnap.data().followingId;
                const userDocRef = doc(db, 'users', followingId);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    const userQuery = query(collection(db, 'users'), where('userID', '==', followingId));
                    const userQuerySnapshot = await getDocs(userQuery);

                    if (!userQuerySnapshot.empty) {
                        userQuerySnapshot.forEach((userDoc) => {
                            const userData = userDoc.data() as User;
                            followedUsers.push({ ...userData, uid: userDoc.id });
                        });
                    }
                } else {
                    const userData = userDoc.data() as User;
                    followedUsers.push({ ...userData, uid: userDoc.id });
                }
            }

            setFollowing(followedUsers);
        } catch (error) {
            console.error('Error fetching following users:', error);
            message.error('フォローしているユーザーの取得中にエラーが発生しました。');
        } finally {
            setLoadingFollowing(false);
        }
    };

    useEffect(() => {
        if (user) {
            setLoadingFollowing(true);
            fetchFollowing(user.uid);
        }
    }, [user]);

    if (loading || loadingFollowing) {
        return <div className="w-full min-h-screen flex justify-center items-center"><Spin size="large" /></div>;
    }

    if (error) {
        return <div className="w-full min-h-screen flex justify-center items-center">{error}</div>;
    }

    return (
        <Body>
            <Head>
                <title>Following</title>
            </Head>
                {following.length > 0 ? (
                    <div>
                        <p className="text-[32px] font-bold mb-5">フォロー中</p>
                        <div className="space-y-5">
                            {following.map((user) => {
                                return (
                                    <div key={user.uid} className="flex items-center space-x-2.5">
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
                                );
                            })}
                        </div>
                    </div>
                ) : (
                <div className="flex flex-col items-center justify-center text-center">
                    <img src="/m/cb-none.png" className="w-64" />
                    <p className="text-xl opacity-50 font-bold">ユーザーをフォローしましょう</p>
                    <Button type="dashed" className="mt-5">
                        <Link href="/search">
                            ユーザーを検索
                        </Link>
                    </Button>
                </div>
                )}
        </Body>
    );
};

export default Following;