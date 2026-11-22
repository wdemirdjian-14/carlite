#!/usr/bin/env bash
# =====================================================================
# CARLITE — activation du déploiement automatique par tag (GitHub Actions).
# À lancer UNE fois, en root, après installer-serveur.sh :
#     sudo bash /var/www/carlite/deploy/activer-deploiement-auto.sh
#
# Ce que fait ce script (et rien d'autre) :
#  - installe /usr/local/bin/carlite-deployer (copie root, non modifiable par l'application)
#  - crée /var/www/carlite-deploy (versions + lien « current »), propriété de l'utilisateur carlite
#  - crée une clé SSH dédiée à GitHub Actions, RESTREINTE : elle ne peut lancer que
#    « carlite-deployer » (pas de shell, pas de transfert de port), sous l'utilisateur carlite
#  - affiche les 3 valeurs à copier dans les secrets GitHub du dépôt
# Option --nouvelle-cle : remplace la clé GitHub Actions existante.
# =====================================================================
set -euo pipefail

APP=carlite
APP_USER=carlite
APP_DIR=/var/www/carlite
DEPLOY_DIR=/var/www/carlite-deploy
MARK="github-actions-$APP"
AUTH="/home/$APP_USER/.ssh/authorized_keys"

[ "$(id -u)" -eq 0 ] || { echo "Lancez ce script avec sudo."; exit 1; }
[ -f "$APP_DIR/.env" ] || { echo "Installez d'abord l'application (installer-serveur.sh)."; exit 1; }

echo "==> Script de déploiement"
install -o root -g root -m 755 "$APP_DIR/deploy/deployer.sh" /usr/local/bin/carlite-deployer
mkdir -p "$DEPLOY_DIR/releases" && chown -R "$APP_USER:$APP_USER" "$DEPLOY_DIR"

echo "==> Accès SSH de l'utilisateur $APP_USER"
SSHD_ALLOW="$(sshd -T 2>/dev/null | awk '/^allowusers|^allowgroups/' || true)"
if [ -n "$SSHD_ALLOW" ] && ! echo "$SSHD_ALLOW" | grep -qw "$APP_USER"; then
  echo "[!] sshd limite les comptes autorisés ($SSHD_ALLOW) : ajoutez « $APP_USER » à AllowUsers, puis : systemctl reload ssh"
fi
SSH_PORT="$(sshd -T 2>/dev/null | awk '/^port /{print $2; exit}' || true)"; SSH_PORT="${SSH_PORT:-22}"

install -d -m 700 -o "$APP_USER" -g "$APP_USER" "/home/$APP_USER/.ssh"
touch "$AUTH" && chown "$APP_USER:$APP_USER" "$AUTH" && chmod 600 "$AUTH"

if grep -q "$MARK" "$AUTH" && [ "${1:-}" != "--nouvelle-cle" ]; then
  echo "La clé GitHub Actions est déjà installée (relancez avec --nouvelle-cle pour la remplacer)."
  PRIVATE=""
else
  sed -i "/$MARK/d" "$AUTH"
  TMP="$(mktemp -d)"
  ssh-keygen -q -t ed25519 -N "" -C "$MARK" -f "$TMP/key"
  echo "restrict,command=\"/usr/local/bin/carlite-deployer\" $(cat "$TMP/key.pub")" >> "$AUTH"
  PRIVATE="$(cat "$TMP/key")"
  rm -rf "$TMP"   # la clé privée n'est conservée nulle part sur le serveur
fi

HOST_IP="$(curl -s -4 --max-time 5 ifconfig.me || true)"; HOST_IP="${HOST_IP:-93.93.117.124}"   # IP publique (pas une IP interne)
KNOWN=""
for k in /etc/ssh/ssh_host_ed25519_key.pub /etc/ssh/ssh_host_ecdsa_key.pub; do
  [ -f "$k" ] || continue
  if [ "$SSH_PORT" = 22 ]; then H="$HOST_IP"; else H="[$HOST_IP]:$SSH_PORT"; fi
  KNOWN="${KNOWN}${H} $(cut -d' ' -f1,2 "$k")"$'\n'
done
KNOWN="${KNOWN%$'\n'}"

cat <<EOF

=====================================================================
 À copier dans GitHub : dépôt carlite → Settings → Secrets and variables
 → Actions → « New repository secret » (un secret par bloc)
=====================================================================

Nom : VPS_HOST
Valeur :
$HOST_IP

Nom : VPS_PORT
Valeur :
$SSH_PORT

Nom : VPS_KNOWN_HOSTS
Valeur :
$KNOWN
EOF
if [ -n "$PRIVATE" ]; then cat <<EOF

Nom : VPS_SSH_KEY      (tout le bloc, lignes BEGIN et END comprises)
Valeur :
$PRIVATE

[!] Cette clé n'est affichée qu'une fois et n'est enregistrée nulle part sur le serveur.
    Effacez l'écran après l'avoir copiée :  clear
EOF
fi
echo
echo "Test local du déployeur :  sudo -iu $APP_USER carlite-deployer status"
