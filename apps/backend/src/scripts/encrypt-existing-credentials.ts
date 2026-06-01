/**
 * One-time migration: encrypt existing plaintext McpConnector.authValue rows.
 *
 * Usage:
 *   ENCRYPTION_KEY=<64-char-hex> npx ts-node src/scripts/encrypt-existing-credentials.ts
 *
 * Safe to run multiple times — rows already starting with `enc:` are skipped.
 */
import { PrismaClient } from '@prisma/client';
import { encrypt, isEncryptionEnabled } from '../utils/encrypt';

const prisma = new PrismaClient();

async function main() {
  if (!isEncryptionEnabled()) {
    console.error('ENCRYPTION_KEY not set or invalid. Aborting.');
    process.exit(1);
  }

  const rows = await prisma.mcpConnector.findMany({
    where: { authValue: { not: null } },
    select: { id: true, authValue: true },
  });

  const toEncrypt = rows.filter(
    (r): r is { id: string; authValue: string } =>
      r.authValue !== null && !r.authValue.startsWith('enc:'),
  );

  console.log(`Found ${rows.length} connectors with authValue, ${toEncrypt.length} need encryption.`);

  let ok = 0;
  let fail = 0;
  for (const row of toEncrypt) {
    try {
      const encrypted = encrypt(row.authValue);
      await prisma.mcpConnector.update({
        where: { id: row.id },
        data: { authValue: encrypted },
      });
      ok++;
    } catch (err) {
      console.error(`Failed to encrypt connector ${row.id}:`, (err as Error).message);
      fail++;
    }
  }

  console.log(`Done: ${ok} encrypted, ${fail} failed.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
