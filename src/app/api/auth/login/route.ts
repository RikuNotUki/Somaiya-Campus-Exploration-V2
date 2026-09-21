import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { studentCode, password } = await req.json();
  if (!studentCode || !password) {
    return NextResponse.json({ error: "Missing student ID or password" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { data: student, error } = await supabase
    .from("students")
    .select("id, student_code, password_hash, display_name")
    .eq("student_code", studentCode)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!student) {
    return NextResponse.json({ error: "That ID and password don't match a pre-set account." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, student.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "That ID and password don't match a pre-set account." }, { status: 401 });
  }

  await setSessionCookie(student.id);
  return NextResponse.json({ ok: true, displayName: student.display_name });
}
