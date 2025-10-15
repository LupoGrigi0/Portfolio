/**
 * Site Configuration Loader
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-10-15
 *
 * Loads environment-specific configuration from site-config files
 * Supports both development and production environments without code changes
 */
export interface SiteConfig {
    environment: string;
    paths: {
        content: string;
        database: string;
        logs: string;
        source: string;
    };
    server: {
        port: number;
        host: string;
    };
    content: {
        imageSizes: string;
        supportedFormats: string;
    };
}
/**
 * Load site configuration from JSON file
 *
 * Config files are located in the deployments/ directory.
 *
 * Priority order:
 * 1. SITE_CONFIG environment variable (e.g., "production", "development")
 * 2. deployments/site-config.json (active config - gitignored)
 * 3. deployments/site-config.development.json (development default)
 */
export declare function loadSiteConfig(): SiteConfig;
/**
 * Get a specific config value
 */
export declare function getConfigValue<K extends keyof SiteConfig>(key: K): SiteConfig[K];
/**
 * Clear cached config (useful for testing)
 */
export declare function clearConfigCache(): void;
