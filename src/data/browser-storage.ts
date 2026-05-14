/**
 * @description Gère la persistance des annonces masquées dans le storage local du navigateur.
 */
export class BrowserStorage {
  /**
   * Persiste le tableau des annonces masquées dans le storage local.
   */
  static async saveAsync<T>(key: string, item: T): Promise<void> {
    await browser.storage.local.set({ [key]: item });
  }

  static async getAsync<T>(key: string): Promise<T | undefined> {
    const result = await browser.storage.local.get(key);
    return result[key] as T | undefined;
  }

  /**
   * Supprime une annonce et persiste.
   */
  static async removeAsync(key: string): Promise<void> {
    await browser.storage.local.remove(key);
  }
}
