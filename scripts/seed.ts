import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { loadCsv, resolveSource } from "./loadCsv";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env — see .env.example"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

type CategoryRow = {
  category_key: string;
  label: string;
  gem_type: string;
  is_gate: string;
  sort_order: string;
  reward_mode: string;
  gem_pool: string;
};

type LocationRow = {
  category_key: string;
  name: string;
  lat: string;
  lng: string;
  proximity_radius_m: string;
  did_you_know: string;
  info_md: string;
  image_url: string;
  pdf_url: string;
  video_url: string;
  sort_order: string;
};

type QuizRow = {
  location_name: string;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  shard_reward: string;
};

type PrizeRow = {
  name: string;
  image_url: string;
  recipe_json: string;
  sort_order: string;
};

type StudentRow = {
  student_code: string;
  password: string;
  display_name: string;
};

async function main() {
  console.log("Seeding categories...");
  const categoryRows = await loadCsv<CategoryRow>(
    resolveSource("CATEGORIES_CSV_URL", "categories.csv")
  );
  const categoryIdByKey = new Map<string, string>();

  for (const row of categoryRows) {
    const { data, error } = await supabase
      .from("categories")
      .upsert(
        {
          key: row.category_key,
          label: row.label,
          gem_type: row.gem_type,
          is_gate: row.is_gate.toLowerCase() === "true",
          sort_order: Number(row.sort_order) || 0,
          reward_mode: row.reward_mode || "weighted",
          gem_pool: row.gem_pool ? Number(row.gem_pool) : null,
        },
        { onConflict: "key" }
      )
      .select("id, key")
      .single();
    if (error) throw error;
    categoryIdByKey.set(data.key, data.id);
  }

  console.log("Seeding locations...");
  const locationRows = await loadCsv<LocationRow>(
    resolveSource("LOCATIONS_CSV_URL", "locations.csv")
  );
  const locationIdByName = new Map<string, string>();

  for (const row of locationRows) {
    const categoryId = categoryIdByKey.get(row.category_key);
    if (!categoryId) {
      console.warn(`Skipping location "${row.name}" — unknown category_key "${row.category_key}"`);
      continue;
    }
    const { data, error } = await supabase
      .from("locations")
      .upsert(
        {
          category_id: categoryId,
          name: row.name,
          lat: Number(row.lat),
          lng: Number(row.lng),
          proximity_radius_m: Number(row.proximity_radius_m) || 40,
          did_you_know: row.did_you_know || null,
          info_md: row.info_md || null,
          image_url: row.image_url || null,
          pdf_url: row.pdf_url || null,
          video_url: row.video_url || null,
          sort_order: Number(row.sort_order) || 0,
        },
        { onConflict: "category_id,name" }
      )
      .select("id, name")
      .single();
    if (error) throw error;
    locationIdByName.set(data.name, data.id);
  }

  console.log("Seeding quiz questions...");
  const quizRows = await loadCsv<QuizRow>(
    resolveSource("QUIZ_CSV_URL", "quiz_questions.csv")
  );
  const locationsWithQuiz = new Set<string>();

  for (const row of quizRows) {
    const locationId = locationIdByName.get(row.location_name);
    if (!locationId) {
      console.warn(`Skipping quiz row — unknown location "${row.location_name}"`);
      continue;
    }
    locationsWithQuiz.add(row.location_name);
    // Replace any existing question(s) for this location with the CSV version.
    await supabase.from("quiz_questions").delete().eq("location_id", locationId);
    const { error } = await supabase.from("quiz_questions").insert({
      location_id: locationId,
      prompt: row.prompt,
      option_a: row.option_a,
      option_b: row.option_b,
      option_c: row.option_c,
      option_d: row.option_d,
      correct_option: row.correct_option.toLowerCase(),
      shard_reward: Number(row.shard_reward) || 1,
    });
    if (error) throw error;
  }

  // Auto-fill a placeholder question for every location that doesn't have
  // a real one yet, so the app is fully click-through-able immediately.
  console.log("Filling placeholder quiz questions for remaining locations...");
  for (const [name, locationId] of locationIdByName) {
    if (locationsWithQuiz.has(name)) continue;
    const { data: existing } = await supabase
      .from("quiz_questions")
      .select("id")
      .eq("location_id", locationId)
      .limit(1);
    if (existing && existing.length > 0) continue;

    const { error } = await supabase.from("quiz_questions").insert({
      location_id: locationId,
      prompt: `[Placeholder] What did you learn at ${name}?`,
      option_a: "Placeholder answer A",
      option_b: "Placeholder answer B",
      option_c: "Placeholder answer C",
      option_d: "Placeholder answer D",
      correct_option: "a",
      shard_reward: 1,
    });
    if (error) throw error;
  }

  console.log("Seeding prizes...");
  const prizeRows = await loadCsv<PrizeRow>(resolveSource("PRIZES_CSV_URL", "prizes.csv"));
  for (const row of prizeRows) {
    let recipe: Record<string, number>;
    try {
      recipe = JSON.parse(row.recipe_json);
    } catch {
      console.warn(`Skipping prize "${row.name}" — invalid recipe_json`);
      continue;
    }
    const { error } = await supabase.from("prizes").upsert(
      {
        name: row.name,
        image_url: row.image_url || null,
        recipe,
        sort_order: Number(row.sort_order) || 0,
        active: true,
      },
      { onConflict: "name" }
    );
    if (error) throw error;
  }

  console.log("Seeding pre-set student accounts...");
  const studentRows = await loadCsv<StudentRow>(
    resolveSource("STUDENTS_CSV_URL", "students.csv")
  );
  for (const row of studentRows) {
    const password_hash = await bcrypt.hash(row.password, 10);
    const { error } = await supabase.from("students").upsert(
      {
        student_code: row.student_code,
        password_hash,
        display_name: row.display_name,
      },
      { onConflict: "student_code" }
    );
    if (error) throw error;
  }

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
