import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, FlatList, ActivityIndicator, Platform,
  TouchableOpacity, ScrollView, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import authStorage from "@/utils/authStorage";

const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

type CategoryKey = "points" | "time" | "tests" | "audio" | "streak";
type Scope = "all" | "friends" | "age";

type AgeGroup = { label: string; ageMin: number | null; ageMax: number | null };

const AGE_GROUPS: AgeGroup[] = [
  { label: "До 12 лет", ageMin: null, ageMax: 12 },
  { label: "13–15 лет", ageMin: 13,   ageMax: 15 },
  { label: "16–18 лет", ageMin: 16,   ageMax: 18 },
  { label: "18+ лет",   ageMin: 19,   ageMax: null },
];

type CategoryEntry = {
  userId: number;
  name: string;
  surname?: string | null;
  username: string;
  avatarEmoji: string | null;
  avatarColor: string | null;
  avatarUrl: string | null;
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
  { key: "points", label: "Очки",       icon: "star",        color: "#f59e0b", formatValue: (v) => `${v} ⭐`,                                          subtitle: "Рейтинг по очкам опыта" },
  { key: "time",   label: "Время",      icon: "clock",       color: "#6366f1", formatValue: (v) => v >= 60 ? `${Math.floor(v/60)} ч ${v%60} м` : `${v} м`, subtitle: "Кто больше занимался" },
  { key: "tests",  label: "Тесты",      icon: "check-circle",color: "#10b981", formatValue: (v) => v > 0 ? `${v}%` : "—",                              subtitle: "Средний балл по тестам" },
  { key: "audio",  label: "Аудирование",icon: "headphones",  color: "#8b5cf6", formatValue: (v) => v > 0 ? `${v}%` : "—",                              subtitle: "Балл по аудио-заданиям" },
  { key: "streak", label: "Серия",      icon: "zap",         color: "#ef4444", formatValue: (v) => v === 1 ? "1 день" : v <= 4 ? `${v} дня` : `${v} дней`, subtitle: "Серия ежедневных входов" },
];

const SCOPE_OPTIONS: { key: Scope; label: string }[] = [
  { key: "all",     label: "Все ученики" },
  { key: "friends", label: "Друзья" },
  { key: "age",     label: "По возрасту" },
];

const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["#f59e0b", "#94a3b8", "#b45309"];

// ── Avatar component ──────────────────────────────────────────────────
function Avatar({ entry, size, borderColor }: { entry: CategoryEntry; size: number; borderColor: string }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: entry.avatarColor ?? "#6366f1",
      borderWidth: 3, borderColor,
      overflow: "hidden", justifyContent: "center", alignItems: "center",
    }}>
      {entry.avatarUrl
        ? <Image source={{ uri: entry.avatarUrl }} style={{ width: size, height: size }} />
        : <Text style={{ fontSize: size * 0.44 }}>{entry.avatarEmoji ?? "🦁"}</Text>
      }
    </View>
  );
}

