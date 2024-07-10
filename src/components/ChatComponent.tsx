import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '@/firebase/firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Text, VStack, HStack, Link, Avatar } from '@chakra-ui/react';
import { FaUpload } from 'react-icons/fa';
import NextLink from 'next/link';
import { format } from 'date-fns';
import { Empty, Input, Button, Upload, message } from "antd";
import { UploadOutlined } from '@ant-design/icons';

interface Message {
    id: string;
    message: string;
    fileURL?: string;
    sender: string;
    senderName: string;
    senderPhotoURL: string;
    timestamp: any;
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
    const chatContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!groupId) return;

        const messagesRef = collection(db, 'groupChat', groupId, 'messages');
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
        }
    }, [messages]);

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

        const messagesRef = collection(db, 'groupChat', groupId, 'messages');

        await addDoc(messagesRef, {
            message: messageText,
            fileURL,
            sender: auth.currentUser?.uid,
            senderName: currentUser?.displayName || '匿名',
            senderPhotoURL: currentUser?.photoURL || '',
            timestamp: new Date()
        });

        setMessageText('');
        setFile(null);
        setFileURL('');
        setIsSending(false);
    };

    const handleBeforeUpload = async (file: File) => {
        setIsUploading(true);
        const storageRef = ref(storage, `groupChat/${groupId}/messages/${file.name}`);
        await uploadBytes(storageRef, file);
        const fileURL = await getDownloadURL(storageRef);
        setFile(file);
        setFileURL(fileURL);
        setIsUploading(false);
        return false;
    };

    return (
        <div className="w-full">
            <VStack align="stretch" className="space-y-1 mb-5 pb-[50px] md:pb-0 h-[80vh] overflow-y-auto" ref={chatContainerRef}>
                {messages.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <Empty description="No chat yet." />
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`w-fit p-3 rounded-md ${
                                msg.sender === auth.currentUser?.uid ? 'lg:mr-5 ml-auto bg-blue-50' : 'bg-slate-50'
                            }`}
                        >
                            <HStack align="start" spacing="3">
                                <NextLink href={`/users/${userIDs[msg.sender]}`} passHref>
                                    <Link>
                                        <Avatar src={msg.senderPhotoURL} name={msg.senderName} size="md" />
                                    </Link>
                                </NextLink>
                                <div>
                                    <div className="flex items-center">
                                        <NextLink href={`/users/${userIDs[msg.sender]}`} passHref>
                                            <Link fontWeight="bold">{msg.senderName}</Link>
                                        </NextLink>
                                        <Text className="ml-2.5 opacity-50 text-xs text-slate-500">{format(new Date(msg.timestamp.toDate()), 'yyyy-MM-dd HH:mm')}</Text>
                                    </div>
                                    <Text>{msg.message}</Text>
                                    {msg.fileURL && (
                                        <img src={msg.fileURL} alt="attachment" className='my-[5px] max-w-full md:max-w-[200px] rounded-md' />
                                    )}
                                </div>
                            </HStack>
                        </div>
                    ))
                )}
            </VStack>
            <div className="w-full space-y-3 md:space-y-0 md:space-x-3 md:flex">
                <Input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="メッセージを入力"
                />
                <div className="flex space-x-3">
                    <Upload beforeUpload={handleBeforeUpload} showUploadList={false}>
                        <Button icon={<UploadOutlined />} type="dashed" loading={isUploading}>
                            {file ? 'アップロード済み' : 'アップロード'
                            }
                        </Button>
                    </Upload>
                    <Button
                        onClick={handleSendMessage}
                        type="primary"
                        loading={isSending}
                    >
                        送信する
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatComponent;