# Leboncoin - Masquer des annonces

[![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-FF7139?logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/fr/firefox/addon/leboncoin-masquer-des-annonces/)

Extension Firefox (Android & Desktop) pour masquer les annonces indésirables sur [leboncoin.fr](https://www.leboncoin.fr) et faciliter les recherches récurrentes.

![Exemple de l'extension en action](./doc/sample-item-list.png)
![Exemple de l'extension en action 2](./doc/sample-extension-options.png)

## Fonctionnalités

- Bouton masquer sur chaque annonce (œil barré)
- Annonces masquées réduites à une fine barre, avec bouton "Ré-afficher"
- Persistance locale : les annonces restent masquées entre les sessions
- Compatible avec le scroll infini (MutationObserver)
- Popup de gestion : liste, ré-affichage individuel ou global, export des IDs
- Purge automatique des annonces masquées trop anciennes (seuil configurable dans les paramètres)
- Synchronisation Firefox Sync optionnelle pour partager les annonces masquées entre appareils

## Structure

```
src/
├── manifest.json           # Manifest V2 (Firefox Android compatible)
├── globals.d.ts            # Déclaration du global browser pour TypeScript
├── content/
│   ├── content.ts          # Injection dans les pages leboncoin
│   └── content.css         # Styles du bouton et des annonces masquées
├── popup/
│   ├── popup.html          # Interface de gestion
│   ├── popup.ts            # Logique du popup
│   └── popup.css           # Styles du popup
├── data/
│   ├── annonce-entry.ts          # Modèle d'une annonce masquée
│   ├── annonce-entry-storage.ts  # Persistance des annonces masquées
│   ├── browser-storage.ts        # Abstraction du storage navigateur
│   ├── settings.ts               # Modèle des paramètres
│   └── settings-storage.ts       # Persistance des paramètres
└── icons/                  # Icônes SVG de l'extension
```

Les sources TypeScript sont compilées vers `dist/` via esbuild (bundling) + tsc (type-check). Le dossier `dist/` n'est pas versionné.

## Développement

### Prérequis

- Node.js 18+
- Firefox

### Mise en place

```bash
npm install
```

### Scripts

| Commande          | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| `npm run build`   | Compile les sources TypeScript vers `dist/`                  |
| `npm run dev`     | Compilation en watch + Firefox avec rechargement automatique |
| `npm start`       | Build + lance Firefox sur leboncoin.fr                       |
| `npm test`        | Lance les tests unitaires                                    |
| `npm run package` | Génère le `.zip` dans `releases/`                            |

### Workflow classique

```bash
npm start   # Build + lance Firefox
npm test    # vérifie les sélecteurs DOM avec les samples
```

Les fichiers source sont dans `src/`. Le resultat du build est fénéré dans `dist/`, qui est ensuite empaqueté pour la distribution.

## Installation

### Temporaire (debug)

1. Ouvrir `about:debugging` dans Firefox desktop
2. "Ce Firefox" → "Charger un module complémentaire temporaire"
3. Sélectionner `manifest.json`

### Permanente sur Firefox Android

Firefox Android n'autorise que les extensions signées par Mozilla ou listées dans une collection personnalisée.

**Option A – Collection AMO personnalisée (recommandé)**

1. Publier l'extension sur [addons.mozilla.org](https://addons.mozilla.org) (peut rester non listée)
2. Dans Firefox Android : Paramètres → À propos de Firefox → taper 5 fois sur le logo
3. Activer le menu développeur, puis renseigner votre ID de collection AMO

**Option B – Firefox Nightly / Beta**

Firefox Nightly et Beta permettent le chargement d'extensions via `about:debugging` connecté depuis un PC en USB (ADB).

### Packaging (`.zip` / `.xpi`)

```bash
npm run package
```

## Notes

Les sélecteurs CSS ciblant les annonces (`article`, `li[data-qa-id]`, etc.) peuvent évoluer avec les mises à jour du site. Si le bouton masquer n'apparaît plus, inspecter la structure HTML et mettre à jour `findAnnonceElements()` dans [src/content/lbc-dom-parser.ts](src/content/lbc-dom-parser.ts).
