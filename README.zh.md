# Claude Code Mailer

为 [Claude Code](https://claude.ai/code) 提供智能邮件通知。让 Claude 在需要你注意、完成任务或子任务结束时自动发邮件给你，不再需要盯着终端等待。

## 快速开始

一条命令搞定。

```bash
npx claude-code-mailer install
```

交互式向导会引导你完成：

1. 选择邮件服务商（Gmail、163邮箱、QQ邮箱，或自定义 SMTP）
2. 填写 SMTP 账号信息
3. 发送一封测试邮件，你确认收到
4. 配置保存到 `~/.claude-code-mailer/.env`
5. 自动将 hooks 写入 `~/.claude/settings.json`

完成后，Claude Code 每次触发 `Stop`、`SubagentStop`、`Notification` 事件时都会给你发邮件。

## 运行环境要求

- Node.js ≥ 18
- 一个可用的 SMTP 邮箱账户

> **QQ邮箱用户：** 需要在邮箱设置中开启 SMTP 服务，并使用授权码（而非登录密码）。
> **Gmail 用户：** 需要生成 [应用专用密码](https://myaccount.google.com/apppasswords)，不能直接使用 Google 账户密码。

## 命令列表

| 命令 | 说明 |
|------|------|
| `npx claude-code-mailer install` | 交互式初始化向导（首次配置） |
| `npx claude-code-mailer uninstall` | 从 Claude Code 配置中移除 hooks |
| `npx claude-code-mailer verify` | 测试 SMTP 连接并显示当前配置 |
| `npx claude-code-mailer test` | 用当前配置发送一封测试邮件 |
| `npx claude-code-mailer send --stdin` | 从 hook 触发发送通知（内部使用） |
| `npx claude-code-mailer config` | 打印当前解析后的配置 |
| `npx claude-code-mailer custom` | 发送一封自定义邮件 |

## 配置文件

配置保存在 `~/.claude-code-mailer/.env`，可以随时手动编辑：

```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@qq.com
SMTP_PASS=your-authorization-code

FROM_EMAIL=your@qq.com
TO_EMAIL=your@qq.com
SUBJECT_PREFIX=[Claude Code]

# 邮件模板语言：zh-CN | zh-HK | en
TEMPLATE_LANGUAGE=zh-CN

RETRY_ATTEMPTS=3
RETRY_DELAY=1000
TIMEOUT=10000

# 使用自签名证书的 SMTP 服务器需设置为 false
TLS_REJECT_UNAUTHORIZED=true
```

### 配置优先级

环境变量 → 项目目录下的 `.env` → `~/.claude-code-mailer/.env`

## 手动配置 Hooks

如果你想手动配置，在 `~/.claude/settings.json` 中添加：

```json
{
  "hooks": {
    "Notification": [{ "hooks": [{ "type": "command", "command": "npx -y claude-code-mailer send --stdin" }] }],
    "Stop":         [{ "hooks": [{ "type": "command", "command": "npx -y claude-code-mailer send --stdin" }] }],
    "SubagentStop": [{ "hooks": [{ "type": "command", "command": "npx -y claude-code-mailer send --stdin" }] }]
  }
}
```

## 邮件模板

模板为 YAML 格式，随包内置，支持三种语言：

| 文件 | 语言 |
|------|------|
| `templates.zh-CN.yaml` | 简体中文（默认） |
| `templates.zh-HK.yaml` | 繁体中文 |
| `templates.en.yaml` | 英文 |

**模板变量：** `{{timestamp}}`、`{{message}}`、`{{cwd}}`、`{{sessionId}}`
**条件块：** `{{#if message}}…{{/if}}`

## 故障排查

**SMTP 连接失败**
运行 `npx claude-code-mailer verify` 查看详细错误。常见原因：端口填错、密码不对、未启用 SMTP 服务或未使用授权码。

**邮件没收到**
先查垃圾邮件。可运行 `npx claude-code-mailer test` 手动触发发送确认。

**配置目录找不到**
这是旧版本的已知问题，升级到最新版即可：`npx claude-code-mailer@latest install`。

**Hooks 安装后没有触发**
在 Claude Code 中打开 `/hooks` 菜单，重新加载配置后生效。

## 许可证

MIT
