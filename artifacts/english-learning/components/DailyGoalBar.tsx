import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet, Modal, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import authStorage from "@/utils/authStorage";

const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

async function apiFetch(path: string, options?: RequestInit) {
  const token = await authStorage.getItem("auth_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Ошибка сервера");
  return data;
}

interface DailyGoalBarProps {
  todayMinutes: number;
  goalMinutes: number;
  onGoalChange?: (minutes: number) => void;
}

const GOAL_OPTIONS = [10, 15, 20, 30];

export function DailyGoalBar({ todayMinutes, goalMinutes, onGoalChange }: DailyGoalBarProps) {
  const colors = useColors();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [showPicker, setShowPicker] = useState(false);

  const pct = Math.min(1, todayMinutes / Math.max(goalMinutes, 1));
  const done = pct >= 1;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [pct, progressAnim]);

  const barColor = done ? "#10b981" : "#6366f1";
  const remaining = Math.max(0, goalMinutes - todayMinutes);

  const handleGoalChange = async (minutes: number) => {
    setShowPicker(false);
    try {
      await apiFetch("/api/gamification/daily-goal", {
        method: "PATCH",
        body: JSON.stringify({ minutes }),
      });
      onGoalChange?.(minutes);
    } catch {
      Alert.alert("Ошибка", "Не удалось сохранить цель");
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        activeOpacity={0.85}
        style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[styles.iconBox, { backgroundColor: done ? "#d1fae5" : "#ede9fe" }]}>
              <Feather name={done ? "check-circle" : "target"} size={16} color={done ? "#10b981" : "#6366f1"} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {done ? "Цель выполнена! 🎉" : "Ежедневная цель"}
              </Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                {done
                  ? `${todayMinutes} из ${goalMinutes} мин`
                  : `Осталось ${remaining} мин из ${goalMinutes}`}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.pctText, { color: barColor }]}>
              {Math.round(pct * 100)}%
            </Text>
            <Feather name="settings" size={12} color={colors.mutedForeground} style={{ marginTop: 2 }} />
          </View>
        </View>

        <View style={[styles.trackBg, { backgroundColor: colors.muted }]}>
          <Animated.View
            style={[
              styles.trackFill,
              {
                backgroundColor: barColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        {!done && (
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            💡 Нажми, чтобы изменить цель
          </Text>
        )}
      </TouchableOpacity>

      {/* Goal Picker Modal */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <View style={styles.overlay}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Ежедневная цель</Text>
            <Text style={[styles.pickerSub, { color: colors.mutedForeground }]}>
              Сколько минут в день ты хочешь заниматься?
            </Text>
            {GOAL_OPTIONS.map((mins) => (
              <TouchableOpacity
                key={mins}
                onPress={() => handleGoalChange(mins)}
                style={[
                  styles.goalOption,
                  {
                    backgroundColor: mins === goalMinutes ? "#ede9fe" : colors.muted,
                    borderColor: mins === goalMinutes ? "#6366f1" : colors.border,
                  },
                ]}
              >
                <Text style={[styles.goalEmoji]}>
                  {mins <= 10 ? "🌱" : mins <= 15 ? "⭐" : mins <= 20 ? "🔥" : "🚀"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.goalMin, { color: mins === goalMinutes ? "#6366f1" : colors.foreground }]}>
                    {mins} минут
                  </Text>
                  <Text style={[styles.goalDesc, { color: colors.mutedForeground }]}>
                    {mins <= 10 ? "Лёгкий старт" : mins <= 15 ? "Хорошая привычка" : mins <= 20 ? "Активное обучение" : "Максимальный результат"}
                  </Text>
                </View>
                {mins === goalMinutes && (
                  <Feather name="check" size={18} color="#6366f1" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.closeGoalBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => setShowPicker(false)}
            >
              <Text style={[styles.closeGoalText, { color: colors.mutedForeground }]}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 14, fontWeight: "700" },
  sub: { fontSize: 12, marginTop: 1 },
  pctText: { fontSize: 18, fontWeight: "800" },
  trackBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  trackFill: { height: "100%", borderRadius: 4 },
  hint: { fontSize: 11, marginTop: 8, textAlign: "center" },
  overlay: { flex: 1, backgroundColor: "#00000066", justifyContent: "flex-end" },
  pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32 },
  pickerTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  pickerSub: { fontSize: 13, marginBottom: 20 },
  goalOption: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 10,
  },
  goalEmoji: { fontSize: 22 },
  goalMin: { fontSize: 15, fontWeight: "700" },
  goalDesc: { fontSize: 12, marginTop: 2 },
  closeGoalBtn: {
    borderRadius: 12, padding: 14, borderWidth: 1,
    alignItems: "center", marginTop: 4,
  },
  closeGoalText: { fontWeight: "600", fontSize: 15 },
});
