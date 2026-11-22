// Configuration PM2 de CARLITE (lancée par l'utilisateur système « carlite »).
// - APP_CWD : dossier de la version en ligne. Avec le déploiement par tag c'est le lien
//   /var/www/carlite-deploy/current, relu à chaque rechargement ; sinon le dossier de ce fichier.
// - Le port interne est lu dans .env (APP_PORT), choisi à l'installation pour ne pas gêner les autres sites.
const fs = require('fs');
const path = require('path');

const cwd = process.env.APP_CWD || path.join(__dirname, '..');
let port = 3000;
try {
  const m = fs.readFileSync(path.join(cwd, '.env'), 'utf8').match(/^APP_PORT="?(\d+)"?/m);
  if (m) port = Number(m[1]);
} catch {}

module.exports = {
  apps: [
    {
      name: 'carlite',
      cwd,
      script: 'node_modules/next/dist/bin/next',
      args: `start -p ${port} -H 127.0.0.1`, // écoute uniquement en local : Nginx est la seule porte d'entrée
      interpreter: fs.existsSync('/opt/carlite-node/bin/node') ? '/opt/carlite-node/bin/node' : 'node',
      instances: 1, // VPS partagé : une instance suffit
      exec_mode: 'fork',
      max_memory_restart: "600M",
      kill_timeout: 5000,
      env: { NODE_ENV: 'production' },
      time: true,
    },
  ],
};
