export class BrowserStorage {
  static #useSync = false;

  static setSync(useSync: boolean): void {
    BrowserStorage.#useSync = useSync;
  }

  static get #area(): typeof browser.storage.local {
    return BrowserStorage.#useSync ? browser.storage.sync : browser.storage.local;
  }

  static async saveAsync<T>(key: string, item: T): Promise<void> {
    await BrowserStorage.#area.set({ [key]: item });
  }

  static async getAsync<T>(key: string): Promise<T | undefined> {
    const result = await BrowserStorage.#area.get(key);
    return result[key] as T | undefined;
  }

  static async removeAsync(key: string): Promise<void> {
    await BrowserStorage.#area.remove(key);
  }
}
