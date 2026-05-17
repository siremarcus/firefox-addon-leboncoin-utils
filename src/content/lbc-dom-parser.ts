import { AnnonceEntry } from "../data/annonce-entry";

/**
 * @description Contient la logique d'extraction des infos d'une annonce à partir de son élément DOM.
 * Se baser sur les smaple dans le dossier `sample/` pour ajuster les sélecteurs si nécessaire.
 */
export class LeboncoinDomParser {
  static ATTR_ANNONCE_ID = "data-lbc-annonce-id";
  static ATTR_PROCESSED = "data-lbc-processed";

  /**
   * @description Retourne les éléments du DOM représentant des annonces non encore traitées.
   */
  public findAnnonceNotProcessedElements(element: Document): Element[] {
    const candidates = element.querySelectorAll(
      `article:not([${LeboncoinDomParser.ATTR_PROCESSED}]),
     li[data-qa-id]:not([${LeboncoinDomParser.ATTR_PROCESSED}]),
     li[data-test-id]:not([${LeboncoinDomParser.ATTR_PROCESSED}]),
     [data-qa-id="aditem_container"]:not([${LeboncoinDomParser.ATTR_PROCESSED}])`,
    );
    return Array.from(candidates);
  }

  /**
   * @description Extrait les infos essentielles d'une annonce à partir de son élément DOM, et retourne une AnnonceEntry. Retourne null si l'ID ne peut pas être déterminé.
   * @param annonceElement  HTML element représentant une annonce, typiquement un <article> ou un <li> avec certains attributs data-qa-id ou data-test-id.
   * @returns AnnonceEntry avec les infos extraites, ou null si l'ID ne peut pas être déterminé (dans ce cas l'annonce ne pourra pas être masquée).
   */
  public extractAnnonceInfo(annonceElement: Element): AnnonceEntry | null {
    let id: string | null = this.findId(annonceElement);
    if (id === null) {
      console.warn("[lbc] ID introuvable pour l'annonce :", annonceElement);
      return null;
    }
    let url: string | null = this.findUrl(annonceElement);
    let title: string | null = this.findTitle(annonceElement);
    let price: string | null = this.findPrice(annonceElement);
    let sellerId: string | null = this.findSellerId(annonceElement);
    let location: string | null = this.findLocation(annonceElement);

    return new AnnonceEntry(id!, url, title, price, null, sellerId, location);
  }

  private findId(annonceElement: Element): string | null {
    // Tentative d'extraction de l'ID depuis différents attributs possibles
    for (const attr of ["data-id", "data-ad-id", "data-listing-id"]) {
      const v = annonceElement.getAttribute(attr);
      if (v) return v;
    }
    // Fallback : extraire l'ID depuis le href de l'annonce
    const href = annonceElement.querySelector("a[href]")?.getAttribute("href");
    if (href) {
      const matchHtm = href.match(/_(\d{6,})\.htm/);
      if (matchHtm) return matchHtm[1];
      const matchPath = href.match(/\/(\d{7,})/);
      if (matchPath) return matchPath[1];
    }
    return null;
  }

  private findUrl(annonceElement: Element): string | null {
    const link = annonceElement.querySelector("a[href]");
    return link ? (link as HTMLAnchorElement).href : null;
  }

  private findTitle(annonceElement: Element): string | null {
    let title: string | null = null;
    const ariaLabel = annonceElement.getAttribute("aria-label");
    if (ariaLabel) {
      title = ariaLabel.trim().slice(0, 80);
    }

    if (!title) {
      const spanTitle = annonceElement.querySelector("a[href] span[title]");
      if (spanTitle) {
        const raw = spanTitle
          .getAttribute("title")!
          .replace(/^Voir l'annonce\s*:\s*/i, "")
          .trim();
        if (raw) title = raw.slice(0, 80);
      }
    }
    return title;
  }

  private findLocation(annonceElement: Element): string | null {
    const srOnlyEls = Array.from(annonceElement.querySelectorAll("p.sr-only"));
    for (const el of srOnlyEls) {
      const text = el.textContent?.trim() ?? "";
      const match = text.match(/^Situ[ée]e?\s+à\s+(.+)\.?$/i);
      if (match) return match[1].replace(/\.$/, "").trim();
    }
    return null;
  }

  private findSellerId(annonceElement: Element): string | null {
    // Boutique link (pro sellers): <a href="/boutique/{slug}/...">
    const boutiqueLink = annonceElement.querySelector('a[href*="/boutique/"]');
    if (boutiqueLink) {
      const href = boutiqueLink.getAttribute("href")!;
      const match = href.match(/\/boutique\/([^/?#]+)/);
      if (match) return match[1];
    }
    // Fallback: sr-only text starting with "Vendeur :" or store name patterns
    const srOnlyEls = Array.from(annonceElement.querySelectorAll("p.sr-only"));
    for (const el of srOnlyEls) {
      const text = el.textContent?.trim() ?? "";
      const match = text.match(/^Vendeur\s*:\s*(.+)/i);
      if (match) return match[1].trim().slice(0, 80);
    }
    return null;
  }

  private findPrice(annonceElement: Element): string | null {
    const priceEl = Array.from(
      annonceElement.querySelectorAll("p.sr-only"),
    ).find((el) => el.textContent?.trimStart().startsWith("Prix:"));

    if (!priceEl) return null;

    return (
      priceEl
        .textContent!.replace(/^Prix:\s*/i, "")
        // Normalize non-breaking spaces (U+00A0) and narrow no-break spaces (U+202F)
        .replace(/[  ]/g, " ")
        // Keep up to and including the first currency symbol, drop the rest
        .replace(/([€$£¥]).*/s, "$1")
        .trim() || null
    );
  }
}
