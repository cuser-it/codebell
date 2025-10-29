export interface NotificationConfig {
  title?: string;
  message: string;
  level?: "info" | "success" | "warning" | "error";
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  platform: string;
  error?: string;
  messageId?: string;
}

export interface Notifier {
  send(config: NotificationConfig): Promise<NotificationResult>;
  isConfigured(): boolean;
}

