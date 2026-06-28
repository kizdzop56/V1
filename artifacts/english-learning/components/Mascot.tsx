import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Modal, TextInput,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export type MascotMood = "happy" | "celebrate" | "sad" | "thinking" | "wave" | "sleep";

const MOOD_EMOJIS: Record<MascotMood, string> = {
  happy: "😊",
  celebrate: "🎉",
  sad: "😢",
  thinking: "🤔",
  wave: "👋",
  sleep: "😴",
};

const MASCOT_BODY = "🦉";

interface MascotProps {
  visible: boolean;
  mood?: MascotMood;
  message: string;
  onClose: () => void;
  mascotName?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function MascotModal({
  visible, mood = "happy", message, onClose, mascotName = "Оливер",
  actionLabel, onAction,
}: MascotProps) {
  const colors = useColors();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -8, duration: 500, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();

      if (mood === "celebrate") {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
          ])
        ).start();
      }
    } else {
      bounceAnim.stopAnimation();
      glowAnim.stopAnimation();
    }
  }, [visible, mood, bounceAnim, scaleAnim, glowAnim]);

  if (!visible) return null;

  const bgColor = mood === "celebrate" ? "#fef3c7" : mood === "sad" ? "#fee2e2" : "#ede9fe";
  const borderColor = mood === "celebrate" ? "#f59e0b" : mood === "sad" ? "#ef4444" : "#8b5cf6";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: colors.card, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <TouchableOpacity activeOpacity={1}>
            {/* Mascot Character */}
            <View style={styles.mascotArea}>
              <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
                <View style={[styles.mascotCircle, { backgroundColor: bgColor, borderColor }]}>
                  <Text style={styles.mascotBody}>{MASCOT_BODY}</Text>
                  <View style={styles.moodBadge}>
                    <Text style={styles.moodEmoji}>{MOOD_EMOJIS[mood]}</Text>
                  </View>
                </View>
              </Animated.View>
              <Text style={[styles.mascotName, { color: colors.mutedForeground }]}>{mascotName}</Text>
            </View>

            {/* Speech Bubble */}
            <View style={[styles.bubble, { backgroundColor: bgColor, borderColor }]}>
              <View style={[styles.bubbleTail, { borderBottomColor: bgColor }]} />
              <Text style={[styles.messageText, { color: "#1e293b" }]}>{message}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {actionLabel && onAction && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: borderColor }]}
                  onPress={() => { onAction(); onClose(); }}
                >
                  <Text style={styles.actionBtnText}>{actionLabel}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.closeBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
                onPress={onClose}
              >
                <Text style={[styles.closeBtnText, { color: colors.mutedForeground }]}>Понял!</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Floating mascot button ────────────────────────────────────────────────
interface FloatingMascotProps {
  mascotName?: string;
  message?: string;
  mood?: MascotMood;
  onPress?: () => void;
}

export function FloatingMascot({ mascotName = "Оливер", message, mood = "wave", onPress }: FloatingMascotProps) {
  const [showModal, setShowModal] = useState(false);
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -6, duration: 800, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounceAnim]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    if (message) setShowModal(true);
    onPress?.();
  };

  return (
    <>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.floatingBtn}>
        <Animated.View style={{ transform: [{ translateY: bounceAnim }, { scale: scaleAnim }] }}>
          <View style={styles.floatingCircle}>
            <Text style={styles.floatingEmoji}>{MASCOT_BODY}</Text>
          </View>
          <View style={styles.floatingMood}>
            <Text style={{ fontSize: 12 }}>{MOOD_EMOJIS[mood]}</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      <MascotModal
        visible={showModal}
        mood={mood}
        message={message ?? "Привет!"}
        mascotName={mascotName}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

