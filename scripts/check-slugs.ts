import fs from "fs";
import path from "path";

const dir = path.resolve(process.cwd(), "content", "questions", "postgresql");
const files = fs.readdirSync(dir);
const allSlugs = new Set<string>();

for (const f of files) {
  const qs = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
  for (const q of qs) {
    if (allSlugs.has(q.slug)) {
      console.error(`DUPLICATE SLUG FOUND: ${q.slug} in ${f}`);
    }
    allSlugs.add(q.slug);
  }
}

console.log(`Verified ${allSlugs.size} unique slugs across ${files.length} PostgreSQL files.`);
