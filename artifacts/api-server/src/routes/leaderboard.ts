import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, submissionsTable, assignmentsTable, friendshipsTable,
} from "@workspace/db";
import { eq, desc, count, avg, and, or } from "drizzle-orm";
import { requireAuth, getUser } from "../lib/auth";

const router = Router();

function calcAgeFromDOB(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

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
    return { ...s, completedAssignments: result?.count || 0 };
  }));

  res.json(withCounts.map((s, i) => ({ ...s, rank: i + 1 })));
});

router.get("/leaderboard/categories", requireAuth, async (req, res) => {
  const caller = getUser(req);
  const scope = (req.query["scope"] as string) || "all";
  const ageMin = req.query["ageMin"] !== undefined ? Number(req.query["ageMin"]) : null;
  const ageMax = req.query["ageMax"] !== undefined ? Number(req.query["ageMax"]) : null;

  let students = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    avatarEmoji: usersTable.avatarEmoji,
    avatarColor: usersTable.avatarColor,
    avatarUrl: usersTable.avatarUrl,
    totalPoints: usersTable.totalPoints,
    totalTimeMinutes: usersTable.totalTimeMinutes,
    loginStreak: usersTable.loginStreak,
    age: usersTable.age,
    dateOfBirth: usersTable.dateOfBirth,
  }).from(usersTable).where(eq(usersTable.role, "student"));

  if (scope === "friends") {
    const rows = await db.select({
      requesterId: friendshipsTable.requesterId,
      addresseeId: friendshipsTable.addresseeId,
    }).from(friendshipsTable).where(
      and(
        or(
          eq(friendshipsTable.requesterId, caller.userId),
          eq(friendshipsTable.addresseeId, caller.userId),
        ),
        eq(friendshipsTable.status, "accepted"),
      )
    );
    const friendIds = new Set<number>(rows.map(r =>
      r.requesterId === caller.userId ? r.addresseeId : r.requesterId
    ));
    friendIds.add(caller.userId);
    students = students.filter(s => friendIds.has(s.id));
  }

  if (ageMin !== null || ageMax !== null) {
    students = students.filter(s => {
      const age = calcAgeFromDOB(s.dateOfBirth) ?? s.age;
      if (age === null) return false;
      if (ageMin !== null && age < ageMin) return false;
      if (ageMax !== null && age > ageMax) return false;
      return true;
    });
  }

  const studentIds = students.map(s => s.id);

  const [testScoresRaw, audioScoresRaw] = studentIds.length === 0
    ? [[], []]
    : await Promise.all([
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

  type Entry = {
    userId: number; name: string;
    avatarEmoji: string | null; avatarColor: string | null; avatarUrl: string | null;
    value: number; rank: number;
  };

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
    points:  rank(students, s => s.totalPoints),
    time:    rank(students, s => s.totalTimeMinutes ?? 0),
    tests:   rank(students, s => testMap[s.id] ?? 0),
    audio:   rank(students, s => audioMap[s.id] ?? 0),
    streak:  rank(students, s => s.loginStreak ?? 0),
  });
});

export default router;
