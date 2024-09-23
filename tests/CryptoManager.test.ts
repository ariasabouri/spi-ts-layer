import { CryptoManager } from '../src/crypto/CryptoManager';
import * as path from 'path';
import * as fs from 'fs';

describe('CryptoManager', () => {
    let cryptoManager: CryptoManager;
    const message = 'This is a test message.';

    // Paths to the key files
    const tsPrivateKeyPath = path.join(__dirname, '../certs', 'ts_private_key.pem');
    const tsPublicKeyPath = path.join(__dirname, '../certs', 'ts_public_key.pem');

    beforeAll(() => {
        // Initialize the CryptoManager with the TS app's private key
        cryptoManager = new CryptoManager(tsPrivateKeyPath, null); // Assuming goCorePublicKey is not needed here
    });

    test('should encrypt and decrypt message correctly using TS app keys', () => {
        // Read the public key content
        const tsPublicKeyContent = fs.readFileSync(tsPublicKeyPath, 'utf8');

        // Encrypt the message with the TS app's public key
        const encryptedMessage = cryptoManager.encryptWithPublicKey(tsPublicKeyContent, message);
        expect(encryptedMessage).toBeDefined();
        console.log(`Encrypted message: ${encryptedMessage}`);

        // Decrypt the message with the TS app's private key
        const decryptedMessage = cryptoManager.decryptWithPrivateKey(encryptedMessage);
        expect(decryptedMessage).toBe(message);
        console.log(`Decrypted message: ${decryptedMessage}`);
    });
});
