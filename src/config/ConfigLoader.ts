import * as fs from 'fs';
import * as path from 'path';
import { IPackageConfig, IConfigFile } from '../interfaces/IConfigFile'; // Assuming interfaces are in a separate file

export class ConfigLoader {
    private config: IConfigFile | null = null;
    private readonly configPath: string;

    constructor(configFilePath: string) {
        this.configPath = path.resolve(configFilePath);
        return this
    }

    // Loads the config file from disk
    public loadConfig(): ConfigLoader {
        try {
            const configFileData = fs.readFileSync(this.configPath, 'utf-8');
            this.config = JSON.parse(configFileData);
        } catch (error) {
            console.error(`Error loading config file: `, error);
        }
        return this
    }

    // Returns the entire config
    public getConfig(): IConfigFile | null {
        return this.config;
    }

    // Returns the server configuration
    public getServerConfig(): { hostname: string; port: number } | null {
        return this.config ? this.config.server : null;
    }

    // Returns all packages in the config
    public getPackages(): IPackageConfig[] | null {
        return this.config ? this.config.packages : null;
    }

    // Returns a specific package by name
    public getPackageByName(name: string): IPackageConfig | null {
        if (!this.config) return null;
        return this.config.packages.find(pkg => pkg.name === name) || null;
    }

    // Checks if a specific handler in a package is enabled
    public isHandlerEnabled(packageName: string, handlerName: string): boolean | null {
        const packageConfig = this.getPackageByName(packageName);
        if (!packageConfig) return null;

        const handlerConfig = packageConfig.handlers.find(handler => handler.name === handlerName);
        return handlerConfig ? handlerConfig.enabled : null;
    }
}
