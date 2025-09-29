# Claude Mailer

Claude Code 的独立邮件通知服务，使用 Nodemailer 发送邮件。

## 功能特性

- 🚀 独立的 Node.js 项目，专门用于邮件发送
- 📧 使用 Nodemailer 发送邮件
- 🔄 支持重试机制
- 📝 详细的日志记录
- 🔧 灵活的配置选项
- 🎯 CLI 工具，便于集成
- 📋 YAML 模板系统，支持变量替换和条件渲染
- 🏷️ 邮件标题自动包含工作目录名称
- ⏰ 时间戳格式化（时分格式）
- 💬 Markdown 引用格式支持

## 安装依赖

```bash
cd /data/dev/claude-mailer
pnpm install
```

## 配置

### 环境变量

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# SMTP Configuration
SMTP_HOST=smtp.ym.163.com
SMTP_PORT=994
SMTP_SECURE=true
SMTP_USER=claude@lurenjia.in
SMTP_PASS=6F87X1ZIBh

# Email Settings
FROM_EMAIL=claude@lurenjia.in
TO_EMAIL=2036961035@qq.com
SUBJECT_PREFIX=[Claude Code]

# Retry Settings
RETRY_ATTEMPTS=3
RETRY_DELAY=1000
TIMEOUT=10000
```

### 多语言邮件模板配置

在 `.env` 文件中设置语言：

```env
TEMPLATE_LANGUAGE=zh-CN  # 支持: zh-CN, zh-HK, en
```

每种语言都有独立的模板文件：

- `config/templates.zh-CN.yaml` - 简体中文模板
- `config/templates.zh-HK.yaml` - 繁体中文模板  
- `config/templates.en.yaml` - 英文模板

**模板文件结构：**

```yaml
# config/templates.zh-CN.yaml
subjects:
  Notification: "需要你的注意"
  Stop: "任务完成了"
  Error: "遇到错误了"

