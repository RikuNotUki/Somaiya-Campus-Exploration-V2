import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getCurrentStudentId } from "@/lib/session";
import { getStudentInventory } from "@/lib/inventory";

const SHARDS_PER_JOKER = 5;

export async function POST() {
  const studentId = await getCurrentStudentId();
  if (!studentId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const supabase = getSupabaseServer();
  const { shardsAvailable } = await getStudentInventory(supabase, studentId);

  if (shardsAvailable < SHARDS_PER_JOKER) {
    return NextResponse.json(
      { error: `You need ${SHARDS_PER_JOKER} shards to combine — you have ${shardsAvailable}.` },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("shard_conversions").insert({
    student_id: studentId,
    shards_used: SHARDS_PER_JOKER,
    joker_gems_created: 1,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, jokerGemsCreated: 1 });
}
