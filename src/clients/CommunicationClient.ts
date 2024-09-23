import * as https from 'https';

export class CommunicationClient {
    private hostname: string;
    private port: number;
    private rejectUnauthorized: boolean;
    private requestId: string | null = null;  // Property to store request ID

    constructor(
        hostname: string = 'localhost',
        port: number = 8443,
        rejectUnauthorized: boolean = false
    ) {
        this.hostname = hostname;
        this.port = port;
        this.rejectUnauthorized = rejectUnauthorized;
    }

    /**
     * Sets the request ID for this session.
     */
    public setRequestId(requestId: string): void {
        this.requestId = requestId;
    }

    /**
     * Gets the current request ID for this session.
     */
    public getRequestId(): string | null {
        return this.requestId;
    }

    /**
     * Sends a POST request to the specified path with the provided data.
     * Optionally includes the request ID if provided.
     */
    public post(path: string, postData: string, requestId?: string): Promise<{ response: string, headers: any }> {
        return new Promise((resolve, reject) => {
            const headers: { [key: string]: string } = {
                'Content-Type': 'application/json',
                'Content-Length': String(Buffer.byteLength(postData)),
            };

            // Use the requestId if it's passed in or stored in the client
            const finalRequestId = requestId || this.requestId;
            if (finalRequestId) {
                headers['X-Request-ID'] = finalRequestId;
            }

            const options = {
                hostname: this.hostname,
                port: this.port,
                path: path,
                method: 'POST',
                headers,
                rejectUnauthorized: this.rejectUnauthorized,
            };

            const req = https.request(options, (res) => {
                let data = '';
                const responseHeaders = res.headers;

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    resolve({ response: data, headers: responseHeaders });
                });
            });

            req.on('error', (error) => {
                console.error(error); // Remove this before prod!
                reject(`Request error: ${error}`);
            });

            req.write(postData);
            req.end();
        });
    }
}
