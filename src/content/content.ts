/**
 * Leboncoin - Masquer des annonces
 * Content script : ajoute un bouton "Masquer" sur chaque annonce
 * et cache les annonces déjà masquées au chargement.
 */

import { AnnonceEntry } from "../data/annonce-entry";
import { HiddenAnnoncesStorage } from "../data/annonce-entry-storage";
import { LeboncoinDomParser } from "./lbc-dom-parser";

const domParser = new LeboncoinDomParser();

// ─── Bouton "Masquer" ───────────────────────────────────────────────────────

/**
 * @description Crée le bouton "Masquer" pour une annonce.
 * Au clic, persiste l'annonce dans le storage et réduit visuellement l'élément.
 */
function createHideButton(
  annonceInfo: AnnonceEntry,
  annonceElement: Element,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "lbc-hide-btn";
  btn.title = "Masquer cette annonce";
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
    console.log(
      `[lbc] Masquage annonce : ${annonceInfo.id} — ${annonceInfo.title}`,
    );
    await HiddenAnnoncesStorage.saveOneAsync(
      new AnnonceEntry(
        annonceInfo.id,
        annonceInfo.url,
        annonceInfo.title,
        annonceInfo.price,
      ),
    );
    collapseAnnonce(annonceElement, annonceInfo.id, annonceInfo.title);
  });

  return btn;
}

// ─── Affichage masqué / réduit ──────────────────────────────────────────────

/**
 * @description Réduit visuellement une annonce à une bannière "Annonce masquée" avec un bouton "Ré-afficher".
 * Idempotent : sans effet si la bannière existe déjà.
 */
function collapseAnnonce(
  annonceElement: Element,
  annonceId: string,
  title: string | null = null,
): void {
  annonceElement.classList.add("lbc-annonce-hidden");
  annonceElement.setAttribute(domParser.ATTR_ANNONCE_ID, annonceId);

  let banner = annonceElement.querySelector(".lbc-hidden-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.className = "lbc-hidden-banner";

    const span = document.createElement("span");
    span.title = title ?? "";
    span.textContent = title ? title.slice(0, 60) : "Annonce masquée";

    const showBtn = document.createElement("button");
    showBtn.className = "lbc-show-btn";
    showBtn.title = "Ré-afficher cette annonce";
    showBtn.textContent = "Ré-afficher";
    showBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`[lbc] Restauration annonce : ${annonceId}`);
      await HiddenAnnoncesStorage.removeOneAsync(annonceId);
      restoreAnnonce(annonceElement);
    });

    banner.appendChild(span);
    banner.appendChild(showBtn);
    annonceElement.appendChild(banner);
  }
}

/** @description Restaure l'affichage normal d'une annonce préalablement masquée. */
function restoreAnnonce(annonceElement: Element): void {
  annonceElement.classList.remove("lbc-annonce-hidden");
  annonceElement.querySelector(".lbc-hidden-banner")?.remove();
  // Supprime le marqueur "traité" pour que processPage puisse ré-ajouter le bouton "Masquer".
  annonceElement.removeAttribute(domParser.ATTR_PROCESSED);
  annonceElement.removeAttribute(domParser.ATTR_ANNONCE_ID);
}

// ─── Traitement d'un élément annonce ───────────────────────────────────────

/**
 * @description Traite un élément annonce : le marque comme traité, puis soit le masque
 * s'il est dans le cache, soit lui ajoute le bouton "Masquer".
 */
async function processAnnonceElement(
  annonceElement: Element,
  annoncesCache: Map<string, AnnonceEntry>,
): Promise<void> {
  annonceElement.setAttribute(domParser.ATTR_PROCESSED, "1");

  const info = domParser.extractAnnonceInfo(annonceElement);
  if (!info) return;

  if (annoncesCache.has(info.id)) {
    collapseAnnonce(
      annonceElement,
      info.id,
      annoncesCache.get(info.id)?.title ?? null,
    );
    return;
  }

  const btn = createHideButton(info, annonceElement);
  annonceElement.classList.add("lbc-annonce-processed");
  annonceElement.appendChild(btn);
}

// ─── Traitement de la page ──────────────────────────────────────────────────

/**
 * @description Parcourt les annonces non traitées de la page et les traite.
 * Ne fait rien sur les pages de détail d'annonce (/ad/…).
 */
async function processPage(): Promise<void> {
  if (/^\/ad\//.test(location.pathname)) return;
  const annoncesCache = new Map(
    (await HiddenAnnoncesStorage.getAsync()).map((a) => [a.id, a]),
  );
  const annonces = domParser.findAnnonceElements(document);
  console.log(
    `[lbc] processPage: ${annonces.length} nouvelles annonces, ${annoncesCache.size} masquées`,
  );
  for (const annonce of annonces) {
    await processAnnonceElement(annonce, annoncesCache);
  }
}

// ─── Observation des mutations (scroll infini) ──────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** @description Relance processPage avec un debounce de 300ms à chaque mutation du DOM. */
const observer = new MutationObserver(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(processPage, 300);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// ─── Initialisation ─────────────────────────────────────────────────────────

HiddenAnnoncesStorage.purgeOldAsync().then(processPage);
