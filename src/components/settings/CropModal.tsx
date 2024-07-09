import React from 'react';
import { Modal, Button } from 'antd';
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
    <Modal
        title="画像の設定"
        visible={isOpen}
        onOk={handleCropConfirm}
        onCancel={onClose}
        okButtonProps={{ loading: processing[processingKey] }}
        okText="Confirm"
        centered
    >
        <div style={{ position: 'relative', width: '100%', height: '250px' }}>
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
    </Modal>
);

export default CropModal;