import { Router } from "express";
import { db } from "@workspace/db";
import { assignmentsTable, questionsTable, assignedTasksTable, submissionsTable, submissionAnswersTable, usersTable, teacherStudentsTable } from "@workspace/db";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { requireAuth, getUser, requireRole, isTeacher } from "../lib/auth";

const router = Router();

// ── List all assignments ──────────────────────────────────────────────
router.get("/assignments", requireAuth, async (req, res) => {
  const { type, ageMin, ageMax } = req.query;

  const conditions: any[] = [];
  if (type) conditions.push(eq(assignmentsTable.type, type as any));
  if (ageMin) conditions.push(lte(assignmentsTable.ageMin, Number(ageMin)));
  if (ageMax) conditions.push(gte(assignmentsTable.ageMax, Number(ageMax)));

  const assignments = conditions.length > 0
    ? await db.select().from(assignmentsTable).where(and(...conditions))
    : await db.select().from(assignmentsTable);

  res.json(assignments);
});

// ── Assignments assigned to me (student) ─────────────────────────────
router.get("/assignments/my-tasks", requireAuth, async (req, res) => {
  const caller = getUser(req);

  const tasks = await db.select({
    assignedTaskId: assignedTasksTable.id,
    assignedAt: assignedTasksTable.assignedAt,
    teacherId: assignedTasksTable.teacherId,
    teacherName: usersTable.name,
    assignmentId: assignmentsTable.id,
    title: assignmentsTable.title,
    description: assignmentsTable.description,
    type: assignmentsTable.type,
    points: assignmentsTable.points,
    ageMin: assignmentsTable.ageMin,
    ageMax: assignmentsTable.ageMax,
    content: assignmentsTable.content,
    mediaUrl: assignmentsTable.mediaUrl,
    createdAt: assignmentsTable.createdAt,
  })
    .from(assignedTasksTable)
    .leftJoin(assignmentsTable, eq(assignedTasksTable.assignmentId, assignmentsTable.id))
    .leftJoin(usersTable, eq(assignedTasksTable.teacherId, usersTable.id))
    .where(eq(assignedTasksTable.studentId, caller.userId));

  res.json(tasks);
});

// ── Teacher: get their assigned tasks + results ───────────────────────
router.get("/assignments/teacher-results", requireAuth, async (req, res) => {
  const caller = getUser(req);
  if (!isTeacher(caller.role)) { res.status(403).json({ error: "Forbidden" }); return; }

  const tasks = await db.select({
    assignedTaskId: assignedTasksTable.id,
    assignedAt: assignedTasksTable.assignedAt,
    studentId: assignedTasksTable.studentId,
    studentName: usersTable.name,
    studentAvatarEmoji: usersTable.avatarEmoji,
    studentAvatarColor: usersTable.avatarColor,
    assignmentId: assignmentsTable.id,
    assignmentTitle: assignmentsTable.title,
    assignmentType: assignmentsTable.type,
    assignmentPoints: assignmentsTable.points,
  })
    .from(assignedTasksTable)
    .leftJoin(assignmentsTable, eq(assignedTasksTable.assignmentId, assignmentsTable.id))
    .leftJoin(usersTable, eq(assignedTasksTable.studentId, usersTable.id))
    .where(eq(assignedTasksTable.teacherId, caller.userId));

  // For each task, find if the student has submitted it
  const withSubmissions = await Promise.all(tasks.map(async (task) => {
    const [submission] = await db.select({
      id: submissionsTable.id,
      score: submissionsTable.score,
      correctCount: submissionsTable.correctCount,
      totalQuestions: submissionsTable.totalQuestions,
      pointsEarned: submissionsTable.pointsEarned,
      submittedAt: submissionsTable.submittedAt,
    })
      .from(submissionsTable)
      .where(and(
        eq(submissionsTable.studentId, task.studentId!),
        eq(submissionsTable.assignmentId, task.assignmentId!),
      ))
      .orderBy(submissionsTable.submittedAt)
      .limit(1);

    let answers: any[] = [];
    if (submission) {
      answers = await db.select()
        .from(submissionAnswersTable)
        .where(eq(submissionAnswersTable.submissionId, submission.id));
    }

    return { ...task, submission: submission ?? null, answers };
  }));

  res.json(withSubmissions);
});

