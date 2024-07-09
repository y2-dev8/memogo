import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Heading, Text, Avatar, Box, VStack, HStack, Spinner, useToast } from '@chakra-ui/react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import useAuthRedirect from '@/hooks/useAuthRedirect';

interface User {
    uid: string;
    photoURL: string;
    displayName: string;
    bio: string;
    userID: string; // Add this field
}

const Following = () => {
    useAuthRedirect();
    const [following, setFollowing] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const toast = useToast();
    const currentUser = auth.currentUser;

    useEffect(() => {
        const fetchFollowing = async () => {
            if (currentUser) {
                try {
                    console.log("Current user UID:", currentUser.uid);
                    const followsQuery = query(collection(db, 'follows'), where('followerId', '==', currentUser.uid));
                    const followsSnapshot = await getDocs(followsQuery);
                    console.log("Follows snapshot size:", followsSnapshot.size);
                    const followedUsers: User[] = [];

                    for (const docSnap of followsSnapshot.docs) {
                        const followingId = docSnap.data().followingId;
                        console.log("Following ID:", followingId);

                        // Try to get the user document by followingId
                        const userDocRef = doc(db, 'users', followingId);
                        const userDoc = await getDoc(userDocRef);

                        if (!userDoc.exists()) {
                            // If the document does not exist, search for the user by userID field
                            const userQuery = query(collection(db, 'users'), where('userID', '==', followingId));
                            const userQuerySnapshot = await getDocs(userQuery);

                            if (!userQuerySnapshot.empty) {
                                userQuerySnapshot.forEach((userDoc) => {
                                    const userData = userDoc.data() as User;
                                    followedUsers.push({ ...userData, uid: userDoc.id });
                                    console.log("Fetched user data:", userData);
                                });
                            } else {
                                console.log("User document does not exist for ID:", followingId);
                            }
                        } else {
                            const userData = userDoc.data() as User;
                            followedUsers.push({ ...userData, uid: userDoc.id });
                            console.log("Fetched user data:", userData);
                        }
                    }

                    setFollowing(followedUsers);
                } catch (error) {
                    console.error('Error fetching following users:', error);
                    toast({
                        title: 'エラー',
                        description: 'フォローしているユーザーの取得中にエラーが発生しました。',
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                    });
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchFollowing();
    }, [currentUser, toast]);

    if (loading) {
        return <div className="w-full min-h-screen flex justify-center items-center"><Spinner size="xl" /></div>;
    }

    return (
        <div className="container mx-auto my-10">
            <Head>
                <title>フォロー中</title>
            </Head>
            <Layout>
                <Heading size="md" className="mb-5">フォロー中</Heading>
                <VStack align="start" className="space-y-3">
                    {following.length > 0 ? (
                        following.map((user) => (
                            <Box key={user.uid} className="p-3 w-full rounded-md border">
                                <HStack align="center">
                                    <Link href={`/${user.userID}`} passHref>
                                        <Avatar src={user.photoURL} name={user.displayName} size="md" className="mr-1.5" />
                                    </Link>
                                    <VStack align="start" spacing={0}>
                                        <Link href={`/${user.userID}`} passHref>
                                            <Text fontWeight="bold">{user.displayName}</Text>
                                        </Link>
                                        <Text>{user.bio}</Text>
                                    </VStack>
                                </HStack>
                            </Box>
                        ))
                    ) : (
                        <div className="w-full flex justify-center">
                            <Text className="text-slate-500 mb-5">フォローしているユーザーが見つかりませんでした。</Text>
                        </div>
                    )}
                </VStack>
            </Layout>
        </div>
    );
};

export default Following;