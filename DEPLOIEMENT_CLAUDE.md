# CARLITE — Dossier de déploiement sur un nouveau serveur

> **À l'attention de Claude (ou de tout administrateur système)** : ce document décrit précisément le contenu de l'export et la procédure complète pour remettre en ligne le site CARLITE (carlite.fr) sur un serveur Linux autonome. Lis-le en entier avant d'agir. Toutes les commandes sont prévues pour Ubuntu 22.04/24.04 ou Debian 12.

---

## 1. Description du site

Site vitrine + e-commerce léger (sans paiement en ligne) de CARLITE, spécialiste français des quadricycles électriques, voiturettes de golf et utilitaires électriques. Langue : français.

**Pile technique**

| Élément | Version / détail |
|---|---|
| Framework | Next.js **14.2.28** (App Router), React 18.2, TypeScript 5.2 |
| ORM | Prisma **6.7.0** (`prisma/schema.prisma`) |
| Base de données | PostgreSQL (export testé en 17 ; 14+ conseillé) |
| Authentification | NextAuth 4.24 — identifiants email + mot de passe (bcrypt), sessions JWT, rôles `admin` / `user` |
| UI | Tailwind CSS 3.3, shadcn/ui (Radix), framer-motion, lucide-react, sonner |
| Emails | SMTP via `nodemailer` (`lib/send-email.ts`) |
| Fichiers uploadés | Stockage compatible S3 via URL présignée (`lib/s3.ts`, `lib/aws-config.ts`) |
| Node.js | **20 LTS** requis (18.18 minimum) |
| Gestionnaire de paquets | Yarn 4 (via corepack) — npm fonctionne aussi |

**Fonctionnalités principales**

- Pages publiques : accueil, `/vehicules` (+ fiche `/vehicules/[slug]`), `/configurateur`, `/occasion`, `/accessoires` (pièces détachées), `/comparateur`, `/articles` (+ `/articles/[slug]`), `/recharge`, `/faq`, `/contact`, `/recherche`, `/login`. `robots.txt` et `sitemap.xml` dynamiques.
- Prix affichés HT avec TTC (TVA 20 %, `lib/pricing.ts`), promotions (`Promotion`), statut de stock (`stockStatus`, `keepVisible`, `quantity`).
- Formulaires : demande de devis / rappel (`/api/lead`), rappel flottant (`/api/callback`), contact expert (`/api/contact-expert`), essai (`/api/test-drive`). Les demandes sont enregistrées en base (`TestDriveRequest`) **et** envoyées par email.
- Administration `/admin` (rôle admin requis) : véhicules, configurateur dynamique par véhicule (`/admin/configurateur/[id]` : catégories, options, règles de compatibilité), pièces détachées + catégories, occasions, promotions, articles, demandes, utilisateurs, **stock rapide mobile** (`/admin/stock-rapide` : photo, détourage, optimisation).
- Le détourage photo charge la librairie `@imgly/background-removal` **depuis le CDN jsdelivr dans le navigateur** (`lib/image-tools.ts`) : rien à installer côté serveur, mais le navigateur de l'admin doit pouvoir joindre `cdn.jsdelivr.net` et `staticimgly.com`. Ne PAS installer ce paquet en dépendance (casse le build webpack).
- Le configurateur est entièrement piloté par les données (tables `ConfigCategory`, `ConfigOption`, `ConfigRule`) : **aucune option ne doit être codée en dur**.

---

## 2. Contenu de l'export

```
carlite_export/
├── DEPLOIEMENT_CLAUDE.md          ← ce document
├── code/                          ← code source complet, prêt à déployer
│   ├── .env.example               ← modèle des variables d'environnement
│   ├── app/  components/  lib/  hooks/  types/  prisma/  scripts/
│   ├── public/                    ← images statiques du site (logos, photos véhicules, articles…)
│   └── package.json  next.config.js  tailwind.config.ts  tsconfig.json …
├── database/
│   ├── carlite_full_dump.dump     ← dump PostgreSQL format custom (pg_restore) — RECOMMANDÉ
│   ├── carlite_full_dump.sql      ← même dump en SQL texte (psql)
│   ├── 01_schema.sql              ← schéma seul (généré depuis schema.prisma)
│   ├── 02_data.sql                ← données seules, URLs d'images d'origine
│   ├── 02_data_urls_locales.sql   ← données seules, URLs d'images réécrites en /uploads/...
│   └── csv/                       ← chaque table en CSV (lecture / Excel / archive)
└── fichiers_stockage/
    ├── uploads/                   ← toutes les photos uploadées depuis l'admin (175 fichiers)
    │   └── cdn/                   ← 6 images hébergées sur l'ancien CDN
    └── correspondance_urls.json   ← ancienne URL → nouveau chemin /uploads/...
```

