import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, FlatList, ActivityIndicator, Platform,
  TouchableOpacity, ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import authStorage from "@/utils/authStorage";

const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

const MEDAL_COLORS = ["#f59e0b", "#94a3b8", "#b45309"];

type CategoryKey = "points" | "time" | "tests" | "audio" | "streak";

type CategoryEntry = {
  userId: number;
  name: string;
  avatarEmoji: string | null;
  avatarColor: string | null;
  value: number;
  rank: number;
};

type CategoriesData = Record<CategoryKey, CategoryEntry[]>;

const CATEGORIES: {
  key: CategoryKey;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  formatValue: (v: number) => string;
  subtitle: string;
}[] = [
  {
    key: "points",
    label: "Очки",
    icon: "star",
    color: "#f59e0b",
    formatValue: (v) => `${v} ⭐`,
    subtitle: "Общий рейтинг по очкам опыта",
  },
  {
    key: "time",
    label: "Время",
    icon: "clock",
    color: "#6366f1",
    formatValue: (v) => v >= 60 ? `${Math.floor(v / 60)} ч ${v % 60} мин` : `${v} мин`,
    subtitle: "Кто больше всего занимался в приложении",
  },
  {
    key: "tests",
    label: "Тесты",
    icon: "check-circle",
    color: "#10b981",
    formatValue: (v) => v > 0 ? `${v}%` : "—",
    subtitle: "Средний балл по письменным тестам",
  },
  {
    key: "audio",
    label: "Аудирование",
    icon: "headphones",
    color: "#8b5cf6",
    formatValue: (v) => v > 0 ? `${v}%` : "—",
    subtitle: "Средний балл по аудио-заданиям",
  },
  {
    key: "streak",
    label: "Серия",
    icon: "zap",
    color: "#ef4444",
    formatValue: (v) => v === 1 ? "1 день" : v >= 2 && v <= 4 ? `${v} дня` : `${v} дней`,
    subtitle: "Серия ежедневных входов в приложение",
  },
];

export default function LeaderboardScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [data, setData] = useState<CategoriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState<CategoryKey>("points");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await authStorage.getItem("auth_token");
      const res = await fetch(`${BASE_URL}/api/leaderboard/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  const activeCat = CATEGORIES.find(c => c.key === activeKey)!;
  const entries = data?.[activeKey] ?? [];
  const myEntry = entries.find(e => e.userId === user?.id);

  const renderItem = ({ item }: { item: CategoryEntry }) => {
    const isMe = item.userId === user?.id;
    const medalColor = MEDAL_COLORS[item.rank - 1];
    const avatarBg = item.avatarColor ?? "#6366f1";

    const card = (
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: isMe ? activeCat.color + "12" : colors.card,
        borderRadius: 14, padding: 14, marginBottom: 8,
        borderWidth: isMe ? 1.5 : 1,
        borderColor: isMe ? activeCat.color + "50" : colors.border,
      }}>
        {/* Rank */}
        <View style={{
          width: 34, height: 34, borderRadius: 17,
          justifyContent: "center", alignItems: "center",
          backgroundColor: medalColor ? medalColor + "20" : colors.muted,
        }}>
          {item.rank <= 3
            ? <Feather name="award" size={18} color={medalColor} />
            : <Text style={{ fontSize: 15, fontWeight: "800", color: colors.mutedForeground }}>#{item.rank}</Text>
          }
        </View>

        {/* Avatar */}
        <View style={{
          width: 38, height: 38, borderRadius: 19,
          backgroundColor: avatarBg,
          justifyContent: "center", alignItems: "center",
        }}>
          <Text style={{ fontSize: 18 }}>{item.avatarEmoji ?? "🦁"}</Text>
        </View>

        {/* Name */}
        <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.foreground }} numberOfLines={1}>
          {item.name}{isMe ? " (Я)" : ""}
        </Text>

        {/* Value */}
        <Text style={{
          fontSize: 15, fontWeight: "800",
          color: isMe ? activeCat.color : colors.foreground,
        }}>
          {activeCat.formatValue(item.value)}
        </Text>

        {!isMe && <Feather name="chevron-right" size={14} color={colors.mutedForeground} />}
      </View>
    );

    if (isMe) return card;
    return (
      <TouchableOpacity activeOpacity={0.72} onPress={() => router.push(`/(main)/friend/${item.userId}` as any)}>
        {card}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
        paddingHorizontal: 20, paddingBottom: 12,
      }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.foreground, marginBottom: 2 }}>
          Рейтинг
        </Text>
        <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
          {activeCat.subtitle}
        </Text>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8, flexDirection: "row" }}
      >
        {CATEGORIES.map(cat => {
          const active = cat.key === activeKey;
          return (
            <TouchableOpacity
              key={cat.key}
              activeOpacity={0.75}
              onPress={() => setActiveKey(cat.key)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 6,
                paddingHorizontal: 14, paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? cat.color : colors.card,
                borderWidth: 1.5,
                borderColor: active ? cat.color : colors.border,
              }}
            >
              <Feather name={cat.icon} size={14} color={active ? "#fff" : colors.mutedForeground} />
              <Text style={{
                fontSize: 13, fontWeight: "700",
                color: active ? "#fff" : colors.mutedForeground,
              }}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* My position card */}
      {myEntry && (
        <View style={{
          marginHorizontal: 20, marginBottom: 14, padding: 14,
          backgroundColor: activeCat.color + "14", borderRadius: 16,
          borderWidth: 1.5, borderColor: activeCat.color + "40",
          flexDirection: "row", alignItems: "center", gap: 12,
        }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: activeCat.color + "25",
            justifyContent: "center", alignItems: "center",
          }}>
            <Feather name={activeCat.icon} size={20} color={activeCat.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Моё место</Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: activeCat.color }}>
              #{myEntry.rank} — {user?.name}
            </Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "900", color: activeCat.color }}>
            {activeCat.formatValue(myEntry.value)}
          </Text>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={activeCat.color} size="large" />
        </View>
      ) : entries.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
          <Feather name="award" size={48} color={colors.mutedForeground} />
          <Text style={{ fontSize: 16, color: colors.mutedForeground }}>Пока никого нет</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={e => String(e.userId)}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 100,
          }}
        />
      )}
    </View>
  );
}
