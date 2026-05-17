/**
 * @description represente les paramètres de l'extension, avec des valeurs par défaut.
 */
export class ApplicationSettingsDefinition {
  // Nombre de jours après lesquels les annonces masquées sont automatiquement purgées du stockage local. 0 pour désactiver la purge automatique.
  autoPurgeMaxDays: number = 180;
  // Utiliser browser.storage.sync (Firefox Sync) au lieu de browser.storage.local pour les annonces masquées.
  useSync: boolean = false;
}