content:
  Notification: |
    现在时间是 {{timestamp}} 
    
    {{#if message}}
    > {{message}} 
    
    {{/if}}工作目录: {{cwd}} 
    会话ID: {{sessionId}} 
    
    请打开 Claude Code 终端查看详情。 

defaults:
  subject: "通知"
  message: ""

# config/templates.zh-HK.yaml
subjects:
  Notification: "需要你的注意"
  Stop: "任務完成了"

content:
  Notification: |
    現在時間是 {{timestamp}} 
    
    {{#if message}}
    > {{message}} 
    
    {{/if}}工作目錄: {{cwd}} 
    會話ID: {{sessionId}} 
    
    請打開 Claude Code 終端查看詳情。 

# config/templates.en.yaml
subjects:
  Notification: "Your attention needed"
  Stop: "Task completed"

content:
  Notification: |
    Current time is {{timestamp}} 
    
    {{#if message}}
    > {{message}} 
    
    {{/if}}Working directory: {{cwd}} 
    Session ID: {{sessionId}} 
    
    Please open Claude Code terminal for details. 
```

**支持的语言：**
- `zh-CN` - 简体中文（默认）
- `zh-HK` - 繁体中文（香港）
- `en` - English

**模板变量：**
- `{{timestamp}}` - 当前时间（时分格式）
- `{{message}}` - 消息内容（用 Markdown 引用格式包裹）
- `{{cwd}}` - 工作目录
- `{{sessionId}}` - 会话ID
- `{{error}}` - 错误信息
- `{{warning}}` - 警告信息

**条件渲染：**
- `{{#if variable}}content{{/if}}` - 只有当变量存在时才显示内容

## 使用方法

### CLI 命令

#### 验证 SMTP 连接
```bash
node bin/cli.js verify
```

#### 发送测试邮件
```bash
node bin/cli.js test
```

#### 发送通知邮件
```bash
# 从标准输入读取 JSON
echo '{"hook_event_name":"Notification","session_id":"test-session"}' | node bin/cli.js send --stdin

# 使用命令行参数
node bin/cli.js send --event Notification --session test-session
```

#### 发送自定义邮件
```bash
node bin/cli.js custom --subject "测试邮件" --message "这是一封测试邮件"
```

#### 显示配置
```bash
node bin/cli.js config
```

### 编程接口

```javascript
const ClaudeMailer = require('./src/index');

const mailer = new ClaudeMailer();

// 发送通知
await mailer.sendNotification('Notification', { sessionId: 'test-session' });

// 发送自定义邮件
await mailer.sendCustomEmail({
  subject: '自定义邮件',
  text: '邮件内容'
});

// 验证连接
await mailer.verifyConnection();
```

## Claude Code 集成

### 配置方法

在 `~/.claude/settings.json` 中添加以下配置：

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /data/dev/claude-mailer/bin/cli.js send --stdin"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /data/dev/claude-mailer/bin/cli.js send --stdin"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /data/dev/claude-mailer/bin/cli.js send --stdin"
          }
        ]
      }
    ],
    "Error": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /data/dev/claude-mailer/bin/cli.js send --stdin"
          }
        ]
      }
    ],
    "Warning": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /data/dev/claude-mailer/bin/cli.js send --stdin"
          }
        ]
      }
    ],
    "Info": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /data/dev/claude-mailer/bin/cli.js send --stdin"
          }
        ]
      }
    ]
  }
}
```

### 支持的事件

- `Notification` - Claude 需要您的输入或权限
- `Stop` - Claude 完成任务
- `SubagentStop` - Claude 子任务完成
- `Error` - Claude 遇到错误
- `Warning` - Claude 发出警告
- `Info` - Claude 信息通知

### Claude Code 提供的变量

- `{{sessionId}}` - 当前会话ID
- `{{cwd}}` - 当前工作目录
- `{{message}}` - 通知消息内容
- `{{transcript_path}}` - 会话记录文件路径

### 邮件格式特性

- 邮件标题自动包含工作目录的最后一级文件夹名
- 时间戳只显示时分格式（如：19:39）
- 消息内容使用 Markdown 引用格式（> message）
- 每行文本末尾添加空格，防止邮件客户端粘行

## 日志

日志文件位置：
- 普通日志：`~/.claude-mailer/mailer.log`
- 错误日志：`~/.claude-mailer/error.log`

## 项目结构

```
claude-mailer/
├── src/
│   ├── index.js          # 主要入口
│   ├── mailer.js         # 邮件发送核心
│   ├── config-loader.js  # 配置加载器
│   └── logger.js         # 日志记录器
├── bin/
│   └── cli.js            # CLI 工具
├── config/
│   ├── templates.zh-CN.yaml  # 简体中文模板
│   ├── templates.zh-HK.yaml  # 繁体中文模板
│   └── templates.en.yaml      # 英文模板
├── .env                  # 环境变量配置
├── package.json
├── pnpm-lock.yaml
└── README.md
```

## 开发和维护

### 添加新的邮件模板

1. 编辑对应语言的模板文件（如 `config/templates.zh-CN.yaml`）
2. 在 `subjects` 中添加新的主题
3. 在 `content` 中添加对应的内容模板
4. 使用 `{{variable}}` 语法引用变量
5. 使用 `{{#if variable}}content{{/if}}` 进行条件渲染

### 添加新语言支持

1. 在 `config/` 目录下创建新的模板文件（如 `templates.ja.yaml`）
2. 复制现有模板结构并翻译内容
3. 在 `.env.template` 中添加新语言选项说明

### 配置管理

- 所有配置都通过环境变量管理（.env 文件）
- 不再使用 JSON 配置文件
- 模板系统使用 YAML 格式，便于维护

### 邮件格式优化

- 时间戳：只显示时分格式，提高可读性
- 工作目录：自动提取最后一级文件夹名到邮件标题
- 消息格式：使用 Markdown 引用格式，突出显示
- 行间距：每行末尾添加空格，防止邮件客户端粘行
- 多语言支持：支持简体中文、繁体中文（香港）、英文三种语言模板
- 独立语言文件：每种语言都有独立的模板文件，便于维护和扩展

## 开发

### 运行开发模式
```bash
pnpm dev
```

### 运行测试
```bash
pnpm test
```

## 故障排除

### SMTP 连接失败
1. 检查 SMTP 服务器配置
2. 验证用户名和密码
3. 检查网络连接
4. 查看错误日志

### 邮件发送失败
1. 验证收件人邮箱地址
2. 检查邮件内容格式
3. 查看 `~/.claude-mailer/error.log` 日志

### 权限问题
1. 确保脚本有执行权限：`chmod +x bin/cli.js`
2. 确保日志目录有写入权限

## 许可证

MIT License