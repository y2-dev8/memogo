import { format } from 'date-fns';
import { Avatar } from '@chakra-ui/react';
import Link from 'next/link';
import { auth } from '@/firebase/firebaseConfig';
import { Message, User } from '@/types';
import { Divider, Image } from "antd";

interface MessageListProps {
    messages: Message[];
    users: { [key: string]: User };
    userIDs: { [key: string]: string };
    scrollToBottom: () => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, users, userIDs, scrollToBottom }) => {
    const renderMessageContent = (message: string) => {
        const stampRegex = /\[stamp:([^\]]+)\]/g;
        const parts = message.split(stampRegex);

        return (
            <div className="flex flex-wrap items-center">
                {parts.map((part, index) => {
                    if (index % 2 === 1) {
                        return (
                            <div className="inline-block w-10 select-none" key={index}>
                                <img src={`https://api.dicebear.com/9.x/fun-emoji/svg?seed=${part}`} className="inline-block" draggable="false" />
                            </div>
                        );
                    }
                    return <span key={index}>{part}</span>;
                })}
            </div>
        );
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
        <>
            {Object.keys(groupedMessages).map((dateKey) => (
                <div key={dateKey} className="space-y-[12.5px]">
                    <div className="flex justify-center">
                        <Divider>
                            <p className="bg-blue-50 text-xs text-blue-500 px-1.5 rounded-full">
                                {format(new Date(dateKey), 'MMMM dd')}
                            </p>
                        </Divider>
                    </div>
                    {groupedMessages[dateKey].map((msg) => {
                        const user = users[msg.sender];
                        return (
                            <div key={msg.id} className="flex">
                                {msg.sender !== auth.currentUser?.uid && (
                                    <Link href={`/u/${userIDs[msg.sender]}`}>
                                        <Avatar
                                            src={user?.photoURL || `https://api.dicebear.com/9.x/dylan/svg?seed=${user?.displayName.length}`}
                                            name={user?.displayName}
                                            size="sm"
                                            className="mr-1.5 select-none"
                                        />
                                    </Link>
                                )}
                                <div className={msg.sender === auth.currentUser?.uid ? 'ml-auto' : ''}>
                                    <div className={`w-fit px-[12.5px] py-2.5 rounded-md ${msg.sender === auth.currentUser?.uid ? 'bg-blue-100' : 'bg-gray-50'}`}>
                                        <div className="space-y-1.5">
                                            <p className="flex items-center">{renderMessageContent(msg.message)}</p>
                                            {msg.fileURL && (
                                                <Image src={msg.fileURL} className='max-w-60 select-none' />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex">
                                        <p className={`mt-0.5 text-xs opacity-50 ${msg.sender === auth.currentUser?.uid && 'ml-auto'}`}>
                                            {format(new Date(msg.timestamp.toDate()), 'HH:mm')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </>
    );
};

export default MessageList;