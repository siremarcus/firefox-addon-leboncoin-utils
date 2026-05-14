/**
 * Leboncoin - Masquer des annonces
 * Content script : ajoute un bouton "Masquer" sur chaque annonce
 * et cache les annonces déjà masquées au chargement.
 */

const STORAGE_KEY = "lbc_hidden_ads";
const ATTR_AD_ID = "data-lbc-ad-id";
const ATTR_PROCESSED = "data-lbc-processed";

// ─── Utilitaires storage ────────────────────────────────────────────────────

async function getHiddenIds() {
  const result = await browser.storage.local.get(STORAGE_KEY);
  return new Set(result[STORAGE_KEY] || []);
}

async function saveHiddenIds(ids) {
  await browser.storage.local.set({ [STORAGE_KEY]: [...ids] });
}

async function hideAd(adId) {
  const ids = await getHiddenIds();
  ids.add(adId);
  await saveHiddenIds(ids);
}

async function showAd(adId) {
  const ids = await getHiddenIds();
  ids.delete(adId);
  await saveHiddenIds(ids);
}

// ─── Extraction de l'ID d'une annonce ──────────────────────────────────────

/**
 * Extrait l'identifiant unique d'une annonce depuis l'attribut href
 * d'un lien leboncoin. Ex: /annonces/offres/..._12345678.htm → "12345678"
 * Ou depuis l'attribut data-id / data-ad-id si présent.
 */
function extractAdId(adElement) {
  // Certaines versions du site exposent un attribut data-id directement
  for (const attr of ["data-id", "data-ad-id", "data-listing-id"]) {
    const v = adElement.getAttribute(attr);
    if (v) return v;
  }

  // Sinon on cherche dans le premier lien href
  const link = adElement.querySelector("a[href]");
  if (!link) return null;

  const href = link.getAttribute("href");
  // Format classique : /annonces/…_123456789.htm
  const matchHtm = href.match(/_(\d{6,})\.htm/);
  if (matchHtm) return matchHtm[1];

  // Format alternatif : /p/1234567890 ou contient un long nombre
  const matchPath = href.match(/\/(\d{7,})/);
  if (matchPath) return matchPath[1];

  return null;
}

// ─── Sélecteurs d'annonces ─────────────────────────────────────────────────

/**
 * Retourne tous les éléments du DOM qui représentent une annonce
 * (non encore traités par notre extension).
 */
function findAdElements() {
  // leboncoin utilise des <article> ou des <li> contenant des liens d'annonces
  const candidates = document.querySelectorAll(
    `article:not([${ATTR_PROCESSED}]),
     li[data-qa-id]:not([${ATTR_PROCESSED}]),
     li[data-test-id]:not([${ATTR_PROCESSED}]),
     [data-qa-id="aditem_container"]:not([${ATTR_PROCESSED}])`
  );
  return Array.from(candidates);
}

// ─── Bouton "Masquer" ───────────────────────────────────────────────────────

function createHideButton(adId, adElement) {
  const btn = document.createElement("button");
  btn.className = "lbc-hide-btn";
  btn.title = "Masquer cette annonce";
  btn.setAttribute("aria-label", "Masquer cette annonce");
  btn.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fill-rule="evenodd"
      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414
         l-1.473-1.473A10.014 10.014 0 0019.542 10
         C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781z
         m4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514
         a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/>
    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741
             L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7
             a9.957 9.957 0 004.954-1.303z"/>
  </svg>`;

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await hideAd(adId);
    collapseAd(adElement, adId);
  });

  return btn;
}

// ─── Affichage masqué / réduit ──────────────────────────────────────────────

function collapseAd(adElement, adId) {
  adElement.classList.add("lbc-ad-hidden");
  adElement.setAttribute(ATTR_AD_ID, adId);

  // Remplace le contenu par une bannière "annonce masquée"
  let banner = adElement.querySelector(".lbc-hidden-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.className = "lbc-hidden-banner";
    banner.innerHTML = `
      <span>Annonce masquée</span>
      <button class="lbc-show-btn" title="Ré-afficher cette annonce">Ré-afficher</button>
    `;
    banner.querySelector(".lbc-show-btn").addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await showAd(adId);
      restoreAd(adElement);
    });
    adElement.appendChild(banner);
  }
}

function restoreAd(adElement) {
  adElement.classList.remove("lbc-ad-hidden");
}

// ─── Traitement d'un élément annonce ───────────────────────────────────────

async function processAdElement(adElement, hiddenIds) {
  // Marquer comme traité pour éviter les doublons
  adElement.setAttribute(ATTR_PROCESSED, "1");

  const adId = extractAdId(adElement);
  if (!adId) return;

  // Cacher immédiatement si déjà masqué
  if (hiddenIds.has(adId)) {
    collapseAd(adElement, adId);
    return;
  }

  // Ajouter le bouton masquer
  const btn = createHideButton(adId, adElement);

  // Trouver le meilleur conteneur pour le bouton
  // (on cherche un div de contrôles, sinon on l'ajoute sur l'article)
  adElement.classList.add("lbc-ad-processed");
  adElement.appendChild(btn);
}

// ─── Traitement de la page ──────────────────────────────────────────────────

async function processPage() {
  const hiddenIds = await getHiddenIds();
  const ads = findAdElements();
  for (const ad of ads) {
    await processAdElement(ad, hiddenIds);
  }
}

// ─── Observation des mutations (scroll infini) ──────────────────────────────

let debounceTimer = null;

const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(processPage, 300);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// ─── Initialisation ─────────────────────────────────────────────────────────

processPage();
