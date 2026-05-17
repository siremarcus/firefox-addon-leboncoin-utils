import { ApplicationSettingsDefinition } from "../data/settings";
import { AnnonceEntry } from "../data/annonce-entry";
import { HiddenAnnoncesStorage } from "../data/annonce-entry-storage";
import { ApplicationSettings } from "../data/settings-storage";

// ─── Rendu ───────────────────────────────────────────────────────────────────

async function renderMain(): Promise<void> {
  const annonces = await HiddenAnnoncesStorage.getAsync();
  const summary = document.getElementById("summary")!;
  const content = document.getElementById("content")!;

  const plural = annonces.length !== 1 ? "s" : "";
  const strong = document.createElement("strong");
  strong.textContent = String(annonces.length);
  summary.replaceChildren(strong, ` annonce${plural} masquée${plural}`);

  if (annonces.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.append(
      "Aucune annonce masquée.",
      document.createElement("br"),
      "Naviguez sur leboncoin et utilisez",
      document.createElement("br"),
      "le bouton 👁 pour masquer une annonce.",
    );
    content.replaceChildren(p);
    return;
  }

  const list = document.createElement("ul");
  list.style.cssText =
    "list-style:none; padding: 8px 16px; max-height:220px; overflow-y:auto;";

  const sorted = [...annonces].sort((a, b) => {
    const da = a.hiddenDate ? new Date(a.hiddenDate).getTime() : 0;
    const db = b.hiddenDate ? new Date(b.hiddenDate).getTime() : 0;
    return db - da;
  });

  for (const annonce of sorted) {
    const li = document.createElement("li");
    li.style.cssText =
      "display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid #f0f0f0; font-size:13px; gap:8px;";

    const dateStr = annonce.hiddenDate
      ? new Date(annonce.hiddenDate).toLocaleString("fr-FR", {
          dateStyle: "short",
          timeStyle: "short",
        } as Intl.DateTimeFormatOptions)
      : null;
    const tooltip = [`#${annonce.id}`, annonce.title, dateStr]
      .filter(Boolean)
      .join(" — ");

    let label: HTMLAnchorElement | HTMLSpanElement;
    const safeUrl =
      annonce.url && /^https?:\/\//.test(annonce.url) ? annonce.url : null;
    if (safeUrl) {
      const a = document.createElement("a");
      a.href = safeUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.title = `${tooltip} — Ouvrir l'annonce`;
      a.style.cssText =
        "color:#0065c9; text-decoration:none; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;";
      label = a;
    } else {
      const span = document.createElement("span");
      span.title = tooltip;
      span.style.cssText =
        "color:#555; font-family:monospace; min-width:0; flex:1;";
      label = span;
    }
    label.textContent =
      annonce.price +
      (annonce.location ? ` (${annonce.location})` : "") +
      (annonce.title ? ` - ${annonce.title.slice(0, 60)}` : `#${annonce.id}`);

    const btnRestore = document.createElement("button");
    btnRestore.textContent = "Ré-afficher";
    btnRestore.style.cssText =
      "font-size:11px; padding:3px 8px; border:1px solid #0065c9; color:#0065c9; background:transparent; border-radius:4px; cursor:pointer; white-space:nowrap;";
    btnRestore.addEventListener("click", async () => {
      await HiddenAnnoncesStorage.removeOneAsync(annonce.id);
      renderMain();
    });

    li.appendChild(label);
    li.appendChild(btnRestore);
    list.appendChild(li);
  }

  content.innerHTML = "";
  content.appendChild(list);

  document.getElementById("version")!.textContent =
    `v${browser.runtime.getManifest().version}`;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

document.getElementById("btn-clear")!.addEventListener("click", async () => {
  if (confirm("Ré-afficher toutes les annonces masquées ?")) {
    await HiddenAnnoncesStorage.saveAsync([]);
    renderMain();
  }
});

document.getElementById("btn-export")!.addEventListener("click", async () => {
  const annonces = await HiddenAnnoncesStorage.getAsync();
  if (annonces.length === 0) {
    alert("Aucune annonce masquée à exporter.");
    return;
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(annonces, null, 2));
    const btn = document.getElementById("btn-export")!;
    btn.textContent = "Copié !";
    setTimeout(() => {
      btn.textContent = "Exporter";
    }, 2000);
  } catch {
    alert(JSON.stringify(annonces));
  }
});

