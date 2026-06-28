export interface Achievement {
  id: string;
  emoji: string;
  image?: any;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  check: (stats: AchievementStats) => boolean;
}

const BADGE_IMAGES = {
  start: require("../assets/badges/start.jpeg"),
  firstStep: require("../assets/badges/first-step.jpeg"),
  firstPoints: require("../assets/badges/first-points.jpeg"),
  loverOfKnowledge: require("../assets/badges/lover-of-knowledge.jpeg"),
};

export interface AchievementStats {
  completedAssignments: number;
  totalPoints: number;
  knowledgeLevel: string | null;
  totalTimeMinutes: number;
  voiceChatSessions: number;
  loginStreak: number;
  perfectScoreCount: number;
  xpLevel: number;
  earlyBirdSessions: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // ─── Регистрация ───────────────────────────────────────────────
  {
    id: "welcome",
    emoji: "🎉",
    image: BADGE_IMAGES.start,
    title: "Старт!",
    description: "Создал аккаунт и начал учиться",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    check: () => true,
  },

  // ─── Задания ───────────────────────────────────────────────────
  {
    id: "first_task",
    emoji: "👣",
    image: BADGE_IMAGES.firstStep,
    title: "Первый шаг",
    description: "Выполнил первое задание",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    check: ({ completedAssignments }) => completedAssignments >= 1,
  },
  {
    id: "five_tasks",
    emoji: "📖",
    image: BADGE_IMAGES.loverOfKnowledge,
    title: "Любитель знаний",
    description: "Выполнил 5 заданий",
    color: "#d97706",
    bgColor: "#fef3c7",
    check: ({ completedAssignments }) => completedAssignments >= 5,
  },
  {
    id: "ten_tasks",
    emoji: "🏆",
    title: "Отличник",
    description: "Выполнил 10 заданий",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    check: ({ completedAssignments }) => completedAssignments >= 10,
  },
  {
    id: "twenty_five_tasks",
    emoji: "💎",
    title: "Мастер заданий",
    description: "Выполнил 25 заданий",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    check: ({ completedAssignments }) => completedAssignments >= 25,
  },
  {
    id: "fifty_tasks",
    emoji: "🚀",
    title: "Покоритель высот",
    description: "Выполнил 50 заданий",
    color: "#3b82f6",
    bgColor: "#dbeafe",
    check: ({ completedAssignments }) => completedAssignments >= 50,
  },
  {
    id: "hundred_tasks",
    emoji: "🌟",
    title: "Легенда учёбы",
    description: "Выполнил 100 заданий",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    check: ({ completedAssignments }) => completedAssignments >= 100,
  },

  // ─── Идеальные результаты ──────────────────────────────────────
  {
    id: "perfect_test",
    emoji: "💯",
    title: "Идеально!",
    description: "Получил 100% в задании",
    color: "#10b981",
    bgColor: "#d1fae5",
    check: ({ perfectScoreCount }) => perfectScoreCount >= 1,
  },
  {
    id: "five_perfect",
    emoji: "🎯",
    title: "5 идеальных тестов",
    description: "5 раз получил 100% в заданиях",
    color: "#6366f1",
    bgColor: "#e0e7ff",
    check: ({ perfectScoreCount }) => perfectScoreCount >= 5,
  },
  {
    id: "ten_perfect",
    emoji: "🏅",
    title: "Перфекционист",
    description: "10 раз получил 100% в заданиях",
    color: "#f43f5e",
    bgColor: "#ffe4e6",
    check: ({ perfectScoreCount }) => perfectScoreCount >= 10,
  },

  // ─── Очки ──────────────────────────────────────────────────────
  {
    id: "points_10",
    emoji: "⭐",
    image: BADGE_IMAGES.firstPoints,
    title: "Первые очки",
    description: "Набрал 10 очков",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    check: ({ totalPoints }) => totalPoints >= 10,
  },
  {
    id: "points_100",
    emoji: "🌟",
    title: "Коллекционер очков",
    description: "Набрал 100 очков",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    check: ({ totalPoints }) => totalPoints >= 100,
  },
  {
    id: "points_500",
    emoji: "💫",
    title: "Звёздный ученик",
    description: "Набрал 500 очков",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    check: ({ totalPoints }) => totalPoints >= 500,
  },
  {
    id: "points_1000",
    emoji: "💰",
    title: "Богатый опытом",
    description: "Набрал 1000 очков",
    color: "#eab308",
    bgColor: "#fefce8",
    check: ({ totalPoints }) => totalPoints >= 1000,
  },
  {
    id: "points_2000",
    emoji: "👑",
    title: "Царь очков",
    description: "Набрал 2000 очков",
    color: "#f97316",
    bgColor: "#ffedd5",
    check: ({ totalPoints }) => totalPoints >= 2000,
  },
  {
    id: "points_5000",
    emoji: "💎",
    title: "Бриллиантовый ученик",
    description: "Набрал 5000 очков",
    color: "#06b6d4",
    bgColor: "#cffafe",
    check: ({ totalPoints }) => totalPoints >= 5000,
  },

