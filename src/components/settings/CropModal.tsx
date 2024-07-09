import React from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Spinner } from '@chakra-ui/react';
import Cropper from 'react-easy-crop';

interface CropModalProps {
    isOpen: boolean;
    onClose: () => void;
    image: string;
    crop: { x: number, y: number };
    zoom: number;
    aspect: number;
    onCropChange: (crop: { x: number, y: number }) => void;
    onZoomChange: (zoom: number) => void;
    onCropComplete: (croppedArea: any, croppedAreaPixels: { x: number, y: number, width: number, height: number }) => void;
    handleCropConfirm: () => void;
    processingKey: string;
    processing: { [key: string]: boolean };
}

const CropModal: React.FC<CropModalProps> = ({
    isOpen,
    onClose,
    image,
    crop,
    zoom,
    aspect,
    onCropChange,
    onZoomChange,
    onCropComplete,
    handleCropConfirm,
    processingKey,
    processing,
}) => (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent>
            <ModalHeader>画像の設定</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
                <div className="relative w-full h-[250px]">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropComplete}
                    />
                </div>
            </ModalBody>
            <ModalFooter>
                <Button onClick={onClose} className='mr-3'>
                    キャンセル
                </Button>
                <Button colorScheme='blue' onClick={handleCropConfirm}>
                    {processing[processingKey] ? <Spinner size="sm" /> : '決定'}
                </Button>
            </ModalFooter>
        </ModalContent>
    </Modal>
);

export default CropModal;