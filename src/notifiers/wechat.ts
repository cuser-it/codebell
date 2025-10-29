import axios from "axios";
import { Notifier, NotificationConfig, NotificationResult } from "../types.js";

export class WeChatNotifier implements Notifier {
  constructor(private webhookUrl?: string) {}

  isConfigured(): boolean {
    return !!this.webhookUrl;
  }

  async send(config: NotificationConfig): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        platform: "wechat",
        error: "WeChat webhook URL not configured",
      };
    }

    try {
      const emoji = this.getEmoji(config.level);

      // 企业微信 Markdown 格式
      const content = `
### ${emoji} ${config.title || "通知"}

${config.message}

${
  config.metadata
    ? `---
**元数据**:
${Object.entries(config.metadata)
  .map(([key, value]) => `> ${key}: <font color="info">${value}</font>`)
  .join("\n")}
`
    : ""
}

---
<font color="comment">🕐 ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</font>
      `.trim();

      const payload = {
        msgtype: "markdown",
        markdown: {
          content: content,
        },
      };

      const response = await axios.post(this.webhookUrl!, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
      });

      if (response.data.errcode === 0) {
        return {
          success: true,
          platform: "wechat",
        };
      } else {
        return {
          success: false,
          platform: "wechat",
          error: response.data.errmsg || "Unknown error",
        };
      }
    } catch (error) {
      return {
        success: false,
        platform: "wechat",
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
}

