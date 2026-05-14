# Leboncoin - Masquer des annonces

Extension Firefox (Android & Desktop) pour masquer les annonces indésirables sur [leboncoin.fr](https://www.leboncoin.fr) et faciliter les recherches récurrentes.

## Fonctionnalités

- Bouton masquer sur chaque annonce (œil barré)
- Annonces masquées réduites à une fine barre, avec bouton "Ré-afficher"
- Persistance locale : les annonces restent masquées entre les sessions
- Compatible avec le scroll infini (MutationObserver)
- Popup de gestion : liste, ré-affichage individuel ou global, export des IDs

## Structure

```
├── manifest.json   # Manifest V2 (Firefox Android compatible)
├── content.js      # Injection dans les pages leboncoin
├── content.css     # Styles du bouton et des annonces masquées
├── popup.html      # Interface de gestion
├── popup.js        # Logique du popup
└── icons/          # Icônes SVG de l'extension
```

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
zip -r leboncoin-hide-ads.zip manifest.json content.js content.css popup.html popup.js icons/
```

## Notes

Les sélecteurs CSS ciblant les annonces (`article`, `li[data-qa-id]`, etc.) peuvent évoluer avec les mises à jour du site. Si le bouton masquer n'apparaît plus, inspecter la structure HTML et mettre à jour `findAdElements()` dans [content.js](content.js).
