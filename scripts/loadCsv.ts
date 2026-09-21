import fs from "fs";
import path from "path";
import Papa from "papaparse";

/**
 * Loads a CSV either from a local file (content/*.csv) or from a URL.
 *
 * To hand content editing to a spreadsheet instead of a local file:
 * 1. Put the same columns in a Google Sheet tab.
 * 2. File → Share → Publish to web → select that sheet → CSV.
 * 3. Copy the published URL into .env, e.g. LOCATIONS_CSV_URL=...
 * 4. Re-run `npm run seed` — no code changes needed.
 */
export async function loadCsv<T = Record<string, string>>(
  fileNameOrUrl: string
): Promise<T[]> {
  let text: string;
  if (fileNameOrUrl.startsWith("http")) {
    const res = await fetch(fileNameOrUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${fileNameOrUrl}: ${res.status}`);
    }
    text = await res.text();
  } else {
    const filePath = path.join(process.cwd(), "content", fileNameOrUrl);
    text = fs.readFileSync(filePath, "utf-8");
  }

  const parsed = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (parsed.errors.length) {
    console.warn(`CSV parse warnings for ${fileNameOrUrl}:`, parsed.errors.slice(0, 3));
  }

  return parsed.data;
}

/** Resolves a source: env override (URL) if set, else the local content/ file. */
export function resolveSource(envVar: string, localFile: string): string {
  return process.env[envVar]?.trim() || localFile;
}
