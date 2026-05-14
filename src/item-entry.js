/**
 * @description Représente une annonce masquée, avec son URL, son titre et la date à laquelle elle a été masquée.
 * @property {string} id - L'identifiant unique de l'annonce (ex. "1234567890").
 * @property {string|null} url - L'URL de l'annonce sur leboncoin, ou null si non disponible.
 * @property {string|null} title - Le titre de l'annonce, ou null si non disponible.
 * @property {string} hiddenDate - La date ISO à laquelle l'annonce a été masquée (ex. "2024-06-01T12:34:56.789Z").
 */
class ItemEntry {
  constructor(id, url = null, title = null, hiddenDate = null) {
    this.id = id;
    this.url = url;
    this.title = title;
    this.hiddenDate = hiddenDate ?? new Date().toISOString();
  }
}

/**
 * @description Gère la persistance des annonces masquées dans le storage local du navigateur.
 */
class HiddenAdsStorage {
  static #KEY = "lbc_hidden_ads";

  /**
   * Lit les annonces masquées depuis le storage local.
   * Les entrées au format legacy (string) sont migrées à la volée.
   * @returns {Promise<ItemEntry[]>}
   */
  static async getAsync() {
    const result = await browser.storage.local.get(HiddenAdsStorage.#KEY);
    const raw = result[HiddenAdsStorage.#KEY] || [];
    return raw.map(entry =>
      typeof entry === "string"
        ? new ItemEntry(entry)
        : new ItemEntry(entry.id, entry.url, entry.title, entry.hiddenDate)
    );
  }

  /**
   * Persiste le tableau des annonces masquées dans le storage local.
   * @param {ItemEntry[]} ads
   */
  static async saveAsync(ads) {
    await browser.storage.local.set({ [HiddenAdsStorage.#KEY]: ads });
  }

  /**
   * Ajoute ou modifie une annonce à la liste des masquées et la persiste.
   * @param {ItemEntry} entry
   */
  static async saveOneAsync(entry) {
    const ads = await HiddenAdsStorage.getAsync();
    const idx = ads.findIndex(a => a.id === entry.id);
    if (idx >= 0) ads[idx] = entry;
    else ads.push(entry);
    await HiddenAdsStorage.saveAsync(ads);
  }

  /**
   * suppprime une annonce de la liste des masquées et persiste le changement.
   * @param {string} entryId
   */
  static async removeOneAsync(entryId) {
    const ads = await HiddenAdsStorage.getAsync();
    await HiddenAdsStorage.saveAsync(ads.filter(a => a.id !== entryId));
  }

}
