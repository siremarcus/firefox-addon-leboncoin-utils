import { AnnonceEntry } from "../../data/annonce-entry";
import { HiddenAnnoncesStorage } from "../../data/annonce-entry-storage";
import { LeboncoinDomParser } from "../lbc-dom-parser";

/**
 * @description Gère la création du bouton "Masquer" sur une annonce, ainsi que le masquage et le ré-affichage de l'annonce.
 */
export class HideAnnonceButton {
  readonly info: AnnonceEntry;
  readonly element: Element;

  public constructor(annonceInfo: AnnonceEntry, annonceElement: Element) {
    this.info = annonceInfo;
    this.element = annonceElement;
    this.createHideButton();
  }

  private createHideButton(): void {
    if (this.element.getAttribute(LeboncoinDomParser.ATTR_PROCESSED) === "1") {
      throw new Error("L'annonce a déjà été traitée : " + this.info.id);
    }
    this.element.setAttribute(LeboncoinDomParser.ATTR_PROCESSED, "1");
    const btn = document.createElement("button");
    btn.className = "lbc-hide-btn";
    btn.title = "Masquer cette annonce (H)";
    btn.setAttribute("aria-label", "Masquer cette annonce");
    const img = document.createElement("img");
    img.src = browser.runtime.getURL("icons/eye-slash.svg");
    img.width = 18;
    img.height = 18;
    img.alt = "Cacher l'annonce";
    img.setAttribute("aria-hidden", "true");
    btn.appendChild(img);

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.hideAnnonce(this.info);
    });

    this.element.classList.add("lbc-annonce-processed");
    this.element.appendChild(btn);
  }

  /**
   * @description Masque une annonce : persistence dans le local storage puis réduit son affichage à une bannière "Annonce masquée".
   * @param annonceInfo
   */
  async hideAnnonce(annonceInfo: AnnonceEntry): Promise<void> {
    console.log(
      `[lbc] Masquage annonce : ${annonceInfo.id} — ${annonceInfo.title}`,
    );
    await HiddenAnnoncesStorage.saveOneAsync(
      new AnnonceEntry(
        annonceInfo.id,
        annonceInfo.url,
        annonceInfo.title,
        annonceInfo.price,
        null,
        annonceInfo.sellerId,
        annonceInfo.location,
      ),
    );
    this.collapseAnnonce();
  }

  /**
   * @description Réduit visuellement une annonce à une bannière "Annonce masquée" avec un bouton "Ré-afficher".
   * Idempotent : sans effet si la bannière existe déjà.
   */
  collapseAnnonce(): void {
    this.element.classList.add("lbc-annonce-hidden");
    this.element.setAttribute(LeboncoinDomParser.ATTR_ANNONCE_ID, this.info.id);

    let banner = this.element.querySelector(".lbc-hidden-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.className = "lbc-hidden-banner";

      const titleText = this.info.title
        ? this.info.title.slice(0, 60)
        : "Annonce masquée";
      const locationText = this.info.location ? ` — ${this.info.location}` : "";
      const labelText = titleText + locationText;

      const safeUrl =
        this.info.url && /^https?:\/\//.test(this.info.url)
          ? this.info.url
          : null;
      let label: HTMLAnchorElement | HTMLSpanElement;
      if (safeUrl) {
        const a = document.createElement("a");
        a.href = safeUrl;
        a.title = this.info.title ?? "";
        a.className = "lbc-hidden-banner-link";
        a.textContent = labelText;
        label = a;
      } else {
        const span = document.createElement("span");
        span.title = this.info.title ?? "";
        span.textContent = labelText;
        label = span;
      }

      const showBtn = document.createElement("button");
      showBtn.className = "lbc-show-btn";
      showBtn.title = "Ré-afficher cette annonce";
      showBtn.textContent = "Ré-afficher";
      showBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`[lbc] Restauration annonce : ${this.info.id}`);
        await HiddenAnnoncesStorage.removeOneAsync(this.info.id);
        this.restoreAnnonce();
      });

      banner.appendChild(label);
      banner.appendChild(showBtn);
      this.element.appendChild(banner);
    }
  }

  /** @description Restaure l'affichage normal d'une annonce préalablement masquée. */
  restoreAnnonce(): void {
    this.element.classList.remove("lbc-annonce-hidden");
    this.element.querySelector(".lbc-hidden-banner")?.remove();
    // Supprime le marqueur "traité" pour que processPage puisse ré-ajouter le bouton "Masquer".
    this.element.removeAttribute(LeboncoinDomParser.ATTR_PROCESSED);
    this.element.removeAttribute(LeboncoinDomParser.ATTR_ANNONCE_ID);
  }
}
