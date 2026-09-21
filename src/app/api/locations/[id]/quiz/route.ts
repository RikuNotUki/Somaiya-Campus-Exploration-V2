import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getCurrentStudentId } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const studentId = await getCurrentStudentId();
  if (!studentId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id: locationId } = await params;

  const supabase = getSupabaseServer();
  const { data: progress } = await supabase
    .from("student_location_progress")
    .select("geotagged_at, quiz_passed_at")
    .eq("student_id", studentId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (!progress?.geotagged_at) {
    return NextResponse.json(
      { error: "Geo-tag this location first — walk to the spot to unlock its quiz." },
      { status: 403 }
    );
  }

  const { data: question, error } = await supabase
    .from("quiz_questions")
    .select("id, prompt, option_a, option_b, option_c, option_d")
    .eq("location_id", locationId)
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!question) return NextResponse.json({ error: "No quiz question set up for this location yet." }, { status: 404 });

  return NextResponse.json({ question, alreadyPassed: !!progress.quiz_passed_at });
}
