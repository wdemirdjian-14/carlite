#!/usr/bin/env bash
# =====================================================================
# CARLITE — diagnostic du VPS AVANT installation.
# LECTURE SEULE : ne modifie rien. Usage : sudo bash diagnostic.sh
# Envoyez la sortie complète pour valider l'installation.
# =====================================================================
t() { printf '\n===== %s =====\n' "$*"; }

t "Système"
. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME"; uname -m
free -h | head -2; df -h / | tail -1

t "Panneau d'administration"
[ -d /usr/local/psa ] && echo "Plesk détecté" || echo "Pas de Plesk"
[ -d /usr/local/cpanel ] && echo "cPanel détecté"
[ -d /usr/local/hestia ] && echo "HestiaCP détecté"

t "Ports web 80 / 443 (qui écoute ?)"
ss -ltnp 2>/dev/null | awk 'NR==1 || /:(80|443) /'

t "Nginx"
if command -v nginx >/dev/null; then
  nginx -v 2>&1; ls -1 /etc/nginx/sites-enabled/ 2>/dev/null; ls -1 /etc/nginx/conf.d/ 2>/dev/null
  echo "-- domaines déjà configurés :"; grep -rhoE 'server_name[^;]+' /etc/nginx/ 2>/dev/null | sort -u
else echo "Nginx non installé"; fi

t "Apache"
command -v apache2 >/dev/null && { apache2 -v | head -1; ls -1 /etc/apache2/sites-enabled/ 2>/dev/null; } || echo "Apache non installé"

t "Node.js / PM2"
command -v node >/dev/null && node -v || echo "Node non installé"
if [ -d /root/.pm2 ]; then pm2 list 2>/dev/null | head -20; else echo "Pas de PM2 actif pour root (non démarré pour rester en lecture seule)"; fi
for u in /home/*; do [ -d "$u/.pm2" ] && echo "PM2 présent pour l'utilisateur $(basename "$u")"; done
ls -d /opt/carlite-node 2>/dev/null

t "Ports applicatifs 3000-3999 occupés"
ss -ltnp 2>/dev/null | awk 'NR==1 || $4 ~ /:3[0-9][0-9][0-9]$/'

t "Application derrière chaque port (dossier de lancement)"
ss -ltnpH 2>/dev/null | awk '$4 ~ /:(3[0-9]{3}|[4-9][0-9]{3})$/' | while read -r _ _ _ addr _ proc; do
  pid=$(echo "$proc" | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2)
  [ -n "$pid" ] && printf '%-22s %-10s %s\n' "$addr" "$(ps -o user= -p "$pid" 2>/dev/null)" "$(readlink "/proc/$pid/cwd" 2>/dev/null)"
done
echo "-- correspondance Nginx -> port :"
grep -rHoE 'proxy_pass\s+http://[^;]+' /etc/nginx/sites-enabled/ 2>/dev/null | sed 's#/etc/nginx/sites-enabled/##' | sort -u

t "PostgreSQL"
command -v pg_lsclusters >/dev/null && pg_lsclusters || echo "PostgreSQL non installé"
command -v mysql >/dev/null && echo "MySQL/MariaDB présent : $(mysql --version 2>/dev/null)"

t "Docker"
command -v docker >/dev/null && docker ps --format '{{.Names}}  {{.Ports}}' 2>/dev/null || echo "Docker non installé"

t "Pare-feu"
command -v ufw >/dev/null && ufw status 2>/dev/null | head -15 || echo "ufw absent"

t "DNS carlite.fr"
IP=$(curl -s -4 --max-time 5 ifconfig.me || echo "?"); echo "IP publique du VPS : $IP"
getent ahostsv4 carlite.fr | head -1 || echo "carlite.fr ne résout pas"
getent ahostsv4 www.carlite.fr | head -1 || echo "www.carlite.fr ne résout pas"

t "Fin du diagnostic (aucune modification effectuée)"
