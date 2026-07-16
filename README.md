# LearningQuest 控制組｜程式系統交接文件

> 文件日期：2026-07-17  
> 適用範圍：**本對話上傳的控制組程式碼**  
> 後端：控制組與實驗組共用同一個 Supabase 專案與資料庫 Schema  
> 重要：本 README 依照實際程式重新盤點；舊 README 中「30 枚獎章、所有 Unit 已開放、課文功能已上線」等描述與目前程式不一致。

## 1. 專案現況

LearningQuest 控制組是以 React 19、TypeScript、Vite 7、Tailwind CSS 4 與 Supabase 建立的國中英文遊戲式學習網站。正式介面目前固定使用 **Unit 1：國中第六冊會考複習**，提供：

- Email／密碼登入、註冊與個人資料設定
- 單字卡與瀏覽器文字轉語音
- 貪吃蛇單字遊戲
- 文法技能樹
- 文法方塊遊戲
- Unit 1 十關固定選擇題挑戰
- 20 枚固定獎章（銅／銀／金）
- 貪吃蛇、方塊與獎章排行榜
- LSA 行為事件紀錄
- `profiles.progress` JSONB 雲端進度儲存

### 目前實際開放／隱藏功能

| 功能 | 狀態 | 說明 |
| --- | --- | --- |
| Unit 1 | 開放 | `unitId` 固定為 1 |
| Unit 2-5 | 資料存在但 UI 不可切換 | 單元切換區被註解；未做正式回歸測試 |
| 單字集 | 開放 | 收集卡片、TTS、XP 與獎章統計 |
| 貪吃蛇 | 開放 | Unit 1 實際最多 30 題；無總時間限制 |
| 單字四選一 | 程式存在但入口隱藏 | `VocabQuiz` 仍保留 |
| 文法說明 | 開放 | 卡片式技能樹 |
| 文法方塊 | 開放 | 組句後放置三個方塊，消行／列計分 |
| 課文故事／句型排列 | 程式存在但入口隱藏 | `text` Tab 被註解 |
| Challenge Level 1-10 | 開放 | 每關固定 10 題、每題 20 秒 |
| 固定獎章 | 開放 | 實際共 20 枚，不是 30 枚 |

## 2. 技術與環境

- Node.js：Vite 7.2.4 要求 `^20.19.0 || >=22.12.0`
- 建議：Node.js 22 LTS
- React 19.1.1 / React DOM 19.1.1
- TypeScript 5.8.3
- Vite 7.2.4（由 lockfile 安裝）
- Tailwind CSS 4.1.12
- Supabase JS 2.75.0
- dnd-kit：排序與拖曳方塊
- Heroicons：單字發音圖示

### 安裝

```bash
git clone <CONTROL_GROUP_REPOSITORY_URL>
cd <PROJECT_DIRECTORY>
npm ci
cp .env.example .env.local   # 若 repository 未附範例，手動建立
npm run dev
```

`.env.local`：

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

不得把 `service_role` 金鑰放入 Vite 前端環境變數。

### 常用指令

```bash
npm run dev      # 開發伺服器
npm run build    # TypeScript + production build
npm run lint     # ESLint
npm run preview  # 預覽 dist
npm audit        # 依賴弱點檢查
```

### 本次實測結果（2026-07-17）

- `npm ci`：成功
- `npm run build`：成功
- JS bundle：547.47 kB，gzip 173.67 kB；Vite 顯示超過 500 kB 警告
- `npm run lint`：失敗，40 errors、1 warning
- `npm audit`：13 vulnerabilities（1 low、4 moderate、8 high）
- 挑戰題庫結構驗證：10 關 × 10 題，共 100 題；ID 無重複；每題 4 選項且 `correctIndex` 均有效
- 尚無 unit test、component test、E2E test 或 CI

## 3. 架構總覽

```text
main.tsx
└─ AuthProvider
   └─ App
      ├─ AuthGate                    未登入
      ├─ ProfileSetup                已登入但 full_name 未建立
      └─ LearningQuestApp            主程式
         ├─ useProgress              profiles.progress 雲端狀態
         ├─ Learn
         │  ├─ VocabSet
         │  ├─ SnakeChallenge
         │  ├─ GrammarExplain
         │  └─ ReorderSentenceGame
         ├─ ChallengeRun             Unit 1 level-1...level-10.json
         ├─ BadgesView
         └─ Leaderboard
```