// ── Podium card (top 3) ───────────────────────────────────────────────
function PodiumCard({
  entry, rank, isCenter, activeCat, isMe, onPress,
}: {
  entry: CategoryEntry | undefined;
  rank: number;
  isCenter: boolean;
  activeCat: typeof CATEGORIES[0];
  isMe: boolean;
  onPress: () => void;
}) {
  const avatarSize = isCenter ? 72 : 60;
  const medColor = MEDAL_COLORS[rank - 1];

  if (!entry) {
    return (
      <View style={{ alignItems: "center", flex: 1 }}>
        <View style={{
          width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2,
          backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 2,
          borderColor: "rgba(255,255,255,0.2)", borderStyle: "dashed",
          justifyContent: "center", alignItems: "center",
        }}>
          <Text style={{ fontSize: 22, opacity: 0.4 }}>?</Text>
        </View>
        <Text style={{ marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          {rank} место
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={isMe ? 1 : 0.75}
      onPress={isMe ? undefined : onPress}
      style={{ alignItems: "center", flex: 1 }}
    >
      {/* Medal badge */}
      <View style={{
        position: "relative",
        marginBottom: isCenter ? 0 : 16,
        marginTop: isCenter ? 0 : 16,
      }}>
        <View style={{
          shadowColor: medColor, shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
        }}>
          <Avatar entry={entry} size={avatarSize} borderColor={isMe ? "#fff" : medColor} />
        </View>
        {/* Medal circle */}
        <View style={{
          position: "absolute", bottom: -8, alignSelf: "center",
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: medColor,
          justifyContent: "center", alignItems: "center",
          borderWidth: 2, borderColor: "#4c1d95",
        }}>
          <Text style={{ fontSize: 10, fontWeight: "900", color: "#fff" }}>{rank}</Text>
        </View>
      </View>

      <Text
        numberOfLines={1}
        style={{
          marginTop: 14, fontSize: isCenter ? 14 : 12,
          fontWeight: "800", color: "#fff",
          maxWidth: 90, textAlign: "center",
        }}
      >
        {entry.username}{isMe ? " (Я)" : ""}
      </Text>
      <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>
        {activeCat.formatValue(entry.value)}
      </Text>
    </TouchableOpacity>
  );
}

export default function LeaderboardScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [scope, setScope] = useState<Scope>("all");
  const [activeAgeGroup, setActiveAgeGroup] = useState<AgeGroup>(AGE_GROUPS[0]);
  const [activeKey, setActiveKey] = useState<CategoryKey>("points");
  const [data, setData] = useState<CategoriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildUrl = useCallback((s: Scope, ag: AgeGroup) => {
    const params = new URLSearchParams({ scope: s });
    if (s === "age") {
      if (ag.ageMin !== null) params.set("ageMin", String(ag.ageMin));
      if (ag.ageMax !== null) params.set("ageMax", String(ag.ageMax));
    }
    return `${BASE_URL}/api/leaderboard/categories?${params.toString()}`;
  }, []);

  const load = useCallback(async (s: Scope, ag: AgeGroup) => {
    setLoading(true);
    try {
      const token = await authStorage.getItem("auth_token");
      const res = await fetch(buildUrl(s, ag), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setData(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  }, [buildUrl]);

  useEffect(() => {
    load(scope, activeAgeGroup);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => load(scope, activeAgeGroup), 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [scope, activeAgeGroup, load]);

  const activeCat = CATEGORIES.find(c => c.key === activeKey)!;
  const entries = data?.[activeKey] ?? [];
  const myEntry = entries.find(e => e.userId === user?.id);

  const top3 = [
    entries.find(e => e.rank === 1),
    entries.find(e => e.rank === 2),
    entries.find(e => e.rank === 3),
  ];
  const rest = entries.filter(e => e.rank > 3);

  const renderItem = ({ item }: { item: CategoryEntry }) => {
    const isMe = item.userId === user?.id;
    const avatarBg = item.avatarColor ?? "#6366f1";

    const card = (
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: isMe ? activeCat.color + "12" : colors.card,
        borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
        marginBottom: 8, marginHorizontal: 20,
        borderWidth: isMe ? 1.5 : 1,
        borderColor: isMe ? activeCat.color + "50" : colors.border,
      }}>
        <Text style={{
          width: 28, fontSize: 14, fontWeight: "800", textAlign: "center",
          color: colors.mutedForeground,
        }}>
          {item.rank}
        </Text>
        <View style={{
          width: 40, height: 40, borderRadius: 20, backgroundColor: avatarBg,
          overflow: "hidden", justifyContent: "center", alignItems: "center",
        }}>
          {item.avatarUrl
            ? <Image source={{ uri: item.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
            : <Text style={{ fontSize: 20 }}>{item.avatarEmoji ?? "🦁"}</Text>
          }
        </View>
        <Text
          style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.foreground }}
          numberOfLines={1}
        >
          {(user?.role === "teacher" || user?.role === "admin") && (item.name || item.surname)
            ? `${item.username} (${[item.name, item.surname].filter(Boolean).join(" ")})`
            : item.username}{isMe ? " (Я)" : ""}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: "800", color: isMe ? activeCat.color : colors.foreground }}>
          {activeCat.formatValue(item.value)}
        </Text>
      </View>
    );

    if (isMe) return card;
    return (
      <TouchableOpacity activeOpacity={0.72} onPress={() => router.push(`/(main)/friend/${item.userId}` as any)}>
        {card}
      </TouchableOpacity>
    );
  };

  const ListHeader = (
    <>
      {/* ── Hero gradient section ── */}
      <LinearGradient
        colors={["#3b0764", "#6d28d9", "#7c3aed"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), paddingBottom: 0 }}
      >
        {/* Title */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 26, fontWeight: "900", color: "#fff" }}>Рейтинг</Text>
        </View>

        {/* Scope tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, flexDirection: "row", marginBottom: 14 }}
        >
          {SCOPE_OPTIONS.map(opt => {
            const active = opt.key === scope;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setScope(opt.key)}
                activeOpacity={0.78}
                style={{
                  paddingHorizontal: 18, paddingVertical: 8, borderRadius: 22,
                  backgroundColor: active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                  borderWidth: 1.5,
                  borderColor: active ? "#fff" : "rgba(255,255,255,0.2)",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: active ? "#fff" : "rgba(255,255,255,0.6)" }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Age group pills */}
        {scope === "age" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, flexDirection: "row", marginBottom: 14 }}
          >
            {AGE_GROUPS.map(ag => {
              const active = ag.label === activeAgeGroup.label;
              return (
                <TouchableOpacity
                  key={ag.label}
                  onPress={() => setActiveAgeGroup(ag)}
                  activeOpacity={0.78}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 22,
                    backgroundColor: active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                    borderWidth: 1.5, borderColor: active ? "#fff" : "rgba(255,255,255,0.2)",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: active ? "#fff" : "rgba(255,255,255,0.6)" }}>
                    {ag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, flexDirection: "row", marginBottom: 20 }}
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
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: 22,
                  backgroundColor: active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                  borderWidth: 1.5, borderColor: active ? "#fff" : "rgba(255,255,255,0.2)",
                }}
              >
                <Feather name={cat.icon} size={13} color={active ? "#fff" : "rgba(255,255,255,0.55)"} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: active ? "#fff" : "rgba(255,255,255,0.55)" }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Podium — 2nd | 1st | 3rd */}
        {loading ? (
          <View style={{ height: 160, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color="rgba(255,255,255,0.7)" size="large" />
          </View>
        ) : (
          <View style={{
            flexDirection: "row", alignItems: "flex-end",
            paddingHorizontal: 10, paddingBottom: 28, minHeight: 160,
          }}>
            {/* 2nd */}
            <PodiumCard
              entry={top3[1]}
              rank={2}
              isCenter={false}
              activeCat={activeCat}
              isMe={top3[1]?.userId === user?.id}
              onPress={() => top3[1] && router.push(`/(main)/friend/${top3[1].userId}` as any)}
            />
            {/* 1st */}
            <PodiumCard
              entry={top3[0]}
              rank={1}
              isCenter={true}
              activeCat={activeCat}
              isMe={top3[0]?.userId === user?.id}
              onPress={() => top3[0] && router.push(`/(main)/friend/${top3[0].userId}` as any)}
            />
            {/* 3rd */}
            <PodiumCard
              entry={top3[2]}
              rank={3}
              isCenter={false}
              activeCat={activeCat}
              isMe={top3[2]?.userId === user?.id}
              onPress={() => top3[2] && router.push(`/(main)/friend/${top3[2].userId}` as any)}
            />
          </View>
        )}

        {/* Wavy bottom edge */}
        <View style={{ height: 24, backgroundColor: "transparent", overflow: "hidden" }}>
          <View style={{
            position: "absolute", bottom: -1, left: -10, right: -10, height: 36,
            backgroundColor: colors.background,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
          }} />
        </View>
      </LinearGradient>

      {/* ── My position banner (if I'm outside top 3) ── */}
      {!loading && myEntry && myEntry.rank > 3 && (
        <View style={{
          marginHorizontal: 20, marginTop: 14, marginBottom: 4,
          padding: 12, backgroundColor: activeCat.color + "14",
          borderRadius: 14, borderWidth: 1.5, borderColor: activeCat.color + "40",
          flexDirection: "row", alignItems: "center", gap: 12,
        }}>
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: activeCat.color + "25",
            justifyContent: "center", alignItems: "center",
          }}>
            <Text style={{ fontSize: 14, fontWeight: "900", color: activeCat.color }}>#{myEntry.rank}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Моё место</Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: activeCat.color }}>{user?.name}</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: "900", color: activeCat.color }}>
            {activeCat.formatValue(myEntry.value)}
          </Text>
        </View>
      )}

      {/* Section label */}
      {!loading && rest.length > 0 && (
        <Text style={{
          marginHorizontal: 20, marginTop: 16, marginBottom: 8,
          fontSize: 11, fontWeight: "700", color: colors.mutedForeground,
          textTransform: "uppercase", letterSpacing: 0.6,
        }}>
          Участники · {entries.length}
        </Text>
      )}

      {!loading && entries.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
          <Feather name="award" size={48} color={colors.mutedForeground} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
            {scope === "friends" ? "Нет друзей в рейтинге" :
             scope === "age"     ? `Нет учеников — «${activeAgeGroup.label}»` :
             "Пока никого нет"}
          </Text>
          {scope === "friends" && (
            <Text style={{ fontSize: 13, color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 40 }}>
              Добавьте друзей через профиль другого ученика
            </Text>
          )}
        </View>
      )}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={rest}
        keyExtractor={e => String(e.userId)}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
