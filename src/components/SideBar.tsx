import React, { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, Image } from '@chakra-ui/react';
import { FiBookmark, FiDroplet, FiFeather, FiHash, FiLogIn, FiLogOut, FiMessageCircle, FiSearch, FiUser, FiUserPlus } from 'react-icons/fi';
import { getDoc, doc } from 'firebase/firestore';
import { Modal } from 'antd';

interface MenuItemProps {
    icon: React.ReactNode;
    href?: string;
    onClick?: () => void;
}

const SideBar: React.FC = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userID, setUserID] = useState<string | null>('placeholder');

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
                    }
                } catch (error) {
                    console.error('Failed to fetch userID:', error);
                }
            } else {
                setUser(null);
                setUserID(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            // router.push('/login');
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

    return (
        <>
            <div className="hidden md:flex sticky top-0 h-screen w-16 flex-col bg-white text-black shadow-sm border-r">
                <Link href="/" className='p-3'>
                    <Image src="/memogo.png" className="rounded-md" />
                </Link>
                <div className="flex-grow">
                    <MenuItem icon={<FiHash className="text-lg" />} href="/feed" />
                    <MenuItem icon={<FiSearch className="text-lg" />} href="/search" />
                    {user && <MenuItem icon={<FiUser className="text-lg" />} href={`/users/${userID}`} />}
                    {user && <MenuItem icon={<FiUserPlus className="text-lg" />} href='/following' />}
                    {user && <MenuItem icon={<FiBookmark className="text-lg" />} href='/bookmarks' />}
                    {user && <MenuItem icon={<FiFeather className="text-lg" />} href='/editor' />}
                    {user && <MenuItem icon={<FiMessageCircle className="text-lg" />} href='/message' />}
                </div>
                <div>
                    {!user && <MenuItem icon={<FiLogIn className="text-lg" />} href='/login' />}
                    {user && <MenuItem icon={<FiLogOut className="text-lg" />} onClick={handleLogoutClick} />}
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

const MenuItem: React.FC<MenuItemProps> = ({ icon, href, onClick }) => {
    if (href) {
        return (
            <Link href={href} className="h-16 flex items-center justify-center">
                {icon}
            </Link>
        );
    } else {
        return (
            <button className="h-16 w-full flex items-center justify-center" onClick={onClick}>
                {icon}
            </button>
        );
    }
};

export default SideBar;