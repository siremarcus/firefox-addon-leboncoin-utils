# Déploiement sur addons.mozilla.org (AMO)

Ce guide décrit comment signer et publier l'extension sur [addons.mozilla.org](https://addons.mozilla.org) (AMO), ce qui est nécessaire pour l'installer sur **Firefox Android** et pour distribuer une version permanente sur desktop.

---

## Prérequis

- Un compte sur [addons.mozilla.org](https://addons.mozilla.org/fr/developers/)
- Une clé API AMO (JWT) : Paramètres du compte → [Gestion des clés API](https://addons.mozilla.org/fr/developers/addon/api/key/)
- `web-ext` installé (déjà présent dans les dépendances du projet) :
  ```bash
  npm install
  ```

---

## 1. Vérifier l'extension avant soumission

`web-ext` intègre un linter qui détecte les erreurs courantes :

```bash
npm run build && npx web-ext lint --source-dir dist/
```

Corrigez tous les avertissements bloquants avant de continuer.

---

## 2. Créer le package `.zip`

Incrémentez la version dans `manifest.json` (ex. de `1.0.0` à `1.0.1`), puis générez le package :

```bash
npm run package
```

Le fichier `.zip` est généré dans `releases/`. C'est ce fichier qui sera soumis à AMO.

> `npm run package` compile les sources TypeScript vers `dist/`, puis emballe `dist/` avec `web-ext build`.

---

## 3. Soumettre sur AMO

### Option A — Interface web (recommandé pour la première soumission)

1. Connectez-vous sur [addons.mozilla.org/developers](https://addons.mozilla.org/fr/developers/).
2. Cliquez sur **"Soumettre un nouveau module"**.
3. Choisissez la visibilité :
   - **Listée** : l'extension est publique et apparaît dans les résultats de recherche AMO.
   - **Non listée** : l'extension est signée mais non indexée — idéal pour un usage personnel ou pour Firefox Android via collection personnalisée.
4. Uploadez le `.zip` généré à l'étape 2.
5. Remplissez les métadonnées (nom, description, captures d'écran, politique de confidentialité si demandée).
6. Soumettez. Mozilla effectue une revue automatique, puis manuelle si nécessaire.

### Option B — Signature en ligne de commande (mises à jour ultérieures)

Récupérez d'abord vos clés API sur AMO ([Gestion des clés API](https://addons.mozilla.org/fr/developers/addon/api/key/)), puis :

```bash
npx web-ext sign \
  --source-dir src/ \
  --artifacts-dir releases/ \
  --api-key <JWT_ISSUER> \
  --api-secret <JWT_SECRET>
```

Le fichier `.xpi` signé est déposé dans `dist/`. Il peut être installé directement dans Firefox ou distribué.

---

## 4. Installer sur Firefox Android via collection personnalisée

Une fois l'extension soumise (même non listée), créez une collection AMO personnalisée :

1. Sur AMO : votre compte → **Collections** → **Créer une collection**.
2. Notez l'**ID utilisateur** et le **slug** de la collection.
3. Sur Firefox Android :
   - Ouvrir **Paramètres** → **À propos de Firefox**
   - Taper **5 fois** sur le logo Firefox pour activer le menu développeur
   - Aller dans **Paramètres** → **Options développeur** → **Colletion personnalisée**
   - Saisir votre **ID utilisateur** et le **slug** de la collection
4. Redémarrer Firefox Android. L'extension apparaît dans la liste des modules disponibles.

---

## 5. Publier une mise à jour

1. Incrémentez le champ `version` dans [manifest.json](../src/manifest.json).
2. Rebuilder le package :
   ```bash
   npm run package
   ```
3. Soumettre la nouvelle version via l'interface AMO ou via `web-ext sign` (Option B ci-dessus).

> AMO conserve l'historique de toutes les versions. Les utilisateurs ayant installé l'extension reçoivent la mise à jour automatiquement.

---

## Checklist Android (AMO)

Avant de soumettre l'extension, vérifier les points suivants pour Android :

- [ ] **APIs JS compatibles** — Vérifier avec [Browser Support for JavaScript APIs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_support_for_JavaScript_APIs) que toutes les APIs utilisées sont disponibles sur Firefox Android.
  - `browser.storage.local` ✅ supporté
  - `MutationObserver` ✅ supporté
  - `navigator.clipboard.writeText` ⚠️ peut échouer sur Android (fallback `alert` en place)

- [ ] **Balise viewport** — Les pages HTML doivent avoir une balise `<meta name="viewport">` pour un affichage correct sur mobile.
  - `popup.html` ✅ balise présente

- [ ] **Design responsive** — Utiliser des patterns responsive adaptés aux utilisateurs Android.
  - Popup : largeur bornée (`min-width: 280px`, `max-width: 360px`) ✅
  - Bouton masquer : `@media (hover: none)` le rend toujours visible sur écrans tactiles ✅

- [ ] **Tester les chemins critiques** sur un appareil Android réel ou un émulateur Android Studio.

- [ ] **Fonctionnement hors connexion** — L'extension ne doit pas être bloquée sans réseau.
  - Seul `browser.storage.local` est utilisé — aucun appel réseau depuis l'extension ✅

- [ ] **Tester sur différentes tailles d'écrans** — Android Studio fournit des appareils virtuels variés.

---

## Références

- [Documentation web-ext](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/)
- [Soumettre une extension — Extension Workshop](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)
- [API de signature AMO](https://addons-server.readthedocs.io/en/latest/topics/api/signing.html)
