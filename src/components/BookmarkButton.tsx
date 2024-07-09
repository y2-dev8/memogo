import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Button, useToast } from '@chakra-ui/react';
import { FaBookmark } from 'react-icons/fa';

type BookmarkButtonProps = {
    memoId: string;
};

const BookmarkButton = ({ memoId }: BookmarkButtonProps) => {
    const [bookmarked, setBookmarked] = useState(false);
    const currentUser = auth.currentUser;
    const toast = useToast();

    useEffect(() => {
        const fetchBookmark = async () => {
            if (!currentUser) return;
            const docRef = doc(db, 'bookmarks', `${currentUser.uid}_${memoId}`);
            const docSnap = await getDoc(docRef);
            setBookmarked(docSnap.exists());
        };
        fetchBookmark();
    }, [memoId, currentUser]);

    const handleBookmark = async () => {
        if (!currentUser) return;

        const docRef = doc(db, 'bookmarks', `${currentUser.uid}_${memoId}`);

        try {
            if (bookmarked) {
                await deleteDoc(docRef);
                toast({
                    title: 'ブックマークを解除しました。',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                await setDoc(docRef, {
                    userId: currentUser.uid,
                    memoId,
                    createdAt: new Date()
                });
                toast({
                    title: 'ブックマークしました。',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            }
            setBookmarked(!bookmarked);
        } catch (error) {
            console.error('ブックマークの操作中にエラーが発生しました:', error);
            toast({
                title: 'エラー',
                description: 'ブックマークの操作中にエラーが発生しました。',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <Button
            onClick={handleBookmark}
            background="none"
            border="none"
            p="0"
            minW="auto"
            height="auto"
            sx={{
                '&:hover': {
                    background: 'none',
                    color: 'inherit',
                },
            }}
        >
            <FaBookmark className={`${bookmarked ? 'text-yellow-500' : 'text-slate-300'}`} />
        </Button>
    );
};

export default BookmarkButton;