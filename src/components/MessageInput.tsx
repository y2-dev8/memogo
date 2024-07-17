import { useState } from 'react';
import { auth, db, storage } from '@/firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Input, Button, Upload, Dropdown } from "antd";
import { FiUpload, FiSmile, FiNavigation } from "react-icons/fi";

interface MessageInputProps {
    groupId: string;
    scrollToBottom: () => void;
    stampNames: string[];
}

const MessageInput: React.FC<MessageInputProps> = ({ groupId, scrollToBottom, stampNames }) => {
    const [messageText, setMessageText] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [fileURL, setFileURL] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);

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

    const handleStampSelect = (stampName: string) => {
        setMessageText(prev => prev + `[stamp:${stampName}]`);
    };

    const stampMenu = (
        <div className="grid grid-cols-5 bg-white shadow-xl rounded-md overflow-hidden">
            {stampNames.map(name => (
                <div key={name} onClick={() => handleStampSelect(name)} className="cursor-pointer hover:bg-gray-100">
                    <img src={`https://api.dicebear.com/9.x/fun-emoji/svg?seed=${name}`} className="h-[75px]" />
                </div>
            ))}
        </div>
    );

    return (
        <div className="w-full flex space-x-2.5">
            <Upload beforeUpload={handleBeforeUpload} showUploadList={false}>
                <Button icon={<FiUpload />} type="text" loading={isUploading} />
            </Upload>
            <Input.Group compact className="flex-1">
                <Input
                    style={{ width: 'calc(100% - 32px)' }}
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="メッセージを入力"
                />
                <Dropdown overlay={stampMenu} trigger={['click']}>
                    <Button icon={<FiSmile />} type="default" />
                </Dropdown>
            </Input.Group>
            <Button icon={<FiNavigation />} onClick={handleSendMessage} type="primary" loading={isSending} className="rounded-full" />
        </div>
    );
};

export default MessageInput;