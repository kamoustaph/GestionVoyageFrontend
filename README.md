# Yoon : application web de réservation de voyages en car au Sénégal

Frontend Angular 20 de **Yoon**. Il couvre trois publics :

- **Voyageurs** : recherche de départs, réservation, paiement mobile money, billets à QR code.
- **Agents de contrôle** : scanner de QR par la caméra du téléphone, liste d'embarquement, historique.
- **Administrateurs** : tableau de bord, programmation des départs, comptes, journal des contrôles.

L'API Spring Boot est dans le dépôt [GestionVoyageBakend](https://github.com/kamoustaph/GestionVoyageBakend).

## Démarrage rapide

Prérequis : Node.js 20 ou 22, et l'API lancée sur le port 8093 (`./mvnw spring-boot:run` dans le dépôt backend).

```bash
npm install
npm start
```

Ouvrez http://localhost:4200. En développement, `ng serve` relaie `/api` vers `http://localhost:8093`
(voir `proxy.conf.json`), il n'y a donc aucun réglage CORS à faire.

Comptes de démonstration (créés par le backend) : la page de connexion propose de les remplir en un clic.

| Rôle | Email | Mot de passe |
|---|---|---|
| Voyageur | voyageur@yoon.sn | Voyageur123! |
| Agent de contrôle | agent@yoon.sn | Agent123! |
| Administrateur | admin@yoon.sn | Admin123! |

## Parcours à essayer

1. Connectez-vous en voyageur, réservez un départ pour deux passagers, payez par Wave : deux billets QR s'affichent.
2. Ouvrez un billet sur votre téléphone, ou faites une capture d'écran de son QR code.
3. Connectez-vous en agent, onglet **Scanner** : activez la caméra et présentez le QR, ou utilisez **Lire une photo de billet**.
4. Confirmez l'embarquement, puis scannez le même QR : il est refusé (« Billet déjà utilisé »).
5. Connectez-vous en admin : le scan et le refus apparaissent dans le **Journal des contrôles**.

## Pages

| Route | Accès | Contenu |
|---|---|---|
| `/` | public | tableau des prochains départs, recherche, lignes principales |
| `/voyages` | public | résultats de recherche, filtres par jour |
| `/voyages/:id/reserver` | connecté | passagers, paiement (compte à rebours de 15 min), billets |
| `/mes-voyages` | connecté | billets à venir, voyages passés, réservations et annulation |
| `/billets/:code` | connecté | un billet, imprimable |
| `/connexion`, `/inscription` | public | authentification |
| `/agent/scanner` | agent, admin | scanner QR, saisie manuelle, verdict, embarquement |
| `/agent/departs`, `/agent/departs/:id` | agent, admin | départs du jour et liste d'embarquement |
| `/agent/historique` | agent, admin | mes contrôles du jour |
| `/admin` | admin | tableau de bord |
| `/admin/voyages` | admin | programmer, modifier, ouvrir l'embarquement, annuler |
| `/admin/reservations`, `/admin/utilisateurs`, `/admin/controles` | admin | suivi et gestion |

## Structure

```
src/app
├── app.ts, app.config.ts, app.routes.ts   racine, locale fr, routes chargées à la demande
├── core/
│   ├── models.ts           types de l'API
│   ├── api.service.ts      tous les appels HTTP + messageErreur()
│   ├── auth.service.ts     session (signals) et jeton JWT
│   ├── auth.interceptor.ts ajoute le jeton, gère la session expirée
│   ├── guards.ts           connecteGuard, roleGuard
│   └── format.ts           pipes : fcfa, duree, codeVille, libelle, ton
├── layout/                 en-tête, pied de page, logo
├── shared/
│   ├── ticket-card.ts      billet avec talon et QR
│   ├── qr-image.ts         génération du QR (bibliothèque qrcode, dans le navigateur)
│   ├── qr-scanner.ts       lecture caméra (getUserMedia + jsQR) et lecture depuis une photo
│   └── search-form.ts      formulaire de recherche
└── pages/                  home, search, booking, account, auth, agent, admin
```

Composants autonomes (standalone), signals et nouveau contrôle de flux (`@if`, `@for`). Aucune bibliothèque d'interface :
tout le style est dans `src/styles.css` et dans chaque composant.

## Le scanner

`shared/qr-scanner.ts` lit le flux de la caméra arrière, décode les images avec jsQR et émet le contenu lu.
Le même QR n'est pas émis deux fois en moins de 3 secondes, et la lecture est suspendue pendant l'affichage d'un verdict.

- **La caméra exige HTTPS** (sauf sur `localhost`). En production, servez l'application derrière un certificat.
- Signal sonore et vibration : un bip aigu si le billet est accepté, deux bips graves s'il est refusé.
- Mode **Embarquement direct** : un billet valide est enregistré dès le scan, sans confirmation (gares très fréquentées).
- Repli sans caméra : saisie du code de 10 caractères, ou lecture d'une photo du billet.

## Charte visuelle

Couleurs à plat, aucun dégradé. Variables dans `src/styles.css` :

| Variable | Valeur | Usage |
|---|---|---|
| `--baobab` | `#0E5E3B` | actions, billet valide |
| `--board` | `#0B3D27` | tableau des départs, panneaux sombres |
| `--sun` | `#F5C400` | heures du tableau, repères, focus clavier |
| `--red` | `#C4162A` | refus de contrôle, erreurs |
| `--ink` | `#13221B` | texte |
| `--page` | `#F3F5F1` | fond |

Polices : **Bricolage Grotesque** pour les titres, les heures et les codes de gare (DKR, STL, ZIG…) ;
**Atkinson Hyperlegible** pour le texte, choisie pour sa lisibilité sur téléphone en plein soleil.

Accessibilité : focus clavier visible, lien d'évitement, contrastes AA, `prefers-reduced-motion` respecté,
résultats du scanner annoncés aux lecteurs d'écran.

## Build et Docker

```bash
npm run build           # dist/gestion-voyage-frontend/browser
docker build -t gestion-voyage-web .
docker run -p 8080:80 -e API_UPSTREAM=http://<hôte-api>:8093 gestion-voyage-web
```

L'image nginx sert l'application, renvoie `index.html` pour les routes Angular et relaie `/api` vers `API_UPSTREAM`
(`nginx/default.conf.template`). Santé : `/healthz`.

Pour lancer toute la pile (MySQL, API, web), utilisez le `docker-compose.yml` du dépôt backend.

## CI

`.github/workflows/ci.yml` : build de production à chaque pull request, et sur `main` publication de l'image
`ghcr.io/kamoustaph/gestion-voyage-web`.
