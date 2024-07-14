import { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { VStack } from '@chakra-ui/react';
import { Button } from "antd";
import { useRouter } from 'next/router';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Message, User } from '@/types';
import { FiArrowUp, FiArrowDown } from "react-icons/fi";

interface ChatComponentProps {
    groupId: string;
    currentUser: any;
    userIDs: { [key: string]: string };
}

const stampNames = [
    "Jack", "Bandit", "Kiki", "Harley", "Max",
    "Coco", "Cookie", "Boots", "Bubba", "Buster",
    "Loki", "Sassy", "Chester", "Snuggles", "Abby",
    "Fluffy", "Sam", "Cuddles", "Shadow", "Milo"
];

const ChatComponent: React.FC<ChatComponentProps> = ({ groupId, currentUser, userIDs }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [users, setUsers] = useState<{ [key: string]: User }>({});
    const [isAtTop, setIsAtTop] = useState<boolean>(false);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!groupId) return;

        const messagesRef = collection(db, 'groups', groupId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [groupId]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
            fetchUsers();
        }
    }, [messages]);

    useEffect(() => {
        const handleRouteChange = () => {
            scrollToBottom();
        };

        router.events.on('routeChangeComplete', handleRouteChange);

        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, [router]);

    const fetchUsers = async () => {
        const newUsers: { [key: string]: User } = {};
        for (const msg of messages) {
            if (!users[msg.sender]) {
                const userDoc = await getDoc(doc(db, 'users', msg.sender));
                if (userDoc.exists()) {
                    newUsers[msg.sender] = userDoc.data() as User;
                }
            }
        }
        setUsers(prevUsers => ({ ...prevUsers, ...newUsers }));
    };

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            setIsAtTop(false);
        }
    };

    const scrollToTop = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = 0;
            setIsAtTop(true);
        }
    };

    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop } = chatContainerRef.current;
        setIsAtTop(scrollTop === 0);
    };

    return (
        <div className="w-full">
            <VStack
                align="stretch"
                className="md:mb-5 pt-[15px] pb-[65px] md:py-0 h-[80vh] overflow-y-auto scrollbar"
                ref={chatContainerRef}
                onScroll={handleScroll}
            >
                {messages.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="flex flex-col justify-center text-center">
                            <img src="https://opendoodles.s3-us-west-1.amazonaws.com/float.svg" className="h-60 opacity-50 mb-5" />
                            <p className="text-lg opacity-50 font-semibold">楽しい会話を始めましょう</p>
                        </div>
                    </div>
                ) : (
                    <MessageList
                        messages={messages}
                        users={users}
                        userIDs={userIDs}
                        scrollToBottom={scrollToBottom}
                    />
                )}
            </VStack>
            <div className="w-full space-x-2.5 flex fixed md:static bottom-0 bg-white left-0 border-t md:border-none p-[12.5px] md:p-0">
                {messages.length > 0 && (
                    <div className="flex">
                        {!isAtTop && <Button icon={<FiArrowUp />} onClick={scrollToTop} />}
                        {isAtTop && <Button icon={<FiArrowDown />} onClick={scrollToBottom} />}
                    </div>
                )}
                <MessageInput
                    groupId={groupId}
                    scrollToBottom={scrollToBottom}
                    stampNames={stampNames}
                />
            </div>
        </div>
    );
};

export default ChatComponent;