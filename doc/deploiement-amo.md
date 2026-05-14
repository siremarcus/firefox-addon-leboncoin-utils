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
npx web-ext lint --source-dir src/
```

Corrigez tous les avertissements bloquants avant de continuer.

---

## 2. Créer le package `.zip`

```bash
npx web-ext build --source-dir src/ --artifacts-dir releases/
```

Le fichier `.zip` est généré dans `dist/`. C'est ce fichier qui sera soumis à AMO.

> `web-ext build` exclut automatiquement `.git`, `node_modules` et les fichiers listés dans `.gitignore`.

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

1. Incrémentez le champ `version` dans [manifest.json](../manifest.json).
2. Rebuilder le package :
   ```bash
   npx web-ext build --source-dir src/ --artifacts-dir releases/
   ```
3. Soumettre la nouvelle version via l'interface AMO ou via `web-ext sign` (Option B ci-dessus).

> AMO conserve l'historique de toutes les versions. Les utilisateurs ayant installé l'extension reçoivent la mise à jour automatiquement.

---

## Références

- [Documentation web-ext](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/)
- [Soumettre une extension — Extension Workshop](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)
- [API de signature AMO](https://addons-server.readthedocs.io/en/latest/topics/api/signing.html)
