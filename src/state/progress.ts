// src/state/progress.ts
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { UnitId } from "../types";
import { supabase } from "../supabaseClient";
import { useAuth } from "./AuthContext";

// === 型別定義 ===
export type BadgeUnlockEvent = {
  key: string;       // 例如 "STORY_FAN"
  tier: BadgeTier;   // 1, 2, 3
  unlockedAt: string;
};

export type Progress = {
  byUnit: Record<UnitId, UnitProgress>;
  badges: Record<string, BadgeProgress>;
  stats: UserStats;
  totalXP: number;
  /** 本次狀態更新中「新解鎖或升級」的獎章事件（給 toast 用） */
  lastBadgeEvents?: BadgeUnlockEvent[];
};

export type BadgeTier = 0 | 1 | 2 | 3; // 0: 未解鎖, 1: 銅, 2: 銀, 3: 金

export type BadgeProgress = {
  tier: BadgeTier;
  unlockedAt?: string;
};

export type UnitProgress = {
  stars: number; // 單元整體 0–3 星
  xp: number;
  vocab: { studied: number; quizBest: number };
  grammar: { studied: number; reorderBest: number };
  text: { read: number; arrangeBest: number };
  challenge: {
    clearedLevels: number; // 最大通關關卡（相容舊版）
    bestTimeSec: number;   // 全單元最佳時間
    bestScore: number;     // 全單元最佳分數
    levels: Record<
      number,
      {
        bestScore: number;
        bestTimeSec: number;
        stars: number;
        passed?: boolean;
      }
    >;
  };
};

// 用於獎章評估的統計數據
export type UserStats = {
  totalLogins: number;      // 總登入次數
  totalTimeSec: number;     // 總學習秒數
  totalErrors: number;      // 累積錯誤次數
  totalHints: number;       // 使用提示次數
  totalRetries: number;     // 失敗後重試次數
  gamesPlayed: number;      // 小遊戲遊玩總數
  perfectRuns: number;      // 滿分通關次數
  storiesRead: number;      // 完整閱讀故事次數

  // 進階鼓勵類用
  longSessions: number;     // 單次長時間學習（例如 >= 20 分鐘）的次數
  closeCalls: number;       // 險勝（剛好及格）的次數
  comebackRuns: number;     // 成績大幅進步的次數
  failedChallenges: number; // 挑戰失敗次數
  // === 新增的統計欄位 ===

  /** 目前連續玩遊戲的場數（切去學習就歸 0） */
  currentGameStreak: number;

  /** 曾經達到過的最大連續遊戲場數（用來判斷 GAME_LOVER） */
  maxGameStreak: number;

  /** 句子排列遊戲獲得「滿分」的累積次數（ARRANGE_PRO 用） */
  arrangePerfectRuns: number;

  /** 貪吃蛇中吃到正確單字的累積總數（ACCURACY_GOD 用） */
  snakeCorrectTotal: number;
};



// === 獎章定義 ===
// thresholds: [銅, 銀, 金]
// reverse = true 表示「數值越小越好」（例如時間越短越好）

export const BADGE_QR: Record<
  string,
  { type: "participation" | "skill" | "encouragement"; thresholds: [number, number, number]; reverse?: boolean }
