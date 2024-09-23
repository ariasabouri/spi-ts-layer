import { CommunicationClient } from './src/clients/CommunicationClient';
import { HandshakeManager } from './src/clients/HandshakeManager';
import { ConfigLoader } from './src/config/ConfigLoader';
import { CryptoManager } from './src/crypto/CryptoManager';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    // Load configuration
    const configPath = path.resolve(__dirname, 'config.json');
    const config = new ConfigLoader(configPath).loadConfig().getConfig()

    // Initialize communication client
    const communicationClient = new CommunicationClient('localhost', 8443);

    // Initialize handshake manager
    if (!config?.server || !config?.server.public_key || !config.server.private_key) {
        throw new Error(`No valid configuration file provided: server.public_key or server.private_key is missing.`)
    }

    const handshakeManager = new HandshakeManager(communicationClient, config.server.public_key, config.server.private_key);

    // Perform the handshake
    if (await handshakeManager.performInitialHandshake()) {
        await handshakeManager.validateSecureConnection()
    }
}

main()