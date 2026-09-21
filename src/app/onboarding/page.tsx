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
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
          Walk the campus, visit real spots across 7 categories, and answer a quick quiz
          at each one. Correct answers earn shards — collect 5 shards to crystallise a
          Joker Gem. Some spots also hide a gem of their own, but you won&apos;t know how
          many are out there, so it pays to visit every location in a category.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
          Start with the Institute Tour and Campus History — finishing both unlocks the
          rest of the map.
        </p>
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
