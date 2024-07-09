import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { Input, Box, Text, VStack, useToast, useDisclosure, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Heading, Divider } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import RoomList from '@/components/RoomList';
import { FaPlus } from "react-icons/fa";
import Head from 'next/head';
import { Button } from "antd"

const GroupChatPage = () => {
    const [groupName, setGroupName] = useState('');
    const [groupID, setGroupID] = useState('');
    const [joinGroupID, setJoinGroupID] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
    const cancelRef = useRef(null);
    const toast = useToast();
    const router = useRouter();

    const handleJoinGroup = async () => {
        try {
            const groupIDQuery = query(collection(db, 'groupChat'), where('groupID', '==', joinGroupID));
            const groupIDSnapshot = await getDocs(groupIDQuery);

            if (groupIDSnapshot.empty) {
                toast({
                    title: 'エラー',
                    description: 'グループIDが存在しません。',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }

            const groupDoc = groupIDSnapshot.docs[0].ref;
            await updateDoc(groupDoc, {
                participants: arrayUnion(auth.currentUser?.uid)
            });

            onClose();
            toast({
                title: 'グループの参加に成功しました!',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            router.push(`/message/${joinGroupID}`);
        } catch (error) {
            toast({
                title: 'エラー',
                description: 'グループの参加に失敗しました。',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            console.error('Error joining group:', error);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName || !groupID) {
            toast({
                title: 'エラー',
                description: 'グループの名前とIDは必須です。',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        try {
            const groupIDQuery = query(collection(db, 'groupChat'), where('groupID', '==', groupID));
            const groupIDSnapshot = await getDocs(groupIDQuery);

            if (!groupIDSnapshot.empty) {
                toast({
                    title: 'エラー',
                    description: 'このグループIDは既に使われています。',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }

            const newGroupRef = await addDoc(collection(db, 'groupChat'), {
                groupName,
                groupID,
                participants: [auth.currentUser?.uid]
            });

            onCreateClose();
            toast({
                title: 'グループの作成に成功しました!',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            router.push(`/message/${groupID}`);
        } catch (error) {
            toast({
                title: 'エラー',
                description: 'グループの作成に失敗しました。',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
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
            <AlertDialog
                isOpen={isCreateOpen}
                leastDestructiveRef={cancelRef}
                onClose={onCreateClose}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                            新しいグループを作成
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            <Input
                                placeholder="グループの名前"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="mb-3"
                            />
                            <Input
                                placeholder="グループID"
                                value={groupID}
                                onChange={(e) => setGroupID(e.target.value)}
                            />
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onCreateClose}>
                                キャンセル
                            </Button>
                            <Button onClick={handleCreateGroup} className="ml-3">
                                作成
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
            <AlertDialog
                isOpen={isOpen}
                leastDestructiveRef={cancelRef}
                onClose={onClose}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                            新しいグループに参加する
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            <Input
                                placeholder="グループID"
                                value={joinGroupID}
                                onChange={(e) => setJoinGroupID(e.target.value)}
                            />
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                                キャンセル
                            </Button>
                            <Button  onClick={handleJoinGroup} className="ml-3">
                                参加
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </div>
    );
};

export default GroupChatPage;