import { IHandler } from '../interfaces/IHandler';
import { SPIClient } from '../services/SPIClient';

export class WebServerHandler implements IHandler {
    private client: SPIClient;
    private config: any;

    constructor(client: SPIClient, config: any) {
        this.client = client;
        this.config = config;
    }

    public async setup() {
        console.log('Starting web server setup...');

        if (this.config.installApache) {
            await this.installApache();
        }

        if (this.config.installRedis) {
            await this.installRedis();
        }

        if (this.config.installCertbot) {
            await this.installCertbot();
        }
    }

    private async installApache() {
        console.log('Installing Apache...');
        const command = 'apt-get install apache2 -y';
        const response = await this.client.sendCommand(command);
        console.log('Apache installation result:', response);
    }

    private async installRedis() {
        console.log('Installing Redis...');
        const command = 'apt-get install redis-server -y';
        const response = await this.client.sendCommand(command);
        console.log('Redis installation result:', response);
    }

    private async installCertbot() {
        console.log('Installing Certbot...');
        const command = 'apt-get install certbot -y';
        const response = await this.client.sendCommand(command);
        console.log('Certbot installation result:', response);
    }
}
