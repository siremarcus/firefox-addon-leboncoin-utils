import { ApplicationSettingsDefinition } from "./settings";

/**
 * @description Charger et enregistrer les paramètres de l'extension dans le storage local du navigateur.
 */
export class ApplicationSettings {
  static readonly #KEY = "lbc_settings";

  /**
   * Valide et corrige les paramètres si nécessaire. Modifie l'objet en place.
   */
  static validate(settings: ApplicationSettingsDefinition): void {
    if (
      typeof settings.autoPurgeMaxDays !== "number" ||
      settings.autoPurgeMaxDays < 0
    ) {
      settings.autoPurgeMaxDays = 180;
    }
    if (typeof settings.useSync !== "boolean") {
      settings.useSync = false;
    }
  }

  /**
   * Charge les paramètres depuis le storage local.
   */
  static async loadAsync(): Promise<ApplicationSettingsDefinition> {
    const result = await browser.storage.local.get(ApplicationSettings.#KEY);
    const raw = result[ApplicationSettings.#KEY] as
      | Partial<ApplicationSettingsDefinition>
      | undefined;
    if (raw) {
      const settings = new ApplicationSettingsDefinition();
      Object.assign(settings, raw);
      ApplicationSettings.validate(settings);
      return settings;
    }
    return new ApplicationSettingsDefinition();
  }

  /**
   * Enregistre les paramètres dans le storage local.
   */
  static async saveAsync(
    settings: ApplicationSettingsDefinition,
  ): Promise<void> {
    await browser.storage.local.set({ [ApplicationSettings.#KEY]: settings });
  }
}
