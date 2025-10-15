/**
 * Site Configuration Loader
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-10-15
 *
 * Loads environment-specific configuration from site-config files
 * Supports both development and production environments without code changes
 */
import { readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let cachedConfig = null;
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
export function loadSiteConfig() {
    if (cachedConfig) {
        return cachedConfig;
    }
    // Find project root (go up from src/backend/dist/utils to project root)
    // dist/utils -> dist -> src/backend -> src -> Portfolio (project root)
    const projectRoot = resolve(__dirname, '../../../..');
    const deploymentsDir = join(projectRoot, 'deployments');
    // Determine which config file to use
    let configFile;
    if (process.env.SITE_CONFIG) {
        // Allow shorthand like SITE_CONFIG=production -> site-config.production.json
        const envConfig = process.env.SITE_CONFIG;
        if (envConfig.endsWith('.json')) {
            configFile = envConfig;
        }
        else {
            configFile = `site-config.${envConfig}.json`;
        }
    }
    else {
        // Default: try active config, then development config
        configFile = 'site-config.json';
    }
    const configPath = join(deploymentsDir, configFile);
    let config;
    try {
        const configData = readFileSync(configPath, 'utf-8');
        config = JSON.parse(configData);
        console.log(`✅ Loaded site config from: ${configPath}`);
    }
    catch (error) {
        // Fall back to development config
        const defaultConfigPath = join(deploymentsDir, 'site-config.development.json');
        try {
            const configData = readFileSync(defaultConfigPath, 'utf-8');
            config = JSON.parse(configData);
            console.log(`✅ Loaded default site config from: ${defaultConfigPath}`);
        }
        catch (fallbackError) {
            console.error(`❌ Failed to load site configuration from ${configPath} or ${defaultConfigPath}`);
            throw new Error('Site configuration file not found. Please create site-config.development.json in deployments/');
        }
    }
    // Resolve relative paths to absolute paths
    config.paths.content = resolvePath(config.paths.content, projectRoot);
    config.paths.database = resolvePath(config.paths.database, projectRoot);
    config.paths.logs = resolvePath(config.paths.logs, projectRoot);
    config.paths.source = resolvePath(config.paths.source, projectRoot);
    cachedConfig = config;
    return config;
}
/**
 * Resolve a path (absolute or relative) to an absolute path
 */
function resolvePath(configPath, projectRoot) {
    if (configPath.startsWith('/') || configPath.match(/^[A-Z]:\\/i)) {
        // Absolute path (Unix or Windows)
        return configPath;
    }
    else {
        // Relative path - resolve from project root
        return resolve(projectRoot, configPath);
    }
}
/**
 * Get a specific config value
 */
export function getConfigValue(key) {
    const config = loadSiteConfig();
    return config[key];
}
/**
 * Clear cached config (useful for testing)
 */
export function clearConfigCache() {
    cachedConfig = null;
}
