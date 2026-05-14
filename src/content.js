/**
 * Leboncoin - Masquer des annonces
 * Content script : ajoute un bouton "Masquer" sur chaque annonce
 * et cache les annonces déjà masquées au chargement.
 */

const STORAGE_KEY = "lbc_hidden_ads";
const ATTR_AD_ID = "data-lbc-ad-id";
const ATTR_PROCESSED = "data-lbc-processed";


// ─── Utilitaires storage ────────────────────────────────────────────────────

async function getHiddenAds() {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const raw = result[STORAGE_KEY] || [];
  const map = new Map();
  for (const entry of raw) {
    if (typeof entry === "string") {
      map.set(entry, new ItemEntry(entry));
    } else {
      map.set(entry.id, new ItemEntry(entry.id, entry.url, entry.title, entry.hiddenDate));
    }
  }
  return map;
}

async function saveHiddenAds(adsMap) {
  await browser.storage.local.set({ [STORAGE_KEY]: [...adsMap.values()] });
}

async function hideAd(adId, adUrl, adTitle) {
  const ads = await getHiddenAds();
  ads.set(adId, new ItemEntry(adId, adUrl, adTitle));
  await saveHiddenAds(ads);
}

async function showAd(adId) {
  const ads = await getHiddenAds();
  ads.delete(adId);
  await saveHiddenAds(ads);
}

// ─── Extraction des infos d'une annonce ────────────────────────────────────

function extractAdInfo(adElement) {
  let id = null;
  let url = null;
  let title = null;

  for (const attr of ["data-id", "data-ad-id", "data-listing-id"]) {
    const v = adElement.getAttribute(attr);
    if (v) { id = v; break; }
  }

  const link = adElement.querySelector("a[href]");
  if (link) {
    const href = link.getAttribute("href");
    if (!id) {
      const matchHtm = href.match(/_(\d{6,})\.htm/);
      if (matchHtm) id = matchHtm[1];
      else {
        const matchPath = href.match(/\/(\d{7,})/);
        if (matchPath) id = matchPath[1];
      }
    }
    url = link.href; // URL absolue réelle
  }

  // L'article porte directement aria-label="Titre de l'annonce"
  const ariaLabel = adElement.getAttribute("aria-label");
  if (ariaLabel) {
    title = ariaLabel.trim().slice(0, 80);
  }

  if (!title) {
    // Le <span> dans le lien a title="Voir l'annonce: Titre de l'annonce"
    const spanTitle = adElement.querySelector("a[href] span[title]");
    if (spanTitle) {
      const raw = spanTitle.getAttribute("title").replace(/^Voir l'annonce\s*:\s*/i, "").trim();
      if (raw) title = raw.slice(0, 80);
    }
  }

  return { id, url, title };
}

// ─── Sélecteurs d'annonces ─────────────────────────────────────────────────

function findAdElements() {
  const candidates = document.querySelectorAll(
    `article:not([${ATTR_PROCESSED}]),
     li[data-qa-id]:not([${ATTR_PROCESSED}]),
     li[data-test-id]:not([${ATTR_PROCESSED}]),
     [data-qa-id="aditem_container"]:not([${ATTR_PROCESSED}])`
  );
  return Array.from(candidates);
}

// ─── Bouton "Masquer" ───────────────────────────────────────────────────────

function createHideButton(adInfo, adElement) {
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
    await hideAd(adInfo.id, adInfo.url, adInfo.title);
    collapseAd(adElement, adInfo.id);
  });

  return btn;
}

// ─── Affichage masqué / réduit ──────────────────────────────────────────────

function collapseAd(adElement, adId) {
  adElement.classList.add("lbc-ad-hidden");
  adElement.setAttribute(ATTR_AD_ID, adId);

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

async function processAdElement(adElement, hiddenAds) {
  adElement.setAttribute(ATTR_PROCESSED, "1");

  const info = extractAdInfo(adElement);
  if (!info.id) return;

  if (hiddenAds.has(info.id)) {
    collapseAd(adElement, info.id);
    return;
  }

  const btn = createHideButton(info, adElement);
  adElement.classList.add("lbc-ad-processed");
  adElement.appendChild(btn);
}

// ─── Traitement de la page ──────────────────────────────────────────────────

async function processPage() {
  if (/^\/ad\//.test(location.pathname)) return;
  const hiddenAds = await getHiddenAds();
  const ads = findAdElements();
  for (const ad of ads) {
    await processAdElement(ad, hiddenAds);
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