### 認證流程

1. `AuthProvider` 先呼叫 `supabase.auth.getSession()`。
2. `onAuthStateChange` 監聽登入、登出與 token refresh。
3. 有 session 時從 `profiles` 讀取 `id, full_name, school, grade`。
4. 無 session 顯示 `AuthGate`。
5. 有 session 但沒有 `profile.full_name` 顯示 `ProfileSetup`。
6. 個人資料完成後顯示 `LearningQuestApp`。

注意：`ProfileSetup` 現在使用 `update`，所以必須確保新使用者 trigger 已先建立 `profiles` 列。

### 進度流程

```text
UI callback
→ addXP / patchUnit / reportActivity
→ reducer
→ evaluateBadges
→ React progress state
→ useEffect persist
→ UPDATE profiles SET progress = <整包 JSONB>
```

`progress` 的主要形狀：

```ts
type Progress = {
  byUnit: Record<UnitId, UnitProgress>;
  badges: Record<string, {
    tier: 0 | 1 | 2 | 3;
    unlockedAtByTier?: Partial<Record<1 | 2 | 3, string>>;
  }>;
  stats: UserStats;
  totalXP: number;
  lastBadgeEvents?: BadgeUnlockEvent[]; // 僅前端 toast，不寫入 DB
};
```

## 4. 重要遊戲與規則

### 4.1 單字集

- Unit 1 共 30 個單字。
- 卡片翻面後可播放瀏覽器 TTS。
- 每張卡第一次按「收入圖鑑」：`vocab.studied +1`、Unit XP +5、並中斷遊戲連勝。
- 收集狀態只存在元件 state；離開再回來會重置，因此可再次取得 XP。

### 4.2 貪吃蛇

- 棋盤 20×20，預設移動間隔 200 ms。
- 每題同時放三個選項；吃到任一選項立即作答並換題。
- 答對才增長蛇身。
- Unit 1 題數取 `min(78, words.length)`，所以目前是 30 題。
- 撞牆、撞身或完成整副 deck 時結束。
- `targetScore`、`passScore`、`totalQuestions` props 目前保留但沒有實際控制遊戲。
- App 的 UI/LSA 以 7 分判定 `passed`，但 `SnakeReport.passed` 目前以全對判定，兩者不一致。
- 排行榜保存最高正確題數，game=`snake`。

### 4.3 文法技能樹

- Unit 1 共 11 個文法點。
- 每個文法點第一次按「獲得技能」：`grammar.studied +1`、XP +10。
- 鎖定目前主要是視覺提示；卡片仍可點開，並非真正阻擋。
- mastered 只存在元件 state，重新進入可再次累積。

### 4.4 文法方塊

- 先將英文句子片段排成正確順序。
- 正確後取得三個隨機 tetromino；三塊放完才進下一題。
- 棋盤 10×10；完整行與完整列各 +1 分並清除。
- 累積錯三題、無可放置方塊、完成全部句子或按「我累了」時結束。
- 報表同時寫入 localStorage、browser CustomEvent、LSA，以及 `leaderboard` 最高分。
- localStorage key：`lq:grammar-tetris:logs`。

### 4.5 挑戰區

- Unit 1 固定 10 關，每關 10 題。
- 每題 20 秒；JSON 中 `meta.time=60` 目前未使用。
- 星等：10 分=3★、7-9 分=2★、4-6 分=1★、0-3 分=0★。
- 2★以上視為通過並解鎖下一關。
- 只有至少 1★ 的結果會更新最快時間。
- 詳細作答與總時間會寫入 `lsa_logs.context_data`。

## 5. 固定獎章（控制組）

控制組沒有 learner-created badge plan。`BADGE_QR` 實際定義 20 枚固定獎章：

