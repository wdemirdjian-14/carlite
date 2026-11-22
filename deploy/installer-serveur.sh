#!/usr/bin/env bash
# =====================================================================
# CARLITE — installation sur le VPS IONOS PARTAGÉ (Ubuntu 24.04, ~16 autres sites).
#
# Usage (en root, depuis n'importe où) :
#   sudo bash /var/www/carlite/deploy/installer-serveur.sh [/root/carlite_full_dump.sql]
#
# Le dump est facultatif :
#   - avec le dump de l'ancienne plateforme (carlite_full_dump.sql de préférence ; le .dump,
#     produit par PostgreSQL 17, n'est pas lisible par le PostgreSQL 16 du serveur) : comptes, demandes clients et
#     catalogue sont restaurés, puis les URL d'images sont basculées en local ;
#   - sans dump : le catalogue (véhicules, pièces, occasions, articles…) est importé depuis
#     prisma/data/*.csv ; il faudra alors créer un compte admin (voir la fin du script).
#
# Garanties pour les autres sites du serveur :
#  - Node.js 20 isolé dans /opt/carlite-node (le Node système n'est pas touché)
#  - PM2 propre à l'utilisateur « carlite » ; écoute sur 127.0.0.1 uniquement, port libre 3100-3199
#  - PostgreSQL 16 de l'hôte réutilisé (nouvelle base + nouveau rôle dédiés, aucun DROP)
#  - Nginx : AJOUT d'un seul fichier de site, annulé si `nginx -t` échoue ; reload (jamais restart)
#  - aucun changement de pare-feu
# Ré-exécutable : les étapes déjà faites sont sautées.
# =====================================================================
set -euo pipefail

DOMAIN="${DOMAIN:-carlite.fr}"
APP=carlite
APP_DIR="${APP_DIR:-/var/www/carlite}"
APP_USER="${APP_USER:-carlite}"
DATA_DIR=/var/www/carlite-data          # photos uploadées depuis l'admin (persistant entre versions)
REPO="${REPO:-git@github.com:wdemirdjian-14/carlite.git}"
BRANCH="${BRANCH:-main}"
NODE_DIR=/opt/carlite-node
DUMP="${1:-}"
NGINX_SITE=/etc/nginx/sites-available/carlite

