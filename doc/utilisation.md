# Guide d'utilisation — Leboncoin Masquer des annonces

Cette extension Firefox vous permet de masquer les annonces qui ne vous intéressent pas sur [leboncoin.fr](https://www.leboncoin.fr), afin de retrouver plus facilement les nouvelles annonces lors de vos recherches récurrentes.

---

## Masquer une annonce

1. Rendez-vous sur leboncoin.fr et effectuez votre recherche habituelle.
2. Sur chaque annonce, un bouton **œil barré** (🚫👁) apparaît.
3. Cliquez sur ce bouton pour masquer l'annonce.

L'annonce est remplacée par une fine barre grise affichant **"Annonce masquée"**. Elle ne disparaît pas complètement : vous pouvez la ré-afficher à tout moment.

> Le masquage fonctionne aussi avec le **scroll infini** : les annonces chargées dynamiquement reçoivent automatiquement le bouton masquer.

![Exemple de l'extension en action](./sample-item-list.png)

---

## Ré-afficher une annonce masquée

### Directement sur la page

Cliquez sur le bouton **"Ré-afficher"** visible dans la barre grise de l'annonce concernée.

### Depuis le popup de gestion

1. Cliquez sur l'icône de l'extension dans la barre d'outils Firefox.
2. La liste de toutes les annonces masquées s'affiche.
3. Cliquez sur **"Ré-afficher"** en face de l'identifiant souhaité.

---

## Gérer les annonces masquées (popup)

![Exemple de l'extension en action](./sample-extension-options.png)


Cliquez sur l'icône de l'extension pour ouvrir le popup. Il affiche :

| Élément | Description |
|---|---|
| Compteur | Nombre total d'annonces actuellement masquées |
| Liste des IDs | Chaque annonce masquée, avec un lien vers la page de l'annonce |
| Bouton **Exporter** | Copie tous les IDs dans le presse-papier (un par ligne) |
| Bouton **Tout effacer** | Ré-affiche toutes les annonces masquées en une seule action |

### Exporter la liste

Le bouton **"Exporter"** copie les identifiants de toutes les annonces masquées dans le presse-papier. Vous pouvez coller le résultat dans un fichier texte pour en garder une trace.

### Tout effacer

Le bouton **"Tout effacer"** demande une confirmation, puis supprime toutes les annonces masquées. Toutes les annonces redeviennent visibles sur le site.

---

## Persistance des données

Les annonces masquées sont **stockées localement** dans votre navigateur (via `browser.storage.local`). Elles persistent entre les sessions : si vous fermez et rouvrez Firefox, vos annonces masquées sont toujours mémorisées.

Les données ne quittent jamais votre appareil.

---

## Limites connues

- L'extension fonctionne uniquement sur **www.leboncoin.fr**.
- Si le bouton masquer n'apparaît plus sur certaines annonces, c'est probablement que leboncoin a modifié la structure HTML de ses pages. Voir les notes de maintenance dans le [README](../README.md).
