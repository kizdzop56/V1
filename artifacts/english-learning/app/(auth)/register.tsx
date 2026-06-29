import React, { useState, useMemo, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform, KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth, LEVEL_META } from "@/contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import authStorage from "@/utils/authStorage";

type Role = "student" | "parent" | "teacher";
type Step = "role" | "details" | "dob";

const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель",
  "Май", "Июнь", "Июль", "Август",
  "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const CURRENT_YEAR = new Date().getFullYear();
// Extend range: allow 5 to 25 years old (2000 to CURRENT_YEAR-5)
const YEARS = Array.from({ length: CURRENT_YEAR - 2000 - 4 }, (_, i) => CURRENT_YEAR - 5 - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function calculateAge(day: number, month: number, year: number): number {
  const today = new Date();
  const dob = new Date(year, month, day);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function getLevel(age: number) {
  if (age <= 6) return "starter";
  if (age <= 9) return "beginner";
  if (age <= 12) return "elementary";
  if (age <= 15) return "intermediate";
  return "upper_intermediate";
}

// Simple drum-roll picker — works correctly on both web and mobile
interface DrumPickerProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  label: string;
  width: number;
  colors: ReturnType<typeof useColors>;
}

function DrumPicker({ items, selectedIndex, onSelect, label, width, colors }: DrumPickerProps) {
  const ITEM_H = 46;
  const scrollRef = useRef<ScrollView>(null);
  const [localIdx, setLocalIdx] = useState(selectedIndex);

  const handleScrollEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    setLocalIdx(clamped);
    onSelect(clamped);
  };

  return (
    <View style={{ width, alignItems: "center" }}>
      <View style={{
        width, height: ITEM_H * 3, overflow: "hidden",
        borderRadius: 14, backgroundColor: colors.card,
        borderWidth: 1.5, borderColor: colors.border,
      }}>
        {/* Selection highlight */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { justifyContent: "center" }]}>
          <View style={{
            height: ITEM_H,
            borderTopWidth: 2, borderBottomWidth: 2,
            borderColor: colors.primary + "50",
            backgroundColor: colors.primary + "08",
          }} />
        </View>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: ITEM_H }}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          contentOffset={{ x: 0, y: selectedIndex * ITEM_H }}
        >
          {items.map((item, i) => {
            const isSelected = i === localIdx;
            return (
              <TouchableOpacity
                key={i}
                style={{ height: ITEM_H, justifyContent: "center", alignItems: "center" }}
                onPress={() => {
                  setLocalIdx(i);
                  onSelect(i);
                  scrollRef.current?.scrollTo({ y: i * ITEM_H, animated: true });
                }}
              >
                <Text style={{
                  fontSize: isSelected ? 17 : 14,
                  fontWeight: isSelected ? "800" : "400",
                  color: isSelected ? colors.primary : colors.mutedForeground,
                  letterSpacing: isSelected ? -0.3 : 0,
                }}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      {/* Label clearly below picker */}
      <Text style={{
        fontSize: 11, fontWeight: "700",
        color: colors.mutedForeground,
        textTransform: "uppercase",
        marginTop: 6, letterSpacing: 0.5,
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function RegisterScreen() {
  const colors = useColors();
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dayIdx, setDayIdx] = useState(0);
  const [monthIdx, setMonthIdx] = useState(0);
  const [yearIdx, setYearIdx] = useState(0);

  const selectedDay = DAYS[dayIdx] ?? 1;
  const selectedMonth = monthIdx;
  const selectedYear = YEARS[yearIdx] ?? YEARS[0];

  const age = useMemo(
    () => calculateAge(selectedDay, selectedMonth, selectedYear ?? CURRENT_YEAR),
    [selectedDay, selectedMonth, selectedYear]
  );
  const levelKey = useMemo(() => (age >= 5 ? getLevel(age) : null), [age]);
  const levelMeta = levelKey ? LEVEL_META[levelKey as keyof typeof LEVEL_META] : null;

  const dayItems = DAYS.map((d) => String(d).padStart(2, "0"));
  const yearItems = YEARS.map((y) => String(y));

  const ROLES: Array<{
    key: Role;
    iconName: "book-open" | "users" | "star";
    label: string;
    desc: string;
    bgColor: string;
    iconColor: string;
  }> = [
    {
      key: "student",
      iconName: "book-open",
      label: "Ученик",
      desc: "Выполняю задания и изучаю английский",
      bgColor: "#ede9fe",
      iconColor: "#7c3aed",
    },
    {
      key: "parent",
      iconName: "users",
      label: "Родитель",
      desc: "Слежу за прогрессом своего ребёнка",
      bgColor: "#e0f2fe",
      iconColor: "#0369a1",
    },
    {
      key: "teacher",
      iconName: "star",
      label: "Учитель",
      desc: "Создаю задания и управляю учениками",
      bgColor: "#fef3c7",
      iconColor: "#b45309",
    },
  ];

  const goBack = () => {
    setError("");
    if (step === "dob") setStep("details");
    else if (step === "details") setStep("role");
  };

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    setError("");
    setStep("details");
  };

  const handleDetailsNext = () => {
    if (!name.trim()) { setError("Введите ваше полное имя"); return; }
    if (!username.trim()) { setError("Введите ваш псевдоним"); return; }
    if (password.length < 6) { setError("Пароль должен содержать не менее 6 символов"); return; }
    setError("");
    if (role === "student") {
      setStep("dob");
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (role === "student" && age < 5) {
      setError("Возраст ученика должен быть не менее 5 лет");
      return;
    }

    setLoading(true);
    setError("");

    const dobStr = role === "student"
      ? `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
      : undefined;

    const baseUrl = process.env["EXPO_PUBLIC_DOMAIN"]
      ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
      : "";

    try {
      const body: Record<string, unknown> = {
        username: username.trim(),
        password,
        name: name.trim(),
        role,
      };
      if (dobStr) body.dateOfBirth = dobStr;

      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Ошибка при регистрации");
        return;
      }
      await login(data.token, data.user);
      await authStorage.setItem("onboarding_tour_pending", "1");
      router.replace("/(main)/assignments");
    } catch {
      setError("Ошибка соединения. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1 },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: insets.top + 24,
      paddingBottom: insets.bottom + 36,
    },

    backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 28 },
    backText: { fontSize: 15, color: colors.primary, fontWeight: "600" },

    pageTitle: { fontSize: 26, fontWeight: "800", color: colors.foreground, marginBottom: 6 },
    pageSub: { fontSize: 15, color: colors.mutedForeground, marginBottom: 28, lineHeight: 22 },

    // Role cards
    roleCard: {
      borderWidth: 2, borderColor: colors.border, borderRadius: 18,
      padding: 18, marginBottom: 12,
      flexDirection: "row", alignItems: "center", gap: 16,
      backgroundColor: colors.card,
    },
    roleCardActive: { borderColor: colors.primary },
    roleIconBox: { width: 52, height: 52, borderRadius: 15, justifyContent: "center", alignItems: "center" },
    roleLabel: { fontSize: 17, fontWeight: "800", color: colors.foreground, marginBottom: 2 },
    roleDesc: { fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },

    // Form
    fieldLabel: { fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 6 },
    inputRow: {
      backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
      borderRadius: 13, flexDirection: "row", alignItems: "center",
      paddingHorizontal: 14, marginBottom: 14,
    },
    input: { flex: 1, fontSize: 15, color: colors.foreground, paddingVertical: 14 },
    eyeBtn: { padding: 6 },

    // Buttons
    primaryBtn: {
      backgroundColor: colors.primary, borderRadius: 14,
      paddingVertical: 16, alignItems: "center", marginTop: 10,
    },
    primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#fff", letterSpacing: 0.2 },
    disabledBtn: { opacity: 0.4 },

    error: { fontSize: 14, color: colors.destructive, textAlign: "center", marginBottom: 12, lineHeight: 20 },

    // Footer
    footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 28, gap: 4 },
    footerText: { fontSize: 14, color: colors.mutedForeground },
    footerLink: { fontSize: 14, fontWeight: "700", color: colors.primary },

    // DOB
    wheelRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 28,
    },

    levelCard: {
      borderRadius: 16, padding: 16, marginBottom: 24,
      flexDirection: "row", alignItems: "center", gap: 14,
      borderWidth: 1.5,
    },
    levelIconBox: { width: 50, height: 50, borderRadius: 14, justifyContent: "center", alignItems: "center" },
    levelTitle: { fontSize: 16, fontWeight: "800" },
    levelSub: { fontSize: 13, marginTop: 1 },
    levelAge: { fontSize: 12, fontWeight: "600", marginTop: 3 },

    ageErrorBox: {
      backgroundColor: "#fef2f2", borderRadius: 12, padding: 14, marginBottom: 20,
      borderWidth: 1, borderColor: "#fecaca",
    },
    ageErrorText: { fontSize: 14, color: colors.destructive, textAlign: "center", lineHeight: 20 },
  });

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={s.content}>

          {/* Кнопка назад */}
          {step !== "role" && (
            <TouchableOpacity style={s.backRow} onPress={goBack}>
              <Feather name="arrow-left" size={18} color={colors.primary} />
              <Text style={s.backText}>Назад</Text>
            </TouchableOpacity>
          )}

          {/* ── ШАГ 1: Выбор роли ── */}
          {step === "role" && (
            <>
              <Text style={s.pageTitle}>Создать аккаунт</Text>
              <Text style={s.pageSub}>Выберите вашу роль для начала работы</Text>

              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={s.roleCard}
                  onPress={() => handleRoleSelect(r.key)}
                  activeOpacity={0.75}
                >
                  <View style={[s.roleIconBox, { backgroundColor: r.bgColor }]}>
                    <Feather name={r.iconName} size={26} color={r.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.roleLabel}>{r.label}</Text>
                    <Text style={s.roleDesc}>{r.desc}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}

              <View style={s.footer}>
                <Text style={s.footerText}>Уже есть аккаунт?</Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                  <Text style={[s.footerLink, { marginLeft: 4 }]}>Войти</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── ШАГ 2: Данные пользователя ── */}
          {step === "details" && role && (
            <>
              <Text style={s.pageTitle}>
                {role === "student" ? "Данные ученика"
                  : role === "parent" ? "Данные родителя"
                  : "Данные учителя"}
              </Text>
              <Text style={s.pageSub}>
                {role === "student"
                  ? "Введите ваши данные для создания аккаунта"
                  : role === "parent"
                  ? "Контролируйте успехи вашего ребёнка"
                  : "Управляйте заданиями и учениками"}
              </Text>

              <Text style={s.fieldLabel}>Полное имя</Text>
              <View style={s.inputRow}>
                <TextInput
                  style={s.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Введите ваше имя"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <Text style={s.fieldLabel}>Ваш псевдоним</Text>
              <View style={s.inputRow}>
                <TextInput
                  style={s.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Придумайте уникальный логин"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Text style={s.fieldLabel}>Пароль</Text>
              <View style={s.inputRow}>
                <TextInput
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Не менее 6 символов"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity style={s.primaryBtn} onPress={handleDetailsNext} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryBtnText}>
                      {role === "student" ? "Продолжить" : "Создать аккаунт"}
                    </Text>
                }
              </TouchableOpacity>
            </>
          )}

          {/* ── ШАГ 3: Дата рождения (только для учеников) ── */}
          {step === "dob" && (
            <>
              <Text style={s.pageTitle}>Дата рождения</Text>
              <Text style={s.pageSub}>
                Мы подберём задания и уровень по вашему возрасту
              </Text>

              {/* Три барабана: День / Месяц / Год */}
              <View style={s.wheelRow}>
                <DrumPicker
                  items={dayItems}
                  selectedIndex={dayIdx}
                  onSelect={setDayIdx}
                  label="День"
                  width={62}
                  colors={colors}
                />
                <DrumPicker
                  items={MONTHS_RU}
                  selectedIndex={monthIdx}
                  onSelect={setMonthIdx}
                  label="Месяц"
                  width={126}
                  colors={colors}
                />
                <DrumPicker
                  items={yearItems}
                  selectedIndex={yearIdx}
                  onSelect={setYearIdx}
                  label="Год"
                  width={76}
                  colors={colors}
                />
              </View>

              {/* Карточка уровня */}
              {age >= 5 && levelMeta ? (
                <View style={[s.levelCard, {
                  backgroundColor: levelMeta.color + "12",
                  borderColor: levelMeta.color + "45",
                }]}>
                  <View style={[s.levelIconBox, { backgroundColor: levelMeta.color + "20" }]}>
                    <Feather name="zap" size={24} color={levelMeta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.levelTitle, { color: levelMeta.color }]}>
                      {levelMeta.labelRu}
                    </Text>
                    <Text style={[s.levelSub, { color: colors.mutedForeground }]}>
                      {levelMeta.label}
                    </Text>
                    <Text style={[s.levelAge, { color: levelMeta.color }]}>
                      {age} {age === 1 ? "год" : age < 5 ? "года" : "лет"} · {levelMeta.ageRange}
                    </Text>
                  </View>
                  <Feather name="check-circle" size={22} color={levelMeta.color} />
                </View>
              ) : (
                <View style={s.ageErrorBox}>
                  <Text style={s.ageErrorText}>
                    Возраст ученика должен быть не менее 5 лет.{"\n"}
                    Пожалуйста, выберите правильную дату рождения.
                  </Text>
                </View>
              )}

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.primaryBtn, age < 5 && s.disabledBtn]}
                onPress={handleSubmit}
                disabled={loading || age < 5}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryBtnText}>Продолжить</Text>
                }
              </TouchableOpacity>
            </>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
