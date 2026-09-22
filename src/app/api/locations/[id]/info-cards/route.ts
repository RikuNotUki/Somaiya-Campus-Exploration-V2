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
    .select("geotagged_at")
    .eq("student_id", studentId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (!progress?.geotagged_at) {
    return NextResponse.json(
      { error: "Geo-tag this location first — walk to the spot to unlock its info." },
      { status: 403 }
    );
  }

  const { data: cards, error } = await supabase
    .from("location_info_cards")
    .select("id, sort_order, title, body, image_url")
    .eq("location_id", locationId)
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ cards: cards ?? [] });
}
