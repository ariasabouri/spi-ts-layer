import * as crypto from 'crypto';
import * as fs from 'fs';

export class CryptoManager {
    private privateKey: string;
    private goCorePublicKey: string | null;

    constructor(privateKeyPath: string, goCorePublicKey: string | null) {
        this.privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        this.goCorePublicKey = goCorePublicKey;
    }

    /**
     * Encrypts a message using the Go core's public key.
     */
    public encryptWithPublicKey(keyContent: string, message: string): string {
        const publicKey = crypto.createPublicKey({
            key: keyContent,
            format: 'pem',
            type: 'spki', // Adjust if your key type is different
        });
    
        const buffer = Buffer.from(message, 'utf8');
        const encrypted = crypto.publicEncrypt(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_PADDING,
            },
            buffer
        );
        return encrypted.toString('base64');
    }
    

    /**
     * Decrypts a message using the TypeScript app's private key.
     */
    public decryptWithPrivateKey(encryptedMessage: string): string {
        const buffer = Buffer.from(encryptedMessage, 'base64');
        const decrypted = crypto.privateDecrypt(
            {
                key: this.privateKey,
                padding: crypto.constants.RSA_PKCS1_PADDING, // Ensure padding matches
            },
            buffer
        );
        return decrypted.toString('utf8');
    }

    /**
     * Double encrypts a message using the TypeScript app's private key and the Go core's public key.
     */
    public doubleEncrypt(message: string): string {
        if (!this.goCorePublicKey) {
            throw new Error('Go core public key not available.');
        }

        const buffer = Buffer.from(message, 'utf8');
        const encryptedWithPrivateKey = crypto.privateEncrypt(this.privateKey, buffer);
        const encryptedWithGoPublicKey = crypto.publicEncrypt(this.goCorePublicKey, encryptedWithPrivateKey);
        return encryptedWithGoPublicKey.toString('base64');
    }

    public static createRandomString(length: number) {
        return crypto.randomBytes(length).toString('hex').slice(0, length);
    }

}
