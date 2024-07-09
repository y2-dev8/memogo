import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/firebaseConfig';
import { getDoc, getDocs, query, where, doc, updateDoc, arrayUnion, collection } from 'firebase/firestore';
import { Button, useToast, useDisclosure, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Input, Spinner } from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
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
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = useRef(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                setCurrentUser(userDoc.data());
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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

    if (loading) {
        return <div className="w-full min-h-screen flex justify-center items-center"><Spinner size="xl" /></div>;
    }

    return (
        <div className='w-[90%] mx-auto my-10'>
            <Head>
                <title>Message</title>
            </Head>
            <div className="flex flex-col md:flex-row">
                <div className="md:w-[20%] md:mr-5">
                    <div className="hidden md:block">
                        <Button onClick={onOpen} variant="outline" leftIcon={<FaPlus />} className="w-full mb-[30px]">参加する</Button>
                    </div>
                    {auth.currentUser && <RoomList userId={auth.currentUser.uid} currentGroup={groupId as string} />}
                </div>
                <div className="md:w-[80%] py-5 md:py-0">
                    {groupId && currentUser && (
                        <>
                            <ChatComponent groupId={groupId as string} currentUser={currentUser} userIDs={userIDs} />
                        </>
                    )}
                </div>
            </div>

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
                            <Button colorScheme='teal' onClick={handleJoinGroup} ml={3}>
                                参加
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </div>
    );
};

export default GroupChat;