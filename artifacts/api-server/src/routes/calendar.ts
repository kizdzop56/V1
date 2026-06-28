import { Router } from "express";
import { db } from "@workspace/db";
import {
  calendarSlotsTable, slotBookingsTable, usersTable, teacherStudentsTable,
} from "@workspace/db";
import { eq, and, inArray, gte } from "drizzle-orm";
import { requireAuth, getUser, isTeacher } from "../lib/auth";

const router = Router();

// ── GET /calendar/slots?date=YYYY-MM-DD ───────────────────────────────
// Teacher: own slots + booking info for selected date
// Student: connected teachers' slots with status for current user
router.get("/calendar/slots", requireAuth, async (req, res) => {
  const caller = getUser(req);
  const date = typeof req.query.date === "string" ? req.query.date : null;

  if (isTeacher(caller.role)) {
    const where = date
      ? and(eq(calendarSlotsTable.teacherId, caller.userId), eq(calendarSlotsTable.date, date))
      : eq(calendarSlotsTable.teacherId, caller.userId);

    const slots = await db.select().from(calendarSlotsTable).where(where);

    const slotIds = slots.map((s) => s.id);
    const bookings =
      slotIds.length > 0
        ? await db
            .select({
              id: slotBookingsTable.id,
              slotId: slotBookingsTable.slotId,
              studentId: slotBookingsTable.studentId,
              status: slotBookingsTable.status,
              note: slotBookingsTable.note,
              studentName: usersTable.name,
            })
            .from(slotBookingsTable)
            .leftJoin(usersTable, eq(usersTable.id, slotBookingsTable.studentId))
            .where(inArray(slotBookingsTable.slotId, slotIds))
        : [];

    return res.json(
      slots.map((slot) => ({
        ...slot,
        bookings: bookings.filter((b) => b.slotId === slot.id),
      })),
    );
  }

  // Student path
  const connections = await db
    .select({ teacherId: teacherStudentsTable.teacherId })
    .from(teacherStudentsTable)
    .where(
      and(
        eq(teacherStudentsTable.studentId, caller.userId),
        eq(teacherStudentsTable.status, "accepted"),
      ),
    );

  const teacherIds = connections.map((c) => c.teacherId);
  if (teacherIds.length === 0) return res.json([]);

  const today = new Date().toISOString().slice(0, 10);
  const slotWhere = date
    ? and(inArray(calendarSlotsTable.teacherId, teacherIds), eq(calendarSlotsTable.date, date))
    : and(inArray(calendarSlotsTable.teacherId, teacherIds), gte(calendarSlotsTable.date, today));

  const slots = await db
    .select({
      id: calendarSlotsTable.id,
      teacherId: calendarSlotsTable.teacherId,
      date: calendarSlotsTable.date,
      startTime: calendarSlotsTable.startTime,
      endTime: calendarSlotsTable.endTime,
      teacherName: usersTable.name,
    })
    .from(calendarSlotsTable)
    .leftJoin(usersTable, eq(usersTable.id, calendarSlotsTable.teacherId))
    .where(slotWhere);

  const slotIds = slots.map((s) => s.id);
  const bookings =
    slotIds.length > 0
      ? await db
          .select()
          .from(slotBookingsTable)
          .where(inArray(slotBookingsTable.slotId, slotIds))
      : [];

  return res.json(
    slots.map((slot) => {
      const slotBookings = bookings.filter((b) => b.slotId === slot.id);
      const confirmed = slotBookings.find((b) => b.status === "confirmed");
      const myBooking = slotBookings.find((b) => b.studentId === caller.userId);
      return {
        ...slot,
        status: confirmed
          ? confirmed.studentId === caller.userId
            ? "confirmed_me"
            : "unavailable"
          : myBooking
            ? "pending"
            : "available",
        myBookingId: myBooking?.id ?? null,
      };
    }),
  );
});

