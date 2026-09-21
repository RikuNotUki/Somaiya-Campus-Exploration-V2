import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getCurrentStudentId } from "@/lib/session";
import { getStudentInventory } from "@/lib/inventory";
import { matchRecipe } from "@/lib/gems";

export async function GET() {
  const studentId = await getCurrentStudentId();
  if (!studentId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const supabase = getSupabaseServer();
  const { data: prizes, error } = await supabase
    .from("prizes")
    .select("id, name, image_url, recipe, sort_order")
    .eq("active", true)
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { inventory } = await getStudentInventory(supabase, studentId);

  const result = (prizes ?? []).map((p) => {
    const match = matchRecipe(inventory, p.recipe);
    return {
      id: p.id,
      name: p.name,
      imageUrl: p.image_url,
      recipe: p.recipe,
      progress: match,
    };
  });

  return NextResponse.json({ inventory, prizes: result });
}
