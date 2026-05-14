/**
 * @description Représente une annonce masquée, avec les informations essentielles pour l'identifier et l'afficher dans la popup. Les données sont limitées pour éviter d'enregistrer des informations trop volumineuses ou sensibles.
 */
export class AnnonceEntry {
  // ID unique de l'annonce, extrait de son URL ou d'un attribut data-id
  id: string;
  // URL de l'annonce, peut être null si non disponible (ex: format legacy)
  url: string | null;
  // Titre de l'annonce, limité à 80 caractères pour éviter d'enregistrer des données trop volumineuses
  title: string | null;
  // Prix affiché sur l'annonce (ex: "1 200 €")
  price: string | null;
  // ISO string de la date à laquelle l'annonce a été masquée
  hiddenDate: string;

  constructor(
    id: string,
    url: string | null = null,
    title: string | null = null,
    price: string | null = null,
    hiddenDate: string | null = null,
  ) {
    this.id = id;
    this.url = url;
    this.title = title ? title.slice(0, 80) : null;
    this.price = price;
    this.hiddenDate = hiddenDate ?? new Date().toISOString();
  }
}
