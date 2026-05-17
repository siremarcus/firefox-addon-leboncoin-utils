/**
 * Leboncoin - Masquer des annonces
 * Content script : ajoute un bouton "Masquer" sur chaque annonce
 * et cache les annonces déjà masquées au chargement.
 */

import { AnnonceEntry } from "../data/annonce-entry";
import { HiddenAnnoncesStorage } from "../data/annonce-entry-storage";
import { HideAnnonceButton } from "./controls/hideAnnonceButton";
import { LeboncoinDomParser } from "./lbc-dom-parser";

/***
 * Classe principale du script de contenu.
 * Elle est responsable de :
 * - Parcourir les annonces de la page et les traiter (ajout du bouton "Masquer", masquage des annonces déjà masquées, etc.)
 * - Gérer les interactions avec les annonces (clic sur le bouton "Masquer", raccourci clavier, etc.)
 * - Observer les mutations du DOM pour traiter les nouvelles annonces chargées dynamiquement (scroll infini).
 */
class ContentMain {
  domParser = new LeboncoinDomParser();
  hideButtons = new Map<string, HideAnnonceButton>();

  constructor() {}

  /**
   * @description Démarre le script de contenu : enregistre les événements et traite la page initiale.
   */
  public start(): void {
    // ─── Observation des mutations (scroll infini) ──────────────────────────────
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => main.processPage(), 300);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    // ─── Traitement initial de la page ─────────────────────────────────────────
    HiddenAnnoncesStorage.purgeOldAsync().then(() => main.processPage());
  }

  /**
   * @description Parcourt les annonces non traitées de la page et les traite.
   * Ne fait rien sur les pages de détail d'annonce (/ad/…).
   */
  async processPage(): Promise<void> {
    if (/^\/ad\//.test(location.pathname)) return;
    const hiddenAnnoncesCache = new Map(
      (await HiddenAnnoncesStorage.getAsync()).map((a) => [a.id, a]),
    );
    const annonces = this.domParser.findAnnonceNotProcessedElements(document);
    console.log(
      `[lbc] processPage: ${annonces.length} nouvelles annonces, ${hiddenAnnoncesCache.size} masquées`,
    );
    for (const annonce of annonces) {
      await this.processAnnonceElement(annonce, hiddenAnnoncesCache);
    }
    console.log(`[lbc] processPage: traitement terminé`);
  }

  /**
   * @description Traite un élément annonce : le marque comme traité, puis soit le masque
   * s'il est dans le cache, soit lui ajoute le bouton "Masquer".
   */
  private async processAnnonceElement(
    annonceElement: Element,
    hiddenAnnonces: Map<string, AnnonceEntry>,
  ): Promise<void> {
    // parse
    const info = this.domParser.extractAnnonceInfo(annonceElement);
    if (!info) return;
    // init hide control
    var hideButton = new HideAnnonceButton(info, annonceElement);
    this.hideButtons.set(info.id, hideButton);

    if (hiddenAnnonces.has(info.id)) {
      hideButton.collapseAnnonce();
      return;
    }
  }

  /**
   * @description Retourne le contrôle associé à une annonce, ou lance une erreur si l'annonce n'a pas de bouton (ce qui ne devrait pas arriver car processPage doit être appelé avant).
   * @param info
   * @returns
   */
  private getControlForAnnonce(info: AnnonceEntry): HideAnnonceButton {
    if (!this.hideButtons.has(info.id)) {
      throw new Error(
        `Aucun HideAnnonceButton trouvé pour l'annonce ${info.id}`,
      );
    }
    return this.hideButtons.get(info.id)!;
  }
}

// ─── Initialisation ─────────────────────────────────────────────────────────
const main = new ContentMain();
main.start();
console.log("[lbc] Content script démarré", main);
