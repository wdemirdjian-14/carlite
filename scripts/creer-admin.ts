/**
 * Crée (ou promeut) un compte administrateur.
 *   npm run admin:creer -- email@domaine.fr
 * Le mot de passe est demandé au clavier (jamais passé en argument ni affiché).
 */
import readline from 'readline';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const out = process.stdout as any;
  const write = out.write.bind(out);
  return new Promise((resolve) => {
    rl.question(question, (a) => {
      out.write = write;
      rl.close();
      process.stdout.write('\n');
      resolve(a);
    });
    out.write = (s: string) => (s.includes(question) ? write(s) : true); // masque la saisie
  });
}

async function main() {
  const email = (process.argv[2] ?? '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Usage : npm run admin:creer -- email@domaine.fr');
  const pass = await ask('Mot de passe (12 caractères min.) : ');
  if (pass.length < 12) throw new Error('Mot de passe trop court.');
  const again = await ask('Confirmez : ');
  if (pass !== again) throw new Error('Les mots de passe diffèrent.');
  const password = await bcrypt.hash(pass, 12);
  const u = await prisma.user.upsert({
    where: { email },
    update: { password, role: 'admin' },
    create: { email, password, role: 'admin', name: email.split('@')[0] },
  });
  console.log(`Compte admin prêt : ${u.email}`);
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
