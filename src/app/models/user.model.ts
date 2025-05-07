export interface User {
    id?: string;
    name: string;
    email: string;
    password: string;
    otp?: string;
    otpExpiry?: number;
    isVerified?: boolean;
    profileImage?: string;
    bio?: string;
    lastLogin?: number;
    role?: 'user' | 'admin';
    twoFactorEnabled?: boolean;
    loginAttempts?: number;
    lockedUntil?: number | null;
    theme?: 'light' | 'dark' | 'system';
    createdAt?: number;
    updatedAt?: number;
}