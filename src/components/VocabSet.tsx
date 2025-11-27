import { useEffect, useState } from "react";
import type { Word } from "../types";
import { AppButton, AppCard, SectionTitle } from "./ui";
import { launchConfetti } from "../utils/confetti";

type Props = {
  title?: string;
  words: Word[];
  onStudied: () => void;
  onPlayAudio?: () => void;
};

type FlipState = Record<number, boolean>;

export default function VocabSet({ title = "單字集", words, onStudied, onPlayAudio }: Props) {
  const [revealed, setRevealed] = useState<FlipState>({});
  const [hasClaimed, setHasClaimed] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [audioPlayed, setAudioPlayed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported = "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
    setTtsSupported(supported);
  }, []);

  const flipCard = (idx: number) =>
    setRevealed((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const speak = (text: string) => {
    onPlayAudio?.();
    setAudioPlayed(true);
    if (!ttsSupported) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    const voices = window.speechSynthesis.getVoices();
    const prefer = voices.find((v) => /en-(US|GB|AU|CA)/i.test(v.lang));
    if (prefer) u.voice = prefer;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const allFlipped = words.every((_, idx) => revealed[idx]);
  const readyToClaim = allFlipped || audioPlayed;

  const markStudied = () => {
    if (hasClaimed || !readyToClaim) return;
    onStudied();
    launchConfetti();
    setHasClaimed(true);
  };

  return (
    <AppCard className="p-5 space-y-4">
      <SectionTitle
        title={title}
        desc="點擊卡片翻面（中⇄英）並播放發音。互動後即可領取一次性的 XP。"
      />

      {!ttsSupported && (
        <div className="mb-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
          你的瀏覽器不支援語音合成，將隱藏發音功能。
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {words.map((w, idx) => {
          const isBack = !!revealed[idx];

          return (
            <div key={idx} className="relative h-full [perspective:1200px]">
              <div
                className={`relative h-full transition-transform duration-500 [transform-style:preserve-3d] ${
                  isBack ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                <AppCard
                  className="absolute inset-0 h-full flex flex-col gap-4 [backface-visibility:hidden] bg-gradient-to-br from-white/95 to-violet-50/70"
                  hoverable
                >
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span className="font-medium">#{idx + 1}</span>
                    <AppButton
                      size="sm"
                      variant="flat"
                      color="primary"
                      onClick={() => flipCard(idx)}
                      className="px-2"
                    >
                      翻面 ↻
                    </AppButton>
                  </div>
                  <div className="mt-2 space-y-2 flex-1">
                    <div className="text-2xl font-semibold text-neutral-900 leading-tight">{w.def}</div>
                    {w.example && (
                      <p className="text-sm text-neutral-500 leading-relaxed">{w.example}</p>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500">點擊右上角翻到英文。</p>
                </AppCard>

                <AppCard
                  className="absolute inset-0 h-full flex flex-col gap-4 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-white/95 to-emerald-50/70"
                  hoverable
                >
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span className="font-medium">#{idx + 1} · EN</span>
                    <AppButton
                      size="sm"
                      variant="flat"
                      color="primary"
                      onClick={() => flipCard(idx)}
                      className="px-2"
                    >
                      翻回 ↻
                    </AppButton>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-2xl font-semibold text-neutral-900 leading-tight">{w.term}</div>
                    {w.example && (
                      <p className="text-sm text-neutral-500 leading-relaxed">{w.example}</p>
                    )}
                  </div>
                  {ttsSupported && (
                    <AppButton
                      onClick={() => speak(w.term)}
                      size="sm"
                      variant="solid"
                      color="primary"
                      className="self-start"
                    >
                      🔈 發音
                    </AppButton>
                  )}
                </AppCard>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-white/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <AppButton
          color="success"
          size="md"
          disabled={hasClaimed || !readyToClaim}
          onClick={markStudied}
        >
          {hasClaimed ? "Claimed ✓" : "Mark this set as studied"}
        </AppButton>
        <p className="text-xs text-neutral-500">
          {hasClaimed
            ? "已領取本次 XP！"
            : readyToClaim
              ? "已互動完畢，可以領取 XP。"
              : "翻面看看單字或播放一次發音後即可領取 XP。"}
        </p>
      </div>
    </AppCard>
  );
}
