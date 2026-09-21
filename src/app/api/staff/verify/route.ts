import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const { code, passcode } = await req.json();

  if (passcode !== process.env.STAFF_PASSCODE) {
    return NextResponse.json({ error: "Wrong staff passcode." }, { status: 401 });
  }
  if (!code) return NextResponse.json({ error: "Enter a code." }, { status: 400 });

  const supabase = getSupabaseServer();
  const { data: redemption, error } = await supabase
    .from("redemptions")
    .select("id, code, status, issued_at, claimed_at, prize:prizes(name), student:students(display_name, student_code)")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!redemption) return NextResponse.json({ error: "No prize found for that code." }, { status: 404 });

  if (redemption.status === "claimed") {
    return NextResponse.json({
      valid: false,
      alreadyClaimed: true,
      prizeName: (redemption.prize as unknown as { name: string })?.name,
      studentName: (redemption.student as unknown as { display_name: string })?.display_name,
      claimedAt: redemption.claimed_at,
    });
  }

  const { error: updateErr } = await supabase
    .from("redemptions")
    .update({ status: "claimed", claimed_at: new Date().toISOString() })
    .eq("id", redemption.id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({
    valid: true,
    prizeName: (redemption.prize as unknown as { name: string })?.name,
    studentName: (redemption.student as unknown as { display_name: string })?.display_name,
    studentCode: (redemption.student as unknown as { student_code: string })?.student_code,
  });
}
