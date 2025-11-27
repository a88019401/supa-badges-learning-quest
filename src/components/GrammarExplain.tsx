import { useState } from "react";
import type { GrammarPoint } from "../types";
import { AppButton, AppCard, SectionTitle } from "./ui";
import { launchConfetti } from "../utils/confetti";

type Props = { points: GrammarPoint[]; onStudied: () => void };

type InteractiveSentenceProps = {
  id: string;
  text: string;
  translation?: string;
  selected: boolean;
  onToggle: () => void;
};

function InteractiveSentence({ id, text, translation, selected, onToggle }: InteractiveSentenceProps) {
  return (
    <button
      key={id}
      onClick={onToggle}
      className={[
        "w-full text-left rounded-xl border px-3 py-2 transition",
        "hover:-translate-y-0.5 hover:shadow-sm active:scale-95",
        selected
          ? "bg-violet-50 border-violet-200 text-violet-900"
          : "bg-white/70 border-neutral-200 text-neutral-800",
      ].join(" ")}
    >
      <div className="font-medium">{text}</div>
      {translation && <div className="text-xs text-neutral-500 mt-1">{translation}</div>}
      {selected && <div className="text-[11px] text-violet-600 mt-1">Noted ✓</div>}
    </button>
  );
}

export default function GrammarExplain({ points, onStudied }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [claimed, setClaimed] = useState(false);

  const toggleSentence = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleClaim = () => {
    if (claimed) return;
    setClaimed(true);
    onStudied();
    launchConfetti();
  };

  const hasNoticing = Object.values(selected).some(Boolean);

  return (
    <AppCard className="p-5 space-y-4">
      <SectionTitle
        title="文法說明"
        desc="點擊例句來標記你注意到的文法重點，再領取一次性的學習 XP。"
      />

      <div className="space-y-4">
        {points.map((g, i) => (
          <AppCard key={i} className="p-4 bg-white/80 border-violet-50 shadow-sm" hoverable>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-violet-500 font-semibold">{g.point}</p>
                <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{g.desc}</p>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full bg-violet-100 text-violet-700">
                {g.examples.length} sentences
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              {g.examples.map((e, j) => {
                const id = `${i}-${j}`;
                return (
                  <InteractiveSentence
                    key={id}
                    id={id}
                    text={e}
                    selected={!!selected[id]}
                    onToggle={() => toggleSentence(id)}
                  />
                );
              })}
            </div>
          </AppCard>
        ))}
      </div>

      <div className="pt-3 border-t border-white/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <AppButton
          color="success"
          size="md"
          disabled={claimed || !hasNoticing}
          onClick={handleClaim}
        >
          {claimed ? "Claimed ✓" : "Claim XP for this explanation"}
        </AppButton>
        <p className="text-xs text-neutral-500">
          {claimed
            ? "已領取本次 XP，感謝你的細心觀察！"
            : hasNoticing
              ? "看起來你已經標記了一些句子，點擊領取 XP。"
              : "先點擊幾個句子做「noticing」，再領取一次性的 XP。"}
        </p>
      </div>
    </AppCard>
  );
}
