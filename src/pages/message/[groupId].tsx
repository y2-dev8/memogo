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
    const { groupId, invite } = router.query;
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

                if (invite === 'invite') {
                    setJoinGroupID(groupId as string);
                    setIsModalOpen(true);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [invite, groupId]);

    const handleJoinGroup = async () => {
        setConfirmLoading(true);
        try {
            const groupIDQuery = query(collection(db, 'groups'), where('groupID', '==', joinGroupID));
            const groupIDSnapshot = await getDocs(groupIDQuery);

            if (groupIDSnapshot.empty) {
                message.error('グループIDが存在しません。');
                setConfirmLoading(false);
                return;
            }

            const groupDoc = groupIDSnapshot.docs[0].ref;
            await updateDoc(groupDoc, {
                participants: arrayUnion(auth.currentUser?.uid)
            });

            message.success('グループに参加しました。');
            setJoinGroupID(''); // 入力フィールドをリセット
            setIsModalOpen(false);
            router.push(`/message/${joinGroupID}`);
        } catch (error) {
            message.error('グループの参加に失敗しました。');
            console.error('Error joining group:', error);
        } finally {
            setConfirmLoading(false);
        }
    };

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
            <Modal
                title="グループに参加する"
                visible={isModalOpen}
                onOk={handleJoinGroup}
                confirmLoading={confirmLoading}
                onCancel={() => setIsModalOpen(false)}
                okText="Join"
                centered
            >
                <p>このグループに参加しますか？</p>
            </Modal>
        </div>
    );
};

export default GroupChat;