import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform, KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import authStorage from "@/utils/authStorage";

type Role = "student" | "parent" | "teacher";
type Step = "role" | "details";

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
  const [teacherCode, setTeacherCode] = useState("");
  const [showTeacherCode, setShowTeacherCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    setError("");
    setStep("details");
  };

  const handleDetailsNext = () => {
    if (!name.trim()) { setError("Введите ваше полное имя"); return; }
    if (!username.trim()) { setError("Введите ваш псевдоним"); return; }
    if (password.length < 6) { setError("Пароль должен содержать не менее 6 символов"); return; }
    if (role === "teacher") {
      if (!teacherCode.trim()) { setError("Введите код учителя"); return; }
      if (teacherCode.trim() !== "422668") { setError("Неверный код учителя"); return; }
    }
    setError("");
    handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const baseUrl = process.env["EXPO_PUBLIC_DOMAIN"]
      ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
      : "";

    try {
      const body: Record<string, unknown> = {
        username: username.trim(),
        password,
        name: name.trim(),
        role,
        teacherCode: role === "teacher" ? teacherCode.trim() : undefined,
      };

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

    roleCard: {
      borderWidth: 2, borderColor: colors.border, borderRadius: 18,
      padding: 18, marginBottom: 12,
      flexDirection: "row", alignItems: "center", gap: 16,
      backgroundColor: colors.card,
    },
    roleIconBox: { width: 52, height: 52, borderRadius: 15, justifyContent: "center", alignItems: "center" },
    roleLabel: { fontSize: 17, fontWeight: "800", color: colors.foreground, marginBottom: 2 },
    roleDesc: { fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },

    fieldLabel: { fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 6 },
    inputRow: {
      backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
      borderRadius: 13, flexDirection: "row", alignItems: "center",
      paddingHorizontal: 14, marginBottom: 14,
    },
    input: { flex: 1, fontSize: 15, color: colors.foreground, paddingVertical: 14 },
    eyeBtn: { padding: 6 },

    primaryBtn: {
      backgroundColor: colors.primary, borderRadius: 14,
      paddingVertical: 16, alignItems: "center", marginTop: 10,
    },
    primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#fff", letterSpacing: 0.2 },

    error: { fontSize: 14, color: colors.destructive, textAlign: "center", marginBottom: 12, lineHeight: 20 },

    footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 28, gap: 4 },
    footerText: { fontSize: 14, color: colors.mutedForeground },
    footerLink: { fontSize: 14, fontWeight: "700", color: colors.primary },

    teacherCodeHint: {
      fontSize: 12, color: colors.mutedForeground, marginTop: -8, marginBottom: 14, lineHeight: 17,
    },
  });

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={s.content}>

          {step !== "role" && (
            <TouchableOpacity style={s.backRow} onPress={() => { setError(""); setStep("role"); }}>
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

              {role === "teacher" && (
                <>
                  <Text style={s.fieldLabel}>Код учителя</Text>
                  <View style={s.inputRow}>
                    <TextInput
                      style={s.input}
                      value={teacherCode}
                      onChangeText={setTeacherCode}
                      placeholder="Введите секретный код"
                      placeholderTextColor={colors.mutedForeground}
                      secureTextEntry={!showTeacherCode}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity style={s.eyeBtn} onPress={() => setShowTeacherCode(!showTeacherCode)}>
                      <Feather name={showTeacherCode ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                  <Text style={s.teacherCodeHint}>
                    Код выдаётся администратором. Без него создать аккаунт учителя невозможно.
                  </Text>
                </>
              )}

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity style={s.primaryBtn} onPress={handleDetailsNext} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryBtnText}>Создать аккаунт</Text>
                }
              </TouchableOpacity>
            </>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
