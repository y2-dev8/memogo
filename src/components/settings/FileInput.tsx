import React, { ChangeEvent, Ref } from 'react';

interface FileInputProps {
    onChange: (e: ChangeEvent<HTMLInputElement>, type: 'header' | 'avatar') => void;
    type: 'header' | 'avatar';
    fileInputRef: Ref<HTMLInputElement>;
}

const FileInput: React.FC<FileInputProps> = ({ onChange, type, fileInputRef }) => (
    <input
        type="file"
        onChange={(e) => onChange(e, type)}
        ref={fileInputRef}
        className="hidden"
    />
);

export default FileInput;