import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, addDoc, doc, arrayRemove, arrayUnion } from 'firebase/firestore';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Button, Modal, Input, List, message, Drawer, Typography, Space, Avatar, Tooltip, Select, Dropdown, Menu } from 'antd';
import { PlusOutlined, MinusOutlined, EllipsisOutlined } from '@ant-design/icons';
import { FiChevronLeft } from "react-icons/fi";

const RoomList = ({ userId, currentGroup }: { userId: string; currentGroup: string }) => {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isLeaveOpen, setIsLeaveOpen] = useState(false);
    const [isLeaveSelectOpen, setIsLeaveSelectOpen] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [joinGroupID, setJoinGroupID] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [leaveLoading, setLeaveLoading] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupID, setGroupID] = useState('');
    const [selectedLeaveRoomID, setSelectedLeaveRoomID] = useState('');
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

    const fetchRooms = async () => {
        const roomsRef = collection(db, 'groups');
        const q = query(roomsRef, where('participants', 'array-contains', userId));
        const querySnapshot = await getDocs(q);
        const roomList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRooms(roomList);
    };

    const handleJoinGroup = async () => {
        setJoinLoading(true);
        try {
            const groupIDQuery = query(collection(db, 'groups'), where('groupID', '==', joinGroupID));
            const groupIDSnapshot = await getDocs(groupIDQuery);

            if (groupIDSnapshot.empty) {
                toast.error('グループIDが存在しません。');
                setJoinLoading(false);
                return;
            }

            const groupDoc = groupIDSnapshot.docs[0].ref;
            await updateDoc(groupDoc, {
                participants: arrayUnion(auth.currentUser?.uid)
            });

            await fetchRooms();
            setIsJoinOpen(false);
            toast.success('グループの参加に成功しました!');
            router.push(`/message/${joinGroupID}`);
        } catch (error) {
            toast.error('グループの参加に失敗しました。');
            console.error('Error joining group:', error);
        } finally {
            setJoinLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        setCreateLoading(true);
        if (!groupName || !groupID) {
            toast.error('グループの名前とIDは必須です。');
            setCreateLoading(false);
            return;
        }

        if (!/^[a-zA-Z0-9._-]+$/.test(groupID)) {
            toast.error('グループIDはアルファベット、数字、ハイフン、アンダースコア、ドットのみを使用できます。');
            setCreateLoading(false);
            return;
        }

        try {
            const groupIDQuery = query(collection(db, 'groups'), where('groupID', '==', groupID));
            const groupIDSnapshot = await getDocs(groupIDQuery);

            if (!groupIDSnapshot.empty) {
                toast.error('このグループIDは既に使われています。');
                setCreateLoading(false);
                return;
            }

            await addDoc(collection(db, 'groups'), {
                groupName,
                groupID,
                participants: [auth.currentUser?.uid]
            });

            await fetchRooms();
            setIsCreateOpen(false);
            toast.success('グループの作成に成功しました!');
            router.push(`/message/${groupID}`);
        } catch (error) {
            toast.error('グループの作成に失敗しました。');
            console.error('Error creating group:', error);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleLeaveGroup = async () => {
        setLeaveLoading(true);
        if (!selectedLeaveRoomID) return;

        try {
            const groupDoc = doc(db, 'groups', selectedLeaveRoomID);
            await updateDoc(groupDoc, {
                participants: arrayRemove(auth.currentUser?.uid)
            });

            await fetchRooms();
            setIsLeaveOpen(false);
            toast.success('グループを離脱しました!');
            if (currentGroup === selectedLeaveRoomID) {
                router.push('/');
            }
        } catch (error) {
            toast.error('グループの離脱に失敗しました。');
            console.error('Error leaving group:', error);
        } finally {
            setLeaveLoading(false);
        }
    };

    const handleOpenSelectModal = () => {
        setIsSelectOpen(true);
    };

    const handleOpenLeaveSelectModal = () => {
        setIsLeaveSelectOpen(true);
    };

    const handleCloseSelectModal = () => {
        setIsSelectOpen(false);
    };

    const handleCloseJoinModal = () => {
        setIsJoinOpen(false);
    };

    const handleCloseCreateModal = () => {
        setIsCreateOpen(false);
    };

    const handleCloseLeaveModal = () => {
        setIsLeaveOpen(false);
    };

    const handleCloseLeaveSelectModal = () => {
        setIsLeaveSelectOpen(false);
    };

    const handleSelectCreate = () => {
        setIsSelectOpen(false);
        setIsCreateOpen(true);
    };

    const handleSelectJoin = () => {
        setIsSelectOpen(false);
        setIsJoinOpen(true);
    };

    const showDrawer = () => {
        setDrawerVisible(true);
    };

    const closeDrawer = () => {
        setDrawerVisible(false);
    };

    const handleConfirmLeave = () => {
        if (!selectedLeaveRoomID) {
            toast.error('グループを選択してください。');
            return;
        }
        setIsLeaveSelectOpen(false);
        setIsLeaveOpen(true);
    };

    const handleLeaveSelect = (value: string) => {
        setSelectedLeaveRoomID(value);
    };

    const handleLeave = (room: any) => {
        setSelectedLeaveRoomID(room.id);
        setIsLeaveOpen(true);
    };

    const menu = (
        <Menu>
            <Menu.Item key="1" icon={<PlusOutlined />} onClick={handleOpenSelectModal}>
                グループに参加する
            </Menu.Item>
            <Menu.Item key="2" icon={<MinusOutlined />} onClick={handleOpenLeaveSelectModal} danger>
                グループを離脱する
            </Menu.Item>
        </Menu>
    );

    return (
        <div>
            <div className="hidden md:block">
                <List
                    dataSource={[...rooms, { isJoinItem: true }]}
                    renderItem={(room) => (
                        <List.Item key={room.id || 'join'} style={{ borderBottom: 'none', paddingTop: 0, paddingBottom: "1em" }}>
                            {room.isJoinItem ? (
                                <div className="flex flex-col items-center">
                                    <Dropdown overlay={menu} trigger={['click']}>
                                        <Avatar icon={<EllipsisOutlined />} size="large" className="cursor-pointer bg-gray-50 text-blue-500" />
                                    </Dropdown>
                                </div>
                            ) : (
                                <Tooltip title={room.groupName} placement="right">
                                    <Space>
                                        <NextLink href={`/message/${room.groupID}`}>
                                            <Avatar
                                                src={`https://api.dicebear.com/9.x/shapes/svg?seed=${room.groupName.length}`}
                                                className={room.groupID === currentGroup ? 'avatar-square' : 'avatar-circle'}
                                                size="large"
                                            />
                                        </NextLink>
                                    </Space>
                                </Tooltip>
                            )}
                        </List.Item>
                    )}
                />
            </div>
            <div className="md:hidden fixed top-[60px] left-0 z-40 w-full">
                <Button icon={<FiChevronLeft className="text-xl" />} type="text" onClick={showDrawer} size='large' />
                <Drawer
                    title="参加しているグループ"
                    placement="left"
                    onClose={closeDrawer}
                    visible={drawerVisible}
                >
                    <List
                        dataSource={[...rooms, { isJoinItem: true }]}
                        renderItem={(room) => (
                            <List.Item key={room.id || 'join'} style={{ borderBottom: 'none', paddingTop: 0, paddingBottom: "1em" }}>
                                {room.isJoinItem ? (
                                    <div className="flex flex-col items-center">
                                        <Avatar icon={<PlusOutlined />} onClick={handleOpenSelectModal} size="large" className="cursor-pointer bg-gray-100 text-blue-500" />
                                    </div>
                                ) : (
                                    <div className="flex items-center w-full">
                                        <NextLink href={`/message/${room.groupID}`}>
                                            <Avatar
                                                src={`https://api.dicebear.com/9.x/shapes/svg?seed=${room.groupName.length}`}
                                                className={room.groupID === currentGroup ? 'avatar-square' : 'avatar-circle'}
                                                size="large"
                                            />
                                            <Typography.Text className="font-bold ml-2.5">
                                                {room.groupName}
                                            </Typography.Text>
                                        </NextLink>
                                        <Button type="link" danger className="ml-auto" onClick={() => handleLeave(room)}>離脱</Button>
                                    </div>
                                )}
                            </List.Item>
                        )}
                    />
                </Drawer>
            </div>
            <Modal
                title="グループの選択"
                visible={isSelectOpen}
                onCancel={handleCloseSelectModal}
                footer={null}
                centered
            >
                <div className="flex flex-col space-y-2.5">
                    <Button type="dashed" block onClick={handleSelectJoin}>グループに参加する</Button>
                    <Button type="primary" block onClick={handleSelectCreate}>グループを作成する</Button>
                </div>
            </Modal>
            <Modal
                title="新しいグループを作成する"
                visible={isCreateOpen}
                onOk={handleCreateGroup}
                onCancel={handleCloseCreateModal}
                okText="Create"
                okButtonProps={{ loading: createLoading }}
                centered
            >
                <Input
                    placeholder="グループの名前"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="mb-2.5"
                />
                <Input
                    placeholder="グループID"
                    value={groupID}
                    onChange={(e) => setGroupID(e.target.value)}
                />
            </Modal>
            <Modal
                title="新しいグループに参加する"
                visible={isJoinOpen}
                onOk={handleJoinGroup}
                onCancel={handleCloseJoinModal}
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
            <Modal
                title="グループを離脱しますか？"
                visible={isLeaveOpen}
                onOk={handleLeaveGroup}
                onCancel={handleCloseLeaveModal}
                okText="Leave"
                okButtonProps={{ loading: leaveLoading, danger: true }}
                centered
            >
                <Typography.Text>本当にグループを離脱しますか？この操作は取り消せません。</Typography.Text>
            </Modal>
            <Modal
                title="離脱するグループを選択"
                visible={isLeaveSelectOpen}
                onOk={handleConfirmLeave}
                onCancel={handleCloseLeaveSelectModal}
                okText="Select"
                centered
            >
                <Select
                    placeholder="グループを選択"
                    style={{ width: '100%' }}
                    onChange={handleLeaveSelect}
                >
                    {rooms.map((room) => (
                        <Select.Option key={room.id} value={room.id}>
                            {room.groupName}
                        </Select.Option>
                    ))}
                </Select>
            </Modal>
        </div>
    );
};

export default RoomList;