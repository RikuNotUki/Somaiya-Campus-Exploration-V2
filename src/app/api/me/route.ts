import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getCurrentStudentId } from "@/lib/session";
import { getStudentInventory } from "@/lib/inventory";
import { getCategoryProgress } from "@/lib/progress";

export async function GET() {
  const studentId = await getCurrentStudentId();
  if (!studentId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const supabase = getSupabaseServer();
  const { data: student, error } = await supabase
    .from("students")
    .select("id, student_code, display_name")
    .eq("id", studentId)
    .maybeSingle();
  if (error || !student) {
    return NextResponse.json({ error: "Session invalid" }, { status: 401 });
  }

  const [{ inventory, shardsAvailable }, categories] = await Promise.all([
    getStudentInventory(supabase, studentId),
    getCategoryProgress(supabase, studentId),
  ]);

  const totalLocations = categories.reduce((s, c) => s + c.totalLocations, 0);
  const completedLocations = categories.reduce((s, c) => s + c.completedLocations, 0);
  const totalGems = Object.values(inventory).reduce((s, n) => s + n, 0);

  return NextResponse.json({
    student: { id: student.id, studentCode: student.student_code, displayName: student.display_name },
    inventory,
    totalGems,
    shardsAvailable,
    categories,
    explorationProgress: { completed: completedLocations, total: totalLocations },
  });
}
