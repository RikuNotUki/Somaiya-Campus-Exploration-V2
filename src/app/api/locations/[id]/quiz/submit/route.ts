import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getCurrentStudentId } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const studentId = await getCurrentStudentId();
  if (!studentId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id: locationId } = await params;
  const { questionId, selected } = await req.json();

  const supabase = getSupabaseServer();

  const { data: progress } = await supabase
    .from("student_location_progress")
    .select("geotagged_at, quiz_passed_at")
    .eq("student_id", studentId)
    .eq("location_id", locationId)
    .maybeSingle();
  if (!progress?.geotagged_at) {
    return NextResponse.json({ error: "Geo-tag this location first." }, { status: 403 });
  }

  const { data: question, error: qErr } = await supabase
    .from("quiz_questions")
    .select("id, correct_option")
    .eq("id", questionId)
    .maybeSingle();
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const correct = question.correct_option === selected;

  if (!correct) {
    return NextResponse.json({ correct: false });
  }

  if (progress.quiz_passed_at) {
    // Already passed previously (e.g. re-visiting) — don't double-award.
    return NextResponse.json({ correct: true, alreadyAwarded: true });
  }

  // Reveal (but don't create) the hidden gem assignment for this location, if any.
  const { data: assignment } = await supabase
    .from("student_gem_assignments")
    .select("gem_type")
    .eq("student_id", studentId)
    .eq("location_id", locationId)
    .maybeSingle();

  const { error: updateErr } = await supabase
    .from("student_location_progress")
    .update({
      quiz_passed_at: new Date().toISOString(),
      shard_awarded: true,
      gem_awarded: assignment?.gem_type ?? null,
    })
    .eq("student_id", studentId)
    .eq("location_id", locationId);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({
    correct: true,
    shardAwarded: true,
    gemAwarded: assignment?.gem_type ?? null,
  });
}
