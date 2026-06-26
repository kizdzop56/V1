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
  { key: "text_test", label: "Text Test", icon: "edit-3" },
  { key: "audio", label: "Listening", icon: "headphones" },
  { key: "reading", label: "Reading", icon: "book" },
  { key: "video", label: "Video", icon: "video" },
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
        Alert.alert("Success", "Assignment created successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      },
      onError: (err: any) => {
        Alert.alert("Error", err?.message || "Failed to create assignment");
      },
    },
  });

  const addQuestion = () => setQuestions(prev => [...prev, { text: "", correctAnswer: "" }]);
  const removeQuestion = (i: number) => setQuestions(prev => prev.filter((_, idx) => idx !== i));
  const updateQuestion = (i: number, field: "text" | "correctAnswer", value: string) => {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  };

  const handleSubmit = () => {
    if (!title.trim()) { Alert.alert("Error", "Title is required"); return; }
    if (!description.trim()) { Alert.alert("Error", "Description is required"); return; }

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

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
      paddingHorizontal: 20, paddingBottom: 8,
      flexDirection: "row", alignItems: "center", gap: 12,
    },
    backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
    title: { fontSize: 20, fontWeight: "800", color: colors.foreground, flex: 1 },
    scroll: { paddingHorizontal: 20, paddingBottom: insets.bottom + 40 },
    section: { marginBottom: 20 },
    sectionTitle: {
      fontSize: 13, fontWeight: "700", color: colors.mutedForeground,
      textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10,
    },
    typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    typeBtn: {
      flexDirection: "row", alignItems: "center", gap: 6,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
    },
    typeBtnActive: { borderColor: colors.primary, backgroundColor: colors.secondary },
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
    questionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    questionNum: { fontSize: 13, fontWeight: "700", color: colors.primary },
    removeBtn: { padding: 4 },
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
    submitText: { fontSize: 16, fontWeight: "700", color: colors.primaryForeground },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Assignment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assignment Type</Text>
          <View style={styles.typeGrid}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeBtn, type === t.key && styles.typeBtnActive]}
                onPress={() => setType(t.key)}
              >
                <Feather name={t.icon as any} size={16} color={type === t.key ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.typeBtnText, type === t.key && styles.typeBtnTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Assignment title"
            placeholderTextColor={colors.mutedForeground}
          />
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description"
            placeholderTextColor={colors.mutedForeground}
            multiline
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Min Age</Text>
              <TextInput
                style={styles.input}
                value={ageMin}
                onChangeText={setAgeMin}
                keyboardType="numeric"
                placeholder="5"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Max Age</Text>
              <TextInput
                style={styles.input}
                value={ageMax}
                onChangeText={setAgeMax}
                keyboardType="numeric"
                placeholder="18"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>
          <Text style={styles.label}>Points Reward</Text>
          <TextInput
            style={styles.input}
            value={points}
            onChangeText={setPoints}
            keyboardType="numeric"
            placeholder="10"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {(type === "reading" || type === "audio" || type === "video") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content</Text>
            <Text style={styles.label}>{type === "reading" ? "Reading Text" : type === "audio" ? "Audio URL" : "Video URL"}</Text>
            <TextInput
              style={[styles.input, type === "reading" && styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder={type === "reading" ? "Enter the reading passage..." : "Enter media URL..."}
              placeholderTextColor={colors.mutedForeground}
              multiline={type === "reading"}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions</Text>
          {questions.map((q, i) => (
            <View key={i} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNum}>Question {i + 1}</Text>
                {questions.length > 1 && (
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeQuestion(i)}>
                    <Feather name="x" size={18} color={colors.destructive} />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.input}
                value={q.text}
                onChangeText={v => updateQuestion(i, "text", v)}
                placeholder="Question text"
                placeholderTextColor={colors.mutedForeground}
                multiline
              />
              <TextInput
                style={styles.input}
                value={q.correctAnswer}
                onChangeText={v => updateQuestion(i, "correctAnswer", v)}
                placeholder="Correct answer"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={addQuestion}>
            <Feather name="plus" size={16} color={colors.mutedForeground} />
            <Text style={styles.addBtnText}>Add Question</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isPending}>
          {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Assignment</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
