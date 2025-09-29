const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
require('dotenv').config();

class Mailer {
    constructor(config = {}) {
        this.config = {
            smtp: {
                host: config.smtp?.host || process.env.SMTP_HOST,
                port: parseInt(config.smtp?.port || process.env.SMTP_PORT),
                secure: config.smtp?.secure !== undefined ? config.smtp?.secure : process.env.SMTP_SECURE === 'true',
                auth: {
                    user: config.smtp?.auth?.user || process.env.SMTP_USER,
                    pass: config.smtp?.auth?.pass || process.env.SMTP_PASS
                }
            },
            from: config.from || process.env.FROM_EMAIL,
            to: config.to || process.env.TO_EMAIL,
            subjectPrefix: config.subjectPrefix || process.env.SUBJECT_PREFIX,
            retryAttempts: parseInt(config.retryAttempts || process.env.RETRY_ATTEMPTS),
            retryDelay: parseInt(config.retryDelay || process.env.RETRY_DELAY),
            timeout: parseInt(config.timeout || process.env.TIMEOUT),
            language: config.language || process.env.TEMPLATE_LANGUAGE || 'zh-CN'
        };

        this.templates = this.loadTemplates();
        this.transporter = null;
        this.initTransporter();
    }

    initTransporter() {
        this.transporter = nodemailer.createTransport({
            host: this.config.smtp.host,
            port: this.config.smtp.port,
            secure: this.config.smtp.secure,
            auth: {
                user: this.config.smtp.auth.user,
                pass: this.config.smtp.auth.pass
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: this.config.timeout,
            greetingTimeout: this.config.timeout,
            socketTimeout: this.config.timeout,
            debug: true,
            logger: true
        });
    }

    async sendMail(options) {
        const mailOptions = {
            from: this.config.from,
            to: options.to || this.config.to,
            subject: `${this.config.subjectPrefix} ${options.subject}`,
            text: options.text || options.message || '',
            html: options.html || null,
            date: new Date()
        };

        if (options.html) {
            mailOptions.html = options.html;
        }

        return this.retrySend(mailOptions);
    }

    async retrySend(mailOptions, attempt = 1) {
        try {
            const info = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId,
                response: info.response,
                attempt: attempt
            };
        } catch (error) {
            if (attempt < this.config.retryAttempts) {
                console.log(`邮件发送失败，第 ${attempt} 次重试... 错误: ${error.message}`);
                await this.delay(this.config.retryDelay);
                return this.retrySend(mailOptions, attempt + 1);
            } else {
                throw new Error(`邮件发送失败，已重试 ${this.config.retryAttempts} 次。错误: ${error.message}`);
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async sendNotification(eventType, sessionInfo, additionalInfo = {}) {
        const subject = this.getSubject(eventType, sessionInfo, additionalInfo);
        const message = this.getMessage(eventType, sessionInfo, additionalInfo);

        return this.sendMail({
            subject: subject,
            text: message
        });
    }

    loadTemplates() {
        const language = this.config.language || 'zh-CN';
        const templatePath = path.join(__dirname, `../config/templates.${language}.yaml`);
        
        try {
            const templateData = fs.readFileSync(templatePath, 'utf8');
            return yaml.load(templateData);
        } catch (error) {
            console.warn(`无法加载语言模板文件 ${language}:`, error.message);
            
            // 回退到英文模板
            if (language !== 'en') {
                try {
                    const fallbackPath = path.join(__dirname, '../config/templates.en.yaml');
                    const fallbackData = fs.readFileSync(fallbackPath, 'utf8');
                    return yaml.load(fallbackData);
                } catch (fallbackError) {
                    console.warn('无法加载英文模板文件:', fallbackError.message);
                }
            }
            
            // 最终回退到内置模板
            return {
                subjects: {
                    Notification: "Your attention needed",
                    Stop: "Task completed",
                    SubagentStop: "Subtask completed"
                },
                content: {
                    Notification: "Current time is {{timestamp}}\n\n{{#if message}}> {{message}}\n\n{{/if}}Working directory: {{cwd}}\nSession ID: {{sessionId}}\n\nPlease open Claude Code terminal for details.",
                    Stop: "Current time is {{timestamp}}\n\n{{#if message}}> {{message}}\n\n{{/if}}Working directory: {{cwd}}\nSession ID: {{sessionId}}\n\nPlease check terminal for details.",
                    SubagentStop: "Current time is {{timestamp}}\n\n{{#if message}}> {{message}}\n\n{{/if}}Working directory: {{cwd}}\nSession ID: {{sessionId}}\n\nPlease check terminal for details."
                },
                defaults: {
                    subject: 'Notification',
                    message: ''
                }
            };
        }
    }

    renderTemplate(template, data) {
        // 处理条件语句 {{#if variable}}content{{/if}}
        template = template.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, content) => {
            return data[variable] ? content : '';
        });
        
        // 处理变量替换 {{variable}}
        template = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : match;
        });
        
        return template;
    }

    getSubject(eventType, sessionInfo, additionalInfo = {}) {
        const baseSubject = this.templates.subjects[eventType] || this.templates.defaults.subject;
        
        // 从工作目录中提取最后一级文件夹名
        const cwd = additionalInfo.cwd || sessionInfo.cwd || '';
        let folderName = '';
        if (cwd) {
            const parts = cwd.split('/');
            const lastPart = parts[parts.length - 1];
            if (lastPart) {
                folderName = lastPart;
            }
        }
        
        // 如果有文件夹名，添加到标题中
        if (folderName) {
            return `${baseSubject} @${folderName}`;
        }
        
        return baseSubject;
    }

    getMessage(eventType, sessionInfo, additionalInfo = {}) {
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const templateData = {
            timestamp,
            message: additionalInfo.message || '',
            cwd: additionalInfo.cwd || sessionInfo.cwd || '未知',
            sessionId: sessionInfo.sessionId || 'unknown'
        };
        
        const template = this.templates.content[eventType];
        if (!template) {
            return this.templates.defaults.message;
        }
        
        let message = this.renderTemplate(template, templateData);
        
        if (additionalInfo.details) {
            message += `

详细信息:
${additionalInfo.details}`;
        }
        
        return message;
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            return { success: true, message: 'SMTP 连接成功' };
        } catch (error) {
            return { success: false, message: `SMTP 连接失败: ${error.message}` };
        }
    }

    getConfig() {
        return {
            ...this.config,
            smtp: {
                ...this.config.smtp,
                auth: {
                    user: this.config.smtp.auth.user,
                    pass: '***hidden***'
                }
            }
        };
    }
}

module.exports = Mailer;
