import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Button, message } from 'antd';
import { FiBookmark } from 'react-icons/fi';
import { FaBookmark } from 'react-icons/fa';

type BookmarkButtonProps = {
    memoId: string;
};

const BookmarkButton = ({ memoId }: BookmarkButtonProps) => {
    const [bookmarked, setBookmarked] = useState(false);
    const currentUser = auth.currentUser;

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
                message.success('ブックマークを解除しました。');
            } else {
                await setDoc(docRef, {
                    userId: currentUser.uid,
                    memoId,
                    createdAt: new Date()
                });
                message.success('ブックマークしました。');
            }
            setBookmarked(!bookmarked);
        } catch (error) {
            console.error('ブックマークの操作中にエラーが発生しました:', error);
            message.error('ブックマークの操作中にエラーが発生しました。');
        }
    };

    return (
        <Button
            onClick={handleBookmark}
            className="bg-transparent border-none p-0 w-auto h-auto shadow-none"
            size="large"
            icon={bookmarked ? <FaBookmark className="text-yellow-500" /> : <FiBookmark className="text-gray-500 opacity-50" />}
        />
    );
};

export default BookmarkButton;