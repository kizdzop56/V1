import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, RefreshControl, Modal, Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import authStorage from "@/utils/authStorage";

// ── API helper ────────────────────────────────────────────────────────
const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

async function apiFetch(path: string, options?: RequestInit) {
  const token = await authStorage.getItem("auth_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? ""}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────
type SlotBooking = {
  id: number; slotId: number; studentId: number;
  studentName: string | null; status: string; note: string | null;
};
type TeacherSlot = {
  id: number; teacherId: number; date: string;
  startTime: string; endTime: string; bookings: SlotBooking[];
};
type StudentSlot = {
  id: number; teacherId: number; teacherName: string | null;
  date: string; startTime: string; endTime: string;
  status: "available" | "pending" | "confirmed_me" | "unavailable";
  myBookingId: number | null;
};
type BookingRow = {
  id: number; slotId: number; status: string; note: string | null;
  createdAt: string; date: string | null; startTime: string | null; endTime: string | null;
  studentName?: string | null; teacherName?: string | null;
};

// ── Date / time helpers ───────────────────────────────────────────────
const DAY_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTH_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function todayStr() { return new Date().toISOString().slice(0, 10); }

function getDates(count = 35) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}
function dateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return { day: DAY_SHORT[d.getDay()], num: d.getDate(), month: MONTH_SHORT[d.getMonth()] };
}
function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

