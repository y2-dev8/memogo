import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { Spin, List, Card, message } from 'antd';
import Head from 'next/head';
import Layout from '@/components/Layout';
import useAuthRedirect from '@/hooks/useAuthRedirect';
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
    const [following, setFollowing] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const currentUser = auth.currentUser;

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
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setLoading(true);
                fetchFollowing(user.uid);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="w-full min-h-screen flex justify-center items-center"><Spin size="large" /></div>;
    }

    return (
        <div className="container mx-auto my-10">
            <Head>
                <title>Following</title>
            </Head>
            <Layout>
                {following.length > 0 && (
                    <List
                        grid={{ gutter: 16, column: 1 }}
                        dataSource={following}
                        renderItem={user => (
                            <List.Item style={{ borderBottom: "none" }}>
                                <Card
                                    title={
                                        <Flex align="center">
                                            <Link href={`/users/${user.userID}`} passHref>
                                                <Avatar src={user.photoURL} size="sm" name={user.displayName} className="mr-3" />
                                            </Link>
                                            <Link href={`/users/${user.userID}`} className="hover:text-black font-bold text-md" passHref>
                                                {user.displayName}
                                            </Link>
                                        </Flex>
                                    }
                                    className="w-full"
                                >
                                    <p className="text-sm text-gray-500">{user.bio}</p>
                                </Card>
                            </List.Item>
                        )}
                    />
                )}
            </Layout>
        </div>
    );
};

export default Following;