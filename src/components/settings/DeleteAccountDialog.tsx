import React, { RefObject } from 'react';
import { Modal, Button, Typography } from 'antd';

const { Text } = Typography;

interface DeleteAccountDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => void;
    cancelRef: RefObject<HTMLButtonElement>;
    processing: { [key: string]: boolean };
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
    isOpen,
    onClose,
    onDelete,
    cancelRef,
    processing,
}) => (
    <Modal
        title="アカウントを削除する"
        visible={isOpen}
        onOk={onDelete}
        onCancel={onClose}
        okButtonProps={{ danger: true, loading: processing.delete }}
        okText="Delete"
        centered
    >
        <Text>本当に実行しますか？この操作は後から元に戻すことはできません。</Text>
    </Modal>
);

export default DeleteAccountDialog;