say()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m[!] %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m[X] %s\033[0m\n' "$*"; exit 1; }
[ "$(id -u)" -eq 0 ] || die "Lancez ce script avec sudo."
[ -z "$DUMP" ] || [ -f "$DUMP" ] || die "Fichier dump introuvable : $DUMP"

# ---------------------------------------------------------------------
say "1/11 Vérifications (aucune modification)"
command -v nginx >/dev/null || die "Nginx absent : ce n'est pas le VPS attendu. Lancez deploy/diagnostic.sh."
if grep -rlsE "server_name[^;]*\b(www\.)?${DOMAIN//./\\.}\b" /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null | grep -v "/carlite$" | grep -q .; then
  die "Le domaine $DOMAIN est déjà configuré dans un autre fichier Nginx :
$(grep -rlsE "server_name[^;]*${DOMAIN//./\\.}" /etc/nginx/sites-enabled /etc/nginx/conf.d | grep -v '/carlite$')
Retirez-le d'abord (ou envoyez-moi ce fichier)."
fi
echo "OK"

# ---------------------------------------------------------------------
say "2/11 Paquets système (ajout uniquement)"
apt-get update -q
apt-get install -y -q --no-upgrade curl git openssl ca-certificates certbot python3-certbot-nginx xz-utils

# ---------------------------------------------------------------------
say "3/11 Node.js 20 isolé dans $NODE_DIR"
if [ ! -x "$NODE_DIR/bin/node" ]; then
  case "$(uname -m)" in x86_64) ARCH=x64 ;; aarch64) ARCH=arm64 ;; *) die "Architecture non gérée : $(uname -m)" ;; esac
  TARBALL=$(curl -fsSL https://nodejs.org/dist/latest-v20.x/SHASUMS256.txt | awk "/linux-$ARCH.tar.xz/{print \$2}")
  curl -fsSL "https://nodejs.org/dist/latest-v20.x/$TARBALL" -o "/tmp/$TARBALL"
  mkdir -p "$NODE_DIR" && tar -xJf "/tmp/$TARBALL" -C "$NODE_DIR" --strip-components=1 && rm -f "/tmp/$TARBALL"
fi
export PATH="$NODE_DIR/bin:$PATH"
[ -x "$NODE_DIR/bin/pm2" ] || npm install -g --prefix "$NODE_DIR" pm2 >/dev/null
echo "Node $(node -v) — PM2 $(pm2 -v)"

# ---------------------------------------------------------------------
say "4/11 Utilisateur système « $APP_USER » et dossier des photos"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /bin/bash "$APP_USER"
grep -q "$NODE_DIR/bin" "/home/$APP_USER/.profile" 2>/dev/null || echo "export PATH=\"$NODE_DIR/bin:\$PATH\"" >> "/home/$APP_USER/.profile"
mkdir -p "$DATA_DIR/media" && chown -R "$APP_USER:$APP_USER" "$DATA_DIR" && chmod 755 "$DATA_DIR" "$DATA_DIR/media"

# ---------------------------------------------------------------------
say "5/11 Code source dans $APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  if [ -e "$APP_DIR" ] && [ -n "$(ls -A "$APP_DIR" 2>/dev/null)" ]; then die "$APP_DIR existe déjà et n'est pas vide."; fi
  if [ ! -f "/home/$APP_USER/.ssh/id_ed25519" ]; then
    sudo -u "$APP_USER" mkdir -p "/home/$APP_USER/.ssh"
    sudo -u "$APP_USER" ssh-keygen -q -t ed25519 -N "" -C "deploy-$APP" -f "/home/$APP_USER/.ssh/id_ed25519"
  fi
  if ! sudo -u "$APP_USER" env GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new" git ls-remote "$REPO" >/dev/null 2>&1; then
    echo
    echo ">>> Ajoutez cette clé de déploiement (LECTURE SEULE) dans GitHub :"
    echo "    dépôt carlite → Settings → Deploy keys → Add deploy key (ne PAS cocher « Allow write access »)"
    echo
    cat "/home/$APP_USER/.ssh/id_ed25519.pub"
    echo
    echo ">>> puis relancez : sudo bash $0 ${DUMP}"
    exit 0
  fi
  mkdir -p "$APP_DIR" && chown "$APP_USER:$APP_USER" "$APP_DIR"
  sudo -u "$APP_USER" env GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new" git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ---------------------------------------------------------------------
say "6/11 PostgreSQL (base et rôle dédiés)"
read -r PG_VER PG_CLUSTER PG_PORT PG_STATUS _ <<<"$(pg_lsclusters -h | sort -k1,1nr | head -1)"
[ "$PG_STATUS" = online ] || die "PostgreSQL $PG_VER est arrêté : il sert à d'autres sites, vérifiez avant toute action."
echo "PostgreSQL $PG_VER (port $PG_PORT) — seule une base « carlite » est ajoutée."
PSQL_ADMIN=(sudo -u postgres psql -p "$PG_PORT" -v ON_ERROR_STOP=1 -qtA)
[ -f /root/.carlite-db-password ] || { openssl rand -hex 24 > /root/.carlite-db-password && chmod 600 /root/.carlite-db-password; }
DB_PASS="$(cat /root/.carlite-db-password)"
[ "$("${PSQL_ADMIN[@]}" -c "SELECT 1 FROM pg_roles WHERE rolname='carlite'")" = 1 ] || "${PSQL_ADMIN[@]}" -c "CREATE USER carlite WITH PASSWORD '$DB_PASS';"
[ "$("${PSQL_ADMIN[@]}" -c "SELECT 1 FROM pg_database WHERE datname='carlite'")" = 1 ] || "${PSQL_ADMIN[@]}" -c "CREATE DATABASE carlite OWNER carlite ENCODING 'UTF8' TEMPLATE template0;"
PSQL_URL="postgresql://carlite:${DB_PASS}@127.0.0.1:${PG_PORT}/carlite"   # pour psql / pg_restore
DB_URL="${PSQL_URL}?schema=public"                                     # pour Prisma (.env)

TABLES="$(psql "$PSQL_URL" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")"
if [ -n "$DUMP" ] && [ "$TABLES" = "0" ]; then
  say "Restauration du dump $DUMP"
  case "$DUMP" in
    *.dump) pg_restore --no-owner --no-privileges --exit-on-error -d "$PSQL_URL" "$DUMP" \
              || die "Restauration échouée. Un dump .dump fait en PostgreSQL 17 n'est pas lisible par PostgreSQL $PG_VER : utilisez carlite_full_dump.sql." ;;
    *.sql)
      CLEAN=$(mktemp)
      sed -E '/^SET transaction_timeout/d; /^\\(un)?restrict /d; /^ALTER .* OWNER TO /d; /^(GRANT|REVOKE) /d' "$DUMP" > "$CLEAN"
      psql "$PSQL_URL" -v ON_ERROR_STOP=1 -q -1 -f "$CLEAN" || { rm -f "$CLEAN"; die "Import échoué (base laissée vide)."; }
      rm -f "$CLEAN" ;;
    *) die "Format de dump inconnu (attendu .dump ou .sql)" ;;
  esac
