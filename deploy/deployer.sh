#!/usr/bin/env bash
# =====================================================================
# CARLITE — déploiement d'une version (tag) sans coupure, avec retour arrière automatique.
#
# Appelé par GitHub Actions via SSH (clé restreinte à ce seul script, voir activer-deploiement-auto.sh)
# ou à la main :   sudo -u carlite /usr/local/bin/carlite-deployer deploy v1.2.0
#
# Commandes :  deploy <vX.Y.Z | main>   construit et met en ligne cette version
#              rollback                 revient à la version précédente
#              status                   version en ligne + santé
#
# Principe : chaque version est construite dans son propre dossier (le site en ligne n'est jamais
# touché pendant le build), puis un lien symbolique « current » bascule d'un coup. Si le site ne
# répond pas après la bascule, l'ancienne version est remise en ligne automatiquement.
# =====================================================================
set -euo pipefail

APP="${APP:-carlite}"
REPO_DIR="${REPO_DIR:-/var/www/carlite}"                 # clone Git + .env partagé
RELEASES="${RELEASES:-/var/www/carlite-deploy/releases}" # une version par dossier (dossier appartenant à carlite)
CURRENT="${CURRENT:-/var/www/carlite-deploy/current}"    # lien vers la version en ligne
NODE_DIR="${NODE_DIR:-/opt/carlite-node}"
BACKUPS="${BACKUPS:-$HOME/backups}"
KEEP="${KEEP:-3}"                                          # versions conservées pour le retour arrière
export PATH="$NODE_DIR/bin:/usr/local/bin:/usr/bin:/bin"
export NEXT_TELEMETRY_DISABLED=1

log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
die() { printf '[%s] ERREUR : %s\n' "$(date '+%H:%M:%S')" "$*" >&2; exit 1; }

# Toute erreur imprévue est signalée avec sa ligne (sinon `set -e` arrêterait le script en silence)
trap 'printf "[%s] ERREUR inattendue (ligne %s) : déploiement interrompu\n" "$(date +%H:%M:%S)" "$LINENO" >&2' ERR
for cmd in git node npm npx pm2 pg_dump curl flock tar; do
  command -v "$cmd" >/dev/null || die "commande « $cmd » introuvable (PATH=$PATH)"
done

# Commande reçue : SSH forcé ($SSH_ORIGINAL_COMMAND) ou arguments
read -r ACTION REF EXTRA <<<"${SSH_ORIGINAL_COMMAND:-$*}" || true
[ -z "${EXTRA:-}" ] || die "argument inattendu"

env_value() { grep -E "^$1=" "$REPO_DIR/.env" | tail -1 | cut -d= -f2- | sed -E 's/^"(.*)"$/\1/'; }
PORT="$(env_value APP_PORT)"; [ -n "$PORT" ] || die "APP_PORT absent de $REPO_DIR/.env"

healthy() {   # $1 = nombre d'essais (2 s d'intervalle), 30 par défaut
  local i
  for i in $(seq 1 "${1:-30}"); do
    curl -fs -o /dev/null --max-time 5 "http://127.0.0.1:$PORT/api/auth/providers" \
      && curl -fs -o /dev/null --max-time 10 "http://127.0.0.1:$PORT/" && return 0
    sleep 2
  done
  return 1
}

current_release() { readlink "$CURRENT" 2>/dev/null || echo "$REPO_DIR"; }

pm2_switch() {
  # Le processus PM2 tourne dans « current » ; un rechargement relit le lien et démarre la nouvelle version.
  local cwd
  cwd="$(pm2 jlist 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const a=JSON.parse(s).find(p=>p.name===process.argv[1]);process.stdout.write(a?a.pm2_env.pm_cwd:"")}catch{}})' "$APP")"
  if [ "$cwd" != "$CURRENT" ]; then
    # Première bascule vers le mode « versions » (ou processus absent) : redémarrage complet
    pm2 delete "$APP" >/dev/null 2>&1 || true
    APP_CWD="$CURRENT" pm2 start "$CURRENT/deploy/ecosystem.config.js" >/dev/null
  else
    APP_CWD="$CURRENT" pm2 reload "$CURRENT/deploy/ecosystem.config.js" --update-env >/dev/null
  fi
  pm2 save >/dev/null
}

point_current_to() { ln -sfn "$1" "$CURRENT.tmp" && mv -Tf "$CURRENT.tmp" "$CURRENT"; }

exec 9>"/tmp/$APP-deploy.lock"
flock -n 9 || die "un déploiement est déjà en cours"