**Volume des données exportées** (vérifié par restauration complète sur une base vierge) :

| Table | Lignes | Contenu |
|---|---|---|
| User | 13 | comptes (mots de passe hashés bcrypt — les identifiants actuels restent valables) |
| Vehicle | 2 | véhicules neufs (slugs `bi-scot`, `eg202ek`) |
| ConfigCategory / ConfigOption / ConfigRule | 5 / 4 / 0 | configurateur |
| PartCategory | 5 | catégories de pièces détachées |
| Accessory | 155 | pièces détachées / produits en stock |
| UsedVehicle | 4 | véhicules d'occasion |
| Promotion | 1 | promotions |
| Article | 27 | articles de blog |
| TestDriveRequest | 5 | demandes clients (devis, rappels, essais) |
| VehicleColor / VehicleWheel / VehicleOption | 0 | anciens modèles, plus utilisés (conservés pour compatibilité) |

**Comptes administrateur existants** : `wd@carlite.fr`, `maxime@carlite.fr`, `john@doe.com` (compte technique de test — à supprimer ou à changer de mot de passe en production). Les autres comptes `smoke+…@example.com` / `testuser…@example.com` sont des comptes de test automatiques sans valeur : ils peuvent être supprimés.

---

## 3. Différences entre ce code exporté et l'ancien hébergement