elif [ -n "$DUMP" ]; then
  echo "La base contient déjà des tables : dump ignoré (aucune donnée écrasée)."
fi

# ---------------------------------------------------------------------
say "7/11 Port applicatif et fichier .env"
if [ -f "$APP_DIR/.env" ] && grep -q '^APP_PORT=' "$APP_DIR/.env"; then
  APP_PORT=$(grep '^APP_PORT=' "$APP_DIR/.env" | cut -d= -f2 | tr -d '"')
else
  APP_PORT=""
  for p in $(seq 3100 3199); do ss -ltn | grep -q ":$p\s" || { APP_PORT=$p; break; }; done
  [ -n "$APP_PORT" ] || die "Aucun port libre entre 3100 et 3199."
fi
echo "Port interne : $APP_PORT (non exposé sur Internet)"
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$DB_URL\"|" "$APP_DIR/.env"
  sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=\"https://$DOMAIN\"|" "$APP_DIR/.env"
  sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"|" "$APP_DIR/.env"
  sed -i "s|^MEDIA_DIR=.*|MEDIA_DIR=\"$DATA_DIR/media\"|" "$APP_DIR/.env"
  printf '\n# Port interne (choisi à l installation, ne pas modifier)\nAPP_PORT=%s\n' "$APP_PORT" >> "$APP_DIR/.env"
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"; chmod 600 "$APP_DIR/.env"
  echo
  echo ">>> Renseignez le serveur SMTP (emails des demandes de devis) :"
  echo "      sudo nano $APP_DIR/.env      (lignes SMTP_HOST, SMTP_USER, SMTP_PASS…)"
  echo "    Sans SMTP le site fonctionne : les demandes restent visibles dans /admin/demandes."
  echo ">>> puis relancez : sudo bash $0"
  exit 0
fi
grep -q '^APP_PORT=' "$APP_DIR/.env" || echo "APP_PORT=$APP_PORT" >> "$APP_DIR/.env"
grep -q '^SMTP_HOST="<' "$APP_DIR/.env" && warn "SMTP non renseigné : les demandes seront enregistrées mais aucun email ne partira."