// Half-hour intervals 07:00 – 21:30
const TIME_SLOTS = Array.from({ length: 30 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const STATUS_CFG = {
  available:    { label: "Свободно",      color: "#10b981", icon: "circle"       as const },
  pending:      { label: "Ожидает",       color: "#f59e0b", icon: "clock"        as const },
  confirmed_me: { label: "Записан",       color: "#6366f1", icon: "check-circle" as const },
  unavailable:  { label: "Занято",        color: "#ef4444", icon: "x-circle"     as const },
};
const BOOKING_CFG = {
  pending:   { label: "Ожидает",       color: "#f59e0b", icon: "clock"        as const },
  confirmed: { label: "Подтверждено",  color: "#10b981", icon: "check-circle" as const },
  rejected:  { label: "Отклонено",     color: "#ef4444", icon: "x-circle"     as const },
};

const DATES = getDates(35);

// ── Component ─────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isTeacherRole = user?.role === "teacher" || user?.role === "admin";

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [slots, setSlots] = useState<TeacherSlot[] | StudentSlot[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "requests">("schedule");

  // Add-slot modal (teacher)
  const [showAdd, setShowAdd] = useState(false);
  const [addStart, setAddStart] = useState("09:00");
  const [addEnd, setAddEnd] = useState("10:00");
  const [saving, setSaving] = useState(false);

  // Book-slot modal (student)
  const [bookSlot, setBookSlot] = useState<StudentSlot | null>(null);
  const [bookNote, setBookNote] = useState("");
  const [booking, setBooking] = useState(false);

  // ── Data loading ────────────────────────────────────────────────────
  const loadSlots = useCallback(async (date: string) => {
    const data = await apiFetch(`/api/calendar/slots?date=${date}`).catch(() => []);
    setSlots(data);
  }, []);

  const loadBookings = useCallback(async () => {
    const data = await apiFetch("/api/calendar/bookings").catch(() => []);
    setBookings(data);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSlots(selectedDate), loadBookings()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadSlots(selectedDate); }, [selectedDate]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadSlots(selectedDate), loadBookings()]);
    setRefreshing(false);
  }, [selectedDate, loadSlots, loadBookings]);

  // ── Actions ─────────────────────────────────────────────────────────
  const handleAddSlot = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await apiFetch("/api/calendar/slots", {
        method: "POST",
        body: JSON.stringify({ date: selectedDate, startTime: addStart, endTime: addEnd }),
      });
      setShowAdd(false);
      await loadSlots(selectedDate);
    } catch (e: any) { Alert.alert("Ошибка", e.message); }
    finally { setSaving(false); }
  };

  const handleDeleteSlot = (slotId: number) => {
    Alert.alert("Удалить слот?", "Все запросы на этот слот также будут отменены.", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить", style: "destructive", onPress: async () => {
          await apiFetch(`/api/calendar/slots/${slotId}`, { method: "DELETE" }).catch(() => {});
          await loadSlots(selectedDate);
        },
      },
    ]);
  };

  const handleBookSlot = async () => {
    if (!bookSlot || booking) return;
    setBooking(true);
    try {
      await apiFetch(`/api/calendar/slots/${bookSlot.id}/book`, {
        method: "POST",
        body: JSON.stringify({ note: bookNote.trim() || undefined }),
      });
      setBookSlot(null); setBookNote("");
      await Promise.all([loadSlots(selectedDate), loadBookings()]);
    } catch (e: any) { Alert.alert("Ошибка", e.message); }
    finally { setBooking(false); }
  };

  const handleCancelBooking = async (bookingId: number) => {
    await apiFetch(`/api/calendar/bookings/${bookingId}`, { method: "DELETE" }).catch(() => {});
    await Promise.all([loadSlots(selectedDate), loadBookings()]);
  };

  const handleRespond = async (bookingId: number, status: "confirmed" | "rejected") => {
    try {
      await apiFetch(`/api/calendar/bookings/${bookingId}`, {
        method: "PATCH", body: JSON.stringify({ status }),
      });
      await Promise.all([loadSlots(selectedDate), loadBookings()]);
    } catch (e: any) { Alert.alert("Ошибка", e.message); }
  };

  // ── Styles ──────────────────────────────────────────────────────────
  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row", alignItems: "center",
      paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 12,
    },
    headerTitle: { flex: 1, fontSize: 22, fontWeight: "800", color: colors.foreground },

    tabRow: {
      flexDirection: "row", marginHorizontal: 20, marginBottom: 2,
      backgroundColor: colors.muted, borderRadius: 14, padding: 4,
    },
    tab: {
      flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
      flexDirection: "row", justifyContent: "center", gap: 6,
    },
    tabActive: { backgroundColor: colors.card },
    tabText: { fontSize: 13, fontWeight: "700", color: colors.mutedForeground },
    tabTextActive: { color: colors.primary },
    badge: {
      backgroundColor: colors.primary, borderRadius: 8,
      minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 4,
    },
    badgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

    datePicker: { paddingHorizontal: 16, paddingVertical: 10 },
    dateChip: {
      alignItems: "center", paddingHorizontal: 10, paddingVertical: 8,
      borderRadius: 14, marginHorizontal: 4, minWidth: 52, backgroundColor: colors.muted,
    },
    dateChipActive: { backgroundColor: colors.primary },
    dc_day: { fontSize: 10, fontWeight: "600", color: colors.mutedForeground, marginBottom: 2 },
    dc_dayA: { color: "#fff" },
    dc_num: { fontSize: 18, fontWeight: "800", color: colors.foreground },
    dc_numA: { color: "#fff" },
    dc_mon: { fontSize: 9, color: colors.mutedForeground },
    dc_monA: { color: "#ffffffcc" },

    scroll: { padding: 20, paddingBottom: 120 },
    emptyBox: { alignItems: "center", paddingVertical: 48, gap: 12 },
    emptyEmoji: { fontSize: 42 },
    emptyText: { fontSize: 15, color: colors.mutedForeground, textAlign: "center", lineHeight: 22 },

    slotCard: {
      borderRadius: 16, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.card, marginBottom: 12, overflow: "hidden",
    },
    slotTop: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
    slotDot: { width: 12, height: 12, borderRadius: 6 },
    slotTime: { flex: 1, fontSize: 17, fontWeight: "700", color: colors.foreground },
    slotSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 1 },

    bookingRow: {
      flexDirection: "row", alignItems: "center", gap: 10,
      paddingHorizontal: 14, paddingVertical: 11,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    bookingName: { fontWeight: "700", fontSize: 14, color: colors.foreground },
    bookingNote: { fontSize: 12, color: colors.mutedForeground, marginTop: 2, fontStyle: "italic" },

    btnRow: { flexDirection: "row", gap: 8 },
    btnConfirm: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: "#10b981" },
    btnReject:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: "#ef4444" },
    btnCancel:  {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.muted,
    },
    btnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
    btnTextGray: { fontSize: 13, fontWeight: "700", color: colors.mutedForeground },

    addBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
      borderRadius: 16, borderWidth: 2, borderStyle: "dashed", borderColor: colors.primary,
      padding: 16, marginTop: 4,
    },
    addBtnText: { fontSize: 15, fontWeight: "700", color: colors.primary },

    statusLabel: { fontSize: 12, fontWeight: "700" },

    // Modals
    overlay: { flex: 1, backgroundColor: "#00000070", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingTop: 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 24,
    },
    handle: {
      width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
      alignSelf: "center", marginBottom: 18,
    },
    sheetTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground, marginBottom: 18 },
    timeRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
    timePicker: { flex: 1 },
    timeLabel: { fontSize: 11, fontWeight: "700", color: colors.mutedForeground, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
    timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    tChip: {
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
      backgroundColor: colors.muted, borderWidth: 1.5, borderColor: "transparent",
    },
    tChipA: { borderColor: colors.primary, backgroundColor: colors.primary + "18" },
    tChipText: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground },
    tChipTextA: { color: colors.primary, fontWeight: "700" },
    primaryBtn: {
      backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 15,
      alignItems: "center", marginTop: 12,
    },
    primaryBtnText: { fontSize: 16, fontWeight: "700", color: colors.primaryForeground },
    noteInput: {
      borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
      padding: 12, fontSize: 14, color: colors.foreground,
      backgroundColor: colors.muted, minHeight: 64, textAlignVertical: "top", marginBottom: 4,
    },

    // Request / booking cards
    reqCard: {
      borderRadius: 16, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.card, marginBottom: 12, padding: 14, gap: 10,
    },
    reqTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    reqAvatar: {
      width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center",
    },
    reqName: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.foreground },
    reqTime: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    reqNote: { fontSize: 13, color: colors.mutedForeground, fontStyle: "italic" },
  });

  // ── Date strip ──────────────────────────────────────────────────────
  const renderDatePicker = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.datePicker}>
      {DATES.map((date) => {
        const { day, num, month } = dateLabel(date);
        const active = date === selectedDate;
        return (
          <TouchableOpacity
            key={date} style={[s.dateChip, active && s.dateChipActive]}
            onPress={() => setSelectedDate(date)}
          >
            <Text style={[s.dc_day, active && s.dc_dayA]}>{day}</Text>
            <Text style={[s.dc_num, active && s.dc_numA]}>{num}</Text>
            <Text style={[s.dc_mon, active && s.dc_monA]}>{month}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // ── Teacher: schedule tab ───────────────────────────────────────────
  const renderTeacherSchedule = () => {
    const daySlots = slots as TeacherSlot[];
    return (
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {daySlots.length === 0 && (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📅</Text>
            <Text style={s.emptyText}>Нет слотов на {formatDate(selectedDate)}{"\n"}Добавьте время для занятий</Text>
          </View>
        )}
        {daySlots.map((slot) => {
          const pending = slot.bookings.filter((b) => b.status === "pending");
          const confirmed = slot.bookings.find((b) => b.status === "confirmed");
          const isBusy = !!confirmed;
          return (
            <View key={slot.id} style={[s.slotCard, { borderLeftWidth: 4, borderLeftColor: isBusy ? "#ef4444" : "#10b981" }]}>
              <View style={s.slotTop}>
                <View style={[s.slotDot, { backgroundColor: isBusy ? "#ef4444" : "#10b981" }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.slotTime}>{slot.startTime} – {slot.endTime}</Text>
                  <Text style={s.slotSub}>{isBusy ? "Занято" : "Свободно"}</Text>
                </View>
                {pending.length > 0 && (
                  <View style={s.badge}><Text style={s.badgeText}>{pending.length}</Text></View>
                )}
                {!isBusy && (
                  <TouchableOpacity onPress={() => handleDeleteSlot(slot.id)} style={{ padding: 4 }}>
                    <Feather name="trash-2" size={17} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>

              {confirmed && (
                <View style={s.bookingRow}>
                  <Feather name="check-circle" size={16} color="#10b981" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.bookingName}>{confirmed.studentName ?? "Ученик"}</Text>
                    {confirmed.note ? <Text style={s.bookingNote}>«{confirmed.note}»</Text> : null}
                  </View>
                  <Text style={[s.statusLabel, { color: "#10b981" }]}>Подтверждено</Text>
                </View>
              )}

              {pending.map((b) => (
                <View key={b.id} style={s.bookingRow}>
                  <Feather name="user" size={16} color={colors.mutedForeground} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.bookingName}>{b.studentName ?? "Ученик"}</Text>
                    {b.note ? <Text style={s.bookingNote}>«{b.note}»</Text> : null}
                  </View>
                  <View style={s.btnRow}>
                    <TouchableOpacity style={s.btnConfirm} onPress={() => handleRespond(b.id, "confirmed")}>
                      <Text style={s.btnText}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.btnReject} onPress={() => handleRespond(b.id, "rejected")}>
                      <Text style={s.btnText}>✗</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Feather name="plus-circle" size={18} color={colors.primary} />
          <Text style={s.addBtnText}>Добавить слот</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ── Teacher: requests tab ───────────────────────────────────────────
  const renderTeacherRequests = () => (
    <ScrollView
      contentContainerStyle={s.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      {bookings.length === 0 && (
        <View style={s.emptyBox}>
          <Text style={s.emptyEmoji}>🎉</Text>
          <Text style={s.emptyText}>Нет новых запросов</Text>
        </View>
      )}
      {bookings.map((b) => (
        <View key={b.id} style={s.reqCard}>
          <View style={s.reqTop}>
            <View style={[s.reqAvatar, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="user" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.reqName}>{b.studentName ?? "Ученик"}</Text>
              <Text style={s.reqTime}>{formatDate(b.date)}, {b.startTime} – {b.endTime}</Text>
            </View>
          </View>
          {b.note ? <Text style={s.reqNote}>«{b.note}»</Text> : null}
          <View style={s.btnRow}>
            <TouchableOpacity style={[s.btnConfirm, { flex: 1, alignItems: "center" }]} onPress={() => handleRespond(b.id, "confirmed")}>
              <Text style={s.btnText}>Подтвердить</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btnReject, { flex: 1, alignItems: "center" }]} onPress={() => handleRespond(b.id, "rejected")}>
              <Text style={s.btnText}>Отклонить</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  // ── Student: schedule tab ───────────────────────────────────────────
  const renderStudentSchedule = () => {
    const daySlots = slots as StudentSlot[];
    return (
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {daySlots.length === 0 && (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📅</Text>
            <Text style={s.emptyText}>Нет доступных слотов на {formatDate(selectedDate)}</Text>
          </View>
        )}
        {daySlots.map((slot) => {
          const meta = STATUS_CFG[slot.status];
          return (
            <View key={slot.id} style={[s.slotCard, { borderLeftWidth: 4, borderLeftColor: meta.color }]}>
              <View style={s.slotTop}>
                <View style={[s.slotDot, { backgroundColor: meta.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.slotTime}>{slot.startTime} – {slot.endTime}</Text>
                  {slot.teacherName && <Text style={s.slotSub}>{slot.teacherName}</Text>}
                </View>
                <Text style={[s.statusLabel, { color: meta.color }]}>{meta.label}</Text>
              </View>

              {slot.status === "available" && (
                <TouchableOpacity
                  style={[s.btnConfirm, { margin: 12, marginTop: 0, alignItems: "center" }]}
                  onPress={() => setBookSlot(slot)}
                >
                  <Text style={s.btnText}>Записаться</Text>
                </TouchableOpacity>
              )}

              {slot.status === "pending" && slot.myBookingId && (
                <TouchableOpacity
                  style={[s.btnCancel, { margin: 12, marginTop: 0, alignItems: "center" }]}
                  onPress={() => handleCancelBooking(slot.myBookingId!)}
                >
                  <Text style={s.btnTextGray}>Отменить запрос</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // ── Student: my bookings tab ────────────────────────────────────────
  const renderStudentBookings = () => {
    const sorted = [...bookings].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
    return (
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {sorted.length === 0 && (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📝</Text>
            <Text style={s.emptyText}>Нет записей{"\n"}Перейдите в расписание и запишитесь к учителю</Text>
          </View>
        )}
        {sorted.map((b) => {
          const cfg = BOOKING_CFG[b.status as keyof typeof BOOKING_CFG];
          return (
            <View key={b.id} style={[s.reqCard, { borderLeftWidth: 4, borderLeftColor: cfg?.color ?? colors.border }]}>
              <View style={s.reqTop}>
                <View style={[s.reqAvatar, { backgroundColor: (cfg?.color ?? colors.primary) + "20" }]}>
                  <Feather name={cfg?.icon ?? "calendar"} size={18} color={cfg?.color ?? colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reqName}>{b.teacherName ?? "Учитель"}</Text>
                  <Text style={s.reqTime}>{formatDate(b.date)}, {b.startTime} – {b.endTime}</Text>
                </View>
                <Text style={[s.statusLabel, { color: cfg?.color ?? colors.mutedForeground }]}>
                  {cfg?.label ?? b.status}
                </Text>
              </View>
              {b.note ? <Text style={s.reqNote}>«{b.note}»</Text> : null}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // ── Add-slot modal (teacher) ────────────────────────────────────────
  const renderAddSlotModal = () => (
    <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowAdd(false)}>
        <TouchableOpacity style={s.sheet} activeOpacity={1}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>Добавить слот — {formatDate(selectedDate)}</Text>
          <View style={s.timeRow}>
            <View style={s.timePicker}>
              <Text style={s.timeLabel}>Начало</Text>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                <View style={s.timeGrid}>
                  {TIME_SLOTS.map((t) => (
                    <TouchableOpacity
                      key={t} style={[s.tChip, addStart === t && s.tChipA]}
                      onPress={() => { setAddStart(t); if (addEnd <= t) setAddEnd(TIME_SLOTS[TIME_SLOTS.indexOf(t) + 1] ?? t); }}
                    >
                      <Text style={[s.tChipText, addStart === t && s.tChipTextA]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <View style={s.timePicker}>
              <Text style={s.timeLabel}>Конец</Text>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                <View style={s.timeGrid}>
                  {TIME_SLOTS.filter((t) => t > addStart).map((t) => (
                    <TouchableOpacity
                      key={t} style={[s.tChip, addEnd === t && s.tChipA]}
                      onPress={() => setAddEnd(t)}
                    >
                      <Text style={[s.tChipText, addEnd === t && s.tChipTextA]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
          <TouchableOpacity style={[s.primaryBtn, addEnd <= addStart && { opacity: 0.4 }]} onPress={handleAddSlot} disabled={saving || addEnd <= addStart}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.primaryBtnText}>Добавить {addStart} – {addEnd}</Text>
            }
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  // ── Book-slot modal (student) ───────────────────────────────────────
  const renderBookModal = () => (
    <Modal visible={!!bookSlot} transparent animationType="slide" onRequestClose={() => setBookSlot(null)}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setBookSlot(null)}>
        <TouchableOpacity style={s.sheet} activeOpacity={1}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>
            Запись на {formatDate(bookSlot?.date ?? null)}{"\n"}{bookSlot?.startTime} – {bookSlot?.endTime}
          </Text>
          <Text style={[s.timeLabel, { marginBottom: 8 }]}>Сообщение учителю (необязательно)</Text>
          <TextInput
            style={s.noteInput}
            placeholder="Например: хочу разобрать Present Perfect..."
            placeholderTextColor={colors.mutedForeground}
            value={bookNote} onChangeText={setBookNote}
            multiline returnKeyType="done"
          />
          <TouchableOpacity style={s.primaryBtn} onPress={handleBookSlot} disabled={booking}>
            {booking ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Отправить запрос</Text>}
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const pendingCount = isTeacherRole ? bookings.length : 0;

  return (
    <View style={s.container}>
      {renderAddSlotModal()}
      {renderBookModal()}

      <View style={s.header}>
        <Text style={s.headerTitle}>Календарь</Text>
      </View>

      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, activeTab === "schedule" && s.tabActive]} onPress={() => setActiveTab("schedule")}>
          <Feather name="calendar" size={14} color={activeTab === "schedule" ? colors.primary : colors.mutedForeground} />
          <Text style={[s.tabText, activeTab === "schedule" && s.tabTextActive]}>Расписание</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab === "requests" && s.tabActive]} onPress={() => setActiveTab("requests")}>
          <Feather name={isTeacherRole ? "inbox" : "list"} size={14} color={activeTab === "requests" ? colors.primary : colors.mutedForeground} />
          <Text style={[s.tabText, activeTab === "requests" && s.tabTextActive]}>
            {isTeacherRole ? "Запросы" : "Мои записи"}
          </Text>
          {pendingCount > 0 && <View style={s.badge}><Text style={s.badgeText}>{pendingCount}</Text></View>}
        </TouchableOpacity>
      </View>

      {activeTab === "schedule" && renderDatePicker()}

      {loading
        ? <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} size="large" />
        : activeTab === "schedule"
          ? isTeacherRole ? renderTeacherSchedule() : renderStudentSchedule()
          : isTeacherRole ? renderTeacherRequests() : renderStudentBookings()
      }
    </View>
  );
}
