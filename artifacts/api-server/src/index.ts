import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

// One-time cleanup: earlier avatar uploads stored uncompressed base64 data
// URIs (up to several MB) directly in avatar_url. Any user row that still has
// one of these bloats every list response (students, leaderboard, etc.) and
// can break avatar loading entirely. New uploads are compressed client-side
// and capped at 500KB server-side, so simply clear any legacy oversized value
// (user can re-upload — the new upload path keeps it small automatically).
async function cleanupOversizedAvatars() {
  try {
    const result = await db
      .update(usersTable)
      .set({ avatarUrl: null })
      .where(sql`length(${usersTable.avatarUrl}) > 500000`)
      .returning({ id: usersTable.id });
    if (result.length > 0) {
      logger.warn({ userIds: result.map((r: { id: number }) => r.id) }, "Cleared oversized legacy avatar_url values");
    }
  } catch (err) {
    logger.error({ err }, "Failed to clean up oversized avatars");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

cleanupOversizedAvatars().finally(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
});
