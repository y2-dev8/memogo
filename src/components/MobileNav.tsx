import React, { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { Box, Divider, Flex, IconButton, Stack, useDisclosure, Button, Image } from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { FiHome, FiUser, FiSettings, FiPenTool, FiUsers, FiBookmark, FiTruck, FiLogOut, FiHash, FiSearch, FiBook, FiLogIn, FiUserPlus, FiFeather, FiDroplet, FiMessageCircle } from 'react-icons/fi';
import { IconType } from 'react-icons';
import { auth, db } from '@/firebase/firebaseConfig';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { Modal } from 'antd';

interface MobileNavItemProps {
  icon: IconType;
  label: string;
  href: string;
}

const MobileNavItem: FC<MobileNavItemProps> = ({ icon, label, href }) => {
  return (
    <Link href={href}>
      <Flex className="mx-2.5 p-2.5 role-group text-center items-center">
        {icon && (
          <Box className="mr-3 text-base">
            {React.createElement(icon)}
          </Box>
        )}
        {label}
      </Flex>
    </Link>
  );
};

const MobileNav: FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userID, setUserID] = useState<string | null>(null);

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

  return (
    <>
      <Box className="fixed top-0 w-full z-50 md:hidden">
        <Flex
          as="nav"
          className="transition-all min-h-[60px] py-1.5 px-3 text-gray-600 bg-white justify-between items-center border-b"
        >
          <Link href="/"><Image src="/logo.png" alt='MemoGo' className="w-[100px]" /></Link>
          <IconButton
            size="md"
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label="Open Menu"
            onClick={isOpen ? onClose : onOpen}
            className="bg-transparent ml-auto"
          />
        </Flex>
        {isOpen ? (
          <Box className="bg-white shadow-sm h-screen pt-3">
            <Stack as="nav" spacing={3}>
              <MobileNavItem icon={FiHash} label="フィード" href="/feed" />
              <MobileNavItem icon={FiSearch} label="検索" href="/search" />
              {user && userID && <MobileNavItem icon={FiUser} label="プロフィール" href={`/u/${userID}`} />}
              {user && <MobileNavItem icon={FiUserPlus} label="フォロー中" href="/following" />}
              {user && <MobileNavItem icon={FiBookmark} label="ブックマーク" href="/bookmarks" />}
              {user && <MobileNavItem icon={FiFeather} label="エディター" href="/editor" />}
              {user && <MobileNavItem icon={FiMessageCircle} label="メッセージ" href="/m" />}
            </Stack>
            <Divider className='my-3' />
            <Stack as="nav" spacing={3}>
              {!user && <MobileNavItem icon={FiLogIn} label="ログイン" href="/login" />}
              {user && (
                <button onClick={handleLogoutClick} className="mx-2.5 p-2.5 role-group text-center items-center flex">
                  <Box className="mr-3 text-base">
                    <FiLogOut />
                  </Box>
                  ログアウト
                </button>
              )}
            </Stack>
          </Box>
        ) : null}
      </Box>

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

export default MobileNav;