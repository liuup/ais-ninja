import * as fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
// @formatter:off
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
});
// @formatter:on

import {getLogger} from "../utils/logger";

const logger = getLogger('config');

interface ConfigData {
  [key: string]: any;
}

/**
 * const configFilePath = './path/config.json';
 * const config = new Config(configFilePath);
 *
 * const dbHost = config.getConfigValue('database.host');
 * const dbPort = config.getConfigValue('database.port');
 * const serverPort = config.getConfigValue('server.port');
 * console.log(`Database host: ${dbHost}`);
 * console.log(`Database port: ${dbPort}`);
 * console.log(`Server port: ${serverPort}`);
 */
class Config {
  private readonly configData: ConfigData;

  constructor(configFilePath?: string) {
    if (!configFilePath) {
      configFilePath = this.getEnvironmentValue('GPT_CONFIG_FILE_PATH');
    }
    if (!configFilePath) {
      configFilePath = path.join(__dirname, '../../config.json');
    }
    logger.info(`Config file path: ${configFilePath}`);
    try {
      const configFile = fs.readFileSync(configFilePath, 'utf-8');
      this.configData = JSON.parse(configFile);
    } catch (e) {
      logger.error(`Failed to read config file: ${configFilePath}`);
      throw e;
    }
  }

  private getEnvironmentValue(key: string): string | undefined {
    const environmentKey = key.replace(/\./g, '_');
    return process.env[environmentKey] || process.env[environmentKey.toUpperCase()];
  }

  private getConfigValueFromObject(configObject: ConfigData, keys: string[]): any {
    const key = keys.shift();
    if (key) {
      const value = configObject[key];
      if (value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          return this.getConfigValueFromObject(value, keys);
        } else {
          return value;
        }
      }
    }
    return undefined;
  }

  getConfigValue(key: string): any {
    const environmentValue = this.getEnvironmentValue(key);
    if (environmentValue !== undefined) {
      return environmentValue;
    }

    const keys = key.split('.');
    const configValue = this.getConfigValueFromObject(this.configData, keys);
    if (configValue !== undefined) {
      return configValue;
    }

    throw new Error(`Config value "${key}" not found.`);
  }
}

export let config: Config | undefined;

export function initConfig() {
  if (!config) {
    config = new Config();
  }
}
