const Mailer = require('./mailer');
const ConfigLoader = require('./config-loader');
const Logger = require('./logger');

class ClaudeMailer {
    constructor(options = {}) {
        this.configLoader = new ConfigLoader();
        this.logger = new Logger(options.logger);
        this.mailer = new Mailer(this.configLoader.getConfig());
        
        this.logger.info('Claude Mailer 初始化完成', {
            config: this.mailer.getConfig()
        });
    }

    async sendNotification(eventType, sessionInfo, additionalInfo = {}) {
        try {
            this.logger.info('开始发送邮件通知', {
                eventType,
                sessionId: sessionInfo.sessionId,
                to: this.mailer.config.to
            });

            const result = await this.mailer.sendNotification(eventType, sessionInfo, additionalInfo);

            this.logger.info('邮件发送成功', {
                eventType,
                sessionId: sessionInfo.sessionId,
                messageId: result.messageId,
                attempt: result.attempt
            });

            return {
                success: true,
                messageId: result.messageId,
                attempt: result.attempt
            };
        } catch (error) {
            this.logger.error('邮件发送失败', {
                eventType,
                sessionId: sessionInfo.sessionId,
                error: error.message
            });

            return {
                success: false,
                error: error.message,
                attempt: this.mailer.config.retryAttempts
            };
        }
    }

    async sendCustomEmail(options) {
        try {
            this.logger.info('开始发送自定义邮件', {
                to: options.to || this.mailer.config.to,
                subject: options.subject
            });

            const result = await this.mailer.sendMail(options);

            this.logger.info('自定义邮件发送成功', {
                to: options.to || this.mailer.config.to,
                subject: options.subject,
                messageId: result.messageId
            });

            return {
                success: true,
                messageId: result.messageId,
                attempt: result.attempt
            };
        } catch (error) {
            this.logger.error('自定义邮件发送失败', {
                to: options.to || this.mailer.config.to,
                subject: options.subject,
                error: error.message
            });

            return {
                success: false,
                error: error.message,
                attempt: this.mailer.config.retryAttempts
            };
        }
    }

    async verifyConnection() {
        try {
            const result = await this.mailer.verifyConnection();
            this.logger.info('SMTP 连接验证', result);
            return result;
        } catch (error) {
            this.logger.error('SMTP 连接验证失败', { error: error.message });
            return { success: false, message: error.message };
        }
    }

    getConfig() {
        return this.mailer.getConfig();
    }

    getLogger() {
        return this.logger;
    }
}

module.exports = ClaudeMailer;

// If run directly, test the connection
if (require.main === module) {
    const mailer = new ClaudeMailer();
    
    mailer.verifyConnection().then(result => {
        if (result.success) {
            console.log('✅ SMTP 连接成功');
            process.exit(0);
        } else {
            console.error('❌ SMTP 连接失败:', result.message);
            process.exit(1);
        }
    }).catch(error => {
        console.error('❌ 连接测试失败:', error.message);
        process.exit(1);
    });
}