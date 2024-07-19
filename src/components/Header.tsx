import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth, db } from '@/firebase/firebaseConfig';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { Button, Avatar, Dropdown, Menu, Divider } from 'antd';
import { FiBell, FiBookmark, FiList, FiLogOut, FiMessageCircle, FiSearch, FiSettings, FiUser, FiUsers } from 'react-icons/fi';
import { HappyProvider } from '@ant-design/happy-work-theme'

export default function Header() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
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
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    const menu = (
        <Menu>
            <Menu.Item key="profile" icon={<FiUser />}>
                <Link href={`/u/${userID}`}>{displayName}</Link>
            </Menu.Item>
            <Menu.Item key="settings" icon={<FiSettings />}>
                <Link href="/settings">設定</Link>
            </Menu.Item>
            <Menu.Item key="message" icon={<FiMessageCircle />}>
                <Link href="/m">メッセージ</Link>
            </Menu.Item>
            <Divider className='my-[5px]' />
            <Menu.Item key="list" icon={<FiList />}>
                <Link href="/dashboard">記事の管理</Link>
            </Menu.Item>
            <Menu.Item key="bookmarks" icon={<FiBookmark />}>
                <Link href="/bookmarks">ブックマーク</Link>
            </Menu.Item>
            <Menu.Item key="following" icon={<FiUsers />}>
                <Link href="/following">フォロー中</Link>
            </Menu.Item>
            <Divider className='my-[5px]' />
            <Menu.Item key="logout" onClick={handleLogout} icon={<FiLogOut />}>
                ログアウト
            </Menu.Item>
        </Menu>
    );

    return (
        <HappyProvider>
            <div className="sticky z-50 bg-white px-5 py-2.5 flex items-center">
                <Link href="/"><img src="/lol.png" className="w-[50px]" /></Link>
                <div className="ml-auto flex items-center space-x-5">
                    <Link href="/search"><FiSearch className="text-gray-500 text-xl" /></Link>
                    <Link href="/notification"><FiBell className="text-gray-500 text-xl" /></Link>
                    {user ? (
                        <>
                            <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
                                <div className="w-fit h-fit border rounded-full overflow-hidden cursor-pointer">
                                    <Avatar src={photoURL} size="large" />
                                </div>
                            </Dropdown>
                            <Button type="primary" className="hidden md:block">
                                <Link href="/editor">記事を作成</Link>
                            </Button>
                        </>
                    ) : (
                        <Button type="primary">
                            <Link href="/login">ログイン</Link>
                        </Button>
                    )}
                </div>
            </div>
        </HappyProvider>
    );
};