Le code a été rendu **autonome** (plus aucune dépendance à l'ancienne plateforme). Modifications déjà appliquées dans `code/` :

1. **Emails** : l'ancienne API de notification propriétaire a été remplacée par SMTP (`lib/send-email.ts`, `nodemailer`). Fichiers concernés : `app/api/lead/route.ts`, `app/api/callback/route.ts`, `app/api/contact-expert/route.ts`. Destinataires configurables via `EMAIL_TO_LEADS` (défaut `wd@carlite.fr`) et `EMAIL_TO_CONTACT` (défaut `contact@carlite.fr`). Si SMTP n'est pas configuré, les demandes sont quand même enregistrées en base (visibles dans `/admin/demandes`), seul l'email n'est pas envoyé (sauf contact expert qui renvoie une erreur).
2. **Stockage S3** : `lib/aws-config.ts` accepte maintenant des clés explicites (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`), un endpoint personnalisé (`S3_ENDPOINT`) et `lib/s3.ts` une URL publique personnalisée (`S3_PUBLIC_URL_BASE`) → compatible AWS S3, Cloudflare R2, Scaleway, OVH Object Storage, MinIO.
3. **`next.config.js`** nettoyé : `output: 'standalone'`, plus de script d'instrumentation propre à l'ancien hébergeur.
4. **`app/layout.tsx`** : suppression du script externe de l'ancienne plateforme.
5. **`prisma/schema.prisma`** : suppression du chemin de sortie absolu du client Prisma ; `binaryTargets = ["native"]`.
6. **`package.json`** : ajout de `nodemailer` et `@types/nodemailer`. Pas de `yarn.lock` fourni (il sera généré au premier `yarn install`).
7. **`.yarnrc.yml`** simplifié (`nodeLinker: node-modules`).

---

## 4. Procédure de déploiement (serveur VPS Linux)

### 4.1 Prérequis système

```bash
sudo apt update && sudo apt install -y curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable           # active yarn 4
sudo npm install -g pm2
```

Serveur conseillé : 2 vCPU, **4 Go de RAM minimum pour la compilation** (sinon ajouter du swap), 20 Go de disque.

### 4.2 Base de données

```bash
sudo -u postgres psql -c "CREATE USER carlite WITH PASSWORD '<MOT_DE_PASSE_FORT>';"
sudo -u postgres psql -c "CREATE DATABASE carlite OWNER carlite;"
```

Restauration — **choisir UNE des options** :

- **Option A (recommandée, conserve les images sur l'ancien stockage le temps de la migration)** :
  ```bash
  pg_restore --no-owner --no-privileges -h localhost -U carlite -d carlite database/carlite_full_dump.dump
  ```
  ⚠️ Les URLs d'images en base pointent alors vers l'ancien bucket S3 de l'hébergeur précédent : elles fonctionnent tant qu'il existe, mais il faut basculer (option B ou étape 4.4) pour être indépendant.
- **Option B (autonomie totale, images servies localement)** :
  ```bash
  psql -h localhost -U carlite -d carlite -v ON_ERROR_STOP=1 -f database/01_schema.sql
  psql -h localhost -U carlite -d carlite -v ON_ERROR_STOP=1 -f database/02_data_urls_locales.sql
  mkdir -p code/public/uploads && cp -r fichiers_stockage/uploads/* code/public/uploads/
  ```
  Les photos existantes sont alors servies par le site lui-même sous `/uploads/...`.

Vérification : `psql -h localhost -U carlite -d carlite -c 'select count(*) from "Accessory";'` → doit renvoyer **155**.

Puis toujours synchroniser Prisma (non destructif) :
```bash
cd code && yarn prisma db push   # doit indiquer "already in sync"
```
⛔ Ne jamais utiliser `--force-reset` ni `--accept-data-loss`. Ne pas lancer `prisma db seed` sur la base restaurée (inutile ; le seed n'utilise que des upserts mais réécrirait certains contenus d'origine).

### 4.3 Configuration de l'application

```bash
cd /var/www && sudo mkdir carlite && sudo chown $USER carlite
# copier le contenu de code/ dans /var/www/carlite
cd /var/www/carlite
cp .env.example .env && nano .env      # remplir TOUTES les valeurs (voir §5)
yarn install
yarn prisma generate
yarn build                              # NODE_OPTIONS=--max-old-space-size=4096 si mémoire faible
```

Le build produit `.next/standalone`. Pour le lancer, copier les fichiers statiques :
```bash
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
cp .env .next/standalone/
```

### 4.4 Stockage des nouvelles photos (upload depuis l'admin)

L'admin envoie les photos directement du navigateur vers un bucket compatible S3 via une URL présignée (PUT). Il faut donc **un bucket** :

1. Créer un bucket (ex. Cloudflare R2 — gratuit jusqu'à 10 Go —, Scaleway, OVH ou AWS S3 `eu-west-3`).
2. Rendre lisible publiquement le préfixe `public/` (politique de bucket en lecture publique, ou domaine public R2).
3. **Configurer le CORS du bucket** (obligatoire, sinon l'upload échoue dans le navigateur) :
   ```json
   [{
     "AllowedOrigins": ["https://carlite.fr", "https://www.carlite.fr"],
     "AllowedMethods": ["PUT", "GET", "HEAD"],
     "AllowedHeaders": ["*"],
     "ExposeHeaders": ["ETag"],
     "MaxAgeSeconds": 3600
   }]
   ```
4. Remplir `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`, et hors AWS `S3_ENDPOINT` + `S3_PUBLIC_URL_BASE`.
5. Les clés des fichiers suivent le motif `<AWS_FOLDER_PREFIX>public/uploads/<timestamp>-<nom>`. L'URL publique enregistrée en base = `S3_PUBLIC_URL_BASE/<clé>`.
6. *(Optionnel)* Pour tout centraliser dans le bucket : envoyer `fichiers_stockage/uploads/*` dans `public/uploads/` du bucket, puis remplacer en base le préfixe `/uploads/` par `S3_PUBLIC_URL_BASE/public/uploads/` (requêtes `UPDATE ... SET col = replace(col, ...)` sur les colonnes image : `Vehicle.image/gallery`, `Accessory.image/gallery`, `UsedVehicle.image/gallery`, `Article.image`, `ConfigOption.imageUrl`, etc. — vérifier les noms exacts dans `prisma/schema.prisma`). `fichiers_stockage/correspondance_urls.json` donne la table ancienne→nouvelle URL.

### 4.5 Lancement avec PM2

```bash
cd /var/www/carlite/.next/standalone
PORT=3000 HOSTNAME=127.0.0.1 pm2 start server.js --name carlite
pm2 save && pm2 startup          # redémarrage automatique au boot
```

Alternative sans standalone : `pm2 start "yarn start -p 3000" --name carlite` depuis `/var/www/carlite`.

### 4.6 Nginx + HTTPS

`/etc/nginx/sites-available/carlite` :
```nginx
server {
    server_name carlite.fr www.carlite.fr;
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/carlite /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d carlite.fr -d www.carlite.fr
```

### 4.7 DNS

Chez le registrar de `carlite.fr` : enregistrement **A** `@` → IP du serveur, **A** (ou CNAME) `www` → même IP. Supprimer les anciens enregistrements pointant vers l'ancien hébergeur **une fois le nouveau serveur validé**. Pour les emails envoyés depuis `noreply@carlite.fr`, configurer SPF/DKIM chez le fournisseur SMTP.

---

## 5. Variables d'environnement (`.env`)

| Variable | Obligatoire | Description |
|---|---|---|
| `DATABASE_URL` | oui | Chaîne PostgreSQL `postgresql://user:pass@host:5432/carlite?schema=public` |
| `NEXTAUTH_SECRET` | oui | Secret de signature des sessions — `openssl rand -base64 32`. Le changer déconnecte simplement les sessions en cours |
| `NEXTAUTH_URL` | oui | URL publique exacte (`https://carlite.fr`). Utilisée aussi pour `metadataBase`, sitemap |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | oui pour les emails | Serveur SMTP |
| `EMAIL_FROM` | conseillé | Expéditeur, ex. `CARLITE <noreply@carlite.fr>` |
| `EMAIL_TO_LEADS` | non | Destinataire devis + rappels (défaut `wd@carlite.fr`) |
| `EMAIL_TO_CONTACT` | non | Destinataire contact expert (défaut `contact@carlite.fr`) |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | oui pour l'upload | Clés du bucket |
| `AWS_REGION` | oui pour l'upload | ex. `eu-west-3`, `auto` (R2), `fr-par` (Scaleway) |
| `AWS_BUCKET_NAME` | oui pour l'upload | Nom du bucket |
| `AWS_FOLDER_PREFIX` | non | Préfixe des clés (avec `/` final) ou vide |
| `S3_ENDPOINT` | hors AWS | Endpoint S3 du fournisseur |
| `S3_FORCE_PATH_STYLE` | MinIO | `true` pour MinIO |
| `S3_PUBLIC_URL_BASE` | hors AWS | URL publique de lecture du bucket |

Les anciennes variables `ABACUSAI_API_KEY`, `WEB_APP_ID`, `NOTIF_ID_*`, `AWS_PROFILE` ne sont **plus utilisées** par le code exporté.

---

## 6. Checklist de validation après déploiement

1. `https://carlite.fr` s'affiche, images véhicules / pièces visibles.
2. `/vehicules/bi-scot` et `/vehicules/eg202ek` s'ouvrent ; `/configurateur` affiche les options.
3. `/accessoires` liste les 155 pièces (moins celles en rupture non visibles).
4. Connexion `/login` avec un compte admin → `/admin` accessible.
5. Dans l'admin, modifier une pièce et **uploader une photo** → la photo s'affiche (sinon vérifier clés + CORS + `S3_PUBLIC_URL_BASE`).
6. `/admin/stock-rapide` depuis un mobile : photo → détourage → ajout.
7. Envoyer une demande de rappel depuis le site → email reçu sur `EMAIL_TO_LEADS` et ligne visible dans `/admin/demandes`.
8. `https://carlite.fr/sitemap.xml` et `/robots.txt` répondent.
9. `pm2 logs carlite` sans erreur.

---

## 7. Maintenance

- **Sauvegarde quotidienne** de la base (cron) :
  `0 3 * * * pg_dump -Fc -h localhost -U carlite carlite > /var/backups/carlite_$(date +\%F).dump`
  (+ rotation, + copie hors serveur). Sauvegarder aussi `public/uploads/` si l'option B est utilisée.
- **Mise à jour du code** : `git pull` / copie → `yarn install` → `yarn prisma generate` → `yarn prisma db push` (changements additifs uniquement) → `yarn build` → recopier `public` et `.next/static` dans standalone → `pm2 restart carlite`.
- **Règles à respecter** pour les évolutions : schéma uniquement additif (pas de perte de données), configurateur piloté par l'admin sans code en dur, contenu en français, prix saisis HT (TTC calculé à 20 %).
- **Sécurité** : changer le mot de passe de `john@doe.com` ou supprimer ce compte ; supprimer les comptes de test ; ne jamais committer `.env`.