> = {
  // 參與類 Participation —— 只要願意做就有
  LOGIN_STREAK: { type: "participation", thresholds: [1, 5, 20] },          // 總登入次數
  TIME_KEEPER: { type: "participation", thresholds: [180, 480, 900] },  // 累積時間：3 分 / 8 小時 / 15 小時
STORY_FAN: { type: "participation", thresholds: [1, 5, 10] }, // 完整閱讀故事 1 / 5 / 10 次
  GAME_LOVER: { type: "participation", thresholds: [3, 6, 10] },        // 遊玩小遊戲次數
  VOCAB_DRILLER: { type: "participation", thresholds: [3, 10, 30] },        // 單字練習次數
  GRAMMAR_NERD: { type: "participation", thresholds: [3, 10, 30] },        // 文法練習次數
  XP_COLLECTOR: { type: "participation", thresholds: [100, 500, 2000] },   // 累積 XP
  UNIT_EXPLORER: { type: "participation", thresholds: [1, 3, 6] },          // 解鎖單元數
  CLICK_MASTER: { type: "participation", thresholds: [50, 200, 1000] },    // 互動總數（以 gamesPlayed + hints 等近似）
  REVIEWER: { type: "participation", thresholds: [2, 10, 20] },        // 複習（重複遊玩）

  // 技巧類 Skill —— 給高成就 / 實力導向的學生
  SNAKE_MASTER: { type: "skill", thresholds: [10, 30, 60] },               // 貪吃蛇最高分
  TETRIS_ARCH: { type: "skill", thresholds: [10, 40, 80] },               // 文法 Tetris 消行數
  QUIZ_SNIPER: { type: "skill", thresholds: [1, 5, 10] },                 // 單字／關卡滿分次數
  // 秒數越少越好：銅 50s、銀 40s、金 30s
  SPEED_DEMON: { type: "skill", thresholds: [50, 40, 30], reverse: true },
  CHALLENGE_KING: { type: "skill", thresholds: [1, 5, 10] },                 // 挑戰模式滿分關數
  STAR_CATCHER: { type: "skill", thresholds: [3, 9, 18] },                 // 總星星數
  ARRANGE_PRO: { type: "skill", thresholds: [1, 5, 10] },                 // 排列句子滿分次數
  ACCURACY_GOD: { type: "skill", thresholds: [5, 15, 30] },                // 高準確率通關次數（以 perfectRuns 代理）
  LEVEL_CRUSHER: { type: "skill", thresholds: [2, 10, 30] },                // 通過關卡總數
  UNIT_MASTER: { type: "skill", thresholds: [1, 3, 6] },                  // 滿星單元數

  // 鼓勵類 Encouragement —— 獎勵失敗、嘗試與堅持
  PERSISTENT: { type: "encouragement", thresholds: [5, 20, 50] },        // 累積錯誤
  CURIOUS_MIND: { type: "encouragement", thresholds: [3, 10, 30] },        // 使用提示
  NEVER_GIVE_UP: { type: "encouragement", thresholds: [1, 5, 15] },         // 重試次數
  MARATHONER: { type: "encouragement", thresholds: [1, 3, 10] },         // 長時間學習次數
  TRY_HARD: { type: "encouragement", thresholds: [10, 50, 100] },      // 總嘗試數（遊戲 + 重試）
  SLOW_STEADY: { type: "encouragement", thresholds: [1, 5, 10] },         // 穩紮穩打（這裡以 longSessions 近似）
  COMEBACK_KID: { type: "encouragement", thresholds: [1, 3, 5] },          // 逆轉勝
  PRACTICE_MAKE: { type: "encouragement", thresholds: [5, 15, 30] },        // 練習次數（遊戲數）
  BRAVE_HEART: { type: "encouragement", thresholds: [1, 5, 10] },         // 挑戰失敗次數
  SURVIVOR: { type: "encouragement", thresholds: [1, 3, 5] },          // 低空飛過次數
};

// === 預設值 ===

const defaultUnitProgress = (): UnitProgress => ({
  stars: 0,
  xp: 0,
  vocab: { studied: 0, quizBest: 0 },
  grammar: { studied: 0, reorderBest: 0 },
  text: { read: 0, arrangeBest: 0 },
  challenge: {
    clearedLevels: 0,
    bestTimeSec: 0,
    bestScore: 0,
    levels: {},
  },
});

const defaultProgress = (): Progress => ({
  // 這裡假設 UnitId 是 1–6，如果未來有更多單元可再補
  byUnit: {
    1: defaultUnitProgress(),
    2: defaultUnitProgress(),
    3: defaultUnitProgress(),
    4: defaultUnitProgress(),
    5: defaultUnitProgress(),
    6: defaultUnitProgress(),
  } as unknown as Record<UnitId, UnitProgress>,
  badges: {},
  stats: {
    totalLogins: 0,
    totalTimeSec: 0,
    totalErrors: 0,
    totalHints: 0,
    totalRetries: 0,
    gamesPlayed: 0,
    perfectRuns: 0,
    storiesRead: 0,
    longSessions: 0,
    closeCalls: 0,
    comebackRuns: 0,
    failedChallenges: 0,


    currentGameStreak: 0,
    maxGameStreak: 0,
    arrangePerfectRuns: 0,
    snakeCorrectTotal: 0,
  },
  totalXP: 0,
  lastBadgeEvents: [],
});