| 類別 | Key | 名稱 | 統計來源 | 銅／銀／金 | 備註 |
| --- | --- | --- | --- | --- | --- |
| Participation | GAME_LOVER | 遊戲狂熱 | maxGameStreak | 3 / 6 / 10 | 最高連續遊戲場數 |
| Participation | VOCAB_DRILLER | 單字達人 | 各單元 vocab.studied 加總 | 3 / 10 / 30 | 每次收入一張未收集單字卡即 +1 |
| Participation | GRAMMAR_NERD | 文法專家 | 各單元 grammar.studied 加總 | 3 / 10 / 30 | 每次按下未掌握文法的「獲得技能」即 +1 |
| Participation | XP_COLLECTOR | 經驗收藏家 | totalXP | 100 / 300 / 600 | 所有 XP 累積 |
| Participation | REVIEWER | 愛玩遊戲 | stats.gamesPlayed | 2 / 10 / 20 | 完成遊戲／挑戰場次 |
| Participation | AUDIO_LEARNER | 聽力小耳朵 | stats.totalPronunciations | 10 / 50 / 100 | 點擊單字發音即累積 |
| Skill | SNAKE_MASTER | 貪吃蛇王 | 各單元 vocab.quizBest 最大值 | 5 / 10 / 25 | 目前 Unit 1 最多 30 題 |
| Skill | TETRIS_ARCH | 方塊建築師 | 各單元 grammar.reorderBest 最大值 | 5 / 10 / 20 | 單局消除行／列數 |
| Skill | SPEED_DEMON | 極速傳說 | 至少 1★ 關卡的最短 bestTimeSec | ≤50 / ≤40 / ≤30 秒 | 反向門檻，越快越高 |
| Skill | STAR_CATCHER | 摘星者 | 所有關卡星數加總 | 3 / 9 / 18 | 取各關歷史最佳星數 |
| Skill | ACCURACY_GOD | 愛吃的蛇 | stats.snakeCorrectTotal | 20 / 30 / 60 | 每局正確題數累加 |
| Skill | LEVEL_CRUSHER | 過關斬將 | 通過關卡數 | 3 / 6 / 10 | passed=true 或星數 ≥2 |
| Skill | UNIT_MASTER | 單元制霸 | 3★ 關卡數 | 3 / 6 / 10 | 名稱雖為單元，實際統計為 3★ 關卡數 |
| Encouragement | PERSISTENT | 越挫越勇 | stats.totalErrors | 5 / 20 / 50 | 挑戰與遊戲錯誤累加 |
| Encouragement | NEVER_GIVE_UP | 永不放棄 | stats.totalRetries | 1 / 5 / 15 | 按重新開始／再玩一次 |
| Encouragement | TRY_HARD | 勤能補拙 | gamesPlayed + totalRetries | 10 / 50 / 100 | 總嘗試量 |
| Encouragement | COMEBACK_KID | 逆轉勝 | stats.comebackRuns | 1 / 3 / 5 | 同關比舊最佳高至少 3 分 |
| Encouragement | PRACTICE_MAKE | 熟能生巧 | stats.gamesPlayed | 5 / 15 / 30 | 與 REVIEWER 使用同一來源但門檻不同 |
| Encouragement | BRAVE_HEART | 勇敢的心 | stats.failedChallenges | 1 / 5 / 10 | 挑戰未達 2★；方塊 wrong-limit 也可能累加 |
| Encouragement | SURVIVOR | 倖存者 | stats.closeCalls | 1 / 3 / 5 | 挑戰剛好 7 分通關 |

### 升級與時間戳

- 每次 reducer 更新後會重新跑 `evaluateBadges`。
- 新 tier 大於舊 tier 才升級，不會降級。
- 若數值從 0 一次跳到金級，只記錄金級解鎖時間，不會補記銅／銀時間。
- `lastBadgeEvents` 只供右下角 Toast 使用，儲存前會被移除。

## 6. LSA 事件字典

`session_id` 以 browser tab 的 `sessionStorage` 保存。現行事件如下：

