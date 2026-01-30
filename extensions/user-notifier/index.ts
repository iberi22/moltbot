import type { ClawdbotPluginApi } from "clawdbot/plugin-sdk";

const plugin = {
  id: "user-notifier",
  name: "User Notifier",
  description: "Notifies the user via WhatsApp/Telegram about bot activity.",
  configSchema: {
    safeParse(value: any) {
      return { success: true, data: value };
    },
  },
  register(api: ClawdbotPluginApi) {
    const config = api.pluginConfig || {};
    const logger = api.logger;

    const notify = async (message: string) => {
      // WhatsApp Notification
      if (config.targetNumber) {
        try {
          await api.runtime.channel.whatsapp.sendMessageWhatsApp({
            target: String(config.targetNumber),
            message: `[Clawdbot Notification]\n\n${message}`,
          });
          logger.info(`Notification sent to WhatsApp: ${config.targetNumber}`);
        } catch (err) {
          logger.error(`Failed to send WhatsApp notification: ${err}`);
        }
      }

      // Telegram Notification
      if (config.telegramChatId) {
        try {
          await api.runtime.channel.telegram.sendMessageTelegram({
            chatId: String(config.telegramChatId),
            text: `[Clawdbot Notification]\n\n${message}`,
          });
          logger.info(`Notification sent to Telegram: ${config.telegramChatId}`);
        } catch (err) {
          logger.error(`Failed to send Telegram notification: ${err}`);
        }
      }
    };

    // Hook: Gateway Start
    if (config.notifyOnGatewayStart !== false) {
      api.on("gateway_start", async (event) => {
        await notify(`🚀 Gateway started on port ${event.port}`);
      });
    }

    // Hook: Message Received
    if (config.notifyOnMessageReceived === true) {
      api.on("message_received", async (event) => {
        await notify(`📩 Message received from ${event.from}`);
      });
    }

    // Hook: Agent End (Error tracking)
    if (config.notifyOnAgentError !== false) {
      api.on("agent_end", async (event) => {
        if (!event.success) {
          await notify(`❌ Agent error:\n${event.error || "Unknown error"}`);
        }
      });
    }

    logger.info("User Notifier plugin registered.");
  },
};

export default plugin;
