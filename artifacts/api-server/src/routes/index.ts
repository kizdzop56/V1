import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import assignmentsRouter from "./assignments";
import submissionsRouter from "./submissions";
import voiceChatRouter from "./voiceChat";
import timeTrackingRouter from "./timeTracking";
import leaderboardRouter from "./leaderboard";
import uploadRouter from "./upload";
import connectionsRouter from "./connections";
import calendarRouter from "./calendar";
import gamificationRouter from "./gamification";
import { db } from "@workspace/db";
import { usersTable, submissionsTable, timeSessionsTable, voiceChatSessionsTable, voiceChatMessagesTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.post("/admin/cleanup-users", async (req, res) => {
  const token = req.headers["x-admin-token"] as string;
  const expected = process.env["ADMIN_CLEANUP_TOKEN"];
  if (!expected || token !== expected) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const ids = [1, 3, 4, 7];
  const sessions = await db.select({ id: voiceChatSessionsTable.id })
    .from(voiceChatSessionsTable).where(inArray(voiceChatSessionsTable.studentId, ids));
  if (sessions.length > 0) {
    await db.delete(voiceChatMessagesTable).where(inArray(voiceChatMessagesTable.sessionId, sessions.map(s => s.id)));
  }
  await db.delete(voiceChatSessionsTable).where(inArray(voiceChatSessionsTable.studentId, ids));
  await db.delete(submissionsTable).where(inArray(submissionsTable.studentId, ids));
  await db.delete(timeSessionsTable).where(inArray(timeSessionsTable.studentId, ids));
  await db.delete(usersTable).where(inArray(usersTable.id, ids));
  res.json({ ok: true, deletedIds: ids });
});

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(assignmentsRouter);
router.use(submissionsRouter);
router.use(voiceChatRouter);
router.use(timeTrackingRouter);
router.use(leaderboardRouter);
router.use(uploadRouter);
router.use(connectionsRouter);
router.use(calendarRouter);
router.use(gamificationRouter);

export default router;