| action_state | 觸發時機 | context_data |
| --- | --- | --- |
| NAV_LEARN | 點主導覽「學習區」；或切換單字/文法子區 | 子區時可能含 {sub:"vocab"\|"grammar"} |
| NAV_CHALLENGE | 點主導覽「挑戰區」 | {} |
| NAV_BADGES | 點主導覽「獎章區」 | {} |
| NAV_LEADERBOARD | 點主導覽「排行榜」 | {} |
| LEARN_VOCAB_SET | 進入單字集 | {} |
| LEARN_SNAKE_GAME | 進入貪吃蛇；或按重試 | 重試時 {action:"retry"} |
| LEARN_GRAMMAR_EXPLAIN | 進入文法說明 | {} |
| LEARN_TETRIS_GAME | 進入文法方塊；或按重試 | 重試時 {action:"retry"} |
| CHALLENGE_START | 按下關卡開始 | {unitId, level}；level 為題庫標題字串 |
| CHALLENGE_FINISH | 完成／超時至最後一題 | {unitId, level, score, timeUsed, items} |
| SNAKE_GAME_END | 貪吃蛇結束 | {score, wrong, timeUsed, passed, items} |
| TETRIS_GAME_END | 文法方塊結束 | {reason, score, wrongCount, roundsPlayed, wrongItems, correctItems} |

建議分析資料時不要只看 `action_state`；`NAV_LEARN`、`LEARN_SNAKE_GAME` 與 `LEARN_TETRIS_GAME` 都有多種語意，需搭配 `context_data`。

## 7. Supabase 共用資源

| 資源 | 類型 | 組別 | 用途／注意事項 |
| --- | --- | --- | --- |
| `auth.users` | Supabase 管理 | 共用 | 登入帳號來源；前端不直接建表 |
| `public.profiles` | Table | 共用 | 姓名、學校、年級、`progress` JSONB；兩個前端都會讀寫同一列 |
| `public.leaderboard` | Table | 共用 | `snake` 與 `tetris` 歷史最高分；目前不分組 |
| `public.lsa_logs` | Table | 共用 | 導覽、遊戲開始／結束與詳細作答資料；目前不分組 |
| `public.badge_leaderboard_ranked` | View | 共用 | 由 `profiles.progress.badges` 聚合；目前不分組且會計入所有 badge key |

### 共用資料庫的重要限制

- 現行 Schema **沒有組別欄位**。
- `leaderboard` 與 `badge_leaderboard_ranked` 會混合兩組使用者。
- `lsa_logs` 也沒有 app_version／condition；研究分析必須另外用 user_id 名單辨識。
- `badge_leaderboard_ranked` 會把 `progress.badges` 中所有 tier 物件納入計分；實驗組若有自訂獎章，跨組排名不具同等意義。
- 同一帳號不要同時登入兩組前端，因為兩者會更新同一個 `profiles.progress` JSONB。

完整 SQL 請見本 README 最後的附錄，亦提供獨立檔案：`LearningQuest_共用_Supabase_Schema.sql`。

## 8. 檔案結構與責任

