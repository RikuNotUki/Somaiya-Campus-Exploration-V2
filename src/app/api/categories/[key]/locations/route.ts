import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getCurrentStudentId } from "@/lib/session";
import { ensureGemAssignments } from "@/lib/gemAssignment";
import { getCategoryProgress } from "@/lib/progress";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const studentId = await getCurrentStudentId();
  if (!studentId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { key } = await params;

  const supabase = getSupabaseServer();
  const { data: category, error: catErr } = await supabase
    .from("categories")
    .select("id, key, label, gem_type, is_gate")
    .eq("key", key)
    .maybeSingle();
  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  // Enforce the sequencing gate server-side, not just in the UI.
  if (!category.is_gate) {
    const progress = await getCategoryProgress(supabase, studentId);
    const thisCategory = progress.find((c) => c.id === category.id);
    if (thisCategory && !thisCategory.unlocked) {
      return NextResponse.json(
        { error: "Complete Institute Tour and Campus History first." },
        { status: 403 }
      );
    }
  }

  // First visit to this category: silently assign hidden gems.
  await ensureGemAssignments(supabase, studentId, category.id);

  const { data: locations, error: locErr } = await supabase
    .from("locations")
    .select("id, name, lat, lng, proximity_radius_m, did_you_know, info_md, image_url, pdf_url, video_url, sort_order")
    .eq("category_id", category.id)
    .order("sort_order");
  if (locErr) return NextResponse.json({ error: locErr.message }, { status: 500 });

  const { data: progressRows } = await supabase
    .from("student_location_progress")
    .select("location_id, geotagged_at, quiz_passed_at, shard_awarded, gem_awarded")
    .eq("student_id", studentId)
    .in("location_id", (locations ?? []).map((l) => l.id));

  const progressByLocation = new Map((progressRows ?? []).map((p) => [p.location_id, p]));

  const result = (locations ?? []).map((loc) => {
    const p = progressByLocation.get(loc.id);
    return {
      ...loc,
      geotaggedAt: p?.geotagged_at ?? null,
      quizPassedAt: p?.quiz_passed_at ?? null,
      shardAwarded: p?.shard_awarded ?? false,
      // Only reveal the gem once they've actually found it (quiz passed).
      gemAwarded: p?.quiz_passed_at ? p?.gem_awarded ?? null : null,
    };
  });

  return NextResponse.json({
    category,
    locations: result,
    completed: result.filter((l) => l.quizPassedAt).length,
    total: result.length,
  });
}
