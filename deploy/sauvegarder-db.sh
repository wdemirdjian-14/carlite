#!/usr/bin/env bash
# Sauvegarde quotidienne de CARLITE : base « carlite » + photos uploadées depuis l'admin (14 jours conservés).
# Installé dans /usr/local/bin/carlite-sauvegarde par installer-serveur.sh (qui renseigne PG_PORT).
set -euo pipefail
PG_PORT=5432
DEST=/var/backups/carlite
mkdir -p "$DEST" && chmod 700 "$DEST" && chown postgres "$DEST"
sudo -u postgres pg_dump -p "$PG_PORT" -Fc carlite -f "$DEST/carlite-$(date +%F-%H%M).dump"
[ -d /var/www/carlite-data/media ] && tar -czf "$DEST/carlite-media-$(date +%F).tar.gz" -C /var/www/carlite-data media
find "$DEST" -name 'carlite-*' -mtime +14 -delete
echo "$(date '+%F %T') sauvegarde OK"
