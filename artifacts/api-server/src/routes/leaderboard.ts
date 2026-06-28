import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, submissionsTable, assignmentsTable } from "@workspace/db";
import { eq, desc, count, avg } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/leaderboard", requireAuth, async (req, res) => {
  const students = await db.select({
    userId: usersTable.id,
    name: usersTable.name,
    totalPoints: usersTable.totalPoints,
    avatarEmoji: usersTable.avatarEmoji,
    avatarColor: usersTable.avatarColor,
  }).from(usersTable)
    .where(eq(usersTable.role, "student"))
    .orderBy(desc(usersTable.totalPoints));

  const withCounts = await Promise.all(students.map(async (s) => {
    const [result] = await db.select({ count: count() }).from(submissionsTable)
      .where(eq(submissionsTable.studentId, s.userId));
    return {
      ...s,
      completedAssignments: result?.count || 0,
    };
  }));

  res.json(withCounts.map((s, i) => ({ ...s, rank: i + 1 })));
});

router.get("/leaderboard/categories", requireAuth, async (req, res) => {
  const students = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    avatarEmoji: usersTable.avatarEmoji,
    avatarColor: usersTable.avatarColor,
    avatarUrl: usersTable.avatarUrl,
    totalPoints: usersTable.totalPoints,
    totalTimeMinutes: usersTable.totalTimeMinutes,
    loginStreak: usersTable.loginStreak,
  }).from(usersTable).where(eq(usersTable.role, "student"));

  const [testScoresRaw, audioScoresRaw] = await Promise.all([
    db.select({
      studentId: submissionsTable.studentId,
      avgScore: avg(submissionsTable.score),
    }).from(submissionsTable)
      .innerJoin(assignmentsTable, eq(submissionsTable.assignmentId, assignmentsTable.id))
      .where(eq(assignmentsTable.type, "text_test"))
      .groupBy(submissionsTable.studentId),

    db.select({
      studentId: submissionsTable.studentId,
      avgScore: avg(submissionsTable.score),
    }).from(submissionsTable)
      .innerJoin(assignmentsTable, eq(submissionsTable.assignmentId, assignmentsTable.id))
      .where(eq(assignmentsTable.type, "audio"))
      .groupBy(submissionsTable.studentId),
  ]);

  const testMap: Record<number, number> = {};
  for (const t of testScoresRaw) testMap[t.studentId] = Math.round(Number(t.avgScore) || 0);

  const audioMap: Record<number, number> = {};
  for (const a of audioScoresRaw) audioMap[a.studentId] = Math.round(Number(a.avgScore) || 0);

  type Entry = { userId: number; name: string; avatarEmoji: string | null; avatarColor: string | null; avatarUrl: string | null; value: number; rank: number };

  const rank = (arr: typeof students, getValue: (s: typeof students[0]) => number): Entry[] =>
    [...arr]
      .sort((a, b) => getValue(b) - getValue(a))
      .map((s, i) => ({
        userId: s.id,
        name: s.name,
        avatarEmoji: s.avatarEmoji,
        avatarColor: s.avatarColor,
        avatarUrl: s.avatarUrl,
        value: getValue(s),
        rank: i + 1,
      }));

  res.json({
    points: rank(students, s => s.totalPoints),
    time: rank(students, s => s.totalTimeMinutes ?? 0),
    tests: rank(students, s => testMap[s.id] ?? 0),
    audio: rank(students, s => audioMap[s.id] ?? 0),
    streak: rank(students, s => s.loginStreak ?? 0),
  });
});

export default router;
