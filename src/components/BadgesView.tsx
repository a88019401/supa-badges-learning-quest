// src/components/BadgesView.tsx
import type { Progress, BadgeTier } from "../state/progress";
import { BADGE_QR, getBadgeValue } from "../state/progress";

// 顯示文字（名稱 + 說明）
export const BADGE_META: Record<string, { name: string; desc: string }> = {
  // 參與類 Participation
  LOGIN_STREAK: { name: "持之以恆", desc: "累積登入學習的天數" },
  TIME_KEEPER: { name: "時間管理者", desc: "累積學習時數" },
  STORY_FAN: { name: "故事迷", desc: "完整讀完課文故事很多次" },
  GAME_LOVER: { name: "遊戲狂熱", desc: "遊玩小遊戲" },
  VOCAB_DRILLER: { name: "單字達人", desc: "完成單字練習" },
  GRAMMAR_NERD: { name: "文法專家", desc: "完成文法練習" },
  XP_COLLECTOR: { name: "經驗收藏家", desc: "累積 XP 點數" },
  UNIT_EXPLORER: { name: "探險家", desc: "解鎖不同單元" },
  CLICK_MASTER: { name: "行動派", desc: "熱衷各種點擊互動" },
  REVIEWER: { name: "溫故知新", desc: "願意多次重複練習" },

  // 技巧類 Skill
  SNAKE_MASTER: { name: "貪吃蛇王", desc: "貪吃蛇高分高手" },
  TETRIS_ARCH: { name: "方塊建築師", desc: "文法方塊高手" },
  QUIZ_SNIPER: { name: "學院派", desc: "多次拿到滿分" },
  SPEED_DEMON: { name: "極速傳說", desc: "以極快速度完成挑戰" },
  CHALLENGE_KING: { name: "挑戰王者", desc: "挑戰模式滿分關卡" },
  STAR_CATCHER: { name: "摘星者", desc: "收集大量星星" },
  ARRANGE_PRO: { name: "組句高手", desc: "句子排列滿分" },
  ACCURACY_GOD: { name: "精準打擊", desc: "高準確率通關" },
  LEVEL_CRUSHER: { name: "過關斬將", desc: "通過許多關卡" },
  UNIT_MASTER: { name: "單元制霸", desc: "多個單元達到三星" },

  // 鼓勵類 Encouragement
  PERSISTENT: { name: "越挫越勇", desc: "從錯誤中不斷學習" },
  CURIOUS_MIND: { name: "求知若渴", desc: "善用提示功能" },
  NEVER_GIVE_UP: { name: "永不放棄", desc: "失敗後依然重試" },
  MARATHONER: { name: "馬拉松", desc: "長時間專注學習" },
  TRY_HARD: { name: "勤能補拙", desc: "持續嘗試不怕累" },
  SLOW_STEADY: { name: "穩紮穩打", desc: "花時間慢慢前進" },
  COMEBACK_KID: { name: "逆轉勝", desc: "成績大幅進步" },
  PRACTICE_MAKE: { name: "熟能生巧", desc: "大量練習" },
  BRAVE_HEART: { name: "勇敢的心", desc: "面對失敗不退縮" },
  SURVIVOR: { name: "倖存者", desc: "低空飛過也是成功" },
};

// 等級樣式
export const TIER_STYLES: Record<BadgeTier, string> = {
  0: "bg-neutral-100 text-neutral-400 border-neutral-200 grayscale opacity-70",
  1: "bg-orange-50 text-amber-800 border-orange-200",
  2: "bg-slate-100 text-slate-800 border-slate-300",
  3: "bg-yellow-50 text-yellow-800 border-yellow-300 ring-1 ring-yellow-200 shadow-sm",
};

export const TIER_NAMES: Record<BadgeTier, string> = {
  0: "未解鎖",
  1: "銅級",
  2: "銀級",
  3: "金級",
};

export const TIER_ICONS: Record<BadgeTier, string> = {
  0: "🔒",
  1: "🥉",
  2: "🥈",
  3: "🥇",
};

