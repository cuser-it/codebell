import axios from "axios";
import { Notifier, NotificationConfig, NotificationResult } from "../types.js";

export class FeishuNotifier implements Notifier {
  constructor(private webhookUrl?: string) {}

  isConfigured(): boolean {
    return !!this.webhookUrl;
  }

  async send(config: NotificationConfig): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        platform: "feishu",
        error: "Feishu webhook URL not configured",
      };
    }

    try {
      const emoji = this.getEmoji(config.level);
      const color = this.getColor(config.level);

      // 飞书支持富文本消息
      const payload = {
        msg_type: "interactive",
        card: {
          header: {
            title: {
              tag: "plain_text",
              content: `${emoji} ${config.title || "通知"}`,
            },
            template: color,
          },
          elements: [
            {
              tag: "div",
              text: {
                tag: "lark_md",
                content: config.message,
              },
            },
            ...(config.metadata
              ? [
                  {
                    tag: "hr",
                  },
                  {
                    tag: "div",
                    text: {
                      tag: "lark_md",
                      content: `**元数据**: ${JSON.stringify(config.metadata, null, 2)}`,
                    },
                  },
                ]
              : []),
            {
              tag: "note",
              elements: [
                {
                  tag: "plain_text",
                  content: `发送时间: ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
                },
              ],
            },
          ],
        },
      };

      const response = await axios.post(this.webhookUrl!, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
      });

      if (response.data.code === 0) {
        return {
          success: true,
          platform: "feishu",
        };
      } else {
        return {
          success: false,
          platform: "feishu",
          error: response.data.msg || "Unknown error",
        };
      }
    } catch (error) {
      return {
        success: false,
        platform: "feishu",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private getEmoji(level?: string): string {
    switch (level) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "ℹ️";
    }
  }

  private getColor(level?: string): string {
    switch (level) {
      case "success":
        return "green";
      case "warning":
        return "orange";
      case "error":
        return "red";
      default:
        return "blue";
    }
  }
}

