import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { db, auth, storage } from '@/firebase/firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Image, Avatar, useDisclosure } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import Head from 'next/head';
import getCroppedImg from "@/utils/cropImage";
import FileInput from '@/components/settings/FileInput';
import CropModal from '@/components/settings/CropModal';
import DeleteAccountDialog from '@/components/settings/DeleteAccountDialog';
import { Form, Input, Button, Empty, message, Card, Row, Col, Spin } from "antd";

const { TextArea } = Input;

const Settings = () => {
    useAuthRedirect();
    const [user, setUser] = useState<any>(null);
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [headerFile, setHeaderFile] = useState<File | null>(null);
    const [photoURL, setPhotoURL] = useState('');
    const [headerPhotoURL, setHeaderPhotoURL] = useState('');
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [croppingHeader, setCroppingHeader] = useState(false);
    const [croppingAvatar, setCroppingAvatar] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<{ [key: string]: boolean }>({
        profile: false,
        header: false,
        avatar: false,
        delete: false,
        google: false,
        deleteHeader: false
    });

    const { isOpen: isDeleteDialogOpen, onOpen: onOpenDeleteDialog, onClose: onCloseDeleteDialog } = useDisclosure();
    const cancelRef = useRef(null);

    const currentUser = auth.currentUser;
    const router = useRouter();
    const fileInput = useRef<HTMLInputElement | null>(null);
    const headerFileInput = useRef<HTMLInputElement | null>(null);
    const avatarFileInput = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const fetchUser = async (user: any) => {
            if (user) {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setUser(userData);
                    setDisplayName(userData.displayName);
                    setBio(userData.bio);
                    setPhotoURL(userData.photoURL || '');
                    setHeaderPhotoURL(userData.headerPhotoURL || '');
                }
                setLoading(false);
            }
        };

        onAuthStateChanged(auth, (user) => {
            setLoading(true);
            fetchUser(user);
        });
    }, []);

    const showMessage = (content: string, type: "success" | "error") => {
        if (type === "success") {
            message.success(content);
        } else {
            message.error(content);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'header' | 'avatar') => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (type === 'header') {
                setHeaderFile(selectedFile);
                setCroppingHeader(true);
            } else if (type === 'avatar') {
                setFile(selectedFile);
                setCroppingAvatar(true);
            }
        }
    };

    const onCropComplete = (croppedArea: any, croppedAreaPixels: { x: number, y: number, width: number, height: number }) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropConfirm = async (type: 'header' | 'avatar') => {
        try {
            if ((file || headerFile) && croppedAreaPixels && currentUser) {
                const croppedImg = await getCroppedImg(URL.createObjectURL(type === 'header' ? headerFile! : file!), croppedAreaPixels);

                const fileRef = ref(storage, `${type === 'header' ? 'headerPictures' : 'profilePictures'}/${currentUser.uid}/${type}.jpg`);
                setProcessing(prev => ({ ...prev, [type]: true }));
                await uploadBytes(fileRef, croppedImg);
                const imageURL = await getDownloadURL(fileRef);

                const docRef = doc(db, 'users', currentUser.uid);
                await updateDoc(docRef, { [type === 'header' ? 'headerPhotoURL' : 'photoURL']: imageURL });

                if (type === 'header') {
                    setHeaderPhotoURL(imageURL);
                    setCroppingHeader(false);
                    setHeaderFile(null);
                } else {
                    setPhotoURL(imageURL);
                    setCroppingAvatar(false);
                    setFile(null);
                }
                setProcessing(prev => ({ ...prev, [type]: false }));
                showMessage(`${type === 'header' ? 'ヘッダー' : 'アイコン'}が更新されました。`, "success");
            }
        } catch (error) {
            console.error(error);
            setProcessing(prev => ({ ...prev, [type]: false }));
            showMessage(`${type === 'header' ? 'ヘッダー' : 'アイコン'}を更新することに失敗しました。`, "error");
        }
    };

    const updateProfile = async (values: { displayName: string; bio: string }) => {
        if (!values.displayName) {
            showMessage('名前は必須です。', 'error');
            return;
        }

        if (currentUser) {
            const docRef = doc(db, 'users', currentUser.uid);
            const updatedData: { [key: string]: any } = {
                displayName: values.displayName,
                bio: values.bio,
            };

            setProcessing(prev => ({ ...prev, profile: true }));
            await updateDoc(docRef, updatedData);

            setProcessing(prev => ({ ...prev, profile: false }));
            showMessage("プロフィールが更新されました。", "success");
        }
    };

    const confirmDeleteAccount = () => {
        onOpenDeleteDialog();
    };

    const deleteAccount = async () => {
        if (currentUser) {
            setProcessing(prev => ({ ...prev, delete: true }));
            await deleteDoc(doc(db, 'users', currentUser.uid));
            await deleteUser(currentUser);
            setProcessing(prev => ({ ...prev, delete: false }));
            showMessage("アカウントが削除されました。", "success");
            router.push('/register');
        }
    };

    const linkGoogleAccount = async () => {
        try {
            const provider = new GoogleAuthProvider();
            setProcessing(prev => ({ ...prev, google: true }));
            await signInWithPopup(auth, provider);
            setProcessing(prev => ({ ...prev, google: false }));
            showMessage("Googleアカウントとの連携に成功しました。", "success");
        } catch (error) {
            console.error(error);
            setProcessing(prev => ({ ...prev, google: false }));
            showMessage("Googleアカウントとの連携に失敗しました。", "error");
        }
    };

    const deleteHeaderImage = async () => {
        if (currentUser && headerPhotoURL) {
            const fileRef = ref(storage, `headerPictures/${currentUser.uid}/header.jpg`);
            try {
                setProcessing(prev => ({ ...prev, deleteHeader: true }));
                await deleteObject(fileRef);
                const docRef = doc(db, 'users', currentUser.uid);
                await updateDoc(docRef, { headerPhotoURL: '' });
                setHeaderPhotoURL('');
                setProcessing(prev => ({ ...prev, deleteHeader: false }));
                showMessage("ヘッダー画像が削除されました。", "success");
            } catch (error) {
                console.error(error);
                setProcessing(prev => ({ ...prev, deleteHeader: false }));
                showMessage("ヘッダー画像を削除することに失敗しました。", "error");
            }
        }
    };

    if (loading) return <div className="w-full min-h-screen flex justify-center items-center"><Spin size="large" /></div>;

    return (
        <div className="container mx-auto my-10">
            <Head>
                <title>Settings</title>
            </Head>
            <Layout>
                <div>
                    <FileInput onChange={handleFileChange} type='avatar' fileInputRef={avatarFileInput} />
                    <FileInput onChange={handleFileChange} type='header' fileInputRef={headerFileInput} />
                    <div className="flex flex-col w-full space-y-5">
                        <div className="flex flex-col space-y-3">
                            {headerPhotoURL ? (
                                <div className="rounded-md overflow-hidden border">
                                    <Image src={headerPhotoURL} className="w-full h-auto" />
                                </div>
                            ) : (
                                <div className="w-full h-[100px] flex items-center justify-center cursor-pointer rounded-md border overflow-hidden" onClick={() => headerFileInput.current?.click()}>
                                    <Empty description="ヘッダーを設定する" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                </div>
                            )}
                            {headerPhotoURL && (
                                <Button onClick={deleteHeaderImage} loading={processing.deleteHeader} danger>
                                    ヘッダーを削除する
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-3">
                            <Avatar src={photoURL} name={displayName} size="lg" className="cursor-pointer" onClick={() => avatarFileInput.current?.click()} />
                            <div className='w-full flex flex-col'>
                                <Form
                                    name="profile"
                                    initialValues={{ displayName, bio }}
                                    onFinish={updateProfile}
                                    autoComplete="off"
                                    layout="vertical"
                                >
                                    <Form.Item label="表示名" name="displayName" colon={false} rules={[{ required: true, message: '表示名を入力してください' }]}>
                                        <Input />
                                    </Form.Item>
                                    <Form.Item label="自己紹介" name="bio" colon={false}>
                                        <TextArea rows={3} />
                                    </Form.Item>
                                    <Form.Item className='flex justify-center'>
                                        <Button type="primary" htmlType="submit" loading={processing.profile}>
                                            更新する
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-10">
                    <Row gutter={[16, 16]}>
                        <Col span={24} md={12}>
                            <Card title="アカウント">
                                <Button onClick={linkGoogleAccount} loading={processing.google} type="default" block>
                                    Googleアカウントと連携する
                                </Button>
                            </Card>
                        </Col>
                        <Col span={24} md={12}>
                            <Card title="削除">
                                <Button onClick={confirmDeleteAccount} loading={processing.delete} danger block>
                                    アカウントを削除する
                                </Button>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Layout>
            <CropModal
                isOpen={isCropping || croppingHeader}
                onClose={() => { setIsCropping(false); setCroppingHeader(false); }}
                image={headerFile ? URL.createObjectURL(headerFile) : ''}
                crop={crop}
                zoom={zoom}
                aspect={20 / 5}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                handleCropConfirm={() => handleCropConfirm('header')}
                processingKey='header'
                processing={processing}
            />
            <CropModal
                isOpen={croppingAvatar}
                onClose={() => setCroppingAvatar(false)}
                image={file ? URL.createObjectURL(file) : ''}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                handleCropConfirm={() => handleCropConfirm('avatar')}
                processingKey='avatar'
                processing={processing}
            />
            <DeleteAccountDialog
                isOpen={isDeleteDialogOpen}
                onClose={onCloseDeleteDialog}
                onDelete={deleteAccount}
                cancelRef={cancelRef}
                processing={processing}
            />
        </div>
    );
};

export default Settings;