| 檔案 | 行數 | 責任 |
| --- | --- | --- |
| `.gitattributes` | 11 | 建置與專案設定 |
| `.gitignore` | 72 | 建置與專案設定 |
| `README.md` | 414 | 原始 README（本次將以新版取代） |
| `eslint.config.js` | 23 | 建置與專案設定 |
| `index.html` | 13 | 建置與專案設定 |
| `package-lock.json` | 4485 | 建置與專案設定 |
| `package.json` | 39 | 建置與專案設定 |
| `postcss.config.js` | 6 | 建置與專案設定 |
| `src/App.css` | 46 | 應用核心／型別／樣式 |
| `src/App.tsx` | 1525 | 應用核心／型別／樣式 |
| `src/components/ArrangeSentencesGame.tsx` | 215 | React UI／功能元件 |
| `src/components/BadgesView.tsx` | 289 | React UI／功能元件 |
| `src/components/ChallengeRun.tsx` | 279 | React UI／功能元件 |
| `src/components/GrammarExplain.tsx` | 262 | React UI／功能元件 |
| `src/components/Leaderboard.tsx` | 147 | React UI／功能元件 |
| `src/components/ProfileSetup.tsx` | 97 | React UI／功能元件 |
| `src/components/ReorderSentenceGame.tsx` | 1046 | React UI／功能元件 |
| `src/components/SnakeChallenge.tsx` | 737 | React UI／功能元件 |
| `src/components/StoryViewer.tsx` | 116 | React UI／功能元件 |
| `src/components/VocabQuiz.tsx` | 129 | React UI／功能元件 |
| `src/components/VocabSet.tsx` | 319 | React UI／功能元件 |
| `src/components/ui.tsx` | 24 | React UI／功能元件 |
| `src/data/challenges/unit-1/level-1.json` | 138 | Unit 1 固定挑戰題庫 |
| `src/data/challenges/unit-1/level-10.json` | 138 | Unit 1 固定挑戰題庫 |
| `src/data/challenges/unit-1/level-2.json` | 138 | Unit 1 固定挑戰題庫 |
| `src/data/challenges/unit-1/level-3.json` | 138 | Unit 1 固定挑戰題庫 |
| `src/data/challenges/unit-1/level-4.json` | 138 | Unit 1 固定挑戰題庫 |
| `src/data/challenges/unit-1/level-5.json` | 138 | Unit 1 固定挑戰題庫 |
| `src/data/challenges/unit-1/level-6.json` | 138 | Unit 1 固定挑戰題庫 |
| `src/data/challenges/unit-1/level-7.json` | 138 | Unit 1 固定挑戰題庫 |
| `src/data/challenges/unit-1/level-8.json` | 138 | Unit 1 固定挑戰題庫 |
| `src/data/challenges/unit-1/level-9.json` | 138 | Unit 1 固定挑戰題庫 |
| `src/data/units.ts` | 1275 | 教材資料（Unit 1-5） |
| `src/index.css` | 297 | 應用核心／型別／樣式 |
| `src/lib/analytics.ts` | 25 | 分析紀錄／題目工具 |
| `src/lib/lsa-states.ts` | 21 | 分析紀錄／題目工具 |
| `src/lib/questionGen.ts` | 107 | 分析紀錄／題目工具 |
| `src/main.tsx` | 12 | 應用核心／型別／樣式 |
| `src/state/AuthContext.tsx` | 155 | 認證／進度狀態 |
| `src/state/progress.ts` | 390 | 認證／進度狀態 |
| `src/supabaseClient.ts` | 8 | 應用核心／型別／樣式 |
| `src/types/web-speech.d.ts` | 49 | 應用核心／型別／樣式 |
| `src/types.ts` | 49 | 應用核心／型別／樣式 |
| `src/vite-env.d.ts` | 1 | 應用核心／型別／樣式 |
| `tailwind.config.js` | 24 | 建置與專案設定 |
| `tsconfig.app.json` | 28 | 建置與專案設定 |
| `tsconfig.json` | 8 | 建置與專案設定 |
| `tsconfig.node.json` | 27 | 建置與專案設定 |
| `vite.config.ts` | 7 | 建置與專案設定 |

## 9. 優先 Code Review 結果

