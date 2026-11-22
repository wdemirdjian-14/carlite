# CARLITE — mise en ligne sur le VPS IONOS

Site : **https://carlite.fr** (www.carlite.fr redirige vers carlite.fr). DNS : A `@` et `www` → `93.93.117.124` (déjà fait).
Serveur partagé avec d'autres sites : tout est **additif** (utilisateur, base, port et site Nginx dédiés).

| Élément | Valeur |
|---|---|
| Utilisateur système | `carlite` (PM2 propre) |
| Code | `/var/www/carlite` (clone Git + `.env`) |
| Versions déployées | `/var/www/carlite-deploy/releases/vX.Y.Z`, lien `current` |
| Photos uploadées depuis l'admin | `/var/www/carlite-data/media` (servies sous `/media/` par Nginx) |
| Base | PostgreSQL 16 de l'hôte, base + rôle `carlite` |
| Port interne | premier libre 3100-3199 (`APP_PORT` du `.env`), écoute 127.0.0.1 |
| Node | 20, isolé dans `/opt/carlite-node` |

## 1. Installation (une fois, en SSH root)

```bash
# 1. Copier le dump SQL de l'ancienne plateforme (depuis le Mac)
scp "…/carlite_export/database/carlite_full_dump.sql" root@93.93.117.124:/root/

# 2. Sur le serveur : récupérer le script d'installation et le lancer
curl -fsSL https://raw.githubusercontent.com/wdemirdjian-14/carlite/main/deploy/installer-serveur.sh -o /root/installer-carlite.sh
sudo bash /root/installer-carlite.sh /root/carlite_full_dump.sql
```

Le script s'arrête deux fois, volontairement :
1. il affiche une **clé de déploiement** à ajouter dans GitHub (dépôt → Settings → Deploy keys, lecture seule), puis on le relance ;
2. il crée `/var/www/carlite/.env` : renseigner le **SMTP** (`sudo nano /var/www/carlite/.env`), puis on le relance.

Il restaure ensuite le dump (comptes, demandes, catalogue), lance `npm run import:contenu` (images basculées en local,
photos iPhone HEIC remplacées par leur version JPEG), construit, démarre et ajoute le site Nginx.

```bash
sudo certbot --nginx -d carlite.fr -d www.carlite.fr     # HTTPS
sudo bash /var/www/carlite/deploy/activer-deploiement-auto.sh   # déploiement par tag (affiche 4 secrets GitHub)
```

Sans dump : le catalogue est importé depuis `prisma/data/*.csv`, puis créer un admin :
`sudo -iu carlite bash -c 'cd /var/www/carlite && npm run admin:creer -- vous@carlite.fr'`

## 2. Mises à jour

PR fusionnée dans `main` → GitHub → Actions → « Déploiement production » → `release` (version `auto`).
Build dans un dossier séparé, sauvegarde de la base, `prisma db push` (refuse toute perte de données), bascule sans
coupure, retour automatique à la version précédente si le site ne répond plus. `rollback` et `status` au même endroit.

## 3. Points d'attention

- Le dump `.dump` (PostgreSQL 17) n'est pas lisible par le PostgreSQL 16 du serveur : utiliser le `.sql`.
- Sans bucket S3 (`AWS_*` vides), les photos de l'admin sont stockées sur le serveur (`MEDIA_DIR`) et sauvegardées
  chaque nuit avec la base dans `/var/backups/carlite` (14 jours).
- Sécurité : supprimer ou changer le mot de passe du compte `john@doe.com` et des comptes `smoke+…` / `testuser…`.
- `npm run import:contenu` ne supprime ni n'écrase rien : il ne crée que les lignes absentes et réécrit les URL d'images.
  Ne pas le relancer après avoir supprimé des produits dans l'admin (il les recréerait depuis les CSV).
