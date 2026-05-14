const STORAGE_KEY = "lbc_hidden_ads";

async function getHiddenAds() {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const raw = result[STORAGE_KEY] || [];
  return raw.map(entry =>
    typeof entry === "string" ? { id: entry, url: null, title: null } : entry
  );
}

async function saveHiddenAds(ads) {
  await browser.storage.local.set({ [STORAGE_KEY]: ads });
}

async function render() {
  const ads = await getHiddenAds();
  const summary = document.getElementById("summary");
  const content = document.getElementById("content");

  const plural = ads.length !== 1 ? "s" : "";
  const strong = document.createElement("strong");
  strong.textContent = ads.length;
  summary.replaceChildren(strong, ` annonce${plural} masquée${plural}`);

  if (ads.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.append(
      "Aucune annonce masquée.", document.createElement("br"),
      "Naviguez sur leboncoin et utilisez", document.createElement("br"),
      "le bouton 👁 pour masquer une annonce."
    );
    content.replaceChildren(p);
    return;
  }

  const list = document.createElement("ul");
  list.style.cssText = "list-style:none; padding: 8px 16px; max-height:220px; overflow-y:auto;";

  const sorted = [...ads].sort((a, b) => {
    const da = a.hiddenDate ? new Date(a.hiddenDate) : 0;
    const db = b.hiddenDate ? new Date(b.hiddenDate) : 0;
    return db - da;
  });

  for (const ad of sorted) {
    const li = document.createElement("li");
    li.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid #f0f0f0; font-size:13px; gap:8px;";

    const dateStr = ad.hiddenDate
      ? new Date(ad.hiddenDate).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
      : null;
    const tooltip = [`#${ad.id}`, dateStr].filter(Boolean).join(" — ");

    let label;
    if (ad.url) {
      label = document.createElement("a");
      label.href = ad.url;
      label.target = "_blank";
      label.rel = "noopener noreferrer";
      label.title = `${tooltip} — Ouvrir l'annonce`;
      label.style.cssText = "color:#0065c9; text-decoration:none; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;";
    } else {
      label = document.createElement("span");
      label.title = tooltip;
      label.style.cssText = "color:#555; font-family:monospace; min-width:0; flex:1;";
    }
    const displayTitle = ad.title ? ad.title.slice(0, 60) : `#${ad.id}`;
    label.textContent = displayTitle;

    const btnRestore = document.createElement("button");
    btnRestore.textContent = "Ré-afficher";
    btnRestore.style.cssText = "font-size:11px; padding:3px 8px; border:1px solid #0065c9; color:#0065c9; background:transparent; border-radius:4px; cursor:pointer; white-space:nowrap;";
    btnRestore.addEventListener("click", async () => {
      const current = await getHiddenAds();
      await saveHiddenAds(current.filter(a => a.id !== ad.id));
      render();
    });

    li.appendChild(label);
    li.appendChild(btnRestore);
    list.appendChild(li);
  }

  content.innerHTML = "";
  content.appendChild(list);
}

document.getElementById("btn-clear").addEventListener("click", async () => {
  if (confirm("Ré-afficher toutes les annonces masquées ?")) {
    await saveHiddenAds([]);
    render();
  }
});

document.getElementById("btn-export").addEventListener("click", async () => {
  const ads = await getHiddenAds();
  if (ads.length === 0) {
    alert("Aucune annonce masquée à exporter.");
    return;
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(ads, null, 2));
    const btn = document.getElementById("btn-export");
    btn.textContent = "Copié !";
    setTimeout(() => { btn.textContent = "Exporter"; }, 2000);
  } catch {
    alert(JSON.stringify(ads));
  }
});

document.getElementById("btn-import").addEventListener("click", async () => {
  let text;
  try {
    text = await navigator.clipboard.readText();
  } catch {
    alert("Impossible de lire le presse-papier.");
    return;
  }

  let incoming;
  try {
    const parsed = JSON.parse(text);
    incoming = (Array.isArray(parsed) ? parsed : [parsed])
      .filter(e => e && typeof e.id === "string" && /^\d+$/.test(e.id))
      .map(({ id, url, title }) => ({
        id,
        url: typeof url === "string" ? url : null,
        title: typeof title === "string" ? title : null,
      }));
  } catch {
    alert("Format invalide. Le presse-papier doit contenir un JSON exporté par cette extension.");
    return;
  }

  if (incoming.length === 0) {
    alert("Aucune annonce valide trouvée dans le presse-papier.");
    return;
  }

  const current = await getHiddenAds();
  const existingIds = new Set(current.map(a => a.id));
  const toAdd = incoming.filter(a => !existingIds.has(a.id));

  await saveHiddenAds([...current, ...toAdd]);
  render();

  const btn = document.getElementById("btn-import");
  const added = toAdd.length;
  btn.textContent = added > 0 ? `+${added} ajouté${added > 1 ? "s" : ""}` : "Déjà présents";
  setTimeout(() => { btn.textContent = "Importer"; }, 2000);
});

render();
