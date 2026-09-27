import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getCurrentStudentId } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const studentId = await getCurrentStudentId();
  if (!studentId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = await params;

  const supabase = getSupabaseServer();
  const { data: location, error } = await supabase
    .from("locations")
    .select("id, name, lat, lng, proximity_radius_m, category_id, categories(key, label, is_gate)")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  const category = location.categories as unknown as { key: string; label: string; is_gate: boolean } | null;

  // Enforce the sequencing gate here too, not just on the map/list views.
  if (category && !category.is_gate) {
    const { data: gateCategories } = await supabase
      .from("categories")
      .select("id")
      .eq("is_gate", true);
    const { data: gateLocations } = await supabase
      .from("locations")
      .select("id")
      .in("category_id", (gateCategories ?? []).map((g) => g.id));
    const { data: gateProgress } = await supabase
      .from("student_location_progress")
      .select("location_id")
      .eq("student_id", studentId)
      .not("quiz_passed_at", "is", null)
      .in("location_id", (gateLocations ?? []).map((l) => l.id));
    const gatesComplete = (gateLocations ?? []).length > 0 &&
      (gateProgress ?? []).length >= (gateLocations ?? []).length;
    if (!gatesComplete) {
      return NextResponse.json(
        { error: "Complete Institute Tour and Campus History first." },
        { status: 403 }
      );
    }
  }

  const { data: progress } = await supabase
    .from("student_location_progress")
    .select("geotagged_at, quiz_passed_at, gem_awarded")
    .eq("student_id", studentId)
    .eq("location_id", id)
    .maybeSingle();

  return NextResponse.json({
    id: location.id,
    name: location.name,
    lat: location.lat,
    lng: location.lng,
    proximityRadiusM: location.proximity_radius_m,
    categoryKey: category?.key ?? null,
    categoryLabel: category?.label ?? null,
    geotaggedAt: progress?.geotagged_at ?? null,
    quizPassedAt: progress?.quiz_passed_at ?? null,
    gemAwarded: progress?.quiz_passed_at ? progress?.gem_awarded ?? null : null,
  });
}
