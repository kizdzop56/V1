import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable, authTokensTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { generateToken, requireAuth, getUser } from "../lib/auth";
import { generateInviteCode } from "../lib/inviteCode";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email";

const router = Router();

const TEACHER_CODE = "422668";

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

const PUBLIC_USER_FIELDS = (u: typeof usersTable.$inferSelect) => ({
  id: u.id,
  username: u.username,
  name: u.name,
  role: u.role,
  age: u.age,
  dateOfBirth: u.dateOfBirth,
  knowledgeLevel: u.knowledgeLevel,
  email: u.email,
  emailVerified: u.emailVerified === "true",
  totalPoints: u.totalPoints,
  totalTimeMinutes: u.totalTimeMinutes,
  avatarEmoji: u.avatarEmoji,
  avatarColor: u.avatarColor,
  bio: u.bio,
  inviteCode: u.inviteCode,
  createdAt: u.createdAt,
});

// ── LOGIN ──────────────────────────────────────────────────────────────
router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Missing username or password" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // Backfill invite code if missing
  if (!user.inviteCode) {
    let code = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const [clash] = await db.select({ id: usersTable.id })
        .from(usersTable).where(eq(usersTable.inviteCode, code));
      if (!clash) break;
      code = generateInviteCode();
      attempts++;
    }
    await db.update(usersTable).set({ inviteCode: code }).where(eq(usersTable.id, user.id));
    user.inviteCode = code;
  }

  const token = generateToken({ userId: user.id, role: user.role });
  res.json({ token, user: PUBLIC_USER_FIELDS(user) });
});

// ── REGISTER ───────────────────────────────────────────────────────────
router.post("/auth/register", async (req, res) => {
  const { username, password, name, role, parentId, teacherCode, email } = req.body;

  if (!username || !password || !name || !role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (!["student", "parent", "teacher"].includes(role)) {
    res.status(400).json({ error: "Invalid role. Must be student, parent, or teacher." });
    return;
  }

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Введите корректный email-адрес" });
    return;
  }

  if (role === "teacher") {
    if (!teacherCode || teacherCode !== TEACHER_CODE) {
      res.status(403).json({ error: "Неверный код учителя" });
      return;
    }
  }

  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existingUser) {
    res.status(400).json({ error: "Этот псевдоним уже занят" });
    return;
  }

  const [existingEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (existingEmail) {
    res.status(400).json({ error: "Этот email уже зарегистрирован" });
    return;
  }

  // Generate unique invite code
  let inviteCode = generateInviteCode();
  let attempts = 0;
  while (attempts < 10) {
    const [clash] = await db.select({ id: usersTable.id })
      .from(usersTable).where(eq(usersTable.inviteCode, inviteCode));
    if (!clash) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const dbRole = role as "student" | "parent" | "teacher";

  const [user] = await db.insert(usersTable).values({
    username,
    passwordHash,
    name,
    role: dbRole,
    email: email.toLowerCase().trim(),
    emailVerified: "false",
    parentId: role === "student" && parentId ? parentId : null,
    totalPoints: 0,
    inviteCode,
  }).returning();

  // Send verification email (non-blocking)
  const verifyToken = makeToken();
  await db.insert(authTokensTable).values({
    userId: user.id,
    token: verifyToken,
    type: "email_verification",
    expiresAt: hoursFromNow(24),
  });

  sendVerificationEmail(user.email!, verifyToken).catch(() => {});

  const jwtToken = generateToken({ userId: user.id, role: user.role });
  res.status(201).json({ token: jwtToken, user: PUBLIC_USER_FIELDS(user) });
});

// ── VERIFY EMAIL ───────────────────────────────────────────────────────
router.get("/auth/verify-email", async (req, res) => {
  const { token } = req.query as { token?: string };
  if (!token) {
    res.status(400).json({ error: "Токен не указан" });
    return;
  }

  const [row] = await db.select().from(authTokensTable).where(
    and(
      eq(authTokensTable.token, token),
      eq(authTokensTable.type, "email_verification"),
      gt(authTokensTable.expiresAt, new Date()),
    )
  );

  if (!row) {
    res.status(400).json({ error: "Ссылка недействительна или истекла" });
    return;
  }
  if (row.usedAt) {
    res.status(400).json({ error: "Ссылка уже была использована" });
    return;
  }

  await db.update(authTokensTable).set({ usedAt: new Date() }).where(eq(authTokensTable.id, row.id));
  await db.update(usersTable).set({ emailVerified: "true" }).where(eq(usersTable.id, row.userId));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, row.userId));
  if (!user) {
    res.status(404).json({ error: "Пользователь не найден" });
    return;
  }

  const jwtToken = generateToken({ userId: user.id, role: user.role });
  res.json({ token: jwtToken, user: PUBLIC_USER_FIELDS(user), verified: true });
});

// ── RESEND VERIFICATION ────────────────────────────────────────────────
router.post("/auth/resend-verification", requireAuth, async (req, res) => {
  const { userId } = getUser(req);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || !user.email) {
    res.status(400).json({ error: "Email не найден" });
    return;
  }
  if (user.emailVerified === "true") {
    res.status(400).json({ error: "Email уже подтверждён" });
    return;
  }

  const verifyToken = makeToken();
  await db.insert(authTokensTable).values({
    userId: user.id,
    token: verifyToken,
    type: "email_verification",
    expiresAt: hoursFromNow(24),
  });

  sendVerificationEmail(user.email, verifyToken).catch(() => {});
  res.json({ ok: true });
});

// ── FORGOT PASSWORD ────────────────────────────────────────────────────
router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Введите email" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));

  // Always respond OK to avoid email enumeration
  if (!user) {
    res.json({ ok: true });
    return;
  }

  const resetToken = makeToken();
  await db.insert(authTokensTable).values({
    userId: user.id,
    token: resetToken,
    type: "password_reset",
    expiresAt: hoursFromNow(1),
  });

  sendPasswordResetEmail(user.email!, resetToken).catch(() => {});
  res.json({ ok: true });
});

// ── RESET PASSWORD ─────────────────────────────────────────────────────
router.post("/auth/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 6) {
    res.status(400).json({ error: "Некорректные данные" });
    return;
  }

  const [row] = await db.select().from(authTokensTable).where(
    and(
      eq(authTokensTable.token, token),
      eq(authTokensTable.type, "password_reset"),
      gt(authTokensTable.expiresAt, new Date()),
    )
  );

  if (!row) {
    res.status(400).json({ error: "Ссылка недействительна или истекла" });
    return;
  }
  if (row.usedAt) {
    res.status(400).json({ error: "Ссылка уже была использована" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, row.userId));
  await db.update(authTokensTable).set({ usedAt: new Date() }).where(eq(authTokensTable.id, row.id));

  res.json({ ok: true });
});

// ── ME ─────────────────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req, res) => {
  const { userId } = getUser(req);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(PUBLIC_USER_FIELDS(user));
});

export default router;
