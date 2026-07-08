/**
 * One-off script: clear the unsubstantiated "Popular" / "Best Seller" badge
 * values that were hand-typed into seed data before badges were tied to
 * real sales data. Real "Best Seller" status is now computed at read time
 * from completed orders (see findBestSellerProductIds).
 *
 * Run with:  node scripts/clean-fake-badges.js
 *
 * Safe to re-run — only touches rows still carrying the old fake values.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const FAKE_BADGES = ["Popular", "Best Seller"];

async function main() {
  const result = await prisma.product.updateMany({
    where: { badge: { in: FAKE_BADGES } },
    data: { badge: null }
  });

  console.log(`Cleared fake badge on ${result.count} product(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
