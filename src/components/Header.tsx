import React, { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { auth, db } from '@/firebase/firebaseConfig';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { Modal, Button, Avatar, Dropdown, Menu, Divider } from 'antd';
import { FiLogOut, FiSearch, FiSettings, FiUser } from 'react-icons/fi';

const Header: FC = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userID, setUserID] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string>('');
    const [photoURL, setPhotoURL] = useState<string>('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setUserID(userData.userID);
                        setDisplayName(userData.displayName || 'ユーザーページ');
                        setPhotoURL(userData.photoURL || '');
                    }
                } catch (error) {
                    console.error('Failed to fetch user data:', error);
                }
            } else {
                setUser(null);
                setUserID(null);
                setDisplayName('');
                setPhotoURL('');
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error('Failed to log out:', error);
        } finally {
            setLoading(false);
            setIsModalOpen(false);
        }
    };

    const handleLogoutClick = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const menu = (
        <Menu>
            <Menu.Item key="profile" icon={<FiUser />}>
                <Link href={`/users/${userID}`}>{displayName}</Link>
            </Menu.Item>
            <Menu.Item key="settings" icon={<FiSettings />}>
                <Link href="/settings">設定</Link>
            </Menu.Item>
            <Divider className='my-[5px]' />
            <Menu.Item key="logout" onClick={handleLogoutClick} icon={<FiLogOut />}>
                ログアウト
            </Menu.Item>
        </Menu>
    );

    return (
        <>
            <div className="sticky z-50 bg-white px-5 py-2.5 hidden md:flex items-center">
                <Link href="/" ><img src="/logo.png" className="w-[100px]" /></Link>
                <div className="flex space-x-5 ml-5">
                    <Link href="/feed">フィード</Link>
                    <Link href="/following">フォロー中</Link>
                    <Link href="/message">メッセージ</Link>
                </div>
                <div className="ml-auto flex items-center space-x-5">
                    <Link href="/search"><FiSearch className="text-gray-500 text-xl" /></Link>
                    <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
                        <div className="w-fit h-fit border rounded-full overflow-hidden cursor-pointer">
                            <Avatar src={photoURL} size="large" />
                        </div>
                    </Dropdown>
                    <Button type="primary">
                        <Link href="/editor">新規作成</Link>
                    </Button>

                </div>
            </div>

            <Modal
                title="ログアウト"
                visible={isModalOpen}
                onOk={handleLogout}
                onCancel={handleCancel}
                okText="Logout"
                confirmLoading={loading}
                centered
            >
                <p>本当にログアウトしますか？</p>
            </Modal>
        </>
    );
};

export default Header;