import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getCurrentStudentId } from "@/lib/session";
import { getCategoryProgress } from "@/lib/progress";
import { ensureGemAssignments } from "@/lib/gemAssignment";

export async function GET() {
  const studentId = await getCurrentStudentId();
  if (!studentId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const supabase = getSupabaseServer();
  const categories = await getCategoryProgress(supabase, studentId);

  // Lazily assign hidden gems the first time the map is loaded for a
  // now-unlocked category (this used to happen on "entering" a category's
  // list page — the map is now that entry point).
  for (const c of categories) {
    if (c.unlocked) {
      await ensureGemAssignments(supabase, studentId, c.id);
    }
  }

  const { data: locations, error: locErr } = await supabase
    .from("locations")
    .select("id, name, lat, lng, proximity_radius_m, category_id");
  if (locErr) return NextResponse.json({ error: locErr.message }, { status: 500 });

  const { data: progressRows } = await supabase
    .from("student_location_progress")
    .select("location_id, geotagged_at, quiz_passed_at, gem_awarded")
    .eq("student_id", studentId);
  const progressByLocation = new Map((progressRows ?? []).map((p) => [p.location_id, p]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const result = (locations ?? []).map((loc) => {
    const category = categoryById.get(loc.category_id);
    const p = progressByLocation.get(loc.id);
    return {
      id: loc.id,
      name: loc.name,
      lat: loc.lat,
      lng: loc.lng,
      proximityRadiusM: loc.proximity_radius_m,
      categoryKey: category?.key ?? null,
      categoryLabel: category?.label ?? null,
      unlocked: category?.unlocked ?? false,
      geotaggedAt: p?.geotagged_at ?? null,
      quizPassedAt: p?.quiz_passed_at ?? null,
      gemAwarded: p?.quiz_passed_at ? p?.gem_awarded ?? null : null,
    };
  });

  return NextResponse.json({ locations: result });
}
