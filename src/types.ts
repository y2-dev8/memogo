export interface Message {
    id: string;
    message: string;
    fileURL?: string;
    sender: string;
    timestamp: any;
}

export interface User {
    displayName: string;
    photoURL: string;
}