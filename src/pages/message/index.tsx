import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { useDisclosure, Image } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import RoomList from '@/components/RoomList';
import { FaPlus } from "react-icons/fa";
import Head from 'next/head';
import { Button, Modal, Input, message, Spin } from "antd";

const GroupChatPage = () => {
    const [groupName, setGroupName] = useState('');
    const [groupID, setGroupID] = useState('');
    const [joinGroupID, setJoinGroupID] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
    const [loading, setLoading] = useState<boolean>(true);
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
            const groupIDQuery = query(collection(db, 'groups'), where('groupID', '==', joinGroupID));
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
            const groupIDQuery = query(collection(db, 'groups'), where('groupID', '==', groupID));
            const groupIDSnapshot = await getDocs(groupIDQuery);

            if (!groupIDSnapshot.empty) {
                showMessage('このグループIDは既に使われています。', 'error');
                return;
            }

            await addDoc(collection(db, 'groups'), {
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

    useEffect(() => {
        const checkUserGroups = async () => {
            if (!auth.currentUser) {
                setLoading(false);
                return;
            }

            const groupsQuery = query(collection(db, 'groups'), where('participants', 'array-contains', auth.currentUser.uid));
            const groupsSnapshot = await getDocs(groupsQuery);

            if (!groupsSnapshot.empty) {
                const firstGroup = groupsSnapshot.docs[0].data().groupID;
                router.push(`/message/${firstGroup}`);
            } else {
                setLoading(false);
            }
        };

        checkUserGroups();
    }, [auth.currentUser, router]);

    if (loading) {
        return <div className="w-full min-h-screen flex justify-center items-center"><Spin size="large" /></div>;
    }

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
                    <div className="flex flex-col justify-center">
                        <Image src="https://opendoodles.s3-us-west-1.amazonaws.com/clumsy.svg" className="h-80" />
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