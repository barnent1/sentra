import vault from 'node-vault';
import { config } from './config';
import { logger } from './logger';

export class VaultManager {
    private client: any;

    constructor() {
        this.client = vault({
            apiVersion: 'v1',
            endpoint: config.vault.url,
            token: config.vault.token,
        });
    }

    async connect(): Promise<void> {
        try {
            // Test the connection
            await this.client.status();
            logger.info('Vault connected successfully');
        } catch (error) {
            logger.error('Failed to connect to Vault:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        // Vault doesn't require explicit disconnection
        logger.info('Vault connection closed');
    }

    async getSecret(path: string): Promise<any> {
        try {
            const result = await this.client.read(path);
            return result.data;
        } catch (error) {
            logger.error('Vault read error:', error);
            throw error;
        }
    }

    async setSecret(path: string, data: any): Promise<void> {
        try {
            await this.client.write(path, data);
            logger.info(`Secret written to Vault: ${path}`);
        } catch (error) {
            logger.error('Vault write error:', error);
            throw error;
        }
    }
}