case "${ACTION:-}" in
  status)
    log "En ligne : $(current_release)"
    [ -f "$(current_release)/.release" ] && cat "$(current_release)/.release"
    healthy && log "Santé : OK" || die "Santé : le site ne répond pas sur le port $PORT"
    ;;

  rollback)
    NOW="$(current_release)"
    PREV="$(ls -1dt "$RELEASES"/*/ 2>/dev/null | sed 's#/$##' | grep -vxF "$NOW" | head -1 || true)"
    [ -n "$PREV" ] || die "aucune version précédente disponible"
    log "Retour arrière : $NOW -> $PREV"
    point_current_to "$PREV"; pm2_switch
    healthy && log "Retour arrière réussi ✔" || die "le site ne répond pas après le retour arrière"
    ;;

  deploy)
    [[ "${REF:-}" =~ ^(v[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.]+)?|main)$ ]] \
      || die "version invalide « ${REF:-} » (attendu : vX.Y.Z ou main)"
    log "Récupération du code ($REF)"
    git -C "$REPO_DIR" fetch --quiet --tags --force origin '+refs/heads/main:refs/remotes/origin/main'
    if [ "$REF" = main ]; then
      SHA="$(git -C "$REPO_DIR" rev-parse origin/main)"; NAME="main-${SHA:0:7}"
    else
      SHA="$(git -C "$REPO_DIR" rev-parse --verify --quiet "refs/tags/$REF^{commit}")" || die "tag $REF introuvable sur GitHub"
      NAME="$REF"
    fi
    DIR="$RELEASES/$NAME"
    if [ "$(current_release)" = "$DIR" ] && healthy 1; then log "$NAME est déjà en ligne, rien à faire ✔"; exit 0; fi

    log "Construction de $NAME (${SHA:0:7}) dans $DIR — le site en ligne n'est pas touché"
    mkdir -p "$RELEASES" "$BACKUPS"
    rm -rf "$DIR"; mkdir -p "$DIR"
    trap 'rm -rf "$DIR"; printf "[%s] ERREUR (ligne %s) : le site en ligne n a pas changé\n" "$(date +%H:%M:%S)" "$LINENO" >&2' ERR
    git -C "$REPO_DIR" archive "$SHA" | tar -x -C "$DIR"
    ln -s "$REPO_DIR/.env" "$DIR/.env"
    printf 'version=%s\ncommit=%s\ndate=%s\n' "$NAME" "$SHA" "$(date -Iseconds)" > "$DIR/.release"
    ( cd "$DIR" && npm ci --no-audit --no-fund --loglevel=error && npx prisma generate >/dev/null && NODE_OPTIONS=--max-old-space-size=1536 npm run build ) \
      || die "le build a échoué : le site en ligne n'a pas changé"
    trap 'printf "[%s] ERREUR inattendue (ligne %s)\n" "$(date +%H:%M:%S)" "$LINENO" >&2' ERR

    DB_URL="$(env_value DATABASE_URL)"; DB_URL="${DB_URL%%\?*}"
    DUMP="$BACKUPS/avant-$NAME-$(date +%Y%m%d-%H%M%S).dump"
    log "Sauvegarde de la base -> $DUMP"
    pg_dump "$DB_URL" -Fc -f "$DUMP" || die "sauvegarde impossible : déploiement annulé"
    ls -1t "$BACKUPS"/avant-*.dump 2>/dev/null | tail -n +11 | xargs -r rm -f

    log "Mise à jour du schéma de la base (refusée si elle détruirait des données)"
    ( cd "$DIR" && npx prisma db push --skip-generate ) || die "schéma refusé : le site en ligne n'a pas changé"

    PREV="$(current_release)"
    log "Bascule : $PREV -> $DIR"
    point_current_to "$DIR"; pm2_switch

    if ! healthy; then
      log "Le site ne répond pas : retour automatique à $PREV"
      point_current_to "$PREV"; pm2_switch
      rm -rf "$DIR"   # une version en échec ne doit jamais servir de cible à un retour arrière
      healthy && die "$NAME en échec, version précédente remise en ligne" || die "$NAME en échec ET la version précédente ne répond pas : intervention nécessaire"
    fi

    # Ménage : on garde les $KEEP versions les plus récentes (dont celle en ligne)
    { ls -1dt "$RELEASES"/*/ | sed 's#/$##' | grep -vxF "$DIR" || true; } | tail -n +"$KEEP" | xargs -r rm -rf
    log "$NAME est en ligne ✔"
    ;;

  *)
    echo "Usage : deploy <vX.Y.Z|main> | rollback | status" >&2; exit 2 ;;
esac
