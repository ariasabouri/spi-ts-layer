import { CryptoManager } from '../crypto/CryptoManager';
import { CommunicationClient } from './CommunicationClient';
import * as fs from 'fs';

export class HandshakeManager {
    private communicationClient: CommunicationClient;
    private publicKey: string;
    private goCorePublicKey: string | null = null;
    private cryptoManager?: CryptoManager;

    constructor(communicationClient: CommunicationClient, publicKeyPath: string, private privateKeyPath: string) {
        this.communicationClient = communicationClient;
        this.publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    }

    /**
     * Performs the initial handshake and key exchange with the Go core.
     */
    public async performInitialHandshake(): Promise<boolean> {
        const postData = JSON.stringify({ tsAppPublicKey: this.publicKey });

        try {
            // Send the TypeScript app's public key to the Go core
            const { response, headers } = await this.communicationClient.post('/api/key-exchange', postData);

            const jsonResponse = JSON.parse(response);
            this.goCorePublicKey = jsonResponse.goCorePublicKey;
            console.log('Received Go core public key:', this.goCorePublicKey);

            // Extract X-Request-ID from the response headers
            const requestId = headers['x-request-id'];
            console.log('Received Request ID:', requestId);

            // Store the Request ID in the communication client
            if (requestId) {
                console.log(`Set Request ID to `, requestId)
                this.communicationClient.setRequestId(requestId);
            }

            // Initialize CryptoManager with Go core's public key
            this.cryptoManager = new CryptoManager(this.privateKeyPath, this.goCorePublicKey);
            return true;
        } catch (error) {
            console.error('Error during handshake:', error);
            if (error instanceof Error) {
                console.error('Stack Trace:', error.stack);
            } else {
                console.error('Raw error object:', error);
            }
        }
        return false;
    }

    /**
     * Validates secure communication by exchanging encrypted messages.
     */
    public async validateSecureConnection(): Promise<boolean> {
        if (!this.cryptoManager || !this.goCorePublicKey) {
            throw new Error('Handshake not initiated. CryptoManager is not initialized.');
        }

        // Create a random string for validation
        const randomString = CryptoManager.createRandomString(64);
        console.log('Random string for validation:', randomString);

        // Encrypt the random string with the Go core's public key
        const encryptedMessage = this.cryptoManager.encryptWithPublicKey(this.goCorePublicKey, randomString);
        console.log(`Encrypted message: ${encryptedMessage}`)

        // Send the encrypted message to the Go core
        const postData = JSON.stringify({ encryptedResponse: encryptedMessage });
        try {
            const { response } = await this.communicationClient.post('/api/verify-message', postData);
            const jsonResponse = JSON.parse(response);

            const encryptedResponse = jsonResponse.encryptedResponse;
            const backendChallenge = jsonResponse.ownChallenge;

            // Decrypt the response using the TypeScript app's private key
            const decryptedResponse = this.cryptoManager.decryptWithPrivateKey(encryptedResponse);
            const decryptedChallenge = this.cryptoManager.decryptWithPrivateKey(backendChallenge)
            console.log('Decrypted response from Go core:', decryptedResponse);
            console.log(`Decrypted final challenge from server: `, decryptedChallenge)

            // Verify if the decrypted response matches the original random string
            if (decryptedResponse === randomString) {
                console.log('Secure connection verified successfully!');
                await this.finalizeHandshake(decryptedChallenge)
                return true;
            } else {
                throw new Error('Failed to validate secure connection. Decrypted response does not match.');
            }
        } catch (error) {
            console.error(error)
            console.error('Error during validating secure connection:', error);
            if (error instanceof Error) {
                console.error('Stack Trace:', error.stack);
            } else {
                console.error('Raw error object:', error);
            }
        }
        return false;
    }

    public async finalizeHandshake(finalSecret: string): Promise<boolean> {
        if (!this.cryptoManager || !this.goCorePublicKey) {
            throw new Error('Handshake not initiated. CryptoManager is not initialized.');
        }

        const encryptedSecret = this.cryptoManager.encryptWithPublicKey(this.goCorePublicKey, finalSecret)
        console.log(`Encrypted final challenge secret: `, encryptedSecret)

        // Send to API
        try {
            const postData = JSON.stringify({ secret: encryptedSecret })
            const { response } = await this.communicationClient.post('/api/handshake-success', postData)

            console.log(response)
            const jsonResponse = JSON.parse(response)
            console.log(`Handshake completed succesfully! `, jsonResponse)
        } catch (error) {
            console.error(error)
            console.error('Error during validating secure connection:', error);
            if (error instanceof Error) {
                console.error('Stack Trace:', error.stack);
            } else {
                console.error('Raw error object:', error);
            }
        }
        return false
    }

    /**
     * Returns the Go core's public key after handshake.
     */
    public getGoCorePublicKey(): string | null {
        return this.goCorePublicKey;
    }
}

