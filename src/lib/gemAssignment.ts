import { SupabaseClient } from "@supabase/supabase-js";
import { GemType } from "./gems";

/**
 * Ensures a student has a hidden gem assignment for every location in a
 * category, generating one on first visit if it doesn't exist yet.
 *
 * - reward_mode 'all' (Institute Tour, Campus History): every location is
 *   assigned the category's gem type. These are mandatory/gated categories,
 *   so the hidden-quantity suspense mechanic isn't needed to drive
 *   exploration — completion is already required.
 * - reward_mode 'weighted' (everything else): `gem_pool` locations are
 *   picked at random out of all the category's locations and assigned the
 *   gem; the rest get none. This is randomised per student and never
 *   revealed to them, so — per the spec — finding a gem early doesn't tell
 *   them whether more are left.
 *
 * Assignment happens once per student per category and is stored, so it
 * stays stable across sessions instead of re-rolling on every visit.
 */
export async function ensureGemAssignments(
  supabase: SupabaseClient,
  studentId: string,
  categoryId: string
) {
  const { data: category, error: catErr } = await supabase
    .from("categories")
    .select("id, gem_type, reward_mode, gem_pool")
    .eq("id", categoryId)
    .single();
  if (catErr || !category) throw catErr ?? new Error("Category not found");

  const { data: locations, error: locErr } = await supabase
    .from("locations")
    .select("id")
    .eq("category_id", categoryId);
  if (locErr) throw locErr;
  if (!locations || locations.length === 0) return;

  const { data: existing, error: existErr } = await supabase
    .from("student_gem_assignments")
    .select("location_id")
    .eq("student_id", studentId)
    .in(
      "location_id",
      locations.map((l) => l.id)
    );
  if (existErr) throw existErr;
  if (existing && existing.length > 0) return; // already assigned for this category

  const gemType = category.gem_type as GemType;
  let winningLocationIds: string[];

  if (category.reward_mode === "all") {
    winningLocationIds = locations.map((l) => l.id);
  } else {
    const pool = Math.min(category.gem_pool ?? 0, locations.length);
    winningLocationIds = shuffle(locations.map((l) => l.id)).slice(0, pool);
  }

  if (winningLocationIds.length === 0) return;

  const rows = winningLocationIds.map((location_id) => ({
    student_id: studentId,
    location_id,
    gem_type: gemType,
  }));

  const { error: insErr } = await supabase.from("student_gem_assignments").insert(rows);
  if (insErr) throw insErr;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