| 嚴重度 | 問題 | 位置 | 影響 | 建議 |
| --- | --- | --- | --- | --- |
| Critical | 進度可能漏存 | src/state/progress.ts:311-316 | persist 進行中若又有 state 更新，effect 直接 return；儲存完成後沒有 queue 或再次觸發，因此最新進度可能永遠未寫回。 | 改用 debounce + latest ref，或串行 promise queue；離頁前 flush。 |
| Critical | 共用資料庫沒有組別欄位 | profiles / leaderboard / lsa_logs / badge_leaderboard_ranked | 目前程式與提供的 Schema 均無 control/experimental 欄位；排行榜和研究紀錄會自然混在一起。 | 至少以部署、帳號名單與 user_id 對照表嚴格管理；研究尚未凍結時再評估 condition/group_code。 |
| Critical | 共用獎章排行榜可比性不足 | badge_leaderboard_ranked | View 會計算 progress.badges 中所有 tier 物件；若實驗組有自訂或不同數量獎章，會與控制組一起計分。 | 建立組別專用排行榜或只計固定白名單 badge key。 |
| Critical | RLS 與 badge view 有結構衝突 | profiles policy + security_invoker view | 若 profiles 只允許讀自己，security_invoker view 只能看到自己；若允許讀全部，使用者可能直接讀到他人完整 progress。 | 以受控 RPC／摘要表重構；正式環境先盤點現有 policy，勿直接覆蓋。 |
| High | 貪吃蛇最後一題 log 可能遺漏 | src/components/SnakeChallenge.tsx:271-292, 438-486 | 最後一題先 setLogs 再 endGame；endGame closure 可能仍拿到舊 logs，造成報表、錯題數與 LSA items 缺最後一題。 | 直接組合 finalLogs 並傳入 endGame(finalScore, finalLogs)。 |
| High | 方塊結算可能使用舊分數／舊題目陣列 | src/components/ReorderSentenceGame.tsx:400-430, 517-583 | setLinesCleared、setCorrectItems 後立刻 endGame，React 非同步 state 可能使排行榜與事件少算最後一次。 | 以區域變數計算 nextScore/nextItems，直接傳入 endGame。 |
| High | 排行榜最高分更新非原子 | SnakeChallenge / ReorderSentenceGame | 先 SELECT 再 UPSERT；雙分頁或競態下，較低分可能最後覆蓋較高分。 | 改用資料庫函式或條件式 UPSERT，以 greatest(existing.score, excluded.score)。 |
| High | LSA session 可能跨使用者 | src/lib/analytics.ts + signOut | sessionStorage 的 lsa_session_id 登出時未清除；共用電腦同一分頁換帳號後，兩位學生可能共用 session_id。 | 登出時 removeItem，或 session key 納入 userId。 |
| High | LSA 寫入失敗會靜默 | src/lib/analytics.ts | insert 回傳的 error 未檢查，也沒有 retry；網路／RLS 問題不會被察覺。 | 檢查 error、記錄本地 pending queue、必要時批次重送。 |
| High | 忘記密碼流程不完整 | src/App.tsx:408-428 | 只寄 reset link，沒有 redirect 後讓使用者輸入新密碼並呼叫 auth.updateUser。 | 增加 PASSWORD_RECOVERY 狀態與新密碼頁。 |
| High | ProfileSetup 依賴觸發器 | src/components/ProfileSetup.tsx | 使用 update 而非 upsert；若 handle_new_user trigger 未建立或曾失敗，update 0 rows 仍可能無 error，使用者會反覆回設定頁。 | 改 upsert({id,...}) 並檢查回傳 rows。 |
| High | 進度 JSON 僅淺層合併 | src/state/progress.ts:367-378 | byUnit 只做一層 spread；舊版本缺少 nested 欄位時可能得到 undefined。 | 逐單元深合併 vocab/grammar/text/challenge/levels。 |
| High | 跨分頁／跨兩個前端為 last-write-wins | profiles.progress JSONB | 整包 progress 由前端 update；同帳號同時操作控制組與實驗組或多分頁，最後一次儲存會覆蓋前一次。 | 研究帳號不要跨兩組登入；長期改成事件表或原子 RPC。 |
| Medium | 控制組實際為 20 枚固定獎章 | progress.ts / BadgesView.tsx | 舊 README 寫 30 枚；實際 BADGE_QR 為 6 參與、7 技巧、7 鼓勵，共 20 枚。 | 以本文件與新版 README 為準。 |
| Medium | 多個功能目前不可由 UI 進入 | src/App.tsx | 單元切換、課文、句型排列、四選一按鈕均被註解；unitId 固定 1。 | 交接時勿誤認 Unit 2-5 已上線；若啟用需回歸測試。 |
| Medium | 貪吃蛇 props 與實際規則不一致 | SnakeChallenge.tsx | targetScore/passScore/totalQuestions 未使用；Report passed 以全對判定，但 App modal 以 7 分判定。 | 統一單一通關規則與 report schema。 |
| Medium | XP 與統計可重複刷取 | VocabSet / GrammarExplain | 元件 remount 後本地 mastered/collected 重置；學生可再次收集並重複增加 XP/次數。 | 若研究設計不允許，將完成狀態持久化或設每日/單元上限。 |
| Medium | 目前 lint 未通過 | npm run lint | 40 errors、1 warning；主要為 any、ts-ignore、Fast Refresh、空 catch、hook dependency。 | 分批清理，先處理資料型別與 hook，再處理格式。 |
| Medium | 依賴弱點與 bundle 警告 | npm audit / npm run build | 2026-07-17：13 vulnerabilities；主 JS 547.47 kB，超過 500 kB 警戒。 | 先升級 Vite/PostCSS/鎖檔並測試；用 dynamic import 拆遊戲元件。 |
| Low | 專案雜項 | index.html / .gitignore / App.css | lang=en、/vite.svg 未提供、App.css 未匯入、.gitignore 重複且有錯誤註解格式。 | 清理模板殘留並改 lang=zh-Hant。 |
| Low | 缺少自動化測試與 CI | 整體專案 | 目前只有 build/lint script，沒有 unit/e2e/schema test。 | 新增 Vitest、Playwright 與 GitHub Actions。 |

