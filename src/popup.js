const STORAGE_KEY = "lbc_hidden_ads";

async function getHiddenIds() {
  const result = await browser.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

async function saveHiddenIds(ids) {
  await browser.storage.local.set({ [STORAGE_KEY]: ids });
}

async function render() {
  const ids = await getHiddenIds();
  const summary = document.getElementById("summary");
  const content = document.getElementById("content");

  summary.innerHTML = `<strong>${ids.length}</strong> annonce${ids.length !== 1 ? "s" : ""} masquée${ids.length !== 1 ? "s" : ""}`;

  if (ids.length === 0) {
    content.innerHTML = `<p class="empty">Aucune annonce masquée.<br>Naviguez sur leboncoin et utilisez<br>le bouton 👁 pour masquer une annonce.</p>`;
    return;
  }

  const list = document.createElement("ul");
  list.style.cssText = "list-style:none; padding: 8px 16px; max-height:220px; overflow-y:auto;";

  for (const id of ids) {
    const li = document.createElement("li");
    li.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid #f0f0f0; font-size:13px; gap:8px;";

    const link = document.createElement("a");
    link.href = `https://www.leboncoin.fr/annonces/offerType_${id}.htm`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `#${id}`;
    link.style.cssText = "color:#0065c9; text-decoration:none; font-family:monospace;";
    link.title = "Ouvrir l'annonce (si elle existe encore)";

    const btnRestore = document.createElement("button");
    btnRestore.textContent = "Ré-afficher";
    btnRestore.style.cssText = "font-size:11px; padding:3px 8px; border:1px solid #0065c9; color:#0065c9; background:transparent; border-radius:4px; cursor:pointer; white-space:nowrap;";
    btnRestore.addEventListener("click", async () => {
      const current = await getHiddenIds();
      const updated = current.filter(i => i !== id);
      await saveHiddenIds(updated);
      render();
    });

    li.appendChild(link);
    li.appendChild(btnRestore);
    list.appendChild(li);
  }

  content.innerHTML = "";
  content.appendChild(list);
}

document.getElementById("btn-clear").addEventListener("click", async () => {
  if (confirm("Ré-afficher toutes les annonces masquées ?")) {
    await saveHiddenIds([]);
    render();
  }
});

document.getElementById("btn-export").addEventListener("click", async () => {
  const ids = await getHiddenIds();
  if (ids.length === 0) {
    alert("Aucune annonce masquée à exporter.");
    return;
  }
  try {
    await navigator.clipboard.writeText(ids.join("\n"));
    const btn = document.getElementById("btn-export");
    btn.textContent = "Copié !";
    setTimeout(() => { btn.textContent = "Exporter"; }, 2000);
  } catch {
    alert(ids.join("\n"));
  }
});

render();
