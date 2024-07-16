import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from 'antd';
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

interface LikeButtonProps {
    memoId: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({ memoId }) => {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const currentUser = auth.currentUser;

    useEffect(() => {
        const fetchLikes = async () => {
            const likesDoc = await getDoc(doc(db, 'likes', memoId));
            if (likesDoc.exists()) {
                const likesData = likesDoc.data();
                setLikesCount(likesData.count || 0);
                if (currentUser) {
                    setLiked(likesData.users.includes(currentUser.uid));
                }
            }
        };
        fetchLikes();
    }, [memoId, currentUser]);

    const handleLike = async () => {
        if (!currentUser) return;

        const likesDocRef = doc(db, 'likes', memoId);
        const likesDoc = await getDoc(likesDocRef);

        if (likesDoc.exists()) {
            const likesData = likesDoc.data();
            if (liked) {
                await setDoc(likesDocRef, {
                    count: likesData.count - 1,
                    users: likesData.users.filter((uid: string) => uid !== currentUser.uid)
                });
                setLikesCount(likesData.count - 1);
            } else {
                await setDoc(likesDocRef, {
                    count: likesData.count + 1,
                    users: [...likesData.users, currentUser.uid]
                });
                setLikesCount(likesData.count + 1);
            }
            setLiked(!liked);
        } else {
            await setDoc(likesDocRef, { count: 1, users: [currentUser.uid] });
            setLikesCount(1);
            setLiked(true);
        }
    };

    return (
        <Button
            onClick={handleLike}
            className="bg-transparent border-none p-0 w-auto h-auto shadow-none"
            size="large"
            icon={liked ? <FaHeart className="text-red-500" /> : <FiHeart className="text-gray-500 opacity-50" />}
        >
            {likesCount}
        </Button>
    );
};

export default LikeButton;