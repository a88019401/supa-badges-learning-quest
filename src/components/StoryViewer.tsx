// components/StoryViewer.tsx
import type { Story, StoryParagraph } from "../types";
import { Card, SectionTitle } from "./ui";
import { useProgress } from "../state/progress";

type Props = { story: Story; onRead: () => void; readCount?: number; };

function isBilingual(p: StoryParagraph): p is { en: string; zh?: string } {
  return typeof p === "object" && p !== null && "en" in p;
}

export default function StoryViewer({ story, onRead, readCount = 0 }: Props) {
    const { reportActivity } = useProgress(); // ✅ 用來記錄翻譯提示（totalHints）
  return (
    <Card>
      <SectionTitle title={`課文：${story.title}`} />
      <div className="space-y-4">
        {story.paragraphs.map((p, i) => {
          if (!isBilingual(p)) {
            // 純英文字串（相容舊資料）
            return (
              <p key={i} className="leading-7 text-neutral-800">
                {p}
              </p>
            );
          }
          return (
            <div key={i} className="leading-7">
              <p className="text-neutral-900">{p.en}</p>
              {p.zh && (
                <details
                  className="mt-1 group"
                  onToggle={(e) => {
                    const el = e.currentTarget as HTMLDetailsElement;
                    // ✅ 只有在「打開」的瞬間算一次 hint
                    if (el.open) {
                      reportActivity({ totalHints: 1 });
                    }
                  }}
                >                  <summary className="list-none cursor-pointer inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
                    <span className="rounded-md border px-2 py-0.5 text-xs">中文</span>
                    <span className="underline decoration-dotted">顯示／隱藏翻譯</span>
                    <span className="transition-transform group-open:rotate-90">›</span>
                  </summary>
                  <div className="mt-2 rounded-lg border bg-neutral-50 px-3 py-2 text-neutral-700">
                    {p.zh}
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={onRead}
          className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm disabled:opacity-60"
          disabled={!onRead}
        >
          {readCount > 0 ? `已標記為已閱讀（共 ${readCount} 次）` : "標記為已閱讀"}
        </button>
      </div>
    </Card>
  );
}