export default function BadgesView({ progress }: { progress: Progress }) {
  const categories: Record<"participation" | "skill" | "encouragement", string> = {
    participation: "參與類 Participation",
    skill: "技巧類 Skill",
    encouragement: "鼓勵類 Encouragement",
  };

  return (
    <div className="space-y-8 pb-10">
      {(["participation", "skill", "encouragement"] as const).map((cat) => (
        <section key={cat} className="space-y-3">
          <h3 className="text-xl font-bold text-neutral-800 border-l-4 border-neutral-800 pl-3">
            {categories[cat]}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Object.entries(BADGE_QR)
              .filter(([, cfg]) => cfg.type === cat)
              .map(([key, cfg]) => {
                const meta = BADGE_META[key] ?? { name: key, desc: "" };
                const userBadge = progress.badges[key] ?? { tier: 0 as BadgeTier };
                const tier = userBadge.tier;
                const style = TIER_STYLES[tier];
                const icon = TIER_ICONS[tier];
                const tierName = TIER_NAMES[tier];

                const [bronze, silver, gold] = cfg.thresholds;
                const currentVal = getBadgeValue(key, progress);
                const isReverse = !!cfg.reverse;

                // 計算「下一級門檻」和文字（銅→銀→金）
                let nextTarget = 0;
                let nextTierLabel = "";
                if (tier === 0) {
                  nextTarget = bronze;
                  nextTierLabel = "銅級";
                } else if (tier === 1) {
                  nextTarget = silver;
                  nextTierLabel = "銀級";
                } else if (tier === 2) {
                  nextTarget = gold;
                  nextTierLabel = "金級";
                }

                let diffText = "";
                if (tier === 3) {
                  diffText = "已達最高等級！";
                } else if (!isReverse) {
                  const remain = Math.max(0, nextTarget - currentVal);
                  diffText =
                    remain === 0
                      ? `已達 ${nextTierLabel} 門檻`
                      : `還差 ${remain} 才能升到 ${nextTierLabel}`;
                } else {
                  // reverse：數值越小越好（例如秒數）
                  if (currentVal === 0) {
                    diffText = "尚未有紀錄，先完成一次挑戰看看。";
                  } else if (currentVal <= nextTarget) {
                    diffText = `已達 ${nextTierLabel} 門檻`;
                  } else {
                    const faster = currentVal - nextTarget;
                    diffText = `再快約 ${Math.round(faster)} 秒，可達 ${nextTierLabel}`;
                  }
                }

                // 進度條比例：非 reverse 用「相對金牌」，reverse 用「越接近銅門檻越滿」
                let ratio = 0;
                if (!isReverse) {
                  ratio = gold > 0 ? Math.min(currentVal / gold, 1) : 0;
                } else {
                  if (currentVal > 0) {
                    // 時間越少越好：達到金牌門檻就滿格
                    if (currentVal <= gold) ratio = 1;
                    else ratio = Math.min(bronze / currentVal, 1);
                  } else {
                    ratio = 0;
                  }
                }

                return (
                  <div
                    key={key}
                    className={`relative p-4 rounded-2xl border transition hover:scale-[1.02] cursor-default ${style}`}
                    title={meta.desc}
                  >
                    <div className="text-3xl mb-2 text-center drop-shadow-sm">{icon}</div>
                    <div className="font-bold text-center text-sm mb-1">{meta.name}</div>
                    <div className="text-xs text-center opacity-80 min-h-[2.5em] flex items-center justify-center">
                      {meta.desc}
                    </div>

                    {/* 進度條區塊 */}
                    <div className="mt-3">
                      <div className="h-1.5 w-full rounded-full bg-black/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all"
                          style={{ width: `${Math.round(ratio * 100)}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[10px] text-neutral-700 leading-snug text-left">
                        {!isReverse ? (
                          <>
                            目前：<span className="font-mono">{currentVal}</span>{" "}
                            {tier < 3 && (
                              <>
                                ｜{diffText}
                              </>
                            )}
                            {tier === 3 && <>｜{diffText}</>}
                          </>
                        ) : (
                          <>
                            最佳紀錄：
                            <span className="font-mono">
                              {currentVal > 0 ? `${currentVal} 秒` : "—"}
                            </span>
                            {diffText && <>｜{diffText}</>}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-black/5 flex justify-between items-center text-[10px]">
                      <span className="font-mono bg-black/5 px-1.5 py-0.5 rounded">
                        {tierName}
                      </span>
                      <span className="opacity-60 text-right leading-tight">
                        目標：
                        <br />
                        銅 {bronze}／銀 {silver}／金 {gold}
                      </span>
                    </div>
                  </div>
                );
              })}

          </div>
        </section>
      ))}
    </div>
  );
}
