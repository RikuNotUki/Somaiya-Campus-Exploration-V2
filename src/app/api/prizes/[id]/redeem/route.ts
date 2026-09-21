import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getCurrentStudentId } from "@/lib/session";
import { getStudentInventory } from "@/lib/inventory";
import { consumeRecipe, matchRecipe } from "@/lib/gems";

function generateCode() {
  // 6-char, unambiguous alphabet (no 0/O/1/I).
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[crypto.randomInt(alphabet.length)];
  }
  return code;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const studentId = await getCurrentStudentId();
  if (!studentId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id: prizeId } = await params;

  const supabase = getSupabaseServer();
  const { data: prize, error: prizeErr } = await supabase
    .from("prizes")
    .select("id, name, recipe, active")
    .eq("id", prizeId)
    .maybeSingle();
  if (prizeErr) return NextResponse.json({ error: prizeErr.message }, { status: 500 });
  if (!prize || !prize.active) return NextResponse.json({ error: "Prize not available" }, { status: 404 });

  const { inventory } = await getStudentInventory(supabase, studentId);
  const match = matchRecipe(inventory, prize.recipe);
  if (!match.canRedeem) {
    return NextResponse.json({ error: "You don't have enough gems for this prize yet." }, { status: 400 });
  }

  const remaining = consumeRecipe(inventory, prize.recipe);
  const gemsConsumed: Record<string, number> = {};
  for (const key of Object.keys(inventory) as (keyof typeof inventory)[]) {
    const consumed = inventory[key] - remaining[key];
    if (consumed > 0) gemsConsumed[key] = consumed;
  }

  // Retry a few times in the unlikely event of a code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from("redemptions")
      .insert({
        student_id: studentId,
        prize_id: prize.id,
        code,
        gems_consumed: gemsConsumed,
        status: "issued",
      })
      .select("id, code")
      .single();

    if (!error) {
      return NextResponse.json({ ok: true, code: data.code, prizeName: prize.name });
    }
    if (!error.message.includes("duplicate")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Could not generate a unique code, try again." }, { status: 500 });
}
