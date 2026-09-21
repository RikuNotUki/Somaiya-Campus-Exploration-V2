import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getCurrentStudentId } from "@/lib/session";
import { isWithinRadius } from "@/lib/geo";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const studentId = await getCurrentStudentId();
  if (!studentId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id: locationId } = await params;
  const { lat, lng } = await req.json();

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { data: location, error: locErr } = await supabase
    .from("locations")
    .select("id, lat, lng, proximity_radius_m")
    .eq("id", locationId)
    .maybeSingle();
  if (locErr) return NextResponse.json({ error: locErr.message }, { status: 500 });
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  const within = isWithinRadius(lat, lng, location.lat, location.lng, location.proximity_radius_m);
  if (!within) {
    return NextResponse.json({ arrived: false, message: "You're not close enough yet — keep walking!" });
  }

  const { error: upsertErr } = await supabase
    .from("student_location_progress")
    .upsert(
      { student_id: studentId, location_id: locationId, geotagged_at: new Date().toISOString() },
      { onConflict: "student_id,location_id", ignoreDuplicates: false }
    );
  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });

  return NextResponse.json({ arrived: true });
}
