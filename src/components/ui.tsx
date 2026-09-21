"use client";

import Link from "next/link";
import { GEM_META, GemType } from "@/lib/gems";

export function PrimaryButton({
  children,
  onClick,
  href,
  disabled,
  variant = "primary",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variant?: "primary" | "outline" | "success";
  type?: "button" | "submit";
}) {
  const base =
    "w-full rounded-[11px] py-3.5 text-center font-medium transition-opacity disabled:opacity-40";
  const styles = {
    primary: "text-white",
    outline: "border border-[var(--color-border-strong)] text-[var(--color-ink)] bg-white",
    success: "text-white",
  } as const;
  const bg =
    variant === "primary"
      ? { background: "var(--color-accent)" }
      : variant === "success"
      ? { background: "var(--color-success)" }
      : {};

  if (href && !disabled) {
    return (
      <Link href={href} className={`${base} ${styles[variant]} block`} style={bg}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]}`}
      style={bg}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  muted,
  className = "",
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[11px] ${className}`}
      style={{ background: muted ? "var(--color-surface-muted)" : undefined, ...style }}
    >
      {children}
    </div>
  );
}

export function GemDot({ type, size = 13 }: { type: GemType; size?: number }) {
  return (
    <span
      className="inline-block rotate-45 rounded-[2px] shrink-0"
      style={{ width: size, height: size, background: GEM_META[type].color }}
    />
  );
}

export function GemChip({ type, count }: { type: GemType; count: number }) {
  return (
    <div
      className="flex flex-col items-center justify-between gap-1 rounded py-1.5 px-1"
      style={{ background: "var(--color-surface-chip)", minWidth: 50 }}
    >
      <GemDot type={type} />
      <span className="text-[10px]" style={{ color: "var(--color-ink-soft)" }}>
        {GEM_META[type].label.toLowerCase()} : {count}
      </span>
    </div>
  );
}

export function TopBar({ title, back }: { title?: string; back?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      {back ? (
        <Link href={back} className="text-lg" style={{ color: "var(--color-ink-soft)" }}>
          ←
        </Link>
      ) : (
        <span />
      )}
      {title && <span className="font-bold text-lg" style={{ color: "var(--color-ink)" }}>{title}</span>}
      <span />
    </div>
  );
}
