import axios from "axios";
import crypto from "crypto-js";
import { Notifier, NotificationConfig, NotificationResult } from "../types.js";

export class DingTalkNotifier implements Notifier {
  constructor(
    private webhookUrl?: string,
    private secret?: string
  ) {}

  isConfigured(): boolean {
    return !!this.webhookUrl;
  }

  async send(config: NotificationConfig): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        platform: "dingtalk",
        error: "DingTalk webhook URL not configured",
      };
    }

    try {
      const url = this.signUrl();
      const emoji = this.getEmoji(config.level);

      // 钉钉 Markdown 格式
      const markdown = `
### ${emoji} ${config.title || "通知"}

${config.message}

${
  config.metadata
    ? `---
**元数据**:
${Object.entries(config.metadata)
  .map(([key, value]) => `- **${key}**: ${value}`)
  .join("\n")}
`
    : ""
}

---
> 🕐 ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
      `.trim();

      const payload = {
        msgtype: "markdown",
        markdown: {
          title: config.title || "通知",
          text: markdown,
        },
      };

      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
      });

      if (response.data.errcode === 0) {
        return {
          success: true,
          platform: "dingtalk",
        };
      } else {
        return {
          success: false,
          platform: "dingtalk",
          error: response.data.errmsg || "Unknown error",
        };
      }
    } catch (error) {
      return {
        success: false,
        platform: "dingtalk",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private signUrl(): string {
    if (!this.secret || !this.webhookUrl) {
      return this.webhookUrl || "";
    }

    const timestamp = Date.now();
    const stringToSign = `${timestamp}\n${this.secret}`;
    const sign = crypto.enc.Base64.stringify(
      crypto.HmacSHA256(stringToSign, this.secret)
    );

    return `${this.webhookUrl}&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
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

