/**
 * One-off script: hash any plaintext passwords still stored in the DB.
 * Run with:  node scripts/migrate-passwords.js
 *
 * Safe to re-run — already-hashed passwords (containing ":") are skipped.
 */

const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();
const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, password: true }
  });

  const unhashed = users.filter(
    (u) => u.password && !u.password.includes(":")
  );

  if (unhashed.length === 0) {
    console.log("No plaintext passwords found. Nothing to migrate.");
    return;
  }

  for (const user of unhashed) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword(user.password) }
    });
    console.log(`  Hashed password for: ${user.email}`);
  }

  console.log(`\nMigration complete: ${unhashed.length} user(s) updated.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
