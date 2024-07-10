import { useState, useEffect } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { doc, updateDoc, arrayRemove, getDoc } from 'firebase/firestore';
import { Button, Dropdown, Input, Menu, Modal, message, Typography, Spin } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { Avatar } from '@chakra-ui/react';

const CurrentRoom = ({ currentGroupId, userId }: { currentGroupId: string; userId: string }) => {
    const [currentRoom, setCurrentRoom] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [renameLoading, setRenameLoading] = useState(false);
    const [leaveLoading, setLeaveLoading] = useState(false);
    const toast = message;

    useEffect(() => {
        const fetchCurrentRoom = async () => {
            const roomDocRef = doc(db, 'groupChat', currentGroupId);
            const roomDoc = await getDoc(roomDocRef);
            if (roomDoc.exists()) {
                setCurrentRoom({ id: roomDoc.id, ...roomDoc.data() });
                setNewGroupName(roomDoc.data().groupName);
            }
            setLoading(false);
        };

        if (currentGroupId) {
            fetchCurrentRoom();
        }
    }, [currentGroupId]);

    const handleRenameGroup = async () => {
        setRenameLoading(true);
        try {
            const roomDocRef = doc(db, 'groupChat', currentGroupId);
            await updateDoc(roomDocRef, { groupName: newGroupName });
            toast.success('グループ名が変更されました');
            setCurrentRoom((prev: any) => ({ ...prev, groupName: newGroupName }));
            setIsRenameModalOpen(false);
        } catch (error) {
            toast.error('グループ名の変更に失敗しました');
        } finally {
            setRenameLoading(false);
        }
    };

    const handleLeaveGroup = async () => {
        setLeaveLoading(true);
        try {
            const roomDocRef = doc(db, 'groupChat', currentGroupId);
            await updateDoc(roomDocRef, { participants: arrayRemove(userId) });
            toast.success('グループから離脱しました');
            setIsLeaveModalOpen(false);
        } catch (error) {
            toast.error('グループからの離脱に失敗しました');
        } finally {
            setLeaveLoading(false);
        }
    };

    if (loading) {
        return <div className="w-full min-h-screen flex justify-center items-center"><Spin size="large" /></div>;
    }

    if (!currentRoom) {
        return <div className="w-full min-h-screen flex justify-center items-center"><Typography.Text>グループが見つかりません。</Typography.Text></div>;
    }

    const menu = (
        <Menu>
            <Menu.Item onClick={() => setIsRenameModalOpen(true)}>
                グループ名を変更
            </Menu.Item>
            <Menu.Item onClick={() => setIsLeaveModalOpen(true)} danger>
                グループを離脱
            </Menu.Item>
        </Menu>
    );

    return (
        <div className="w-full p-5 border rounded-md">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Avatar src="NONE" name={currentRoom.groupName} size="lg" />
                    <Typography.Title level={4}>{currentRoom.groupName}</Typography.Title>
                </div>
                <Dropdown overlay={menu} trigger={['click']}>
                    <Button icon={<SettingOutlined />} />
                </Dropdown>
            </div>

            <Modal
                title="グループ名を変更"
                visible={isRenameModalOpen}
                onOk={handleRenameGroup}
                onCancel={() => setIsRenameModalOpen(false)}
                okText="変更"
                cancelText="キャンセル"
                okButtonProps={{ loading: renameLoading }}
                centered
            >
                <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="新しいグループ名"
                />
            </Modal>

            <Modal
                title="グループを離脱"
                visible={isLeaveModalOpen}
                onOk={handleLeaveGroup}
                onCancel={() => setIsLeaveModalOpen(false)}
                okText="離脱"
                cancelText="キャンセル"
                okButtonProps={{ loading: leaveLoading, danger: true }}
                centered
            >
                本当に{currentRoom.groupName}を離脱しますか？
            </Modal>
        </div>
    );
};

export default CurrentRoom;