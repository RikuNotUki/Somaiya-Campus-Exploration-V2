import Frame from "@/components/Frame";
import { PrimaryButton } from "@/components/ui";
import { GemDot } from "@/components/ui";
import { GEM_TYPES } from "@/lib/gems";

export default function OnboardingPage() {
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
        <h1 className="text-xl font-bold text-center" style={{ color: "var(--color-ink)" }}>
          What is Campus Explorer?
        </h1>
        <ul className="text-sm leading-relaxed space-y-2.5" style={{ color: "var(--color-ink-soft)" }}>
          <li>• Walk the campus and visit real spots, grouped into 7 categories.</li>
          <li>• At each spot, answer a quick quiz — correct answers earn you shards.</li>
          <li>• Collect 5 shards to crystallise them into a Joker Gem.</li>
          <li>
            • Some spots also hide a gem of their own — but you won&apos;t know how many,
            so it pays to visit every location in a category.
          </li>
          <li>
            • Start with the Institute Tour and Campus History — finishing both unlocks
            the rest of the map.
          </li>
        </ul>
        <div className="flex items-center justify-center gap-3 py-4">
          {GEM_TYPES.map((g) => (
            <GemDot key={g} type={g} size={20} />
          ))}
        </div>
      </div>
      <PrimaryButton href="/gem-rules">Continue</PrimaryButton>
    </Frame>
  );
}
