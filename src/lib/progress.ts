import { SupabaseClient } from "@supabase/supabase-js";

export type CategoryProgress = {
  id: string;
  key: string;
  label: string;
  gem_type: string;
  is_gate: boolean;
  sort_order: number;
  totalLocations: number;
  completedLocations: number;
  unlocked: boolean;
};

/**
 * Returns every category with the student's completion count, and whether
 * it's unlocked. Gate categories (Institute Tour, Campus History) are
 * always unlocked; everything else unlocks only once ALL gate categories
 * are fully completed, per the spec's "mandatory front door" rule.
 */
export async function getCategoryProgress(
  supabase: SupabaseClient,
  studentId: string
): Promise<CategoryProgress[]> {
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, key, label, gem_type, is_gate, sort_order")
    .order("sort_order");
  if (catErr) throw catErr;

  const { data: locations, error: locErr } = await supabase
    .from("locations")
    .select("id, category_id");
  if (locErr) throw locErr;

  const { data: progress, error: progErr } = await supabase
    .from("student_location_progress")
    .select("location_id, quiz_passed_at")
    .eq("student_id", studentId)
    .not("quiz_passed_at", "is", null);
  if (progErr) throw progErr;

  const completedLocationIds = new Set((progress ?? []).map((p) => p.location_id));

  const byCategory = new Map<string, { total: number; completed: number }>();
  for (const loc of locations ?? []) {
    const entry = byCategory.get(loc.category_id) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (completedLocationIds.has(loc.id)) entry.completed += 1;
    byCategory.set(loc.category_id, entry);
  }

  const gateCategories = (categories ?? []).filter((c) => c.is_gate);
  const gatesComplete = gateCategories.every((c) => {
    const p = byCategory.get(c.id) ?? { total: 0, completed: 0 };
    return p.total > 0 && p.completed >= p.total;
  });

  return (categories ?? []).map((c) => {
    const p = byCategory.get(c.id) ?? { total: 0, completed: 0 };
    return {
      id: c.id,
      key: c.key,
      label: c.label,
      gem_type: c.gem_type,
      is_gate: c.is_gate,
      sort_order: c.sort_order,
      totalLocations: p.total,
      completedLocations: p.completed,
      unlocked: c.is_gate || gatesComplete,
    };
  });
}
