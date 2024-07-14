import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '@/firebase/firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Text, VStack, Avatar } from '@chakra-ui/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Empty, Input, Button, Upload, message, Image, Divider } from "antd";
import { FiUpload, FiNavigation, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { useRouter } from 'next/router';

interface Message {
    id: string;
    message: string;
    fileURL?: string;
    sender: string;
    timestamp: any;
}

interface User {
    displayName: string;
    photoURL: string;
}

interface ChatComponentProps {
    groupId: string;
    currentUser: any;
    userIDs: { [key: string]: string };
}

const ChatComponent: React.FC<ChatComponentProps> = ({ groupId, currentUser, userIDs }) => {
    const [messageText, setMessageText] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [fileURL, setFileURL] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);
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

    const handleSendMessage = async () => {
        if (!messageText && !fileURL) {
            return;
        }

        setIsSending(true);

        const messagesRef = collection(db, 'groups', groupId, 'messages');
        const newMessage = {
            message: messageText,
            fileURL,
            sender: auth.currentUser?.uid,
            timestamp: new Date()
        };

        try {
            await addDoc(messagesRef, newMessage);
        } catch (error) {
            console.error("Error sending message: ", error);
        }

        setMessageText('');
        setFile(null);
        setFileURL('');
        setIsSending(false);
        scrollToBottom();
    };

    const handleBeforeUpload = async (file: File) => {
        setIsUploading(true);
        const storageRef = ref(storage, `groups/${groupId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const fileURL = await getDownloadURL(storageRef);
        setFile(file);
        setFileURL(fileURL);
        setIsUploading(false);
        return false;
    };

    const groupMessagesByDate = (messages: Message[]) => {
        const groupedMessages: { [key: string]: Message[] } = {};

        messages.forEach((message) => {
            const dateKey = format(new Date(message.timestamp.toDate()), 'yyyy-MM-dd');
            if (!groupedMessages[dateKey]) {
                groupedMessages[dateKey] = [];
            }
            groupedMessages[dateKey].push(message);
        });

        return groupedMessages;
    };

    const groupedMessages = groupMessagesByDate(messages);

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
                    <>
                        {Object.keys(groupedMessages).map((dateKey) => (
                            <div key={dateKey} className="space-y-[12.5px]">
                                <div className="flex justify-center">
                                    <Divider>
                                        <Text className="bg-blue-50 text-xs text-blue-500 px-1.5 rounded-full">
                                            {format(new Date(dateKey), 'MMMM dd')}
                                        </Text>
                                    </Divider>
                                </div>
                                {groupedMessages[dateKey].map((msg, index) => {
                                    const user = users[msg.sender];
                                    return (
                                        <div key={msg.id}>
                                            <div className="flex">
                                                {msg.sender !== auth.currentUser?.uid && (
                                                    <Link href={`/users/${userIDs[msg.sender]}`}>
                                                        <Avatar
                                                            src={user?.photoURL || `https://api.dicebear.com/9.x/thumbs/svg?seed=${user?.displayName.length}`} 
                                                            name={user?.displayName}
                                                            size="sm"
                                                            className="mr-1.5"
                                                        />
                                                    </Link>
                                                )}
                                                <div className={msg.sender === auth.currentUser?.uid ? 'ml-auto' : ''}>
                                                    <div
                                                        className={`w-fit px-[12.5px] py-2.5 rounded-md ${
                                                            msg.sender === auth.currentUser?.uid ? 'bg-blue-100' : 'bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="space-y-1.5">
                                                            <Text>{msg.message}</Text>
                                                            {msg.fileURL && (
                                                                <Image src={msg.fileURL} className='max-w-60' />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex">
                                                        <Text className={`mt-0.5 text-xs opacity-50 ${msg.sender === auth.currentUser?.uid && 'ml-auto'}`}>
                                                            {format(new Date(msg.timestamp.toDate()), 'HH:mm')}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </>
                )}
            </VStack>
            <div className="w-full space-x-2.5 flex fixed md:static bottom-0 bg-white left-0 border-t md:border-none p-[12.5px] md:p-0">
                {messages.length > 0 && (
                    <div className="flex">
                        {!isAtTop && <Button icon={<FiArrowUp />} onClick={scrollToTop} />}
                        {isAtTop && <Button icon={<FiArrowDown />} onClick={scrollToBottom} />}
                    </div>
                )}
                <Input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="メッセージを入力"
                />
                <div className="hidden md:flex space-x-2.5">
                    <Upload beforeUpload={handleBeforeUpload} showUploadList={false}>
                        <Button icon={<FiUpload />} type="dashed" loading={isUploading}>
                            {file ? 'アップロード済み' : 'アップロード'}
                        </Button>
                    </Upload>
                    <Button onClick={handleSendMessage} type="primary" loading={isSending}>
                        送信
                    </Button>
                </div>
                <div className='flex md:hidden space-x-3'>
                    <Button icon={<FiNavigation />} onClick={handleSendMessage} type="primary" loading={isSending} />
                    <Upload beforeUpload={handleBeforeUpload} showUploadList={false}>
                        <Button icon={<FiUpload />} type="dashed" loading={isUploading} />
                    </Upload>
                </div>
            </div>
        </div>
    );
};

export default ChatComponent;