import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { useDisclosure, Image } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import Head from 'next/head';
import { Button, Modal, Input, message, Spin, Switch } from "antd";

const GroupChatPage = () => {
    const [groupName, setGroupName] = useState('');
    const [groupID, setGroupID] = useState('');
    const [groupPassword, setGroupPassword] = useState('');
    const [joinGroupID, setJoinGroupID] = useState('');
    const [joinGroupPassword, setJoinGroupPassword] = useState('');
    const [isPasswordProtected, setIsPasswordProtected] = useState(false);
    const [isJoinPasswordRequired, setIsJoinPasswordRequired] = useState(false);
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
            const groupIDQuery = query(collection(db, 'InfoNest'), where('groupID', '==', joinGroupID));
            const groupIDSnapshot = await getDocs(groupIDQuery);

            if (groupIDSnapshot.empty) {
                showMessage('グループIDが存在しません。', 'error');
                return;
            }

            const groupDoc = groupIDSnapshot.docs[0];
            const groupData = groupDoc.data();

            // パスワードの確認
            if (groupData.password && groupData.password !== joinGroupPassword) {
                showMessage('パスワードが間違っています。', 'error');
                return;
            }

            await updateDoc(groupDoc.ref, {
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
            const groupIDQuery = query(collection(db, 'InfoNest'), where('groupID', '==', groupID));
            const groupIDSnapshot = await getDocs(groupIDQuery);

            if (!groupIDSnapshot.empty) {
                showMessage('このグループIDは既に使われています。', 'error');
                return;
            }

            await addDoc(collection(db, 'InfoNest'), {
                groupName,
                groupID,
                password: isPasswordProtected ? groupPassword : '',
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

            const groupsQuery = query(collection(db, 'InfoNest'), where('participants', 'array-contains', auth.currentUser.uid));
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
                    <div className="flex flex-col lg:flex-row items-center justify-center mb-2.5">
                        <Image src="https://opendoodles.s3-us-west-1.amazonaws.com/moshing.svg" className="h-80" />
                        <div className="flex flex-col items-center">
                            <p className="font-bold text-3xl">メッセージを通じて作業を効率化する</p>
                            <p className="text-md text-gray-500 mt-5">親しみやすいUIとUXでチームの作業体験をより向上させることができます。</p>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row mb-10 space-y-3 md:space-y-0 md:space-x-3">
                        <Button onClick={onCreateOpen} className="w-full" type='primary'>ルームを作成する</Button>
                        <Button onClick={onOpen} className="w-full" type='dashed'>ルームに参加する</Button>
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-center mb-2.5">
                        <div className="flex flex-col items-center lg:w-1/2">
                            <div className="w-10 h-10 bg-blue-500 rounded-full mb-1.5 flex items-center justify-center shadow-sm">
                                <p className="text-md text-white font-semibold">1</p>
                            </div>
                            <p className="font-bold text-3xl">目に優しいUI</p>
                            <p className="text-md text-gray-500 mt-5">蛍光色など目に悪い色を極力取り除き無駄な機能やボタンなども取り除きました。</p>
                        </div>
                        <div className="lg:w-1/2">
                            <Image src="https://opendoodles.s3-us-west-1.amazonaws.com/reading-side.svg" className="h-80" />
                        </div>
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-center mb-2.5">
                        <div className="hidden lg:block lg:w-1/2">
                            <Image src="https://opendoodles.s3-us-west-1.amazonaws.com/unboxing.svg" className="h-80" />
                        </div>
                        <div className="flex flex-col items-center lg:w-1/2">
                            <div className="w-10 h-10 bg-blue-500 rounded-full mb-1.5 flex items-center justify-center shadow-sm">
                                <p className="text-md text-white font-semibold">2</p>
                            </div>
                            <p className="font-bold text-3xl">グループ機能</p>
                            <p className="text-md text-gray-500 mt-5">1分以内にグループを作成しIDのみで簡単に参加することができます。</p>
                        </div>
                        <div className="block lg:hidden lg:w-1/2">
                            <Image src="https://opendoodles.s3-us-west-1.amazonaws.com/unboxing.svg" className="h-80" />
                        </div>
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
                <div className="flex items-center mt-[10px]">
                    <span className="mr-[10px]">パスワードを設定する</span>
                    <Switch checked={isPasswordProtected} onChange={setIsPasswordProtected} />
                </div>
                {isPasswordProtected && (
                    <Input
                        placeholder="パスワード"
                        type="password"
                        value={groupPassword}
                        onChange={(e) => setGroupPassword(e.target.value)}
                        className="mt-[10px]"
                    />
                )}
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
                    className="mb-[10px]"
                />
                <div className="flex items-center">
                    <span className="mr-[10px]">パスワードが必要</span>
                    <Switch checked={isJoinPasswordRequired} onChange={setIsJoinPasswordRequired} />
                </div>
                {isJoinPasswordRequired && (
                    <Input
                        placeholder="パスワード"
                        type="password"
                        value={joinGroupPassword}
                        onChange={(e) => setJoinGroupPassword(e.target.value)}
                        className="mt-[10px]"
                    />
                )}
            </Modal>
        </div>
    );
};

export default GroupChatPage;