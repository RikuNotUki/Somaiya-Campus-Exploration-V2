import Frame from "@/components/Frame";
import { PrimaryButton, Card, GemDot } from "@/components/ui";
import { GEM_TYPES } from "@/lib/gems";

export default function GemRulesPage() {
  return (
    <Frame>
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
        <div
          className="rounded-[11px] flex items-center justify-center h-40"
          style={{ background: "var(--color-surface-muted)" }}
        >
          <span className="text-sm" style={{ color: "var(--color-ink-faint)" }}>
            logo / campus image
          </span>
        </div>

        <h2 className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
          How gems work
        </h2>
        <ul className="text-sm space-y-2" style={{ color: "var(--color-ink-soft)" }}>
          <li>• Each category can hide a gem at some of its locations — you won&apos;t know how many.</li>
          <li>• Joker Gems are wildcards — they count as any gem type when redeeming a prize.</li>
          <li>• Combine 5 shards to crystallise your own Joker Gem.</li>
        </ul>

        <h2 className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
          How to use
        </h2>
        <ul className="text-sm space-y-2" style={{ color: "var(--color-ink-soft)" }}>
          <li>• Walk to a location, geo-tag it, read the info, then answer the quiz.</li>
          <li>• Redeem gems for prizes — you&apos;ll get a code to bring to the prize desk.</li>
        </ul>

        <Card muted className="p-4">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {GEM_TYPES.map((g) => (
              <div key={g} className="flex flex-col items-center gap-1">
                <GemDot type={g} size={22} />
                <span className="text-[11px] capitalize" style={{ color: "var(--color-ink-soft)" }}>
                  {g}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <PrimaryButton href="/login">Continue</PrimaryButton>
    </Frame>
  );
}
