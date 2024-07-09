import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { Box, Text, VStack, useDisclosure, Heading, Divider, Avatar } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import RoomList from '@/components/RoomList';
import { FaPlus } from "react-icons/fa";
import Head from 'next/head';
import { Button, Modal, Input, message } from "antd";

const GroupChatPage = () => {
    const [groupName, setGroupName] = useState('');
    const [groupID, setGroupID] = useState('');
    const [joinGroupID, setJoinGroupID] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
    const cancelRef = useRef(null);
    const router = useRouter();

    const showMessage = (content: string, type: 'success' | 'error') => {
        if (type === 'success') {
            message.success(content);
        } else {
            message.error(content);
        }
    };

    const isValidGroupID = (id: string) => /^[a-zA-Z0-9._-]+$/.test(id);

    const handleJoinGroup = async () => {
        if (!isValidGroupID(joinGroupID)) {
            showMessage('グループIDはアルファベット、数字、ハイフン、アンダースコア、ドットのみを使用できます。', 'error');
            return;
        }

        try {
            const groupIDQuery = query(collection(db, 'groupChat'), where('groupID', '==', joinGroupID));
            const groupIDSnapshot = await getDocs(groupIDQuery);

            if (groupIDSnapshot.empty) {
                showMessage('グループIDが存在しません。', 'error');
                return;
            }

            const groupDoc = groupIDSnapshot.docs[0].ref;
            await updateDoc(groupDoc, {
                participants: arrayUnion(auth.currentUser?.uid)
            });

            onClose();
            showMessage('グループの参加に成功しました。', 'success');
            router.push(`/message/${joinGroupID}`);
        } catch (error) {
            showMessage('グループの参加に失敗しました。', 'error');
            console.error('Error joining group:', error);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName || !groupID) {
            showMessage('グループの名前とIDは必須です。', 'error');
            return;
        }

        if (!isValidGroupID(groupID)) {
            showMessage('グループIDはアルファベット、数字、ハイフン、アンダースコア、ドットのみを使用できます。', 'error');
            return;
        }

        try {
            const groupIDQuery = query(collection(db, 'groupChat'), where('groupID', '==', groupID));
            const groupIDSnapshot = await getDocs(groupIDQuery);

            if (!groupIDSnapshot.empty) {
                showMessage('このグループIDは既に使われています。', 'error');
                return;
            }

            await addDoc(collection(db, 'groupChat'), {
                groupName,
                groupID,
                participants: [auth.currentUser?.uid]
            });

            onCreateClose();
            showMessage('グループの作成に成功しました。', 'success');
            router.push(`/message/${groupID}`);
        } catch (error) {
            showMessage('グループの作成に失敗しました。', 'error');
            console.error('Error creating group:', error);
        }
    };

    return (
        <div className="container mx-auto my-10">
            <Head>
                <title>Message</title>
            </Head>
            <Layout>
                <div>
                    <div className="w-full flex flex-col md:flex-row mt-5 md:mt-0 md:mb-10">
                        <Button onClick={onCreateOpen} className="w-full" type='primary'>ルームを作成する</Button>
                        <Button onClick={onOpen} className="w-full mt-3 md:mt-0 md:ml-3" type='default'>ルームに参加する</Button>
                    </div>
                    <div className="w-full">
                        {auth.currentUser && <RoomList userId={auth.currentUser.uid} currentGroup="None" />}
                    </div>
                </div>
            </Layout>
            <Modal
                title="新しいグループを作成する"
                visible={isCreateOpen}
                onOk={handleCreateGroup}
                onCancel={onCreateClose}
                okText="Create"
                centered
            >
                <Input
                    placeholder="グループの名前"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="mb-[10px]"
                />
                <Input
                    placeholder="グループID"
                    value={groupID}
                    onChange={(e) => setGroupID(e.target.value)}
                />
            </Modal>
            <Modal
                title="新しいグループに参加する"
                visible={isOpen}
                onOk={handleJoinGroup}
                onCancel={onClose}
                okText="Join"
                centered
            >
                <Input
                    placeholder="グループID"
                    value={joinGroupID}
                    onChange={(e) => setJoinGroupID(e.target.value)}
                />
            </Modal>
        </div>
    );
};

export default GroupChatPage;