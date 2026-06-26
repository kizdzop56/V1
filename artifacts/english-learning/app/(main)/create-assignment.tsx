import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useCreateAssignment } from "@workspace/api-client-react";

const TYPES = [
  { key: "text_test", label: "Тест", icon: "edit-3" },
  { key: "audio",    label: "Аудирование", icon: "headphones" },
  { key: "reading",  label: "Чтение", icon: "book" },
  { key: "video",    label: "Видео", icon: "video" },
] as const;

type AssignmentType = typeof TYPES[number]["key"];

export default function CreateAssignmentScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<AssignmentType>("text_test");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ageMin, setAgeMin] = useState("5");
  const [ageMax, setAgeMax] = useState("18");
  const [points, setPoints] = useState("10");
  const [content, setContent] = useState("");
  const [questions, setQuestions] = useState([{ text: "", correctAnswer: "" }]);

  const { mutate: createAssignment, isPending } = useCreateAssignment({
    mutation: {
      onSuccess: () => {
        Alert.alert("Готово", "Задание успешно создано!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      },
      onError: (err: any) => {
        Alert.alert("Ошибка", err?.message || "Не удалось создать задание");
      },
    },
  });

  const addQuestion = () =>
    setQuestions(prev => [...prev, { text: "", correctAnswer: "" }]);
  const removeQuestion = (i: number) =>
    setQuestions(prev => prev.filter((_, idx) => idx !== i));
  const updateQuestion = (
    i: number,
    field: "text" | "correctAnswer",
    value: string,
  ) => setQuestions(prev =>
    prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q),
  );

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Ошибка", "Введите название задания"); return;
    }
    if (!description.trim()) {
      Alert.alert("Ошибка", "Введите описание задания"); return;
    }

    createAssignment({
      data: {
        title: title.trim(),
        description: description.trim(),
        type,
        ageMin: parseInt(ageMin) || 5,
        ageMax: parseInt(ageMax) || 18,
        points: parseInt(points) || 10,
        content: content.trim() || undefined,
        questions: questions.filter(q => q.text.trim()).map((q, i) => ({
          text: q.text.trim(),
          options: [],
          correctAnswer: q.correctAnswer.trim(),
          orderIndex: i,
        })),
      },
    });
  };

  const contentLabel =
    type === "reading" ? "Текст для чтения"
    : type === "audio"   ? "Ссылка на аудио"
    : "Ссылка на видео";

  const contentPlaceholder =
    type === "reading" ? "Вставьте текст для чтения..."
    : "Вставьте URL медиафайла...";

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
      paddingHorizontal: 20, paddingBottom: 8,
      flexDirection: "row", alignItems: "center", gap: 12,
    },
    backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 20, fontWeight: "800", color: colors.foreground, flex: 1 },
    scroll: { paddingHorizontal: 20, paddingBottom: insets.bottom + 40 },
    section: { marginBottom: 20 },
    sectionTitle: {
      fontSize: 12, fontWeight: "700", color: colors.mutedForeground,
      textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10,
    },
    typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    typeBtn: {
      flexDirection: "row", alignItems: "center", gap: 6,
      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
    },
    typeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + "12" },
    typeBtnText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
    typeBtnTextActive: { color: colors.primary },
    label: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 },
    input: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, color: colors.foreground, marginBottom: 12,
    },
    textArea: { minHeight: 100, textAlignVertical: "top" },
    row: { flexDirection: "row", gap: 12 },
    half: { flex: 1 },
    questionCard: {
      backgroundColor: colors.card, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: colors.border, marginBottom: 10,
    },
    questionHeader: {
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between", marginBottom: 8,
    },
    questionNum: { fontSize: 13, fontWeight: "700", color: colors.primary },
    addBtn: {
      flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center",
      paddingVertical: 12, borderRadius: 12, borderWidth: 1.5,
      borderColor: colors.border, borderStyle: "dashed",
    },
    addBtnText: { fontSize: 14, fontWeight: "600", color: colors.mutedForeground },
    submitBtn: {
      backgroundColor: colors.primary, borderRadius: 14,
      paddingVertical: 16, alignItems: "center", marginTop: 8,
    },
    submitText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Создать задание</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Тип задания */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Тип задания</Text>
          <View style={s.typeGrid}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[s.typeBtn, type === t.key && s.typeBtnActive]}
                onPress={() => setType(t.key)}
              >
                <Feather
                  name={t.icon as any}
                  size={16}
                  color={type === t.key ? colors.primary : colors.mutedForeground}
                />
                <Text style={[s.typeBtnText, type === t.key && s.typeBtnTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Основная информация */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Основная информация</Text>

          <Text style={s.label}>Название</Text>
          <TextInput
            style={s.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Например: Глаголы прошедшего времени"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={s.label}>Описание</Text>
          <TextInput
            style={[s.input, s.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Краткое описание задания для ученика"
            placeholderTextColor={colors.mutedForeground}
            multiline
          />

          <View style={s.row}>
            <View style={s.half}>
              <Text style={s.label}>Возраст от</Text>
              <TextInput
                style={s.input}
                value={ageMin}
                onChangeText={setAgeMin}
                keyboardType="numeric"
                placeholder="5"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View style={s.half}>
              <Text style={s.label}>Возраст до</Text>
              <TextInput
                style={s.input}
                value={ageMax}
                onChangeText={setAgeMax}
                keyboardType="numeric"
                placeholder="18"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <Text style={s.label}>Баллы за выполнение</Text>
          <TextInput
            style={s.input}
            value={points}
            onChangeText={setPoints}
            keyboardType="numeric"
            placeholder="10"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {/* Контент (для нетестовых типов) */}
        {(type === "reading" || type === "audio" || type === "video") && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Контент</Text>
            <Text style={s.label}>{contentLabel}</Text>
            <TextInput
              style={[s.input, type === "reading" && s.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder={contentPlaceholder}
              placeholderTextColor={colors.mutedForeground}
              multiline={type === "reading"}
            />
          </View>
        )}

        {/* Вопросы */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Вопросы</Text>
          {questions.map((q, i) => (
            <View key={i} style={s.questionCard}>
              <View style={s.questionHeader}>
                <Text style={s.questionNum}>Вопрос {i + 1}</Text>
                {questions.length > 1 && (
                  <TouchableOpacity onPress={() => removeQuestion(i)}>
                    <Feather name="x" size={18} color={colors.destructive} />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={s.input}
                value={q.text}
                onChangeText={v => updateQuestion(i, "text", v)}
                placeholder="Текст вопроса"
                placeholderTextColor={colors.mutedForeground}
                multiline
              />
              <TextInput
                style={s.input}
                value={q.correctAnswer}
                onChangeText={v => updateQuestion(i, "correctAnswer", v)}
                placeholder="Правильный ответ"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          ))}
          <TouchableOpacity style={s.addBtn} onPress={addQuestion}>
            <Feather name="plus" size={16} color={colors.mutedForeground} />
            <Text style={s.addBtnText}>Добавить вопрос</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={isPending}>
          {isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitText}>Создать задание</Text>}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
