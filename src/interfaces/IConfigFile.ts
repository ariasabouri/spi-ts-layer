export interface IConfigFile {
    server: {
        hostname: string,
        port: number,
        public_key: string,
        private_key: string
    },
    packages: IPackageConfig[]
}

export interface IPackageConfig {
    name: string,
    enabled: boolean,
    handlers: IPackageHandlerConfig[]
}

export interface IPackageHandlerConfig {
    name: string,
    enabled: boolean,
    version?: string | number
}