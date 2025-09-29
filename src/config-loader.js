require('dotenv').config();
const path = require('path');
const fs = require('fs');
const os = require('os');

class ConfigLoader {
    constructor() {
        this.config = this.loadConfig();
    }

    // 获取用户配置目录
    getUserConfigDir() {
        return path.join(os.homedir(), '.claude-mailer');
    }

    // 获取全局配置文件路径
    getGlobalConfigPath() {
        return path.join(this.getUserConfigDir(), '.env');
    }

    // 获取项目配置文件路径
    getProjectConfigPath() {
        // 从当前目录向上查找，直到找到包含 package.json 的目录
        let currentDir = process.cwd();
        while (currentDir !== path.parse(currentDir).root) {
            if (fs.existsSync(path.join(currentDir, 'package.json'))) {
                return path.join(currentDir, '.env');
            }
            currentDir = path.dirname(currentDir);
        }
        return path.join(process.cwd(), '.env');
    }

    // 加载配置文件
    loadConfigFile(configPath) {
        if (!fs.existsSync(configPath)) {
            return {};
        }

        const result = require('dotenv').config({ path: configPath });
        if (result.error) {
            console.warn(`Warning: Failed to load config file ${configPath}:`, result.error.message);
            return {};
        }
        return result.parsed || {};
    }

    // 创建默认配置文件
    createDefaultConfig(configPath) {
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        const defaultConfig = `# Claude Code Mailer Configuration
# Copy this file to .env and fill in your settings

# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# Email Settings
FROM_EMAIL=your-email@example.com
TO_EMAIL=recipient@example.com
SUBJECT_PREFIX=[Claude Code]

# Template Language (zh-CN, zh-HK, en)
TEMPLATE_LANGUAGE=zh-CN

# Retry Settings
RETRY_ATTEMPTS=3
RETRY_DELAY=1000
TIMEOUT=10000
`;

        fs.writeFileSync(configPath, defaultConfig);
        console.log(`📝 Created default configuration file: ${configPath}`);
    }

    loadConfig() {
        // 配置文件加载优先级：
        // 1. 环境变量（最高优先级）
        // 2. 项目级 .env 文件
        // 3. 全局配置文件 ~/.claude-mailer/.env
        // 4. 默认值

        let configData = {};

        // 1. 尝试加载全局配置文件
        const globalConfigPath = this.getGlobalConfigPath();
        if (fs.existsSync(globalConfigPath)) {
            console.log(`📂 Loading global config from: ${globalConfigPath}`);
            configData = { ...configData, ...this.loadConfigFile(globalConfigPath) };
        }

        // 2. 尝试加载项目级配置文件
        const projectConfigPath = this.getProjectConfigPath();
        if (fs.existsSync(projectConfigPath)) {
            console.log(`📂 Loading project config from: ${projectConfigPath}`);
            configData = { ...configData, ...this.loadConfigFile(projectConfigPath) };
        }

        // 3. 如果没有任何配置文件，创建全局配置文件
        if (!fs.existsSync(globalConfigPath) && !fs.existsSync(projectConfigPath)) {
            console.log('🔧 No configuration file found, creating default global config...');
            this.createDefaultConfig(globalConfigPath);
            console.log(`\n⚠️  Please edit the configuration file: ${globalConfigPath}`);
            console.log('Then run your command again.\n');
            process.exit(1);
        }

        // 4. 构建配置对象
        const config = {
            smtp: {
                host: process.env.SMTP_HOST || configData.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || configData.SMTP_PORT) || 587,
                secure: (process.env.SMTP_SECURE || configData.SMTP_SECURE) !== undefined 
                    ? (process.env.SMTP_SECURE || configData.SMTP_SECURE) === 'true' 
                    : false,
                auth: {
                    user: process.env.SMTP_USER || configData.SMTP_USER,
                    pass: process.env.SMTP_PASS || configData.SMTP_PASS
                }
            },
            from: process.env.FROM_EMAIL || configData.FROM_EMAIL,
            to: process.env.TO_EMAIL || configData.TO_EMAIL,
            subjectPrefix: process.env.SUBJECT_PREFIX || configData.SUBJECT_PREFIX || '[Claude Code]',
            language: process.env.TEMPLATE_LANGUAGE || configData.TEMPLATE_LANGUAGE || 'zh-CN',
            retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || configData.RETRY_ATTEMPTS) || 3,
            retryDelay: parseInt(process.env.RETRY_DELAY || configData.RETRY_DELAY) || 1000,
            timeout: parseInt(process.env.TIMEOUT || configData.TIMEOUT) || 10000
        };

        return config;
    }

    mergeConfig(target, source) {
        for (const key in source) {
            if (source[key] !== undefined && source[key] !== null) {
                if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    target[key] = target[key] || {};
                    this.mergeConfig(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
    }

    getConfig() {
        return this.config;
    }

    getSmtpConfig() {
        return this.config.smtp;
    }

    getEmailConfig() {
        return {
            from: this.config.from,
            to: this.config.to,
            subjectPrefix: this.config.subjectPrefix
        };
    }
}

module.exports = ConfigLoader;