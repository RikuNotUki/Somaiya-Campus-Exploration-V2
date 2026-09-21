"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Frame from "@/components/Frame";
import { TopBar, PrimaryButton, GemDot } from "@/components/ui";
import { GemType } from "@/lib/gems";

type Question = {
  id: string;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
};

export default function QuizPage({
  params,
}: {
  params: Promise<{ key: string; locationId: string }>;
}) {
  const { key, locationId } = use(params);
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; gemAwarded?: GemType | null } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/locations/${locationId}/quiz`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setQuestion(data.question);
      });
  }, [locationId]);

  async function submit(option: string) {
    if (!question || submitting) return;
    setSelected(option);
    setSubmitting(true);
    const res = await fetch(`/api/locations/${locationId}/quiz/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, selected: option }),
    });
    const data = await res.json();
    setResult(data);
    setSubmitting(false);
  }

  if (error) {
    return (
      <Frame>
        <TopBar back={`/tour/${key}`} />
        <p style={{ color: "var(--color-gem-ruby)" }}>{error}</p>
      </Frame>
    );
  }

  if (!question) {
    return (
      <Frame>
        <TopBar back={`/tour/${key}`} />
        <p style={{ color: "var(--color-ink-soft)" }}>Loading…</p>
      </Frame>
    );
  }

  const options: [string, string][] = [
    ["a", question.option_a],
    ["b", question.option_b],
    ["c", question.option_c],
    ["d", question.option_d],
  ];

  return (
    <Frame>
      <TopBar back={`/tour/${key}`} />
      <div
        className="rounded-[11px] flex items-center justify-center h-20 mb-5 px-4 text-center"
        style={{ background: "var(--color-surface-muted)" }}
      >
        <p className="font-medium" style={{ color: "var(--color-ink)" }}>
          {question.prompt}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {options.map(([key_, label]) => {
          const isSelected = selected === key_;
          const isCorrectAnswer = result && isSelected && result.correct;
          const isWrongAnswer = result && isSelected && !result.correct;
          return (
            <button
              key={key_}
              onClick={() => submit(key_)}
              disabled={!!result}
              className="w-full text-left rounded-[11px] border px-4 py-3.5 text-[18px] disabled:opacity-70"
              style={{
                borderColor: isCorrectAnswer
                  ? "var(--color-success)"
                  : isWrongAnswer
                  ? "var(--color-gem-ruby)"
                  : "var(--color-border-strong)",
                color: "var(--color-ink)",
                background: isCorrectAnswer
                  ? "rgba(146,211,68,0.12)"
                  : isWrongAnswer
                  ? "rgba(215,54,54,0.08)"
                  : "white",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {result && (
        <div className="mt-5 text-center">
          {result.correct ? (
            <>
              <p className="font-bold" style={{ color: "var(--color-success)" }}>
                Correct! +1 shard{result.gemAwarded ? ` and a ${result.gemAwarded} gem!` : ""}
              </p>
              {result.gemAwarded && (
                <div className="flex justify-center mt-2">
                  <GemDot type={result.gemAwarded} size={20} />
                </div>
              )}
              <div className="mt-4">
                <PrimaryButton onClick={() => router.push(`/tour/${key}`)}>Back to tour</PrimaryButton>
              </div>
            </>
          ) : (
            <>
              <p className="font-bold" style={{ color: "var(--color-gem-ruby)" }}>
                Not quite — give it another go.
              </p>
              <div className="mt-4">
                <PrimaryButton
                  variant="outline"
                  onClick={() => {
                    setSelected(null);
                    setResult(null);
                  }}
                >
                  Try again
                </PrimaryButton>
              </div>
            </>
          )}
        </div>
      )}
    </Frame>
  );
}