## 10. 維護作業

### 修改教材

1. 修改 `src/data/units.ts`。
2. 維持 `UnitConfig`：`id/title/words/grammar/story`。
3. 單字至少要有 `term` 與 `def`。
4. 文法例句可為字串或 `{en, zh}`。
5. 修改後執行 build，並實際測試單字卡、TTS、貪吃蛇與方塊 tokenization。

### 修改 Challenge 題庫

JSON schema：

```json
{
  "meta": { "time": 60, "title": "Unit 1 • Level 1" },
  "questions": [
    {
      "id": "u1-l1-q01",
      "prompt": "Question",
      "choices": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explain": "Explanation",
      "tag": "vocab"
    }
  ]
}
```

提交前確認：每關 10 題、ID 全域唯一、4 選項、`correctIndex` 0-3、解說與答案一致。

### 修改獎章

- 邏輯門檻：`src/state/progress.ts` 的 `BADGE_QR`
- 顯示名稱／敘述：`src/components/BadgesView.tsx` 的 `BADGE_META`
- 指標來源：`getBadgeValue`
- 修改 key 或門檻會影響既有研究資料，研究進行中不要更動。

### 部署前檢查

```bash
npm ci
npm run lint
npm run build
npm audit
```

另需人工測試：註冊、Email 驗證、Profile、登出、每個 LSA 事件、進度重整後保留、排行榜、10 關解鎖、獎章 Toast、不同裝置版面。

## 11. 資料匯出範例

```sql
select
  id,
  user_id,
  full_name,
  session_id,
  action_state,
  context_data,
  created_at
from public.lsa_logs
where user_id = '63b479d3-d21c-40ec-93ad-911588143040'
order by created_at asc;
```

研究匯出時應以 `user_id` 為主鍵；`full_name` 只是事件當下的快照。

## 12. Supabase SQL 附錄

