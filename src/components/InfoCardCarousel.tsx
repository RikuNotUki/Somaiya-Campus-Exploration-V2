"use client";

import { useEffect, useState } from "react";
import { PrimaryButton } from "@/components/ui";

type InfoCard = {
  id: string;
  sort_order: number;
  title: string | null;
  body: string;
  image_url: string | null;
};

export default function InfoCardCarousel({
  locationId,
  onContinue,
}: {
  locationId: string;
  onContinue: () => void;
}) {
  const [cards, setCards] = useState<InfoCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCards(null);
    setIndex(0);
    fetch(`/api/locations/${locationId}/info-cards`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setCards(data.cards);
      });
  }, [locationId]);

  if (error) {
    return (
      <p className="text-sm text-center" style={{ color: "var(--color-gem-ruby)" }}>
        {error}
      </p>
    );
  }

  if (!cards) {
    return (
      <p className="text-sm text-center" style={{ color: "var(--color-ink-soft)" }}>
        Loading…
      </p>
    );
  }

  if (cards.length === 0) {
    return <PrimaryButton onClick={onContinue}>Take the quiz</PrimaryButton>;
  }

  const card = cards[index];
  const isLast = index === cards.length - 1;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-[11px] p-4 min-h-[110px] flex flex-col justify-center"
        style={{ background: "var(--color-surface-muted)" }}
      >
        {card.title && (
          <p className="font-bold text-sm mb-1" style={{ color: "var(--color-ink)" }}>
            {card.title}
          </p>
        )}
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
          {card.body}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="text-lg disabled:opacity-30"
          style={{ color: "var(--color-ink-faint)" }}
        >
          ←
        </button>
        <span className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
          {index + 1} / {cards.length}
        </span>
        <button
          onClick={() => setIndex((i) => Math.min(cards.length - 1, i + 1))}
          disabled={isLast}
          className="text-lg disabled:opacity-30"
          style={{ color: "var(--color-ink-faint)" }}
        >
          →
        </button>
      </div>

      <PrimaryButton onClick={onContinue}>Take the quiz</PrimaryButton>
    </div>
  );
}
