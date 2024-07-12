import { useState, useEffect } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Spin, message, Divider, Empty } from 'antd';
import Head from 'next/head';
import Layout from '@/components/Layout';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import useAuthState from '@/hooks/useAuthState';
import { Avatar, Flex } from "@chakra-ui/react";

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
        <div className="container mx-auto my-10">
            <Head>
                <title>Following</title>
            </Head>
            <Layout>
                {following.length > 0 ? (
                    <div className="space-y-3">
                        {following.map((user, index) => {
                            const avatarSrc = user.photoURL || `https://api.dicebear.com/9.x/thumbs/svg?seed=${user.displayName.length}`;
                            return (
                                <div key={user.uid}>
                                    <Flex align="center">
                                        <Link href={`/users/${user.userID}`} passHref>
                                            <Avatar src={avatarSrc} size="md" name={user.displayName} className="mr-5" />
                                        </Link>
                                        <Link href={`/users/${user.userID}`} className="hover:text-black font-bold text-md" passHref>
                                            {user.displayName}
                                        </Link>
                                    </Flex>
                                    {index < following.length - 1 && <Divider />}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="w-full flex justify-center">
                        <Empty description="No followed users found." />
                    </div>
                )}
            </Layout>
        </div>
    );
};

export default Following;