```sql
-- LearningQuest 共用 Supabase Schema（控制組與實驗組共用）
-- 文件日期：2026-07-17
-- 注意：正式資料庫若已存在資料，請先備份並逐段核對，不要直接刪表重建。

create extension if not exists pgcrypto;

-- ============================================================
-- 1. profiles：兩組共用
--    由 auth.users 一對一建立，progress 以 JSONB 儲存前端進度。
-- ============================================================
create table if not exists public.profiles (
  id uuid not null,
  updated_at timestamp with time zone null default now(),
  full_name text null,
  school text null,
  grade text null,
  progress jsonb not null default '{}'::jsonb,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id)
    references auth.users (id) on delete cascade
) tablespace pg_default;

alter table public.profiles
  add column if not exists updated_at timestamp with time zone null default now(),
  add column if not exists full_name text null,
  add column if not exists school text null,
  add column if not exists grade text null,
  add column if not exists progress jsonb not null default '{}'::jsonb;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 補建既有 auth.users 但缺少 profiles 的資料列
insert into public.profiles (id)
select u.id
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- ============================================================
-- 2. lsa_logs：兩組共用
-- ============================================================
create table if not exists public.lsa_logs (
  id uuid not null default gen_random_uuid(),
  user_id uuid null,
  full_name text null,
  session_id text not null,
  action_state text not null,
  context_data jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  constraint lsa_logs_pkey primary key (id),
  constraint lsa_logs_user_id_fkey foreign key (user_id)
    references auth.users (id)
) tablespace pg_default;

create index if not exists lsa_logs_user_created_idx
  on public.lsa_logs (user_id, created_at);
create index if not exists lsa_logs_session_created_idx
  on public.lsa_logs (session_id, created_at);
create index if not exists lsa_logs_action_created_idx
  on public.lsa_logs (action_state, created_at);

-- 查詢單一學生紀錄（請替換 UUID）
-- select id, user_id, full_name, session_id, action_state, context_data, created_at
-- from public.lsa_logs
-- where user_id = '63b479d3-d21c-40ec-93ad-911588143040'
-- order by created_at asc;

-- ============================================================
-- 3. leaderboard：兩組共用
-- ============================================================
create table if not exists public.leaderboard (
  id bigint generated by default as identity not null,
  user_id uuid not null,
  full_name text null,
  game text not null,
  score integer not null,
  created_at timestamp with time zone null default now(),
  constraint leaderboard_pkey primary key (id),
  constraint unique_user_game unique (user_id, game),
  constraint leaderboard_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade
) tablespace pg_default;

create index if not exists leaderboard_game_score_idx
  on public.leaderboard (game, score desc);

-- ============================================================
-- 4. badge_leaderboard_ranked：兩組共用 View
--    這是使用者提供的現行邏輯：金 5、銀 3、銅 1。
-- ============================================================
create or replace view public.badge_leaderboard_ranked
with (security_invoker = on)
as
with badge_rows as (
  select
    p.id,
    p.full_name,
    case
      when jsonb_typeof(b.value) = 'object'::text
       and coalesce(b.value ->> 'tier'::text, ''::text) ~ '^[0-9]+$'::text
      then (b.value ->> 'tier'::text)::integer
      else 0
    end as tier
  from public.profiles p
  left join lateral jsonb_each(
    coalesce(p.progress -> 'badges'::text, '{}'::jsonb)
  ) b(key, value) on true
), ranked as (
  select
    badge_rows.id,
    badge_rows.full_name,
    count(*) filter (where badge_rows.tier = 3)::integer as gold,
    count(*) filter (where badge_rows.tier = 2)::integer as silver,
    count(*) filter (where badge_rows.tier = 1)::integer as bronze,
    (
      count(*) filter (where badge_rows.tier = 3) * 5
      + count(*) filter (where badge_rows.tier = 2) * 3
      + count(*) filter (where badge_rows.tier = 1)
    )::integer as score
  from badge_rows
  group by badge_rows.id, badge_rows.full_name
)
select id, full_name, gold, silver, bronze, score
from ranked
where full_name is not null
  and btrim(full_name) <> ''::text
  and (gold + silver + bronze) > 0;

-- ============================================================
-- 5. RLS 參考政策
-- ============================================================
-- 重要：security_invoker = on 的 badge view 會套用 profiles 的 RLS。
-- 若 profiles 只能讀自己，獎章排行榜就只會看到自己；若開放讀全部，
-- 則使用者可能直接讀到他人的 progress。正式環境需在「隱私」與
-- 「全體排行榜」之間採用受控 RPC／摘要表等方案，請勿盲目套用。

alter table public.profiles enable row level security;
alter table public.leaderboard enable row level security;
alter table public.lsa_logs enable row level security;

-- profiles：個人資料基本政策（會造成 security_invoker badge view 只看自己）
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- leaderboard：所有登入者可讀排行榜，只能寫自己的列
drop policy if exists "leaderboard_select_authenticated" on public.leaderboard;
create policy "leaderboard_select_authenticated"
  on public.leaderboard for select to authenticated
  using (true);

drop policy if exists "leaderboard_insert_own" on public.leaderboard;
create policy "leaderboard_insert_own"
  on public.leaderboard for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "leaderboard_update_own" on public.leaderboard;
create policy "leaderboard_update_own"
  on public.leaderboard for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- lsa_logs：學生只能新增自己的事件；研究者以 service role／後台查詢
drop policy if exists "lsa_logs_insert_own" on public.lsa_logs;
create policy "lsa_logs_insert_own"
  on public.lsa_logs for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "lsa_logs_select_own" on public.lsa_logs;
create policy "lsa_logs_select_own"
  on public.lsa_logs for select to authenticated
  using (auth.uid() = user_id);

-- View 權限（是否能看到全體仍取決於 profiles RLS）
grant select on public.badge_leaderboard_ranked to authenticated;
```
## License

LearningQuest may be used, modified, and redistributed for educational,
academic, and non-commercial research purposes with proper attribution.

Commercial use is prohibited without prior written permission.

Copyright © 2026 Chang Yu-Hao (張祐豪).  
See [LICENSE](./LICENSE) for details.