// === 工具函式 ===

function computeStars(u: UnitProgress): number {
  let s = 0;
  if (u.vocab.quizBest >= 8) s++;
  if (u.grammar.reorderBest >= 1) s++; // 做過一次文法遊戲就給一顆
  if (u.text.arrangeBest >= 8) s++;
  return s;
}

function checkTier(
  current: number,
  thresholds: [number, number, number],
  isReverse = false
): BadgeTier {
  if (isReverse) {
    // 數值越小越好（例如秒數）：必須 > 0 才算
    if (current > 0 && current <= thresholds[2]) return 3; // 金
    if (current > 0 && current <= thresholds[1]) return 2; // 銀
    if (current > 0 && current <= thresholds[0]) return 1; // 銅
  } else {
    // 數值越大越好
    if (current >= thresholds[2]) return 3;
    if (current >= thresholds[1]) return 2;
    if (current >= thresholds[0]) return 1;
  }
  return 0;
}

// === 給獎章/介面共用：計算每個獎章目前的「數值」 ===
export function getBadgeValue(key: string, p: Progress): number {
  const s = p.stats;
  const units = Object.values(p.byUnit);

  switch (key) {
    // Participation
    case "LOGIN_STREAK":
      return s.totalLogins;
    case "TIME_KEEPER":
      return s.totalTimeSec;
    case "STORY_FAN":
      return s.storiesRead;
    // GAME_LOVER：最大連續遊戲場數
    case "GAME_LOVER":
      return s.maxGameStreak;
    case "VOCAB_DRILLER":
      return units.reduce((acc, u) => acc + u.vocab.studied, 0);
    case "GRAMMAR_NERD":
      return units.reduce((acc, u) => acc + u.grammar.studied, 0);
    case "XP_COLLECTOR":
      return p.totalXP;
    case "UNIT_EXPLORER":
      return units.filter((u) => u.xp > 0).length;
    case "CLICK_MASTER":
      return s.gamesPlayed + s.storiesRead + s.totalHints;
    case "REVIEWER":
      return s.gamesPlayed;

    // Skill
    case "SNAKE_MASTER": {
      const maxSnake = Math.max(...units.map((u) => u.vocab.quizBest), 0);
      return maxSnake;
    }
    case "TETRIS_ARCH": {
      const maxTetris = Math.max(
        ...units.map((u) => u.grammar.reorderBest),
        0
      );
      return maxTetris;
    }
    case "QUIZ_SNIPER":
      return s.perfectRuns;
    case "SPEED_DEMON": {
      const allTimes = units
        .map((u) => u.challenge.bestTimeSec)
        .filter((t) => t > 0);
      const fastest = allTimes.length > 0 ? Math.min(...allTimes) : 0;
      return fastest;
    }
    case "CHALLENGE_KING": {
      const challengeFullMarks = units.reduce(
        (acc, u) => acc + (u.challenge.bestScore === 10 ? 1 : 0),
        0
      );
      return challengeFullMarks;
    }
    case "STAR_CATCHER": {
      const challengeStars = units.reduce((acc, u) => {
        const levelStars = Object.values(u.challenge.levels || {}).reduce(
          (sum, lv) => sum + (lv.stars ?? 0),
          0
        );
        return acc + levelStars;
      }, 0);
      return challengeStars;
    }
    case "ARRANGE_PRO":
      return s.arrangePerfectRuns;
    case "ACCURACY_GOD":
      return s.snakeCorrectTotal;
    case "LEVEL_CRUSHER": {
      const totalCleared = units.reduce(
        (acc, u) => acc + u.challenge.clearedLevels,
        0
      );
      return totalCleared;
    }
    case "UNIT_MASTER": {
      // 目前你用「挑戰區星星總數」當指標
      const challengeStars = units.reduce((acc, u) => {
        const levelStars = Object.values(u.challenge.levels || {}).reduce(
          (sum, lv) => sum + (lv.stars ?? 0),
          0
        );
        return acc + levelStars;
      }, 0);
      return challengeStars;
    }

    // Encouragement
    case "PERSISTENT":
      return s.totalErrors;
    case "CURIOUS_MIND":
      return s.totalHints;
    case "NEVER_GIVE_UP":
      return s.totalRetries;
    case "MARATHONER":
      return s.longSessions;
    case "TRY_HARD":
      return s.gamesPlayed + s.totalRetries;
    case "SLOW_STEADY":
      return s.longSessions;
    case "COMEBACK_KID":
      return s.comebackRuns;
    case "PRACTICE_MAKE":
      return s.gamesPlayed;
    case "BRAVE_HEART":
      return s.failedChallenges;
    case "SURVIVOR":
      return s.closeCalls;

    default:
      return 0;
  }
}


