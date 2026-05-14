/**
 * @description Représente une annonce masquée.
 */
import { AnnonceEntry } from "./annonce-entry";
import { BrowserStorage } from "./browser-storage";
import { ApplicationSettings } from "./settings-storage";

/**
 * @description Gère la persistance des annonces masquées dans le storage local du navigateur.
 */
export class HiddenAnnoncesStorage {
  static readonly #KEY = "lbc_hidden_ads";

  /**
   * Lit les annonces masquées depuis le storage local.
   * Les entrées au format legacy (string) sont migrées à la volée.
   */
  static async getAsync(): Promise<AnnonceEntry[]> {
    const result = await BrowserStorage.getAsync<AnnonceEntry[]>(
      HiddenAnnoncesStorage.#KEY,
    );
    const raw = result || [];
    return raw.map(
      (entry) =>
        new AnnonceEntry(
          entry.id,
          entry.url,
          entry.title,
          entry.price ?? null,
          entry.hiddenDate,
        ),
    );
  }

  /**
   * Persiste le tableau des annonces masquées dans le storage local.
   */
  static async saveAsync(annonces: AnnonceEntry[]): Promise<void> {
    await BrowserStorage.saveAsync(HiddenAnnoncesStorage.#KEY, annonces);
  }

  /**
   * Ajoute ou modifie une annonce et persiste.
   */
  static async saveOneAsync(entry: AnnonceEntry): Promise<void> {
    const annonces = await HiddenAnnoncesStorage.getAsync();
    const idx = annonces.findIndex((a) => a.id === entry.id);
    if (idx >= 0) annonces[idx] = entry;
    else annonces.push(entry);
    await HiddenAnnoncesStorage.saveAsync(annonces);
  }

  /**
   * Supprime une annonce et persiste.
   */
  static async removeOneAsync(entryId: string): Promise<void> {
    const annonces = await HiddenAnnoncesStorage.getAsync();
    await HiddenAnnoncesStorage.saveAsync(
      annonces.filter((a) => a.id !== entryId),
    );
  }

  /**
   * Supprime les annonces masquées dont l'âge dépasse le seuil configuré dans les paramètres.
   */
  static async purgeOldAsync(): Promise<void> {
    const { autoPurgeMaxDays } = await ApplicationSettings.loadAsync();
    const cutoff = Date.now() - autoPurgeMaxDays * 24 * 60 * 60 * 1000;
    if (autoPurgeMaxDays === 0) return; // Purge désactivée
    const annonces = await HiddenAnnoncesStorage.getAsync();
    const filtered = annonces.filter(
      (a) => new Date(a.hiddenDate).getTime() >= cutoff,
    );
    if (filtered.length < annonces.length) {
      await HiddenAnnoncesStorage.saveAsync(filtered);
      console.log(
        `[lbc] Purged ${annonces.length - filtered.length} old annonces`,
      );
    }
  }
}
