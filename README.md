# 🔔 CodeBell

> AI 任务完成智能通知服务 - 让 AI 助手在完成任务后自动通知你

[![npm version](https://img.shields.io/npm/v/codebell.svg)](https://www.npmjs.com/package/codebell)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

CodeBell 是一个强大的 MCP (Model Context Protocol) 通知服务器，让 Cursor、Claude Desktop 等 AI 编程助手能在完成任务后通过飞书、钉钉、企业微信、Telegram 等平台自动发送通知。

---

## ✨ 特性

- 🚀 **多平台支持**: 飞书、钉钉、企业微信、Telegram
- 🔌 **标准 MCP 协议**: 兼容所有支持 MCP 的 AI 工具
- ⚡ **零安装使用**: 通过 `npx` 直接调用，无需本地安装
- 🎯 **智能通知**: AI 自动判断任务完成时机
- 🎨 **富文本支持**: 支持 Markdown、卡片消息等格式
- 🔒 **安全可靠**: 支持钉钉加签验证

---

## 🚀 快速开始

### 1️⃣ 配置你的 AI 工具

使用 [CodeBell 在线配置工具](https://codebell.flic.site) 自动生成配置，或手动配置：

#### Cursor 配置

文件位置：
- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

配置内容：
```json
{
  "mcpServers": {
    "codebell": {
      "command": "npx",
      "args": ["-y", "codebell"],
      "env": {
        "FEISHU_WEBHOOK_URL": "你的飞书webhook",
        "DINGTALK_WEBHOOK_URL": "你的钉钉webhook",
        "DINGTALK_SECRET": "你的钉钉secret"
      }
    }
  }
}
```

#### Claude Desktop 配置

文件位置：
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

配置格式同上。

---

### 2️⃣ 获取 Webhook 地址

#### 飞书 (Feishu/Lark)
1. 在飞书群组中点击 **群设置** → **群机器人** → **添加机器人** → **自定义机器人**
2. 设置机器人名称，获取 Webhook URL
3. 将 URL 填入配置

#### 钉钉 (DingTalk)
1. 在钉钉群组中点击 **群设置** → **智能群助手** → **添加机器人** → **自定义**
2. 选择"加签"安全设置（推荐）
3. 获取 Webhook URL 和 Secret
4. 将两者填入配置

#### 企业微信 (WeChat Work)
1. 在企业微信群组中点击 **群设置** → **群机器人** → **添加群机器人**
2. 设置机器人名称，获取 Webhook URL
3. 将 URL 填入配置

#### Telegram
1. 与 [@BotFather](https://t.me/BotFather) 对话，发送 `/newbot` 创建机器人
2. 获取 Bot Token
3. 与 [@userinfobot](https://t.me/userinfobot) 对话，获取你的 Chat ID
4. 将两者填入配置：
```json
"env": {
  "TELEGRAM_BOT_TOKEN": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
  "TELEGRAM_CHAT_ID": "123456789"
}
```

---

### 3️⃣ 重启 AI 工具

配置完成后，重启 Cursor 或 Claude Desktop，CodeBell 就会自动生效。

---

## 💬 使用方法

配置完成后，直接在 AI 对话中使用：

```
帮我重构这个模块，完成后通知我
```

```
分析整个项目的代码质量，每完成一个模块通知我进度
```

```
这个任务可能需要一段时间，完成后发通知到飞书
```

AI 会在完成任务时自动发送通知！🎊

---

## 🔍 测试配置

在 AI 对话中输入：
```
请检查通知配置状态
```

AI 会告诉你哪些平台已配置，哪些未配置。

---

## 📋 适用场景

- ✅ AI 完成长时间编码任务时通知你
- ✅ 代码重构、批量文件处理完成后提醒
- ✅ 项目里程碑达成通知
- ✅ 错误或警告发生时及时告知
- ✅ 任何需要等待 AI 完成工作的场景

---

## 🔒 隐私和安全

- ✅ **本地处理**: 所有配置在你的本地机器处理
- ✅ **不保存数据**: CodeBell 不上传或保存任何数据
- ✅ **开源透明**: 代码完全开源，可审计
- ✅ **直接通信**: 通知直接从你的机器发送到对应平台

---

## 🆘 常见问题

### Q: 如何配置多个平台？

A: 在 `env` 中同时填写多个平台的配置即可：
```json
"env": {
  "FEISHU_WEBHOOK_URL": "飞书webhook",
  "DINGTALK_WEBHOOK_URL": "钉钉webhook",
  "DINGTALK_SECRET": "钉钉secret",
  "WECHAT_WEBHOOK_URL": "企业微信webhook"
}
```

### Q: npx 每次都要下载吗？

A: npx 会缓存包，首次下载后，后续使用会直接从缓存读取，非常快速。

### Q: 如何指定发送到特定平台？

A: 在对话中明确说明，例如：
```
完成后发通知到飞书
```
```
只通知到钉钉
```

### Q: 通知发送失败怎么办？

A: 检查以下几点：
1. ✅ Webhook URL 是否完整正确
2. ✅ 网络连接是否正常
3. ✅ 钉钉的 Secret 是否正确（如果启用了加签）
4. ✅ 使用"检查通知配置状态"命令验证配置

---

## 🛠️ 技术栈

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- TypeScript
- Node.js

---

## 📚 更多资源

- 🌐 [在线配置工具](https://codebell.flic.site)
- 📖 [完整文档](https://github.com/orua88/codebell)
- 🐛 [问题反馈](https://github.com/orua88/codebell/issues)

---

## 📄 License

MIT © 2025 CodeBell

---

**享受 AI 智能通知带来的便利！** 🎊

