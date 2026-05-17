import type { Runtime } from "webextension-polyfill";

/**
 * @description Script de fond : gère la communication avec les scripts de contenu pour mettre à jour le badge du navigateur.
 */
browser.runtime.onMessage.addListener(
  (message: unknown, sender: Runtime.MessageSender) => {
    const msg = message as Record<string, unknown>;
    if (msg.type === "updateBadge" && sender.tab?.id !== undefined) {
      const count = msg.count as number;
      const tabId = sender.tab.id;
      if (count > 0) {
        browser.browserAction.setBadgeText({ text: String(count), tabId });
        browser.browserAction.setBadgeBackgroundColor({
          color: "#e84040",
          tabId,
        });
      } else {
        browser.browserAction.setBadgeText({ text: "", tabId });
      }
    }
  },
);
