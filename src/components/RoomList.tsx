import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore'; // arrayRemove, doc, getDoc, 
import { Avatar, useDisclosure } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Button, Modal, Input, List, Divider, message, Dropdown, Menu, Typography, Space, Spin } from 'antd';
import { DownOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';

const RoomList = ({ userId, currentGroup }: { userId: string; currentGroup: string }) => {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isJoinOpen, onOpen: onJoinOpen, onClose: onJoinClose } = useDisclosure();
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [joinGroupID, setJoinGroupID] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const cancelRef = useRef(null);
    const toast = message;
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

    // const handleLeaveRoom = async () => {
    //     setLeaveLoading(true);
    //     try {
    //         if (!selectedRoom?.id) {
    //             throw new Error('選択されたルームがありません。');
    //         }

    //         const roomDocRef = doc(db, 'groupChat', selectedRoom.id);
    //         const roomDocSnapshot = await getDoc(roomDocRef);

    //         if (!roomDocSnapshot.exists()) {
    //             throw new Error('指定されたルームが存在しません。');
    //         }

    //         await updateDoc(roomDocRef, {
    //             participants: arrayRemove(userId)
    //         });

    //         setRooms(prevRooms => prevRooms.filter(room => room.id !== selectedRoom.id));
    //         toast.success(`${selectedRoom.groupName}から離脱しました`);
    //         onClose();
    //     } catch (error) {
    //         toast.error('グループの離脱に失敗しました。');
    //     } finally {
    //         setLeaveLoading(false);
    //     }
    // };

    const handleJoinGroup = async () => {
        setJoinLoading(true);
        try {
            const groupIDQuery = query(collection(db, 'groupChat'), where('groupID', '==', joinGroupID));
            const groupIDSnapshot = await getDocs(groupIDQuery);

            if (groupIDSnapshot.empty) {
                toast.error('グループIDが存在しません。');
                return;
            }

            const groupDoc = groupIDSnapshot.docs[0].ref;
            await updateDoc(groupDoc, {
                participants: arrayUnion(auth.currentUser?.uid)
            });

            onJoinClose();
            toast.success('グループの参加に成功しました!');
            router.push(`/message/${joinGroupID}`);
        } catch (error) {
            toast.error('グループの参加に失敗しました。');
            console.error('Error joining group:', error);
        } finally {
            setJoinLoading(false);
        }
    };

    const confirmLeaveRoom = (room: any) => {
        setSelectedRoom(room);
        onOpen();
    };

    const currentRoom = rooms.find(room => room.groupID === currentGroup);
    const currentRoomName = currentRoom?.groupName || "参加しているグループ";

    if (loading) {
        return <div className="w-full min-h-screen flex justify-center items-center"><Spin size="large" /></div>;
    }

    const menu = (
        <Menu>
            {rooms.length > 0 ? (
                rooms.map(room => (
                    <Menu.Item key={room.id}>
                        <NextLink href={`/message/${room.groupID}`}>
                            <Space>
                                <Avatar src="NONE" name={room.groupName} size="sm" rounded="md" />
                                {room.groupName}
                            </Space>
                        </NextLink>
                    </Menu.Item>
                ))
            ) : (
                <Menu.Item disabled>
                    参加しているグループが見つかりませんでした。
                </Menu.Item>
            )}
            <Divider />
            <Menu.Item key="join" onClick={onJoinOpen}>
                <PlusOutlined /> 参加する
            </Menu.Item>
            {/* {currentRoom && (
                <Menu.Item key="leave" onClick={() => confirmLeaveRoom(currentRoom)} danger>
                    <MinusOutlined /> {currentRoomName}を離脱する
                </Menu.Item>
            )} */}
        </Menu>
    );

    return (
        <div>
            <div className="mb-10 md:mb-0 hidden md:block md:sticky md:top-10">
                <Typography.Title level={5}>参加しているグループ</Typography.Title>
                <List
                    bordered
                    dataSource={rooms}
                    renderItem={(room, index) => (
                        <List.Item
                            key={room.id}
                            // actions={[
                            //     room.groupID === currentGroup && (
                            //         <Button
                            //             type="link"
                            //             icon={<MinusOutlined />}
                            //             danger
                            //             onClick={() => confirmLeaveRoom(room)}
                            //         />
                            //     )
                            // ]}
                        >
                            <NextLink href={`/message/${room.groupID}`}>
                                <Space>
                                    <Avatar src="NONE" name={room.groupName} size="sm" rounded="md" />
                                    <Typography.Text>{room.groupName}</Typography.Text>
                                </Space>
                            </NextLink>
                        </List.Item>
                    )}
                />
            </div>
            <div className="md:hidden fixed top-[60px] left-0 z-40 w-full">
                <Dropdown overlay={menu} trigger={['click']}>
                    <Button className="rounded-none" type="primary" block>
                        {currentRoomName}
                    </Button>
                </Dropdown>
            </div>
            {/* <Modal
                title="グループを離れる"
                visible={isOpen}
                onOk={handleLeaveRoom}
                onCancel={onClose}
                okText="Leave"
                okButtonProps={{ danger: true, loading: leaveLoading }}
                centered
            >
                本当に{selectedRoom?.groupName}を離れますか？
            </Modal> */}

            <Modal
                title="新しいグループに参加する"
                visible={isJoinOpen}
                onOk={handleJoinGroup}
                onCancel={onJoinClose}
                okText="Join"
                okButtonProps={{ loading: joinLoading }}
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

export default RoomList;