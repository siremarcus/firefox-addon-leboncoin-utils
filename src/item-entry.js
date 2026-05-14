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
