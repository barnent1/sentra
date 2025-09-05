/**
 * Authentication Integration for Sentra.cx and Local CLI
 *
 * Provides secure authentication management connecting the local CLI
 * with the sentra.cx authentication system and FastAPI backend.
 * Supports token-based authentication, session management, and secure storage.
 *
 * @module Authentication
 */
import type { Brand } from '@sentra/types';
import type { AuthTokenId } from './types';
export type SessionId = Brand<string, 'SessionId'>;
export type RefreshTokenId = Brand<string, 'RefreshTokenId'>;
export type ApiKeyId = Brand<string, 'ApiKeyId'>;
export declare const AuthenticationProvider: {
    readonly SENTRA_CX: "sentra_cx";
    readonly LOCAL: "local";
    readonly API_KEY: "api_key";
};
export type AuthenticationProviderType = typeof AuthenticationProvider[keyof typeof AuthenticationProvider];
export declare const AuthenticationStatus: {
    readonly AUTHENTICATED: "authenticated";
    readonly UNAUTHENTICATED: "unauthenticated";
    readonly EXPIRED: "expired";
    readonly REFRESHING: "refreshing";
    readonly ERROR: "error";
};
export type AuthenticationStatusType = typeof AuthenticationStatus[keyof typeof AuthenticationStatus];
export interface AuthenticationCredentials {
    readonly provider: AuthenticationProviderType;
    readonly token?: string;
    readonly apiKey?: string;
    readonly refreshToken?: string;
    readonly userId?: string;
    readonly email?: string;
}
export interface AuthenticationSession {
    readonly sessionId: SessionId;
    readonly userId: string;
    readonly email?: string;
    readonly provider: AuthenticationProviderType;
    readonly token: AuthTokenId;
    readonly refreshToken?: RefreshTokenId;
    readonly permissions: readonly string[];
    readonly expiresAt: Date;
    readonly createdAt: Date;
    readonly lastActivityAt: Date;
}
export interface AuthenticationConfig {
    readonly sentraCx: {
        readonly baseUrl: string;
        readonly clientId: string;
        readonly redirectUri: string;
        readonly scopes: readonly string[];
    };
    readonly storage: {
        readonly type: 'memory' | 'file' | 'keychain';
        readonly encryptionKey?: string;
        readonly filePath?: string;
    };
    readonly session: {
        readonly timeout: number;
        readonly refreshThreshold: number;
        readonly maxRefreshAttempts: number;
    };
    readonly logging: {
        readonly enabled: boolean;
        readonly level: 'debug' | 'info' | 'warn' | 'error';
        readonly logTokens: boolean;
    };
}
export interface TokenValidationResult {
    readonly isValid: boolean;
    readonly isExpired: boolean;
    readonly timeUntilExpiry?: number;
    readonly shouldRefresh: boolean;
    readonly error?: string;
}
export interface AuthenticationStorage {
    store(key: string, value: string): Promise<void>;
    retrieve(key: string): Promise<string | null>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
}
export declare class SentraAuthenticationManager {
    private readonly config;
    private readonly storage;
    private currentSession;
    private refreshTimer;
    private refreshPromise;
    constructor(config: AuthenticationConfig);
    initialize(): Promise<void>;
    authenticateWithSentraCx(authCode: string): Promise<AuthenticationSession>;
    authenticateWithApiKey(apiKey: string): Promise<AuthenticationSession>;
    authenticateLocally(credentials: {
        readonly userId: string;
        readonly token: string;
    }): Promise<AuthenticationSession>;
    logout(): Promise<void>;
    getValidToken(): Promise<string | null>;
    refreshTokens(): Promise<boolean>;
    private validateToken;
    private scheduleTokenRefresh;
    private getTokenString;
    private exchangeCodeForTokens;
    private validateApiKey;
    private requestTokenRefresh;
    private revokeTokens;
    private createSession;
    private createStorage;
    getCurrentSession(): AuthenticationSession | null;
    getAuthenticationStatus(): AuthenticationStatusType;
    isAuthenticated(): boolean;
    hasPermission(permission: string): boolean;
    getUserId(): string | null;
    getProvider(): AuthenticationProviderType | null;
    generateAuthUrl(): string;
    handleAuthCallback(callbackUrl: string): Promise<AuthenticationSession>;
    private log;
}
export declare const createAuthenticationManager: (config: AuthenticationConfig) => SentraAuthenticationManager;
export declare const createDefaultAuthManager: () => SentraAuthenticationManager;
//# sourceMappingURL=auth.d.ts.map