// ── POST /calendar/slots — teacher creates a slot ─────────────────────
router.post("/calendar/slots", requireAuth, async (req, res) => {
  const caller = getUser(req);
  if (!isTeacher(caller.role)) return res.status(403).json({ error: "Только учитель" });

  const { date, startTime, endTime } = req.body as {
    date: string; startTime: string; endTime: string;
  };
  if (!date || !startTime || !endTime)
    return res.status(400).json({ error: "Укажите дату и время" });
  if (endTime <= startTime)
    return res.status(400).json({ error: "Конец должен быть позже начала" });

  try {
    const [slot] = await db
      .insert(calendarSlotsTable)
      .values({ teacherId: caller.userId, date, startTime, endTime })
      .onConflictDoNothing()
      .returning();

    if (!slot) return res.status(409).json({ error: "Слот уже существует" });
    return res.status(201).json({ ...slot, bookings: [] });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── DELETE /calendar/slots/:id — teacher deletes a slot ───────────────
router.delete("/calendar/slots/:id", requireAuth, async (req, res) => {
  const caller = getUser(req);
  if (!isTeacher(caller.role)) return res.status(403).json({ error: "Только учитель" });

  await db
    .delete(calendarSlotsTable)
    .where(
      and(
        eq(calendarSlotsTable.id, Number(req.params.id)),
        eq(calendarSlotsTable.teacherId, caller.userId),
      ),
    );
  return res.json({ ok: true });
});

// ── POST /calendar/slots/:slotId/book — student books a slot ──────────
router.post("/calendar/slots/:slotId/book", requireAuth, async (req, res) => {
  const caller = getUser(req);
  if (caller.role !== "student") return res.status(403).json({ error: "Только ученик" });

  const slotId = Number(req.params.slotId);
  const { note } = req.body as { note?: string };

  const [slot] = await db
    .select()
    .from(calendarSlotsTable)
    .where(eq(calendarSlotsTable.id, slotId));
  if (!slot) return res.status(404).json({ error: "Слот не найден" });

  const existingBookings = await db
    .select()
    .from(slotBookingsTable)
    .where(eq(slotBookingsTable.slotId, slotId));

  if (existingBookings.find((b) => b.status === "confirmed"))
    return res.status(409).json({ error: "Слот уже занят" });

  try {
    const [booking] = await db
      .insert(slotBookingsTable)
      .values({ slotId, studentId: caller.userId, note: note ?? null })
      .onConflictDoNothing()
      .returning();

    if (!booking) return res.status(409).json({ error: "Вы уже записались на этот слот" });
    return res.status(201).json(booking);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── PATCH /calendar/bookings/:id — teacher confirms or rejects ─────────
router.patch("/calendar/bookings/:id", requireAuth, async (req, res) => {
  const caller = getUser(req);
  if (!isTeacher(caller.role)) return res.status(403).json({ error: "Только учитель" });

  const bookingId = Number(req.params.id);
  const { status } = req.body as { status: "confirmed" | "rejected" };
  if (!["confirmed", "rejected"].includes(status))
    return res.status(400).json({ error: "Неверный статус" });

  const [booking] = await db
    .select()
    .from(slotBookingsTable)
    .where(eq(slotBookingsTable.id, bookingId));
  if (!booking) return res.status(404).json({ error: "Запрос не найден" });

  // When confirming — reject all other pending bookings for same slot
  if (status === "confirmed") {
    await db
      .update(slotBookingsTable)
      .set({ status: "rejected" })
      .where(
        and(
          eq(slotBookingsTable.slotId, booking.slotId),
          eq(slotBookingsTable.status, "pending"),
        ),
      );
  }

  const [updated] = await db
    .update(slotBookingsTable)
    .set({ status })
    .where(eq(slotBookingsTable.id, bookingId))
    .returning();

  return res.json(updated);
});

// ── DELETE /calendar/bookings/:id — student cancels own booking ────────
router.delete("/calendar/bookings/:id", requireAuth, async (req, res) => {
  const caller = getUser(req);
  await db
    .delete(slotBookingsTable)
    .where(
      and(
        eq(slotBookingsTable.id, Number(req.params.id)),
        eq(slotBookingsTable.studentId, caller.userId),
      ),
    );
  return res.json({ ok: true });
});

// ── GET /calendar/bookings ─────────────────────────────────────────────
// Teacher: all pending booking requests for their slots
// Student: all own bookings (any status), sorted by date
router.get("/calendar/bookings", requireAuth, async (req, res) => {
  const caller = getUser(req);

  if (isTeacher(caller.role)) {
    const slots = await db
      .select({ id: calendarSlotsTable.id })
      .from(calendarSlotsTable)
      .where(eq(calendarSlotsTable.teacherId, caller.userId));

    const slotIds = slots.map((s) => s.id);
    if (slotIds.length === 0) return res.json([]);

    const bookings = await db
      .select({
        id: slotBookingsTable.id,
        slotId: slotBookingsTable.slotId,
        studentId: slotBookingsTable.studentId,
        status: slotBookingsTable.status,
        note: slotBookingsTable.note,
        createdAt: slotBookingsTable.createdAt,
        studentName: usersTable.name,
        date: calendarSlotsTable.date,
        startTime: calendarSlotsTable.startTime,
        endTime: calendarSlotsTable.endTime,
      })
      .from(slotBookingsTable)
      .leftJoin(usersTable, eq(usersTable.id, slotBookingsTable.studentId))
      .leftJoin(calendarSlotsTable, eq(calendarSlotsTable.id, slotBookingsTable.slotId))
      .where(and(inArray(slotBookingsTable.slotId, slotIds), eq(slotBookingsTable.status, "pending")));

    return res.json(bookings);
  }

  // Student: own bookings
  const bookings = await db
    .select({
      id: slotBookingsTable.id,
      slotId: slotBookingsTable.slotId,
      status: slotBookingsTable.status,
      note: slotBookingsTable.note,
      createdAt: slotBookingsTable.createdAt,
      teacherName: usersTable.name,
      date: calendarSlotsTable.date,
      startTime: calendarSlotsTable.startTime,
      endTime: calendarSlotsTable.endTime,
    })
    .from(slotBookingsTable)
    .leftJoin(calendarSlotsTable, eq(calendarSlotsTable.id, slotBookingsTable.slotId))
    .leftJoin(usersTable, eq(usersTable.id, calendarSlotsTable.teacherId))
    .where(eq(slotBookingsTable.studentId, caller.userId));

  return res.json(bookings);
});

export default router;
