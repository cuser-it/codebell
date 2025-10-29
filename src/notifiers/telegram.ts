import axios from "axios";
import { Notifier, NotificationConfig, NotificationResult } from "../types.js";

export class TelegramNotifier implements Notifier {
  constructor(
    private botToken?: string,
    private chatId?: string
  ) {}

  isConfigured(): boolean {
    return !!this.botToken && !!this.chatId;
  }

  async send(config: NotificationConfig): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        platform: "telegram",
        error: "Telegram bot token or chat ID not configured",
      };
    }

    try {
      const emoji = this.getEmoji(config.level);

      // Telegram 支持 Markdown 格式
      const text = `
${emoji} *${this.escapeMarkdown(config.title || "Notification")}*

${this.escapeMarkdown(config.message)}

${
  config.metadata
    ? `\n*Metadata*:\n${Object.entries(config.metadata)
        .map(([key, value]) => `• *${this.escapeMarkdown(key)}*: ${this.escapeMarkdown(String(value))}`)
        .join("\n")}`
    : ""
}

_🕐 ${this.escapeMarkdown(new Date().toLocaleString("en-US"))}_
      `.trim();

      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

      const response = await axios.post(
        url,
        {
          chat_id: this.chatId,
          text: text,
          parse_mode: "Markdown",
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 5000,
        }
      );

      if (response.data.ok) {
        return {
          success: true,
          platform: "telegram",
          messageId: response.data.result.message_id,
        };
      } else {
        return {
          success: false,
          platform: "telegram",
          error: response.data.description || "Unknown error",
        };
      }
    } catch (error) {
      return {
        success: false,
        platform: "telegram",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
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