  // ─── Уровни знаний ─────────────────────────────────────────────
  {
    id: "level_starter",
    emoji: "🌱",
    title: "Стартовый уровень",
    description: "Начал обучение — уровень Стартовый",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    check: ({ knowledgeLevel }) =>
      ["starter", "beginner", "elementary", "intermediate", "upper_intermediate"].includes(knowledgeLevel ?? ""),
  },
  {
    id: "level_beginner",
    emoji: "🌿",
    title: "Начинающий",
    description: "Достиг уровня Начинающий",
    color: "#06b6d4",
    bgColor: "#cffafe",
    check: ({ knowledgeLevel }) =>
      ["beginner", "elementary", "intermediate", "upper_intermediate"].includes(knowledgeLevel ?? ""),
  },
  {
    id: "level_elementary",
    emoji: "🌳",
    title: "Элементарный",
    description: "Достиг уровня Элементарный",
    color: "#10b981",
    bgColor: "#d1fae5",
    check: ({ knowledgeLevel }) =>
      ["elementary", "intermediate", "upper_intermediate"].includes(knowledgeLevel ?? ""),
  },
  {
    id: "level_intermediate",
    emoji: "🔥",
    title: "Средний уровень",
    description: "Достиг уровня Средний",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    check: ({ knowledgeLevel }) =>
      ["intermediate", "upper_intermediate"].includes(knowledgeLevel ?? ""),
  },
  {
    id: "level_upper",
    emoji: "🚀",
    title: "Продвинутый",
    description: "Достиг уровня Продвинутый!",
    color: "#ef4444",
    bgColor: "#fee2e2",
    check: ({ knowledgeLevel }) => knowledgeLevel === "upper_intermediate",
  },

  // ─── Стрики ────────────────────────────────────────────────────
  {
    id: "streak_3",
    emoji: "🔥",
    title: "Огонь!",
    description: "3 дня подряд в приложении",
    color: "#f97316",
    bgColor: "#ffedd5",
    check: ({ loginStreak }) => loginStreak >= 3,
  },
  {
    id: "streak_7",
    emoji: "⚡",
    title: "Неделя без пауз",
    description: "7 дней подряд в приложении",
    color: "#eab308",
    bgColor: "#fefce8",
    check: ({ loginStreak }) => loginStreak >= 7,
  },
  {
    id: "streak_30",
    emoji: "🏆",
    title: "Месяц силы",
    description: "30 дней подряд в приложении",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    check: ({ loginStreak }) => loginStreak >= 30,
  },

  // ─── Ранняя пташка ────────────────────────────────────────────
  {
    id: "early_bird",
    emoji: "🐦",
    title: "Ранняя пташка",
    description: "Занимался до 9 утра",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    check: ({ earlyBirdSessions }) => earlyBirdSessions >= 1,
  },
  {
    id: "early_bird_5",
    emoji: "🌅",
    title: "Жаворонок",
    description: "5 раз занимался до 9 утра",
    color: "#f97316",
    bgColor: "#ffedd5",
    check: ({ earlyBirdSessions }) => earlyBirdSessions >= 5,
  },

  // ─── Голосовой чат ─────────────────────────────────────────────
  {
    id: "voice_first",
    emoji: "🎤",
    title: "Первый диалог",
    description: "Провёл первый разговор с AI-тьютором",
    color: "#ec4899",
    bgColor: "#fce7f3",
    check: ({ voiceChatSessions }) => voiceChatSessions >= 1,
  },
  {
    id: "voice_5",
    emoji: "🗣️",
    title: "Болтун",
    description: "5 разговоров с AI-тьютором",
    color: "#a855f7",
    bgColor: "#f3e8ff",
    check: ({ voiceChatSessions }) => voiceChatSessions >= 5,
  },
  {
    id: "voice_10",
    emoji: "🎙️",
    title: "Оратор",
    description: "10 разговоров с AI-тьютором",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    check: ({ voiceChatSessions }) => voiceChatSessions >= 10,
  },

  // ─── XP Уровни ────────────────────────────────────────────────
  {
    id: "xp_level_5",
    emoji: "🌟",
    title: "Уровень 5",
    description: "Достиг 5 уровня опыта",
    color: "#06b6d4",
    bgColor: "#cffafe",
    check: ({ xpLevel }) => xpLevel >= 5,
  },
  {
    id: "xp_level_10",
    emoji: "🏅",
    title: "Уровень 10",
    description: "Достиг 10 уровня опыта",
    color: "#ec4899",
    bgColor: "#fce7f3",
    check: ({ xpLevel }) => xpLevel >= 10,
  },
  {
    id: "xp_level_20",
    emoji: "💎",
    title: "Уровень 20",
    description: "Достиг 20 уровня опыта",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    check: ({ xpLevel }) => xpLevel >= 20,
  },
  {
    id: "xp_level_50",
    emoji: "👑",
    title: "Бог знаний",
    description: "Достиг максимального 50 уровня!",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    check: ({ xpLevel }) => xpLevel >= 50,
  },

  // ─── Время ─────────────────────────────────────────────────────
  {
    id: "time_30",
    emoji: "⏱️",
    title: "Начало пути",
    description: "Провёл в приложении 30 минут",
    color: "#6366f1",
    bgColor: "#ede9fe",
    check: ({ totalTimeMinutes }) => totalTimeMinutes >= 30,
  },
  {
    id: "time_120",
    emoji: "⏰",
    title: "Усердный ученик",
    description: "Провёл в приложении 2 часа",
    color: "#6366f1",
    bgColor: "#ede9fe",
    check: ({ totalTimeMinutes }) => totalTimeMinutes >= 120,
  },
  {
    id: "time_600",
    emoji: "🕰️",
    title: "Настоящий марафонец",
    description: "Провёл в приложении 10 часов",
    color: "#6366f1",
    bgColor: "#ede9fe",
    check: ({ totalTimeMinutes }) => totalTimeMinutes >= 600,
  },
  {
    id: "time_1200",
    emoji: "🦾",
    title: "Неутомимый",
    description: "Провёл в приложении 20 часов",
    color: "#3b82f6",
    bgColor: "#dbeafe",
    check: ({ totalTimeMinutes }) => totalTimeMinutes >= 1200,
  },
];

export function getUnlockedAchievements(stats: AchievementStats): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.check(stats));
}

export function getLockedAchievements(stats: AchievementStats): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !a.check(stats));
}
