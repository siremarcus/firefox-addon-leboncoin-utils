
/**
 * @description represente les paramètres de l'extension, avec des valeurs par défaut.
 */
class ApplicationSettingsDefinition 
{
  autoPurgeMaxDays = 180; // Nombre de jours avant de purger les annonces masquées
}


/**
 * @description Charger et enregistrer les paramètres de l'extension dans le storage local du navigateur.
 */
class ApplicationSettings 
{
  static #KEY = "lbc_settings";


  /**
   * Valide et corrige les paramètres si nécessaire (ex: après import manuel depuis le storage). Modifie l'objet en place.
   * @param {ApplicationSettingsDefinition} settings Les paramètres à valider et corriger si nécessaire. Modifié en place.
   */
  static validate(settings) {
    if(typeof settings.autoPurgeMaxDays !== "number" || settings.autoPurgeMaxDays < 0) {
      settings.autoPurgeMaxDays = 180;
    }
  }

  /**
   * Charge les paramètres depuis le storage local.
   * @returns {Promise<ApplicationSettingsDefinition>} Les paramètres chargés depuis le storage local, ou les valeurs par défaut si aucune donnée n'est présente.
   */
  static async loadAsync() {
    const result = await browser.storage.local.get(ApplicationSettings.#KEY);
    const raw = result[ApplicationSettings.#KEY];
    if (raw) {
      const settings = new ApplicationSettingsDefinition();
      ApplicationSettings.validate(settings);
      Object.assign(settings, raw);
      return settings;
    }
    return new ApplicationSettingsDefinition();
  }
  /**
   * Enregistre les paramètres dans le storage local.
   * @param {ApplicationSettingsDefinition} settings Les paramètres à enregistrer.
   * @returns {Promise<void>}
   */
  static async saveAsync(settings) {
    await browser.storage.local.set({ [ApplicationSettings.#KEY]: settings });
  }
}
