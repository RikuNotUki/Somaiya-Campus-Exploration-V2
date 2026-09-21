import { SupabaseClient } from "@supabase/supabase-js";
import { emptyInventory, GemInventory, GemType } from "./gems";

export async function getStudentInventory(supabase: SupabaseClient, studentId: string) {
  const inventory = emptyInventory();

  // Gems: one per location where the student found their assigned gem
  // (i.e. they passed the quiz at a location that was a "winner" for them).
  const { data: progress, error: progErr } = await supabase
    .from("student_location_progress")
    .select("location_id, gem_awarded, shard_awarded, quiz_passed_at, location:locations(id)")
    .eq("student_id", studentId);
  if (progErr) throw progErr;

  for (const row of progress ?? []) {
    if (row.gem_awarded) {
      inventory[row.gem_awarded as GemType] += 1;
    }
  }

  // Shards earned: quiz_questions.shard_reward for every location where a shard was awarded.
  const { data: shardLocations } = await supabase
    .from("student_location_progress")
    .select("location_id")
    .eq("student_id", studentId)
    .eq("shard_awarded", true);

  let shardsEarned = 0;
  if (shardLocations && shardLocations.length > 0) {
    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("location_id, shard_reward")
      .in(
        "location_id",
        shardLocations.map((r) => r.location_id)
      );
    shardsEarned = (questions ?? []).reduce((sum, q) => sum + q.shard_reward, 0);
  }

  // Shards + jokers already converted.
  const { data: conversions } = await supabase
    .from("shard_conversions")
    .select("shards_used, joker_gems_created")
    .eq("student_id", studentId);

  const shardsUsed = (conversions ?? []).reduce((s, c) => s + c.shards_used, 0);
  const jokersFromShards = (conversions ?? []).reduce((s, c) => s + c.joker_gems_created, 0);
  inventory.joker += jokersFromShards;

  // Gems already spent on redemptions.
  const { data: redemptions } = await supabase
    .from("redemptions")
    .select("gems_consumed")
    .eq("student_id", studentId);

  for (const r of redemptions ?? []) {
    const consumed = r.gems_consumed as Partial<GemInventory>;
    for (const [type, amount] of Object.entries(consumed)) {
      inventory[type as GemType] -= amount ?? 0;
    }
  }

  const shardsAvailable = shardsEarned - shardsUsed;

  return { inventory, shardsAvailable };
}
