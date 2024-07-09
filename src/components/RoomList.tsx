import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, arrayRemove, doc, getDoc, arrayUnion } from 'firebase/firestore';
import { Spinner, Text, Heading, useDisclosure, useToast, Avatar, Divider, Button, AlertDialog, AlertDialogBody, AlertDialogHeader, AlertDialogFooter, AlertDialogOverlay, AlertDialogContent, Menu, MenuButton, MenuList, MenuItem, Input } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { FaMinus } from 'react-icons/fa';

const RoomList = ({ userId, currentGroup }: { userId: string; currentGroup: string }) => {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isJoinOpen, onOpen: onJoinOpen, onClose: onJoinClose } = useDisclosure();
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [joinGroupID, setJoinGroupID] = useState('');
    const cancelRef = useRef(null);
    const toast = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchRooms = async () => {
            setLoading(true);
            const roomsRef = collection(db, 'groupChat');
            const q = query(roomsRef, where('participants', 'array-contains', userId));
            const querySnapshot = await getDocs(q);
            const roomList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRooms(roomList);
            setLoading(false);
        };

        if (userId) {
            fetchRooms();
        }
    }, [userId]);

    const handleLeaveRoom = async () => {
        try {
            if (!selectedRoom?.id) {
                throw new Error('選択されたルームがありません。');
            }

            const roomDocRef = doc(db, 'groupChat', selectedRoom.id);
            const roomDocSnapshot = await getDoc(roomDocRef);

            if (!roomDocSnapshot.exists()) {
                throw new Error('指定されたルームが存在しません。');
            }

            await updateDoc(roomDocRef, {
                participants: arrayRemove(userId)
            });

            setRooms(prevRooms => prevRooms.filter(room => room.id !== selectedRoom.id));
            toast({
                title: 'グループを離脱しました。',
                description: `${selectedRoom.groupName}から離脱しました`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            onClose();
        } catch (error) {
            toast({
                title: 'エラー',
                description: `グループの離脱に失敗しました。`,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

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

            onJoinClose();
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

    const confirmLeaveRoom = (room: any) => {
        setSelectedRoom(room);
        onOpen();
    };

    const currentRoom = rooms.find(room => room.groupID === currentGroup);
    const currentRoomName = currentRoom?.groupName || "参加しているグループ";

    if (loading) {
        return <div className="w-full min-h-screen md:flex justify-center items-center hidden"><Spinner size="xl" /></div>;
    }

    return (
        <div>
            <div className="mb-10 md:mb-0 hidden md:block md:sticky md:top-10">
                <Heading size="sm" className="mb-5">参加しているグループ</Heading>
                <div className="p-3 space-y-3 max-h-80 overflow-y-auto border rounded-md">
                    {rooms.length > 0 ? (
                        rooms.map((room, index) => (
                            <>
                                <div key={index} className={`flex rounded-md p-[7.5px] ${room.groupID === currentGroup ? 'bg-blue-50' : ''}`}>
                                    <NextLink href={`/message/${room.groupID}`}>
                                        <Avatar src="NONE" name={room.groupName} size="sm" rounded="md" />
                                    </NextLink>
                                    <div className="ml-2.5 flex flex-col justify-center">
                                        <NextLink href={`/message/${room.groupID}`}>
                                            <Text className="text-md font-bold">{room.groupName}</Text>
                                        </NextLink>
                                    </div>
                                    {room.groupID === currentGroup && (
                                        <Button colorScheme="red" size="sm" variant="link" className="ml-auto" onClick={() => confirmLeaveRoom(room)}><FaMinus /></Button>
                                    )}
                                </div>
                                {index < rooms.length - 1 && <Divider />}
                            </>
                        ))
                    ) : (
                        <div className="w-full flex justify-center">
                            <Text className="text-slate-500 mb-5">参加しているグループが見つかりませんでした。</Text>
                        </div>
                    )}
                </div>
            </div>
            <div className="md:hidden fixed top-[60px] left-0 z-40 w-full">
                <Menu>
                    <MenuButton as={Button} rightIcon={<ChevronDownIcon />} rounded="none" width="full">
                        {currentRoomName}
                    </MenuButton>
                    <MenuList>
                        {rooms.length > 0 ? (
                            rooms.map(room => (
                                <MenuItem key={room.id}>
                                    <NextLink href={`/message/${room.groupID}`}>
                                        <Avatar src="NONE" name={room.groupName} size="sm" rounded="md" className="mr-2.5" />
                                    </NextLink>
                                    <NextLink href={`/message/${room.groupID}`}>
                                        {room.groupName}
                                    </NextLink>
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem disabled>
                                参加しているグループが見つかりませんでした。
                            </MenuItem>
                        )}
                        <Divider className='my-2.5' />
                        <MenuItem px="3" onClick={onJoinOpen}>
                            <FiPlus className="mr-2.5" />参加する
                        </MenuItem>
                        {currentRoom && (
                            <MenuItem px="3" textColor="red" onClick={() => confirmLeaveRoom(currentRoom)}>
                                <FiMinus className="mr-2.5" />{currentRoomName}を離脱する
                            </MenuItem>
                        )}
                    </MenuList>
                </Menu>
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
                            グループを離れる
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            本当に{selectedRoom?.groupName}を離れますか？
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                                キャンセル
                            </Button>
                            <Button colorScheme='red' onClick={handleLeaveRoom} className="ml-3">
                                離脱
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            <AlertDialog
                isOpen={isJoinOpen}
                leastDestructiveRef={cancelRef}
                onClose={onJoinClose}
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
                            <Button ref={cancelRef} onClick={onJoinClose}>
                                キャンセル
                            </Button>
                            <Button colorScheme='teal' onClick={handleJoinGroup} className="ml-3">
                                参加
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </div>
    );
};

export default RoomList;