# ---------------------------------------------------------------------
say "8/11 Dépendances, schéma, contenu et build (3 à 6 minutes)"
sudo -u "$APP_USER" env PATH="$NODE_DIR/bin:/usr/bin:/bin" NODE_OPTIONS=--max-old-space-size=1536 bash -c "
  set -e; cd '$APP_DIR'
  npm ci --no-audit --no-fund
  npx prisma db push --skip-generate          # refuse toute perte de données
  npm run import:contenu                       # catalogue manquant + images en local (non destructif)
  npm run build"
psql "$PSQL_URL" -c 'SELECT (SELECT count(*) FROM "Accessory") AS pieces, (SELECT count(*) FROM "Vehicle") AS vehicules, (SELECT count(*) FROM "UsedVehicle") AS occasions, (SELECT count(*) FROM "Article") AS articles, (SELECT count(*) FROM "User" WHERE role='"'"'admin'"'"') AS admins;'

# ---------------------------------------------------------------------
say "9/11 Démarrage avec le PM2 de l'utilisateur $APP_USER"
sudo -u "$APP_USER" env PATH="$NODE_DIR/bin:/usr/bin:/bin" bash -c \
  "cd '$APP_DIR' && (pm2 describe carlite >/dev/null 2>&1 && pm2 reload carlite --update-env || pm2 start deploy/ecosystem.config.js) && pm2 save"
[ -f "/etc/systemd/system/pm2-$APP_USER.service" ] || env PATH="$NODE_DIR/bin:$PATH" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" >/dev/null
sleep 4
curl -fsS -o /dev/null "http://127.0.0.1:$APP_PORT" && echo "Application OK sur 127.0.0.1:$APP_PORT" || warn "L'application ne répond pas : sudo -iu $APP_USER pm2 logs carlite"

# ---------------------------------------------------------------------
say "10/11 Site Nginx (ajout d'un fichier, rien d'autre n'est modifié)"
[ -f /etc/nginx/snippets/carlite-proxy.conf ] || cp "$APP_DIR/deploy/nginx-proxy-snippet.conf" /etc/nginx/snippets/carlite-proxy.conf
if [ ! -f "$NGINX_SITE" ]; then
  sed -e "s/127\.0\.0\.1:3000/127.0.0.1:$APP_PORT/g" "$APP_DIR/deploy/nginx-carlite.conf" > "$NGINX_SITE"
  ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/carlite
  if ! nginx -t 2>/tmp/carlite-nginx-test; then
    rm -f /etc/nginx/sites-enabled/carlite "$NGINX_SITE"
    cat /tmp/carlite-nginx-test
    die "Configuration Nginx refusée : le site CARLITE a été retiré, les autres sites ne sont pas affectés."
  fi
  systemctl reload nginx
fi

# ---------------------------------------------------------------------
say "11/11 Sauvegarde quotidienne de la base et des photos"
install -m 750 "$APP_DIR/deploy/sauvegarder-db.sh" /usr/local/bin/carlite-sauvegarde
sed -i "s/^PG_PORT=.*/PG_PORT=$PG_PORT/" /usr/local/bin/carlite-sauvegarde
echo "40 3 * * * root /usr/local/bin/carlite-sauvegarde >> /var/log/carlite-sauvegarde.log 2>&1" > /etc/cron.d/carlite-sauvegarde

say "Installation terminée ✔"
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "HTTPS (le DNS pointe déjà vers ce serveur) :"
  echo "    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi
if [ "$(psql "$PSQL_URL" -tAc "SELECT count(*) FROM \"User\" WHERE role='admin'")" = 0 ]; then
  echo "Aucun compte admin : créez-en un avec"
  echo "    sudo -iu $APP_USER bash -c 'cd $APP_DIR && npm run admin:creer -- votre@email.fr'"
fi
echo "Déploiement automatique : sudo bash $APP_DIR/deploy/activer-deploiement-auto.sh"
exit 0
