const fs = require('fs');
const path = require('path');

class Logger {
    constructor(options = {}) {
        this.logDir = options.logDir || path.join(process.env.HOME || '/tmp', '.claude-code-mailer');
        this.logFile = path.join(this.logDir, 'mailer.log');
        this.errorFile = path.join(this.logDir, 'error.log');
        this.enableConsole = options.enableConsole !== false;
        this.enableFile = options.enableFile !== false;
        
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const dataStr = Object.keys(data).length > 0 ? ` | ${JSON.stringify(data)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
    }

    writeToFile(filename, message) {
        try {
            fs.appendFileSync(filename, message + '\n');
        } catch (error) {
            console.error('无法写入日志文件:', error.message);
        }
    }

    log(level, message, data = {}) {
        const formattedMessage = this.formatMessage(level, message, data);

        if (this.enableConsole) {
            console.log(formattedMessage);
        }

        if (this.enableFile) {
            if (level === 'error') {
                this.writeToFile(this.errorFile, formattedMessage);
            } else {
                this.writeToFile(this.logFile, formattedMessage);
            }
        }
    }

    info(message, data = {}) {
        this.log('info', message, data);
    }

    warn(message, data = {}) {
        this.log('warn', message, data);
    }

    error(message, data = {}) {
        this.log('error', message, data);
    }

    debug(message, data = {}) {
        this.log('debug', message, data);
    }
}

module.exports = Logger;