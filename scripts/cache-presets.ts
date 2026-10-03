import { writeFile } from "node:fs/promises";
import path from "node:path";
import { generateVariants } from "../lib/generate";
import { PRESETS } from "../lib/presets";

// Regenerates data/preset-cache.json: the round-1 (seed) variants for each preset brief.
// Run with `npm run cache-presets`. It only writes the file if every preset succeeds,
// so a failed run never leaves a half-empty cache behind.
async function main() {
  const cache: Record<string, unknown[]> = {};

  for (const preset of PRESETS) {
    console.log(`Generating "${preset.label}": ${preset.brief}`);
    const variants = await generateVariants(preset.brief, null);
    // Ids are stripped; the API route gives cached variants fresh ids on every request.
    cache[preset.brief] = variants.map((v) => ({
      label: v.label,
      applied: v.applied,
      tokens: v.tokens,
      layout: v.layout,
      enforced: v.enforced,
    }));
  }

  const file = path.join(process.cwd(), "data", "preset-cache.json");
  await writeFile(file, `${JSON.stringify(cache, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(cache).length} presets to ${file}`);
}

main().catch((error: unknown) => {
  console.error("cache-presets failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
