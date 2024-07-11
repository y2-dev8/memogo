import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '@/firebase/firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Text, VStack, HStack, Avatar } from '@chakra-ui/react';
import NextLink from 'next/link';
import { format } from 'date-fns';
import { Empty, Input, Button, Upload, message } from "antd";
import { UploadOutlined } from '@ant-design/icons';
import { FiUpload, FiNavigation } from "react-icons/fi";

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
    const chatContainerRef = useRef<HTMLDivElement | null>(null);

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

            // Scroll to the bottom of the chat
            scrollToBottom();
        });

        return () => unsubscribe();
    }, [groupId]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
            fetchUsers();
        }
    }, [messages]);

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
        }
    };

    const handleSendMessage = async () => {
        if (!messageText && !fileURL) {
            message.error('メッセージもしくはファイルが必要です。');
            return;
        }

        setIsSending(true);

        const messagesRef = collection(db, 'groups', groupId, 'messages');

        await addDoc(messagesRef, {
            message: messageText,
            fileURL,
            sender: auth.currentUser?.uid,
            timestamp: new Date()
        });

        setMessageText('');
        setFile(null);
        setFileURL('');
        setIsSending(false);
    };

    const handleBeforeUpload = async (file: File) => {
        setIsUploading(true);
        const storageRef = ref(storage, `groups/${groupId}/messages/${file.name}`);
        await uploadBytes(storageRef, file);
        const fileURL = await getDownloadURL(storageRef);
        setFile(file);
        setFileURL(fileURL);
        setIsUploading(false);
        return false;
    };

    return (
        <div className="w-full">
            <VStack align="stretch" className="space-y-1 md:mb-5 pt-[15px] pb-[50px] md:py-0 h-[80vh] overflow-y-auto scrollbar" ref={chatContainerRef}>
                {messages.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <Empty description="No chat yet." />
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const user = users[msg.sender];
                        return (
                            <div
                                key={index}
                                className={`w-fit p-3 rounded-md ${
                                    msg.sender === auth.currentUser?.uid ? 'ml-auto bg-blue-100' : 'bg-gray-50'
                                }`}
                            >
                                <HStack align="start" spacing="3">
                                    <NextLink href={`/users/${userIDs[msg.sender]}`} passHref>
                                        <Avatar
                                            src={user?.photoURL || `https://api.dicebear.com/9.x/thumbs/svg?seed=${user?.displayName.length}`} 
                                            name={user?.displayName}
                                            size="md"
                                        />
                                    </NextLink>
                                    <div>
                                        <div className="flex items-center">
                                            <NextLink href={`/users/${userIDs[msg.sender]}`} passHref>
                                                <p className="text-md font-bold">{user?.displayName || '匿名'}</p>
                                            </NextLink>
                                            <Text className="ml-2.5 opacity-50 text-xs">{format(new Date(msg.timestamp.toDate()), 'yyyy-MM-dd HH:mm')}</Text>
                                        </div>
                                        <Text>{msg.message}</Text>
                                        {msg.fileURL && (
                                            <img src={msg.fileURL} alt="attachment" className='my-[5px] max-w-full md:max-w-60 rounded-md' />
                                        )}
                                    </div>
                                </HStack>
                            </div>
                        );
                    })
                )}
            </VStack>
            <div
                className="w-full space-x-3 flex fixed md:static bottom-0 bg-white left-0 border-t md:border-none p-[12.5px] md:p-0"
            >
                <Input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="メッセージを入力"
                />
                <div className="hidden md:flex space-x-3">
                    <Upload beforeUpload={handleBeforeUpload} showUploadList={false}>
                        <Button icon={<FiUpload />} type="dashed" loading={isUploading}>
                                {file ? 'アップロード済み' : 'アップロード'}
                        </Button>
                    </Upload>
                    <Button onClick={handleSendMessage} type="primary" loading={isSending}>
                        送信する
                    </Button>
                </div>
                <div className='flex md:hidden space-x-3'>
                    <Upload beforeUpload={handleBeforeUpload} showUploadList={false}>
                        <Button icon={<FiUpload />} type="dashed" loading={isUploading} />
                    </Upload>
                    <Button icon={<FiNavigation />} onClick={handleSendMessage} type="primary" loading={isSending} />
                </div>
            </div>
        </div>
    );
};

export default ChatComponent;