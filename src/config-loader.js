require('dotenv').config();

class ConfigLoader {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        // Load config from environment variables
        const config = {
            smtp: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
                secure: process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : undefined,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            },
            from: process.env.FROM_EMAIL,
            to: process.env.TO_EMAIL,
            subjectPrefix: process.env.SUBJECT_PREFIX,
            retryAttempts: process.env.RETRY_ATTEMPTS ? parseInt(process.env.RETRY_ATTEMPTS) : undefined,
            retryDelay: process.env.RETRY_DELAY ? parseInt(process.env.RETRY_DELAY) : undefined,
            timeout: process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : undefined
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