// ── Create assignment (teacher or admin) ──────────────────────────────
router.post("/assignments", requireAuth, async (req, res) => {
  const caller = getUser(req);
  if (!isTeacher(caller.role) && caller.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const { title, description, type, ageMin, ageMax, points, mediaUrl, content, questions } = req.body;

  const [assignment] = await db.insert(assignmentsTable).values({
    title,
    description,
    type,
    source: "teacher_created",
    createdBy: caller.userId,
    ageMin: ageMin || 5,
    ageMax: ageMax || 18,
    points: points || 10,
    mediaUrl,
    content,
  }).returning();

  if (questions && questions.length > 0) {
    await db.insert(questionsTable).values(
      questions.map((q: any, i: number) => ({
        assignmentId: assignment.id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        orderIndex: q.orderIndex ?? i,
      }))
    );
  }

  res.status(201).json(assignment);
});

// ── Get assignment detail ─────────────────────────────────────────────
router.get("/assignments/:id", requireAuth, async (req, res) => {
  const id = Number(req.params["id"]);
  const caller = getUser(req);

  const [assignment] = await db.select().from(assignmentsTable).where(eq(assignmentsTable.id, id));
  if (!assignment) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }

  const questions = await db.select().from(questionsTable)
    .where(eq(questionsTable.assignmentId, id))
    .orderBy(questionsTable.orderIndex);

  const canSeeAnswers = isTeacher(caller.role) || caller.role === "admin";

  res.json({
    ...assignment,
    questions: questions.map(q => ({
      id: q.id,
      text: q.text,
      options: q.options,
      correctAnswer: canSeeAnswers ? q.correctAnswer : null,
      orderIndex: q.orderIndex,
    })),
    content: assignment.content,
  });
});

// ── Assign assignment to students (teacher) ───────────────────────────
router.post("/assignments/:id/assign", requireAuth, async (req, res) => {
  const caller = getUser(req);
  if (!isTeacher(caller.role)) { res.status(403).json({ error: "Forbidden" }); return; }

  const assignmentId = Number(req.params["id"]);
  const { studentIds } = req.body as { studentIds: number[] };

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    res.status(400).json({ error: "studentIds required" }); return;
  }

  const [assignment] = await db.select({ id: assignmentsTable.id })
    .from(assignmentsTable).where(eq(assignmentsTable.id, assignmentId));
  if (!assignment) { res.status(404).json({ error: "Assignment not found" }); return; }

  // Verify teacher has accepted connection with each student
  const accepted = await db.select({ studentId: teacherStudentsTable.studentId })
    .from(teacherStudentsTable)
    .where(and(
      eq(teacherStudentsTable.teacherId, caller.userId),
      eq(teacherStudentsTable.status, "accepted"),
      inArray(teacherStudentsTable.studentId, studentIds),
    ));

  const validStudentIds = accepted.map((r) => r.studentId);
  if (validStudentIds.length === 0) {
    res.status(400).json({ error: "Нет принятых учеников из списка" }); return;
  }

  // Remove existing assignments to avoid duplicates
  await db.delete(assignedTasksTable).where(and(
    eq(assignedTasksTable.assignmentId, assignmentId),
    eq(assignedTasksTable.teacherId, caller.userId),
    inArray(assignedTasksTable.studentId, validStudentIds),
  ));

  await db.insert(assignedTasksTable).values(
    validStudentIds.map((sid) => ({
      assignmentId,
      studentId: sid,
      teacherId: caller.userId,
    }))
  );

  res.json({ ok: true, assigned: validStudentIds.length });
});

// ── Patch / delete assignment (teacher or admin who owns it) ──────────
router.patch("/assignments/:id", requireAuth, async (req, res) => {
  const caller = getUser(req);
  if (!isTeacher(caller.role) && caller.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const id = Number(req.params["id"]);
  const { title, description, ageMin, ageMax, points, mediaUrl, content } = req.body;

  const [updated] = await db.update(assignmentsTable)
    .set({ title, description, ageMin, ageMax, points, mediaUrl, content, updatedAt: new Date() })
    .where(eq(assignmentsTable.id, id))
    .returning();

  res.json(updated);
});

router.delete("/assignments/:id", requireAuth, async (req, res) => {
  const caller = getUser(req);
  if (!isTeacher(caller.role) && caller.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  await db.delete(assignmentsTable).where(eq(assignmentsTable.id, Number(req.params["id"])));
  res.status(204).send();
});

export default router;
