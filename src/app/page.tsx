import Frame from "@/components/Frame";
import { PrimaryButton } from "@/components/ui";

export default function WelcomePage() {
  return (
    <Frame>
      <div className="flex-1 flex flex-col justify-center gap-6">
        <div
          className="rounded-[11px] flex items-center justify-center h-40"
          style={{ background: "var(--color-surface-muted)" }}
        >
          <span className="text-sm" style={{ color: "var(--color-ink-faint)" }}>
            SVU logo / campus image
          </span>
        </div>
        <h1 className="text-2xl font-bold text-center" style={{ color: "var(--color-ink)" }}>
          Welcome Campus Explorer
        </h1>
      </div>
      <PrimaryButton href="/onboarding">Continue</PrimaryButton>
    </Frame>
  );
}
