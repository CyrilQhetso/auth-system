export interface User {
    id?: string;
    name: string;
    email: string;
    password: string;
    opt?: string;
    optExpiry?: number;
    isVerified?: boolean;
}