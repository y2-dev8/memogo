import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/firebaseConfig';
import { getDoc, getDocs, query, where, doc, updateDoc, arrayUnion, collection } from 'firebase/firestore';
import { Button, Spin, Input, message, Modal } from 'antd';
import RoomList from '@/components/RoomList';
import ChatComponent from '@/components/ChatComponent';
import Head from 'next/head';

const GroupChat = () => {
    const router = useRouter();
    const { groupId } = router.query;
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userIDs, setUserIDs] = useState<{ [key: string]: string }>({});
    const [joinGroupID, setJoinGroupID] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [confirmLoading, setConfirmLoading] = useState<boolean>(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                setCurrentUser(userDoc.data());

                const userIDMap: { [key: string]: string } = {};
                const usersSnapshot = await getDocs(collection(db, 'users'));
                usersSnapshot.forEach((doc) => {
                    const data = doc.data();
                    userIDMap[doc.id] = data.userID;
                });
                setUserIDs(userIDMap);
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="w-full min-h-screen flex justify-center items-center"><Spin size="large" /></div>;
    }

    return (
        <div className='w-[90%] mx-auto md:my-10'>
            <Head>
                <title>Message</title>
            </Head>
            <div className="flex flex-col md:flex-row">
                {auth.currentUser && <RoomList userId={auth.currentUser.uid} currentGroup={groupId as string} />}
                <div className="w-full md:ml-5">
                    {groupId && currentUser && (
                        <ChatComponent groupId={groupId as string} currentUser={currentUser} userIDs={userIDs} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupChat;