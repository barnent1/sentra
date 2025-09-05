/**
 * Authentication Integration for Sentra.cx and Local CLI
 *
 * Provides secure authentication management connecting the local CLI
 * with the sentra.cx authentication system and FastAPI backend.
 * Supports token-based authentication, session management, and secure storage.
 *
 * @module Authentication
 */
export const AuthenticationProvider = {
    SENTRA_CX: 'sentra_cx',
    LOCAL: 'local',
    API_KEY: 'api_key'
};
export const AuthenticationStatus = {
    AUTHENTICATED: 'authenticated',
    UNAUTHENTICATED: 'unauthenticated',
    EXPIRED: 'expired',
    REFRESHING: 'refreshing',
    ERROR: 'error'
};
// ============================================================================
// MEMORY STORAGE IMPLEMENTATION
// ============================================================================
class MemoryAuthStorage {
    storage = new Map();
    async store(key, value) {
        this.storage.set(key, value);
    }
    async retrieve(key) {
        return this.storage.get(key) || null;
    }
    async remove(key) {
        this.storage.delete(key);
    }
    async clear() {
        this.storage.clear();
    }
}
// ============================================================================
// FILE STORAGE IMPLEMENTATION
// ============================================================================
class FileAuthStorage {
    filePath;
    encryptionKey;
    constructor(filePath, encryptionKey) {
        this.filePath = filePath;
        if (encryptionKey !== undefined) {
            this.encryptionKey = encryptionKey;
        }
    }
    async store(key, value) {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            // Ensure directory exists
            await fs.mkdir(path.dirname(this.filePath), { recursive: true });
            // Read existing data
            let data = {};
            try {
                const existing = await fs.readFile(this.filePath, 'utf8');
                data = JSON.parse(existing);
            }
            catch {
                // File doesn't exist or is invalid, start fresh
            }
            // Store value (encrypted if key provided)
            data[key] = this.encryptionKey ? this.encrypt(value) : value;
            // Write back to file
            await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
            // Set secure file permissions (owner read/write only)
            await fs.chmod(this.filePath, 0o600);
        }
        catch (error) {
            throw new Error(`Failed to store auth data: ${error}`);
        }
    }
    async retrieve(key) {
        try {
            const fs = await import('fs/promises');
            const data = await fs.readFile(this.filePath, 'utf8');
            const parsed = JSON.parse(data);
            const value = parsed[key];
            if (!value) {
                return null;
            }
            return this.encryptionKey ? this.decrypt(value) : value;
        }
        catch {
            return null;
        }
    }
    async remove(key) {
        try {
            const fs = await import('fs/promises');
            const data = await fs.readFile(this.filePath, 'utf8');
            const parsed = JSON.parse(data);
            delete parsed[key];
            await fs.writeFile(this.filePath, JSON.stringify(parsed, null, 2), 'utf8');
        }
        catch {
            // File doesn't exist or other error, ignore
        }
    }
    async clear() {
        try {
            const fs = await import('fs/promises');
            await fs.unlink(this.filePath);
        }
        catch {
            // File doesn't exist, ignore
        }
    }
    encrypt(value) {
        if (!this.encryptionKey) {
            return value;
        }
        // Simple XOR encryption for demonstration
        // In production, use proper encryption libraries like crypto-js
        const key = this.encryptionKey;
        let result = '';
        for (let i = 0; i < value.length; i++) {
            result += String.fromCharCode(value.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return Buffer.from(result).toString('base64');
    }
    decrypt(value) {
        if (!this.encryptionKey) {
            return value;
        }
        try {
            const decoded = Buffer.from(value, 'base64').toString();
            const key = this.encryptionKey;
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        }
        catch {
            throw new Error('Failed to decrypt authentication data');
        }
    }
}
// ============================================================================
// AUTHENTICATION MANAGER CLASS
// ============================================================================
export class SentraAuthenticationManager {
    config;
    storage;
    currentSession = null;
    refreshTimer = null;
    refreshPromise = null;
    constructor(config) {
        this.config = config;
        this.storage = this.createStorage();
    }
    // ============================================================================
    // SESSION MANAGEMENT
    // ============================================================================
    async initialize() {
        try {
            // Try to restore session from storage
            const sessionData = await this.storage.retrieve('current_session');
            if (sessionData) {
                const parsedSession = JSON.parse(sessionData);
                const session = {
                    ...parsedSession,
                    expiresAt: new Date(parsedSession.expiresAt),
                    createdAt: new Date(parsedSession.createdAt),
                    lastActivityAt: new Date(parsedSession.lastActivityAt)
                };
                const validation = this.validateToken(session.token);
                if (validation.isValid) {
                    this.currentSession = session;
                    this.scheduleTokenRefresh();
                    this.log('info', `Restored authentication session for user: ${session.userId}`);
                }
                else {
                    this.log('warn', 'Stored session is invalid or expired');
                    await this.storage.remove('current_session');
                }
            }
        }
        catch (error) {
            this.log('error', 'Failed to initialize authentication:', error);
        }
    }
    async authenticateWithSentraCx(authCode) {
        try {
            // Exchange auth code for tokens with sentra.cx
            const tokenResponse = await this.exchangeCodeForTokens(authCode);
            // Create authentication session
            const session = await this.createSession(tokenResponse, AuthenticationProvider.SENTRA_CX);
            // Store session
            await this.storage.store('current_session', JSON.stringify(session));
            this.currentSession = session;
            this.scheduleTokenRefresh();
            this.log('info', `Authenticated with sentra.cx: ${session.userId}`);
            return session;
        }
        catch (error) {
            this.log('error', 'Sentra.cx authentication failed:', error);
            throw error;
        }
    }
    async authenticateWithApiKey(apiKey) {
        try {
            // Validate API key with backend
            const response = await this.validateApiKey(apiKey);
            const session = await this.createSession({
                authenticated: true,
                user_id: response.user_id || 'api_user',
                permissions: response.permissions,
            }, AuthenticationProvider.API_KEY);
            // Store API key separately
            await this.storage.store('api_key', apiKey);
            await this.storage.store('current_session', JSON.stringify(session));
            this.currentSession = session;
            this.log('info', `Authenticated with API key`);
            return session;
        }
        catch (error) {
            this.log('error', 'API key authentication failed:', error);
            throw error;
        }
    }
    async authenticateLocally(credentials) {
        try {
            const session = await this.createSession({
                authenticated: true,
                token: credentials.token,
                user_id: credentials.userId,
                permissions: ['local_access'],
            }, AuthenticationProvider.LOCAL);
            await this.storage.store('current_session', JSON.stringify(session));
            this.currentSession = session;
            this.log('info', `Local authentication successful: ${credentials.userId}`);
            return session;
        }
        catch (error) {
            this.log('error', 'Local authentication failed:', error);
            throw error;
        }
    }
    async logout() {
        try {
            if (this.currentSession) {
                // Clear refresh timer
                if (this.refreshTimer) {
                    clearTimeout(this.refreshTimer);
                    this.refreshTimer = null;
                }
                // Revoke tokens if using sentra.cx
                if (this.currentSession.provider === AuthenticationProvider.SENTRA_CX) {
                    await this.revokeTokens();
                }
                this.log('info', `Logged out user: ${this.currentSession.userId}`);
                this.currentSession = null;
            }
            // Clear stored session
            await this.storage.clear();
        }
        catch (error) {
            this.log('error', 'Logout error:', error);
            throw error;
        }
    }
    // ============================================================================
    // TOKEN MANAGEMENT
    // ============================================================================
    async getValidToken() {
        if (!this.currentSession) {
            return null;
        }
        const validation = this.validateToken(this.currentSession.token);
        if (!validation.isValid) {
            return null;
        }
        if (validation.shouldRefresh && !this.refreshPromise) {
            this.refreshPromise = this.refreshTokens();
            const refreshed = await this.refreshPromise;
            this.refreshPromise = null;
            if (!refreshed) {
                return null;
            }
        }
        // Update last activity
        this.currentSession = {
            ...this.currentSession,
            lastActivityAt: new Date()
        };
        await this.storage.store('current_session', JSON.stringify(this.currentSession));
        return await this.getTokenString();
    }
    async refreshTokens() {
        if (!this.currentSession || !this.currentSession.refreshToken) {
            return false;
        }
        try {
            const response = await this.requestTokenRefresh(this.currentSession.refreshToken);
            // Update session with new tokens
            this.currentSession = {
                ...this.currentSession,
                token: response.token,
                refreshToken: response.refresh_token,
                expiresAt: response.expires_at ? new Date(response.expires_at) : new Date(Date.now() + 3600000),
            };
            await this.storage.store('current_session', JSON.stringify(this.currentSession));
            this.scheduleTokenRefresh();
            this.log('info', 'Tokens refreshed successfully');
            return true;
        }
        catch (error) {
            this.log('error', 'Token refresh failed:', error);
            await this.logout(); // Force logout on refresh failure
            return false;
        }
    }
    validateToken(_token) {
        if (!this.currentSession) {
            return {
                isValid: false,
                isExpired: true,
                shouldRefresh: false,
                error: 'No active session',
            };
        }
        const now = new Date();
        const expiresAt = this.currentSession.expiresAt;
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const isExpired = timeUntilExpiry <= 0;
        const shouldRefresh = timeUntilExpiry <= this.config.session.refreshThreshold;
        const result = {
            isValid: !isExpired,
            isExpired,
            timeUntilExpiry: Math.max(0, timeUntilExpiry),
            shouldRefresh: shouldRefresh && !!this.currentSession.refreshToken,
        };
        if (isExpired) {
            result.error = 'Token expired';
        }
        return result;
    }
    scheduleTokenRefresh() {
        if (!this.currentSession || this.refreshTimer) {
            return;
        }
        const validation = this.validateToken(this.currentSession.token);
        if (validation.timeUntilExpiry && validation.timeUntilExpiry > this.config.session.refreshThreshold) {
            const refreshIn = validation.timeUntilExpiry - this.config.session.refreshThreshold;
            this.refreshTimer = setTimeout(async () => {
                this.refreshTimer = null;
                await this.refreshTokens();
            }, refreshIn);
            this.log('debug', `Token refresh scheduled in ${refreshIn}ms`);
        }
    }
    async getTokenString() {
        if (!this.currentSession) {
            return null;
        }
        switch (this.currentSession.provider) {
            case AuthenticationProvider.SENTRA_CX:
            case AuthenticationProvider.LOCAL:
                return this.currentSession.token;
            case AuthenticationProvider.API_KEY:
                // Retrieve API key from storage
                return await this.storage.retrieve('api_key');
            default:
                return null;
        }
    }
    // ============================================================================
    // API COMMUNICATION
    // ============================================================================
    async exchangeCodeForTokens(authCode) {
        const response = await fetch(`${this.config.sentraCx.baseUrl}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: this.config.sentraCx.clientId,
                redirect_uri: this.config.sentraCx.redirectUri,
                code: authCode,
                scope: this.config.sentraCx.scopes.join(' '),
            }),
        });
        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    }
    async validateApiKey(apiKey) {
        const response = await fetch('/api/auth/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
        });
        if (!response.ok) {
            throw new Error(`API key validation failed: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    }
    async requestTokenRefresh(refreshToken) {
        const response = await fetch(`${this.config.sentraCx.baseUrl}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: this.config.sentraCx.clientId,
            }),
        });
        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    }
    async revokeTokens() {
        if (!this.currentSession?.token) {
            return;
        }
        try {
            await fetch(`${this.config.sentraCx.baseUrl}/oauth/revoke`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.currentSession.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: this.currentSession.token,
                }),
            });
        }
        catch (error) {
            this.log('warn', 'Failed to revoke tokens:', error);
            // Don't throw - logout should still proceed
        }
    }
    // ============================================================================
    // SESSION CREATION
    // ============================================================================
    async createSession(authResponse, provider) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = authResponse.expires_at
            ? new Date(authResponse.expires_at)
            : new Date(Date.now() + this.config.session.timeout);
        return {
            sessionId,
            userId: authResponse.user_id || 'unknown',
            provider,
            token: authResponse.token || `token_${Date.now()}`,
            refreshToken: authResponse.refresh_token,
            permissions: authResponse.permissions || [],
            expiresAt,
            createdAt: new Date(),
            lastActivityAt: new Date(),
        };
    }
    // ============================================================================
    // STORAGE MANAGEMENT
    // ============================================================================
    createStorage() {
        switch (this.config.storage.type) {
            case 'file':
                return new FileAuthStorage(this.config.storage.filePath || '~/.sentra/auth', this.config.storage.encryptionKey);
            case 'memory':
            default:
                return new MemoryAuthStorage();
        }
    }
    // ============================================================================
    // PUBLIC API
    // ============================================================================
    getCurrentSession() {
        return this.currentSession ? { ...this.currentSession } : null;
    }
    getAuthenticationStatus() {
        if (!this.currentSession) {
            return AuthenticationStatus.UNAUTHENTICATED;
        }
        const validation = this.validateToken(this.currentSession.token);
        if (this.refreshPromise) {
            return AuthenticationStatus.REFRESHING;
        }
        if (validation.isExpired) {
            return AuthenticationStatus.EXPIRED;
        }
        if (!validation.isValid) {
            return AuthenticationStatus.ERROR;
        }
        return AuthenticationStatus.AUTHENTICATED;
    }
    isAuthenticated() {
        return this.getAuthenticationStatus() === AuthenticationStatus.AUTHENTICATED;
    }
    hasPermission(permission) {
        return this.currentSession?.permissions.includes(permission) || false;
    }
    getUserId() {
        return this.currentSession?.userId || null;
    }
    getProvider() {
        return this.currentSession?.provider || null;
    }
    // ============================================================================
    // OAUTH FLOW HELPERS
    // ============================================================================
    generateAuthUrl() {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.config.sentraCx.clientId,
            redirect_uri: this.config.sentraCx.redirectUri,
            scope: this.config.sentraCx.scopes.join(' '),
            state: Math.random().toString(36).substr(2, 9),
        });
        return `${this.config.sentraCx.baseUrl}/oauth/authorize?${params.toString()}`;
    }
    async handleAuthCallback(callbackUrl) {
        const url = new URL(callbackUrl);
        const authCode = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        if (error) {
            throw new Error(`Authentication error: ${error}`);
        }
        if (!authCode) {
            throw new Error('No authorization code received');
        }
        return await this.authenticateWithSentraCx(authCode);
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    log(level, message, ...args) {
        if (this.config.logging.enabled &&
            ['debug', 'info', 'warn', 'error'].indexOf(level) >=
                ['debug', 'info', 'warn', 'error'].indexOf(this.config.logging.level)) {
            // Filter sensitive information unless explicitly enabled
            const filteredArgs = this.config.logging.logTokens
                ? args
                : args.map(arg => typeof arg === 'string' && arg.includes('token')
                    ? '[REDACTED]'
                    : arg);
            console[level](`[Auth] ${message}`, ...filteredArgs);
        }
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
export const createAuthenticationManager = (config) => {
    return new SentraAuthenticationManager(config);
};
export const createDefaultAuthManager = () => {
    return createAuthenticationManager({
        sentraCx: {
            baseUrl: 'https://auth.sentra.cx',
            clientId: 'sentra-cli',
            redirectUri: 'http://localhost:3000/auth/callback',
            scopes: ['read', 'write', 'admin'],
        },
        storage: {
            type: 'file',
            filePath: process.env['HOME'] + '/.sentra/auth',
            ...(process.env['SENTRA_AUTH_KEY'] && { encryptionKey: process.env['SENTRA_AUTH_KEY'] }),
        },
        session: {
            timeout: 24 * 60 * 60 * 1000, // 24 hours
            refreshThreshold: 5 * 60 * 1000, // 5 minutes
            maxRefreshAttempts: 3,
        },
        logging: {
            enabled: true,
            level: 'info',
            logTokens: false,
        },
    });
};
//# sourceMappingURL=auth.js.map