import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { useDisclosure } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Button, Modal, Input, List, message, Drawer, Typography, Space, Spin, Avatar, Tooltip } from 'antd';
import { PlusOutlined, MenuOutlined } from '@ant-design/icons';

const RoomList = ({ userId, currentGroup }: { userId: string; currentGroup: string }) => {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isJoinOpen, onOpen: onJoinOpen, onClose: onJoinClose } = useDisclosure();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [joinGroupID, setJoinGroupID] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const cancelRef = useRef(null);
    const toast = message;
    const router = useRouter();

    useEffect(() => {
        const fetchRooms = async () => {
            setLoading(true);
            const roomsRef = collection(db, 'groups');
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

    const handleJoinGroup = async () => {
        setJoinLoading(true);
        try {
            const groupIDQuery = query(collection(db, 'groups'), where('groupID', '==', joinGroupID));
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

    const showDrawer = () => {
        setDrawerVisible(true);
    };

    const closeDrawer = () => {
        setDrawerVisible(false);
    };

    return (
        <div>
            <div className="hidden md:block">
                <List
                    dataSource={[...rooms, { isJoinItem: true }]}
                    renderItem={(room, index) => (
                        <List.Item key={room.id || 'join'} style={{ borderBottom: 'none', paddingTop: 0, paddingBottom: "1em" }}>
                            {room.isJoinItem ? (
                                <div>
                                    <Avatar icon={<PlusOutlined />} onClick={onJoinOpen} size="large" className="cursor-pointer bg-gray-100 text-blue-500" />
                                </div>
                            ) : (
                                <Tooltip title={room.groupName} placement="right">
                                    <NextLink href={`/message/${room.groupID}`}>
                                        <Space>
                                            <Avatar
                                                src={`https://api.dicebear.com/9.x/shapes/svg?seed=${room.groupName.length}`}
                                                className={room.groupID === currentGroup ? 'avatar-square' : 'avatar-circle'}
                                                size="large"
                                            />
                                        </Space>
                                    </NextLink>
                                </Tooltip>
                            )}
                        </List.Item>
                    )}
                />
            </div>
            <div className="md:hidden fixed top-[60px] left-0 z-40 w-full">
                <Button icon={<MenuOutlined />} type="text" onClick={showDrawer} size='large' />
                <Drawer
                    title="参加しているグループ"
                    placement="left"
                    onClose={closeDrawer}
                    visible={drawerVisible}
                >
                    <List
                        dataSource={[...rooms, { isJoinItem: true }]}
                        renderItem={(room, index) => (
                            <List.Item key={room.id || 'join'} style={{ borderBottom: 'none', paddingTop: 0, paddingBottom: "1em" }}>
                                {room.isJoinItem ? (
                                    <div>
                                        <Avatar icon={<PlusOutlined />} onClick={onJoinOpen} size="large" className="cursor-pointer bg-gray-100 text-blue-500" />
                                    </div>
                                ) : (
                                    <NextLink href={`/message/${room.groupID}`}>
                                        <Space>
                                            <Avatar
                                                src={`https://api.dicebear.com/9.x/shapes/svg?seed=${room.groupName.length}`}
                                                className={room.groupID === currentGroup ? 'avatar-square' : 'avatar-circle'}
                                                size="large"
                                            />
                                            <Typography.Text className="font-bold">
                                                {room.groupName}
                                            </Typography.Text>
                                        </Space>
                                    </NextLink>
                                )}
                            </List.Item>
                        )}
                    />
                </Drawer>
            </div>
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