// ── Name picker modal ─────────────────────────────────────────────────────
interface MascotNamePickerProps {
  visible: boolean;
  currentName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export function MascotNamePicker({ visible, currentName, onSave, onClose }: MascotNamePickerProps) {
  const colors = useColors();
  const [name, setName] = useState(currentName);
  useEffect(() => { if (visible) setName(currentName); }, [visible, currentName]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.namePickerContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.namePickerTitle, { color: colors.foreground }]}>Имя маскота</Text>
          <View style={{ alignItems: "center", marginVertical: 16 }}>
            <Text style={{ fontSize: 64 }}>{MASCOT_BODY}</Text>
          </View>
          <TextInput
            style={[styles.nameInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
            value={name}
            onChangeText={setName}
            placeholder="Имя маскота"
            placeholderTextColor={colors.mutedForeground}
            maxLength={20}
            autoFocus
          />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
            <TouchableOpacity style={[styles.closeBtn, { flex: 1, borderColor: colors.border, backgroundColor: colors.muted }]} onPress={onClose}>
              <Text style={[styles.closeBtnText, { color: colors.mutedForeground }]}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { flex: 1, backgroundColor: "#6366f1" }]}
              onPress={() => { if (name.trim()) { onSave(name.trim()); onClose(); } }}
            >
              <Text style={styles.actionBtnText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Mascot messages library ───────────────────────────────────────────────
export function getMascotMessage(event: "daily_login" | "level_up" | "achievement" | "perfect_score" | "error" | "idle" | "streak", context?: Record<string, any>): { message: string; mood: MascotMood } {
  switch (event) {
    case "daily_login":
      return {
        mood: "wave",
        message: context?.streak && context.streak > 1
          ? `С возвращением! 🔥 Твой стрик уже ${context.streak} дней! Так держать! +${context.points ?? 30} очков за вход.`
          : `Привет! Рад тебя видеть! Ты получаешь +${context?.points ?? 30} очков за ежедневный вход. Начнём учиться?`,
      };
    case "level_up":
      return {
        mood: "celebrate",
        message: `Поздравляю! 🎉 Ты достиг уровня ${context?.level ?? ""}! Ты получил новый значок: ${context?.reward ?? ""}. Продолжай в том же духе!`,
      };
    case "achievement":
      return {
        mood: "celebrate",
        message: `Новое достижение разблокировано! 🏅 «${context?.title ?? ""}» — ${context?.description ?? ""}. Ты молодец!`,
      };
    case "perfect_score":
      return {
        mood: "celebrate",
        message: `Невероятно! 💯 Ты получил идеальный результат! 100% правильных ответов. Ты настоящий гений!`,
      };
    case "error":
      return {
        mood: "sad",
        message: context?.message ?? "Не грусти! Ошибки — это часть обучения. Попробуй ещё раз, у тебя получится! 💪",
      };
    case "streak":
      return {
        mood: "celebrate",
        message: `🔥 ${context?.streak ?? ""} дней подряд! Невероятная серия! Продолжай заниматься каждый день и получи бонусные очки!`,
      };
    case "idle":
    default:
      const messages = [
        "Не забывай про ежедневные занятия! Даже 10 минут в день делают чудеса 🌟",
        "Хочешь поговорить с AI-тьютором? Это отличный способ улучшить разговорный английский! 🎤",
        "Каждое выполненное задание приближает тебя к следующему уровню! 🚀",
        "Помни: постоянство — ключ к успеху! Занимайся каждый день ⚡",
      ];
      return { mood: "thinking", message: messages[Math.floor(Math.random() * messages.length)]! };
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "#00000066",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  container: {
    width: "100%", borderRadius: 24, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
  },
  mascotArea: {
    alignItems: "center", marginBottom: 8,
  },
  mascotCircle: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, justifyContent: "center", alignItems: "center",
  },
  mascotBody: { fontSize: 44 },
  moodBadge: {
    position: "absolute", bottom: -4, right: -4,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#fff", justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  moodEmoji: { fontSize: 16 },
  mascotName: { fontSize: 12, fontWeight: "600", marginTop: 6 },
  bubble: {
    borderRadius: 16, borderWidth: 1.5, padding: 16, marginTop: 16, position: "relative",
  },
  bubbleTail: {
    position: "absolute", top: -10, left: "50%", marginLeft: -8,
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 10,
    borderLeftColor: "transparent", borderRightColor: "transparent",
  },
  messageText: { fontSize: 15, lineHeight: 22, fontWeight: "500", textAlign: "center" },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
  actionBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 12,
    alignItems: "center", justifyContent: "center",
  },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  closeBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  closeBtnText: { fontWeight: "600", fontSize: 15 },
  floatingBtn: { position: "absolute", bottom: 90, right: 16, zIndex: 100 },
  floatingCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#ede9fe", justifyContent: "center", alignItems: "center",
    shadowColor: "#6366f1", shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    borderWidth: 2, borderColor: "#8b5cf6",
  },
  floatingEmoji: { fontSize: 28 },
  floatingMood: {
    position: "absolute", top: -2, right: -2, width: 20, height: 20,
    borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  namePickerContainer: {
    width: "100%", borderRadius: 24, padding: 24,
  },
  namePickerTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  nameInput: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    fontSize: 16, fontWeight: "600",
  },
});