// 依據目前 Progress 計算所有獎章
function evaluateBadges(p: Progress): Progress {
  const nextBadges: Record<string, BadgeProgress> = { ...p.badges };
  const unlockedEvents: BadgeUnlockEvent[] = [];

  for (const key of Object.keys(BADGE_QR)) {
    const def = BADGE_QR[key];
    const currentVal = getBadgeValue(key, p);
    const newTier = checkTier(currentVal, def.thresholds, def.reverse);
    const oldTier = nextBadges[key]?.tier ?? 0;

    if (newTier > oldTier) {
      const ts = new Date().toISOString();
      nextBadges[key] = { tier: newTier, unlockedAt: ts };
      unlockedEvents.push({ key, tier: newTier, unlockedAt: ts });
    }
  }

  return {
    ...p,
    badges: nextBadges,
    // 這次狀態更新中，新解鎖 / 升級的獎章清單（給 UI 當 toast 觸發）
    lastBadgeEvents: unlockedEvents,
  };
}


// === Reducer ===

type ReportPayload = Partial<UserStats> & {
  /** 這次的回報是「遊戲」行為 */
  isGame?: boolean;
  /** 這次的回報是「學習」行為 */
  isLearn?: boolean;
};

type Action =
  | { type: "ADD_XP"; unit: UnitId; amount: number }
  | { type: "PATCH_UNIT"; unit: UnitId; patch: Partial<UnitProgress> }
  | { type: "REPORT_ACTIVITY"; payload: ReportPayload }
  | { type: "RESET" }
  | { type: "LOAD"; progress: Progress };


function reducer(state: Progress, action: Action): Progress {
  switch (action.type) {
    case "ADD_XP": {
      const byUnit = { ...state.byUnit };
      const u = byUnit[action.unit] ?? defaultUnitProgress();
      const nextUnit: UnitProgress = { ...u, xp: u.xp + action.amount };
      nextUnit.stars = computeStars(nextUnit);
      byUnit[action.unit] = nextUnit;
      return evaluateBadges({
        ...state,
        byUnit,
        totalXP: state.totalXP + action.amount,
      });
    }
    case "PATCH_UNIT": {
      const byUnit = { ...state.byUnit };
      const prev = byUnit[action.unit] ?? defaultUnitProgress();
      const patch = action.patch as any;
      const nextUnit: UnitProgress = {
        ...prev,
        ...patch,
        vocab: { ...prev.vocab, ...(patch.vocab ?? {}) },
        grammar: { ...prev.grammar, ...(patch.grammar ?? {}) },
        text: { ...prev.text, ...(patch.text ?? {}) },
        challenge: { ...prev.challenge, ...(patch.challenge ?? {}) },
      };
      nextUnit.stars = computeStars(nextUnit);
      byUnit[action.unit] = nextUnit;
      return evaluateBadges({ ...state, byUnit });
    }

    case "REPORT_ACTIVITY": {
      const stats: UserStats = { ...state.stats };
      const { isGame, isLearn, ...rest } = action.payload;

      // 1. 一般數值累加（UserStats 裡對應的欄位都會 +）
      Object.entries(rest).forEach(([k, v]) => {
        if (typeof v === "number") {
          const key = k as keyof UserStats;
          stats[key] = (stats[key] ?? 0) + v;
        }
      });

      // 2. Streak 邏輯（GAME_LOVER 用）
      if (isGame) {
        stats.currentGameStreak = (stats.currentGameStreak ?? 0) + 1;
        stats.maxGameStreak = Math.max(
          stats.maxGameStreak ?? 0,
          stats.currentGameStreak
        );
      }

      if (isLearn) {
        // 一旦去做學習活動，就視為中斷遊戲連續
        stats.currentGameStreak = 0;
      }

      return evaluateBadges({ ...state, stats });
    }

    case "RESET":
      return defaultProgress();
    case "LOAD":
      return evaluateBadges(action.progress);
    default:
      return state;
  }
}

