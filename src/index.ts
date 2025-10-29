#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { FeishuNotifier } from "./notifiers/feishu.js";
import { DingTalkNotifier } from "./notifiers/dingtalk.js";
import { WeChatNotifier } from "./notifiers/wechat.js";
import { TelegramNotifier } from "./notifiers/telegram.js";
import { NotificationConfig, NotificationResult } from "./types.js";

class NotificationServer {
  private server: Server;
  private feishu: FeishuNotifier;
  private dingtalk: DingTalkNotifier;
  private wechat: WeChatNotifier;
  private telegram: TelegramNotifier;

  constructor() {
    this.server = new Server(
      {
        name: "codebell",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 从环境变量初始化通知器
    this.feishu = new FeishuNotifier(process.env.FEISHU_WEBHOOK_URL);
    this.dingtalk = new DingTalkNotifier(
      process.env.DINGTALK_WEBHOOK_URL,
      process.env.DINGTALK_SECRET
    );
    this.wechat = new WeChatNotifier(process.env.WECHAT_WEBHOOK_URL);
    this.telegram = new TelegramNotifier(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    // 列出所有可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: "send_notification",
          description:
            "Send a notification to one or multiple platforms (Feishu, DingTalk, WeChat, Telegram). Use this when you complete a task, reach a milestone, or need to notify the user.",
          inputSchema: {
            type: "object",
            properties: {
              platforms: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["feishu", "dingtalk", "wechat", "telegram", "all"],
                },
                description:
                  "Target platforms to send notification. Use 'all' to send to all configured platforms.",
                default: ["all"],
              },
              title: {
                type: "string",
                description: "Notification title (optional for some platforms)",
              },
              message: {
                type: "string",
                description: "Notification message content",
              },
              level: {
                type: "string",
                enum: ["info", "success", "warning", "error"],
                description: "Notification level/severity",
                default: "info",
              },
              metadata: {
                type: "object",
                description: "Additional metadata (task name, duration, etc.)",
                properties: {
                  taskName: { type: "string" },
                  duration: { type: "string" },
                  filesModified: { type: "number" },
                  status: { type: "string" },
                },
              },
            },
            required: ["message"],
          },
        },
        {
          name: "notify_task_complete",
          description:
            "Notify user that a specific task has been completed. This is a convenience wrapper around send_notification.",
          inputSchema: {
            type: "object",
            properties: {
              taskName: {
                type: "string",
                description: "Name of the completed task",
              },
              duration: {
                type: "string",
                description: "Time taken to complete the task (e.g., '5 minutes')",
              },
              summary: {
                type: "string",
                description: "Brief summary of what was accomplished",
              },
              details: {
                type: "string",
                description: "Detailed information about the task completion",
              },
              platforms: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["feishu", "dingtalk", "wechat", "telegram", "all"],
                },
                default: ["all"],
              },
            },
            required: ["taskName", "summary"],
          },
        },
        {
          name: "notify_milestone",
          description:
            "Notify user about reaching a project milestone or important checkpoint",
          inputSchema: {
            type: "object",
            properties: {
              milestone: {
                type: "string",
                description: "Milestone name or description",
              },
              progress: {
                type: "string",
                description: "Progress percentage or status (e.g., '50%' or '3/5 tasks')",
              },
              nextSteps: {
                type: "string",
                description: "What comes next",
              },
              platforms: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["feishu", "dingtalk", "wechat", "telegram", "all"],
                },
                default: ["all"],
              },
            },
            required: ["milestone", "progress"],
          },
        },
        {
          name: "check_notification_config",
          description:
            "Check which notification platforms are currently configured and available",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ];

      return { tools };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "send_notification":
            return await this.handleSendNotification(args as any);

          case "notify_task_complete":
            return await this.handleTaskComplete(args as any);

          case "notify_milestone":
            return await this.handleMilestone(args as any);

          case "check_notification_config":
            return await this.handleCheckConfig();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleSendNotification(args: {
    platforms?: string[];
    title?: string;
    message: string;
    level?: "info" | "success" | "warning" | "error";
    metadata?: any;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const platforms = args.platforms?.includes("all")
      ? ["feishu", "dingtalk", "wechat", "telegram"]
      : args.platforms || ["all"];

    const config: NotificationConfig = {
      title: args.title,
      message: args.message,
      level: args.level || "info",
      metadata: args.metadata,
    };

    const results: NotificationResult[] = [];

    for (const platform of platforms) {
      try {
        let result: NotificationResult;

        switch (platform) {
          case "feishu":
            result = await this.feishu.send(config);
            break;
          case "dingtalk":
            result = await this.dingtalk.send(config);
            break;
          case "wechat":
            result = await this.wechat.send(config);
            break;
          case "telegram":
            result = await this.telegram.send(config);
            break;
          case "all":
            // Recursively send to all platforms
            const allResult = await this.handleSendNotification({
              ...args,
              platforms: ["feishu", "dingtalk", "wechat", "telegram"],
            });
            return allResult;
          default:
            continue;
        }

        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          platform,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const summary = `✅ Sent notifications to ${successCount}/${results.length} platform(s)`;

    return {
      content: [
        {
          type: "text",
          text: `${summary}\n\n${results
            .map(
              (r) =>
                `${r.platform}: ${r.success ? "✓ Success" : `✗ Failed - ${r.error}`}`
            )
            .join("\n")}`,
        },
      ],
    };
  }

  private async handleTaskComplete(args: {
    taskName: string;
    duration?: string;
    summary: string;
    details?: string;
    platforms?: string[];
  }) {
    const message = `
📋 **任务完成**

**任务名称**: ${args.taskName}
${args.duration ? `**耗时**: ${args.duration}` : ""}

**摘要**: ${args.summary}
${args.details ? `\n**详情**: ${args.details}` : ""}

---
🤖 由 AI 助手自动发送
    `.trim();

    return this.handleSendNotification({
      platforms: args.platforms,
      title: `✅ 任务完成: ${args.taskName}`,
      message,
      level: "success",
      metadata: {
        taskName: args.taskName,
        duration: args.duration,
        type: "task_complete",
      },
    });
  }

  private async handleMilestone(args: {
    milestone: string;
    progress: string;
    nextSteps?: string;
    platforms?: string[];
  }) {
    const message = `
🎯 **里程碑达成**

**里程碑**: ${args.milestone}
**进度**: ${args.progress}
${args.nextSteps ? `\n**下一步**: ${args.nextSteps}` : ""}

---
🤖 由 AI 助手自动发送
    `.trim();

    return this.handleSendNotification({
      platforms: args.platforms,
      title: `🎯 里程碑: ${args.milestone}`,
      message,
      level: "info",
      metadata: {
        milestone: args.milestone,
        progress: args.progress,
        type: "milestone",
      },
    });
  }

  private async handleCheckConfig() {
    const status = {
      feishu: !!process.env.FEISHU_WEBHOOK_URL,
      dingtalk: !!process.env.DINGTALK_WEBHOOK_URL,
      wechat: !!process.env.WECHAT_WEBHOOK_URL,
      telegram:
        !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID,
    };

    const configured = Object.entries(status)
      .filter(([_, enabled]) => enabled)
      .map(([platform]) => platform);

    const notConfigured = Object.entries(status)
      .filter(([_, enabled]) => !enabled)
      .map(([platform]) => platform);

    return {
      content: [
        {
          type: "text",
          text: `
📊 **通知配置状态**

✅ **已配置** (${configured.length}): ${configured.join(", ") || "无"}

⚠️ **未配置** (${notConfigured.length}): ${notConfigured.join(", ") || "无"}

提示: 在环境变量中配置 Webhook URL 来启用通知平台
          `.trim(),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("CodeBell MCP Server running on stdio");
  }
}

const server = new NotificationServer();
server.run().catch(console.error);

