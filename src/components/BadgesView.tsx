// src/components/BadgesView.tsx
import type { Progress, BadgeTier } from "../state/progress";
import { BADGE_QR } from "../state/progress";

// 顯示文字（名稱 + 說明）
const BADGE_META: Record<string, { name: string; desc: string }> = {
 
  // 參與類 Participation —— 短期實驗版
  LOGIN_STREAK:   { name: "任務參與者", desc: "在平台中進行多次學習或遊戲行為" },
  TIME_KEEPER:    { name: "練習場次", desc: "完成多場遊戲或測驗" },
  STORY_FAN:      { name: "故事迷", desc: "多次閱讀課文故事" },
  GAME_LOVER:     { name: "遊戲玩家", desc: "多次參與遊戲化活動" },
  VOCAB_DRILLER:  { name: "單字練習者", desc: "反覆進行單字學習" },
  GRAMMAR_NERD:   { name: "文法練習者", desc: "反覆進行文法學習" },
  XP_COLLECTOR:   { name: "經驗收藏家", desc: "累積相當多的 XP 點數" },
  UNIT_EXPLORER:  { name: "活動探索者", desc: "嘗試不同種類的學習活動" },
  CLICK_MASTER:   { name: "行動派", desc: "進行各種互動與點擊操作" },
  REVIEWER:       { name: "溫故知新", desc: "多次重複遊玩或測驗" },

  // 技巧類 Skill
  SNAKE_MASTER:   { name: "貪吃蛇王", desc: "貪吃蛇高分高手" },
  TETRIS_ARCH:    { name: "方塊建築師", desc: "文法方塊高手" },
  QUIZ_SNIPER:    { name: "神射手", desc: "多次拿到滿分" },
  SPEED_DEMON:    { name: "極速傳說", desc: "以極快速度完成挑戰" },
  CHALLENGE_KING: { name: "挑戰王者", desc: "挑戰模式滿分關卡" },
  STAR_CATCHER:   { name: "摘星者", desc: "收集大量星星" },
  ARRANGE_PRO:    { name: "組句高手", desc: "句子排列滿分" },
  ACCURACY_GOD:   { name: "精準打擊", desc: "高準確率通關" },
  LEVEL_CRUSHER:  { name: "過關斬將", desc: "通過許多關卡" },
  UNIT_MASTER:    { name: "單元制霸", desc: "多個單元達到三星" },

  // 鼓勵類 Encouragement
  PERSISTENT:     { name: "越挫越勇", desc: "從錯誤中不斷學習" },
  CURIOUS_MIND:   { name: "求知若渴", desc: "善用提示功能" },
  NEVER_GIVE_UP:  { name: "永不放棄", desc: "失敗後依然重試" },
  MARATHONER:     { name: "馬拉松", desc: "長時間專注學習" },
  TRY_HARD:       { name: "勤能補拙", desc: "持續嘗試不怕累" },
  SLOW_STEADY:    { name: "穩紮穩打", desc: "花時間慢慢前進" },
  COMEBACK_KID:   { name: "逆轉勝", desc: "成績大幅進步" },
  PRACTICE_MAKE:  { name: "熟能生巧", desc: "大量練習" },
  BRAVE_HEART:    { name: "勇敢的心", desc: "面對失敗不退縮" },
  SURVIVOR:       { name: "倖存者", desc: "低空飛過也是成功" },
};

// 等級樣式
const TIER_STYLES: Record<BadgeTier, string> = {
  0: "bg-neutral-100 text-neutral-400 border-neutral-200 grayscale opacity-70",
  1: "bg-orange-50 text-amber-800 border-orange-200",
  2: "bg-slate-100 text-slate-800 border-slate-300",
  3: "bg-yellow-50 text-yellow-800 border-yellow-300 ring-1 ring-yellow-200 shadow-sm",
};

const TIER_NAMES: Record<BadgeTier, string> = {
  0: "未解鎖",
  1: "銅級",
  2: "銀級",
  3: "金級",
};

const TIER_ICONS: Record<BadgeTier, string> = {
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

                    <div className="mt-3 pt-2 border-t border-black/5 flex justify-between items-center text-[10px]">
                      <span className="font-mono bg-black/5 px-1.5 py-0.5 rounded">
                        {tierName}
                      </span>
                      <span className="opacity-60 text-right leading-tight">
                        目標：
                        <br />
                        銅 {bronze} / 銀 {silver} / 金 {gold}
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