document.getElementById("btn-import")!.addEventListener("click", async () => {
  let text: string;
  try {
    text = await navigator.clipboard.readText();
  } catch {
    alert("Impossible de lire le presse-papier.");
    return;
  }

  let incoming: { id: string; url: string | null; title: string | null }[];
  try {
    const parsed: unknown = JSON.parse(text);
    incoming = (Array.isArray(parsed) ? parsed : [parsed])
      .filter(
        (e): e is Record<string, unknown> =>
          !!e &&
          typeof (e as Record<string, unknown>).id === "string" &&
          /^\d+$/.test((e as Record<string, unknown>).id as string),
      )
      .map((e) => ({
        id: e.id as string,
        url: typeof e.url === "string" ? e.url : null,
        title: typeof e.title === "string" ? e.title : null,
      }));
  } catch {
    alert(
      "Format invalide. Le presse-papier doit contenir un JSON exporté par cette extension.",
    );
    return;
  }

  if (incoming.length === 0) {
    alert("Aucune annonce valide trouvée dans le presse-papier.");
    return;
  }

  const current = await HiddenAnnoncesStorage.getAsync();
  const existingIds = new Set(current.map((a) => a.id));
  const toAdd = incoming.filter((a) => !existingIds.has(a.id));

  await HiddenAnnoncesStorage.saveAsync([
    ...current,
    ...toAdd.map((a) => new AnnonceEntry(a.id, a.url, a.title)),
  ]);
  renderMain();

  const btn = document.getElementById("btn-import")!;
  const added = toAdd.length;
  btn.textContent =
    added > 0 ? `+${added} ajouté${added > 1 ? "s" : ""}` : "Déjà présents";
  setTimeout(() => {
    btn.textContent = "Importer";
  }, 2000);
});

// ─── Navigation ──────────────────────────────────────────────────────────────

function showPage(name: "main" | "settings"): void {
  const isMain = name === "main";
  document.getElementById("page-main")!.hidden = !isMain;
  document.getElementById("page-settings")!.hidden = isMain;
  document.getElementById("btn-go-main")!.hidden = isMain;
  document.getElementById("btn-go-settings")!.hidden = !isMain;
  if (!isMain) renderSettings();
}

document
  .getElementById("btn-go-settings")!
  .addEventListener("click", () => showPage("settings"));
document
  .getElementById("btn-go-main")!
  .addEventListener("click", () => showPage("main"));

// ─── Settings page ───────────────────────────────────────────────────────────

async function renderSettings(): Promise<void> {
  const settings = await ApplicationSettings.loadAsync();
  (document.getElementById("input-purge-days") as HTMLInputElement).value =
    String(settings.autoPurgeMaxDays);
}

document
  .getElementById("btn-save-settings")!
  .addEventListener("click", async () => {
    const days = parseInt(
      (document.getElementById("input-purge-days") as HTMLInputElement).value,
      10,
    );
    if (isNaN(days) || days < 1) return;
    const settings = new ApplicationSettingsDefinition();
    settings.autoPurgeMaxDays = days;
    await ApplicationSettings.saveAsync(settings);
    const btn = document.getElementById("btn-save-settings")!;
    btn.textContent = "Enregistré !";
    setTimeout(() => {
      btn.textContent = "Enregistrer";
    }, 2000);
  });

// ─── Init ────────────────────────────────────────────────────────────────────

showPage("main");
renderMain();
