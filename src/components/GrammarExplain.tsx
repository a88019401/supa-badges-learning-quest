// src/components/GrammarExplain.tsx
import { useState } from "react";
import type { GrammarPoint } from "../types";
import { Card, SectionTitle } from "./ui";

// 修改 Props 定義，拆分「單點掌握」與「全部完成」
type Props = { 
  points: GrammarPoint[]; 
  onAcquire: () => void;  // ✨ 每掌握一個就觸發 (用來 +1)
  onComplete: () => void; // 🎉 全部解鎖後觸發 (用來給大獎勵)
};

export default function GrammarExplain({ points, onAcquire, onComplete }: Props) {
  const [mastered, setMastered] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<number | null>(0);

  const progress = points.length > 0 ? Math.round((mastered.size / points.length) * 100) : 100;
  const isAllMastered = mastered.size === points.length;

  const handleMaster = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 如果還沒掌握過，才觸發
    if (!mastered.has(index)) {
      const next = new Set(mastered);
      next.add(index);
      setMastered(next);
      
      // ✨ 立即觸發外部的 +1 動作
      onAcquire();
      
      // 自動展開下一個
      if (index + 1 < points.length) {
        setExpanded(index + 1);
      } else {
        setExpanded(null);
      }
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle title="文法資料庫 Grammar Database" />
        <div className="text-right">
          <div className="text-xs text-neutral-500 mb-1">同步率</div>
          <div className="text-xl font-bold font-mono text-neutral-800">
            {progress}%
          </div>
        </div>
      </div>

      <div className="w-full h-2 bg-neutral-100 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-3">
        {points.map((g, i) => {
          const isMastered = mastered.has(i);
          const isExpanded = expanded === i;

          return (
            <div
              key={i}
              onClick={() => setExpanded(isExpanded ? null : i)}
              className={`
                group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer
                ${
                  isMastered
                    ? "bg-emerald-50/50 border-emerald-200"
                    : isExpanded
                    ? "bg-white border-neutral-300 shadow-md scale-[1.01]"
                    : "bg-neutral-50 border-neutral-200 hover:border-neutral-300"
                }
              `}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                      ${
                        isMastered
                          ? "bg-emerald-500 text-white"
                          : "bg-neutral-200 text-neutral-500 group-hover:bg-neutral-300"
                      }
                    `}
                  >
                    {isMastered ? "✓" : i + 1}
                  </div>
                  <div className={`font-semibold ${isMastered ? "text-emerald-800" : "text-neutral-800"}`}>
                    {g.point}
                  </div>
                </div>
                <div className="text-xs font-mono opacity-50">
                  {isMastered ? "ACQUIRED" : isExpanded ? "ANALYZING..." : "LOCKED"}
                </div>
              </div>

              <div
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
                `}
              >
                <div className="px-4 pb-4 pt-0 border-t border-black/5 mx-4 mt-2">
                  <div className="text-sm text-neutral-600 leading-relaxed mt-3">
                    {g.desc}
                  </div>
                  
                  <div className="mt-4 bg-white rounded-lg border border-neutral-100 p-3 shadow-sm">
                    <div className="text-xs text-neutral-400 mb-2 uppercase tracking-wider font-bold">Examples</div>
                    <ul className="space-y-2">
                      {g.examples.map((e, j) => (
                        <li key={j} className="text-sm text-neutral-700 flex items-start gap-2">
                          <span className="text-blue-400 mt-1">●</span>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {!isMastered && (
                    <button
                      onClick={(e) => handleMaster(i, e)}
                      className="w-full mt-4 py-3 rounded-lg bg-neutral-900 text-white text-sm font-semibold 
                               hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <span>✨</span> 掌握此概念 (Acquire)
                    </button>
                  )}
                  
                  {isMastered && (
                    <div className="w-full mt-4 py-2 text-center text-xs text-emerald-600 font-semibold bg-emerald-50 rounded-lg">
                      已收入資料庫
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t pt-4">
        <button
          onClick={onComplete}
          disabled={!isAllMastered}
          className={`
            w-full py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 flex flex-col items-center justify-center gap-1
            ${
              isAllMastered
                ? "bg-gradient-to-r from-neutral-900 to-neutral-800 text-white shadow-lg hover:shadow-xl translate-y-0"
                : "bg-neutral-100 text-neutral-400 cursor-not-allowed translate-y-2 opacity-50 grayscale"
            }
          `}
        >
          {isAllMastered ? (
            <>
              <span className="text-lg">🎉 領取同步完成獎勵 (Bonus)</span>
              <span className="text-xs font-normal opacity-80">
                獲得大量 XP 獎勵
              </span>
            </>
          ) : (
            <>
              <span>🔒 需解鎖所有模組以完成研讀</span>
              <span className="text-xs font-normal">
                目前進度：{mastered.size} / {points.length}
              </span>
            </>
          )}
        </button>
      </div>
    </Card>
  );
}