const { Command } = require('commander');
const ClaudeMailer = require('../src/index');
const fs = require('fs');
const path = require('path');

// Read version from package.json
function getVersion() {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return '1.0.0'; // fallback version
  }
}

class ClaudeMailerCLI {
  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  setupCommands() {
    this.program
      .name('claude-mailer')
      .description('Claude Code email notification service')
      .version(getVersion());

    // Send command
    this.program
      .command('send')
      .description('发送邮件通知')
      .option('-e, --event <type>', '事件类型 (Notification|Stop|SubagentStop|Error|Warning|Info)', 'Notification')
      .option('-s, --session <id>', '会话ID', 'unknown')
      .option('-t, --to <email>', '收件人邮箱')
      .option('-f, --from <email>', '发件人邮箱')
      .option('--subject <text>', '邮件主题')
      .option('--message <text>', '邮件内容')
      .option('--details <text>', '详细信息')
      .option('--json', 'JSON 格式输入')
      .option('--stdin', '从标准输入读取JSON数据')
      .action(async (options) => {
        await this.handleSendCommand(options);
      });

    // Custom command
    this.program
      .command('custom')
      .description('发送自定义邮件')
      .option('-t, --to <email>', '收件人邮箱')
      .option('-f, --from <email>', '发件人邮箱')
      .option('-s, --subject <text>', '邮件主题')
      .option('-m, --message <text>', '邮件内容')
      .option('-h, --html <content>', 'HTML内容')
      .option('--stdin', '从标准输入读取JSON数据')
      .action(async (options) => {
        await this.handleCustomCommand(options);
      });

    // Verify command
    this.program
      .command('verify')
      .description('验证SMTP连接')
      .action(async () => {
        await this.handleVerifyCommand();
      });

    // Config command
    this.program
      .command('config')
      .description('显示当前配置')
      .action(() => {
        this.handleConfigCommand();
      });

    // Test command
    this.program
      .command('test')
      .description('发送测试邮件')
      .option('-t, --to <email>', '测试收件人邮箱')
      .action(async (options) => {
        await this.handleTestCommand(options);
      });
  }

  async handleSendCommand(options) {
    const mailer = new ClaudeMailer();

    if (options.stdin || options.json) {
      // 从标准输入读取JSON数据
      let inputData = '';
      
      if (options.stdin) {
        for await (const chunk of process.stdin) {
          inputData += chunk.toString();
        }
      } else if (options.json) {
        inputData = options.json;
      }

      const data = JSON.parse(inputData);
      
      // 构建 sessionInfo 和 additionalInfo
      const sessionInfo = { 
        sessionId: data.session_id || data.sessionId || options.session 
      };
      
      const additionalInfo = {
        ...data.additional_info,
        ...data.additionalInfo,
        message: data.message,
        cwd: data.cwd,
        transcript_path: data.transcript_path
      };
      
      const result = await mailer.sendNotification(
        data.hook_event_name || data.event || options.event,
        sessionInfo,
        additionalInfo
      );

      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    } else {
      // 使用命令行参数
      const sessionInfo = { sessionId: options.session };
      const additionalInfo = {};
      
      if (options.subject) additionalInfo.subject = options.subject;
      if (options.message) additionalInfo.message = options.message;
      if (options.details) additionalInfo.details = options.details;

      const result = await mailer.sendNotification(options.event, sessionInfo, additionalInfo);

      if (result.success) {
        console.log('✅ 邮件发送成功');
        console.log('📧 Message ID:', result.messageId);
        console.log('🔄 尝试次数:', result.attempt);
        process.exit(0);
      } else {
        console.error('❌ 邮件发送失败:', result.error);
        process.exit(1);
      }
    }
  }

  async handleCustomCommand(options) {
    const mailer = new ClaudeMailer();

    let mailOptions = {};

    if (options.stdin) {
      let inputData = '';
      for await (const chunk of process.stdin) {
        inputData += chunk.toString();
      }
      mailOptions = JSON.parse(inputData);
    } else {
      if (options.to) mailOptions.to = options.to;
      if (options.from) mailOptions.from = options.from;
      if (options.subject) mailOptions.subject = options.subject;
      if (options.message) mailOptions.text = options.message;
      if (options.html) mailOptions.html = options.html;
    }

    const result = await mailer.sendCustomEmail(mailOptions);

    if (result.success) {
      console.log('✅ 邮件发送成功');
      console.log('📧 Message ID:', result.messageId);
      process.exit(0);
    } else {
      console.error('❌ 邮件发送失败:', result.error);
      process.exit(1);
    }
  }

  async handleVerifyCommand() {
    const mailer = new ClaudeMailer();
    const result = await mailer.verifyConnection();

    if (result.success) {
      console.log('✅ SMTP 连接成功');
      console.log('📡 配置信息:', JSON.stringify(mailer.getConfig(), null, 2));
      process.exit(0);
    } else {
      console.error('❌ SMTP 连接失败:', result.message);
      process.exit(1);
    }
  }

  handleConfigCommand() {
    const mailer = new ClaudeMailer();
    const config = mailer.getConfig();
    
    console.log('📧 Claude Code Mailer 配置:');
    console.log(JSON.stringify(config, null, 2));
    process.exit(0);
  }

  async handleTestCommand(options) {
    const mailer = new ClaudeMailer();
    
    const result = await mailer.sendNotification('Info', { sessionId: 'test-session' }, {
      subject: 'Claude Code Mailer 测试邮件',
      message: '这是一封来自 Claude Code Mailer 的测试邮件。',
      details: '如果您收到这封邮件，说明邮件发送功能正常工作。'
    });

    if (result.success) {
      console.log('✅ 测试邮件发送成功');
      console.log('📧 Message ID:', result.messageId);
      console.log('🔄 尝试次数:', result.attempt);
      console.log('📮 收件人:', options.to || mailer.getConfig().to);
      process.exit(0);
    } else {
      console.error('❌ 测试邮件发送失败:', result.error);
      process.exit(1);
    }
  }

  // For direct usage from the unified CLI
  parse(argv = process.argv) {
    this.program.parse(argv);
  }
}

// If this file is run directly, execute the CLI
if (require.main === module) {
  const cli = new ClaudeMailerCLI();
  cli.parse();
}

module.exports = ClaudeMailerCLI;