// === Hook ===

export function useProgress() {
  const { session } = useAuth();
  const userId = session?.user?.id as string | undefined;

  const [progress, dispatch] = useReducer(reducer, undefined, defaultProgress);
  const [loading, setLoading] = useState(true);
  const isSaving = useRef(false);

  // 從 Supabase 載入
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    restore(userId)
      .then((p) => {
        // 登入次數 +1
        p.stats.totalLogins = (p.stats.totalLogins ?? 0) + 1;
        dispatch({ type: "LOAD", progress: p });
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // 自動存檔
  useEffect(() => {
    if (!userId || loading) return;
    if (isSaving.current) return;
    isSaving.current = true;
    persist(progress, userId).finally(() => {
      isSaving.current = false;
    });
  }, [progress, userId, loading]);

  // 封裝操作
  const addXP = useCallback(
    (unit: UnitId, amount: number) =>
      dispatch({ type: "ADD_XP", unit, amount }),
    []
  );

  const patchUnit = useCallback(
    (unit: UnitId, patch: Partial<UnitProgress>) =>
      dispatch({ type: "PATCH_UNIT", unit, patch }),
    []
  );

  const reportActivity = useCallback(
    (payload: ReportPayload) =>
      dispatch({ type: "REPORT_ACTIVITY", payload }),
    []
  );

  // 給 Grammar Tetris 用
  const reportGrammarTetris = useCallback(
    (payload: { roundsPlayed: number; reason: "completed" | "no-fit" | "wrong-limit" }) => {
      reportActivity({
        isGame: true,  // ✅ 這是一場遊戲
        gamesPlayed: 1,
        failedChallenges: payload.reason === "wrong-limit" ? 1 : 0,
        // 你也可以加上互動量的概念（之後要做 TOTAL_STEPS 時很好用）
        // interactionCount: payload.roundsPlayed * 5,
      });
    },
    [reportActivity]
  );

  // 給 Snake 用
  const reportSnake = useCallback(
    (payload: { correct: number; total: number; wrong: number; usedTime?: number }) => {
      reportActivity({
        isGame: true,  // ✅ 這是一場遊戲
        gamesPlayed: 1,
        totalErrors: payload.wrong,
        totalTimeSec: payload.usedTime ?? 0,
        snakeCorrectTotal: payload.correct, // ✅ 對 ACCURACY_GOD / SNAKE_EATER 用
        // interactionCount: payload.correct + payload.wrong,
      });
    },
    [reportActivity]
  );


  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    progress,
    addXP,
    patchUnit,
    reportActivity,
    reportGrammarTetris,
    reportSnake,
    reset,
    loadingProgress: loading,
  };
}

// === Supabase 存取 ===

async function restore(userId: string): Promise<Progress> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("progress")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[progress.restore] error:", error);
      return defaultProgress();
    }

    if (data?.progress && typeof data.progress === "object") {
      const remote = data.progress as Partial<Progress>;
      const def = defaultProgress();
      return {
        ...def,
        ...remote,
        byUnit: { ...def.byUnit, ...(remote.byUnit ?? {}) },
        badges: { ...def.badges, ...(remote.badges ?? {}) },
        stats: { ...def.stats, ...(remote.stats ?? {}) },
      };
    }
  } catch (e) {
    console.error("[progress.restore] exception:", e);
  }
  return defaultProgress();
}

async function persist(p: Progress, userId: string) {
  try {
    const { error } = await supabase
    .from("profiles")
      .update({
        progress: p,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (error){
        console.error("[progress.persist] error:", error);
      }
  } catch (e) {
    console.error("[progress.persist] exception:", e);
  }
}
