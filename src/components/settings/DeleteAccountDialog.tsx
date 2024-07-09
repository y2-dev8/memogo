import React, { RefObject } from 'react';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Button,
    Spinner
} from '@chakra-ui/react';

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
    <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
    >
        <AlertDialogOverlay>
            <AlertDialogContent>
                <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                    アカウントを削除する
                </AlertDialogHeader>
                <AlertDialogBody>
                    本当に実行しますか？この操作は後から元に戻すことはできません。
                </AlertDialogBody>
                <AlertDialogFooter>
                    <Button ref={cancelRef} onClick={onClose}>
                        キャンセル
                    </Button>
                    <Button colorScheme='red' onClick={onDelete} ml={3}>
                        {processing.delete ? <Spinner size="sm" /> : '削除'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialogOverlay>
    </AlertDialog>
);

export default DeleteAccountDialog;