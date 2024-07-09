import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '@/firebase/firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button, Text, VStack, HStack, Link, useToast, Avatar, Spinner } from '@chakra-ui/react';
import { FaUpload } from 'react-icons/fa';
import NextLink from 'next/link';
import { format } from 'date-fns';
import { Empty, Input } from "antd"

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
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const toast = useToast();

    useEffect(() => {
        if (!groupId) return;

        const messagesRef = collection(db, 'groupChat', groupId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
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
        if (!message && !file) {
            toast({
                title: 'エラー',
                description: 'メッセージもしくは画像が必要です。',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setIsSending(true);

        const messagesRef = collection(db, 'groupChat', groupId, 'messages');
        let fileURL = '';

        if (file) {
            const storageRef = ref(storage, `groupChat/${groupId}/messages/${file.name}`);
            await uploadBytes(storageRef, file);
            fileURL = await getDownloadURL(storageRef);
        }

        await addDoc(messagesRef, {
            message,
            fileURL,
            sender: auth.currentUser?.uid,
            senderName: currentUser?.displayName || '匿名',
            senderPhotoURL: currentUser?.photoURL || '',
            timestamp: new Date()
        });

        setMessage('');
        setFile(null);
        setIsSending(false);
    };

    return (
        <div className="w-full">
            <VStack align="stretch" className="space-y-1 mb-5 pb-[50px] md:pb-0 h-[75vh] overflow-y-auto" ref={chatContainerRef}>
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
                                <NextLink href={`/${userIDs[msg.sender]}`}>
                                    <Avatar src={msg.senderPhotoURL} name={msg.senderName} size="md" />
                                </NextLink>
                                <div>
                                    <div className="flex items-center">
                                        <NextLink href={`/${userIDs[msg.sender]}`} passHref>
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
            <div className="fixed w-full left-0 md:sticky bottom-0 p-3 bg-white border md:rounded-md md:shadow-sm space-y-3 md:space-y-0 md:space-x-3 md:flex">
                <Input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="メッセージを入力..."
                />
                <div className="flex space-x-3">
                    <Button
                        leftIcon={<FaUpload />}
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="w-full md:w-auto"
                    >
                        {file ? 'アップロード済み' : 'アップロード'}
                    </Button>
                    <Button
                        onClick={handleSendMessage}
                        colorScheme="teal"
                        className="w-full md:w-auto"
                        isDisabled={isSending}
                    >
                        {isSending ? <Spinner size="sm" /> : '送信'}
                    </Button>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default ChatComponent;