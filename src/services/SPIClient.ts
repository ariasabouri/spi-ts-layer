import * as https from 'https';
import * as crypto from 'crypto';
import * as fs from 'fs';

export class SPIClient {
    private publicKey: string;
    private privateKey: string;
    private goCorePublicKey: string | null = null;
    private hostname: string;
    private port: number;
    private rejectUnauthorized: boolean;

    constructor(
        publicKeyPath: string,
        privateKeyPath: string,
        hostname: string = 'localhost',
        port: number = 8443,
        rejectUnauthorized: boolean = false
    ) {
        this.publicKey = fs.readFileSync(publicKeyPath, 'utf8');
        this.privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        this.hostname = hostname;
        this.port = port;
        this.rejectUnauthorized = rejectUnauthorized;
    }

    // Send an encrypted command to the Go server
    public sendCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const encryptedCommand = this.encryptMessage(command);

            const options = {
                hostname: this.hostname,
                port: this.port,
                path: '/api/exec',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': encryptedCommand.length,
                },
                rejectUnauthorized: this.rejectUnauthorized, // For self-signed certificates
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    resolve(data);
                });
            });

            req.on('error', (error) => {
                reject(`Request error: ${error.message}`);
            });

            // Write the encrypted command to the request body
            req.write(encryptedCommand);
            req.end();
        });
    }

    // Encrypt a message using the Go core's public key
    private encryptMessage(message: string): Buffer {
        if (!this.goCorePublicKey) throw new Error('Go core public key is not available.');
        const buffer = Buffer.from(message, 'utf8');
        const encrypted = crypto.publicEncrypt(this.goCorePublicKey, buffer);
        return encrypted;
    }

    // Decrypt a message using the private key
    private decryptMessage(encryptedMessage: string): string {
        const buffer = Buffer.from(encryptedMessage, 'base64');
        const decrypted = crypto.privateDecrypt(
            {
                key: this.privateKey,
                padding: crypto.constants.RSA_PKCS1_PADDING,
            },
            buffer
        );
        return decrypted.toString('utf8');
    }

    // Send a handshake request to the Go core
    public async handshake(): Promise<void> {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                tsAppPublicKey: this.publicKey
            });

            const options = {
                hostname: 'localhost',
                port: 8443,
                path: '/api/handshake',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                },
                rejectUnauthorized: false, // Self-signed certificates
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        this.goCorePublicKey = response.goCorePublicKey;
                        const decryptedMessage = this.decryptMessage(response.encryptedMessage);
                        console.log('Decrypted message from Go Core:', decryptedMessage);
                        resolve();
                    } catch (err) {
                        reject(`Error during handshake: ${err}`);
                    }
                });
            });

            req.on('error', (error) => {
                reject(`Request error: ${error.message}`);
            });

            // Send the public key to Go core
            req.write(postData);
            req.end();
        });
    }

    public async keyExchange(): Promise<void> {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                tsAppPublicKey: this.publicKey
            });

            const options = {
                hostname: 'localhost',
                port: 8443,
                path: '/api/key-exchange',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                },
                rejectUnauthorized: this.rejectUnauthorized,
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        this.goCorePublicKey = response.goCorePublicKey;
                        console.log('Received Go core public key:', this.goCorePublicKey);
                        resolve();
                    } catch (err) {
                        reject(`Error during key exchange: ${err}`);
                    }
                });
            });

            req.on('error', (error) => {
                reject(`Request error: ${error.message}`);
            });

            // Send the TypeScript app's public key to the Go core
            req.write(postData);
            req.end();
        });
    }
}
