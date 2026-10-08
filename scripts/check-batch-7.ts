import fs from "fs";
import path from "path";
import { ctesDefs } from "./batch-7-1-ctes";
import { recursiveCtesDefs } from "./batch-7-1-recursive-ctes";
import { viewsDefs } from "./batch-7-1-views";
import { temporaryTablesDefs } from "./batch-7-1-temporary-tables";

const pgDir = path.resolve(process.cwd(), "content", "questions", "postgresql");
const files = fs.readdirSync(pgDir);
const existingSlugs = new Set<string>();
for (const f of files) {
  // Exclude the 4 topics if they only had 3 seeds, but we want to make sure new slugs don't collide with existing slugs!
  const qs = JSON.parse(fs.readFileSync(path.join(pgDir, f), "utf-8"));
  for (const q of qs) {
    existingSlugs.add(q.slug);
  }
}

const batches = [
  { topic: "ctes", defs: ctesDefs },
  { topic: "recursive-ctes", defs: recursiveCtesDefs },
  { topic: "views", defs: viewsDefs },
  { topic: "temporary-tables", defs: temporaryTablesDefs },
];

let errors = 0;
const newSlugs = new Set<string>();

for (const b of batches) {
  console.log(`Checking ${b.topic} (${b.defs.length} definitions)...`);
  if (b.defs.length !== 29) {
    console.error(`ERROR: ${b.topic} has ${b.defs.length} defs, expected 29`);
    errors++;
  }
  for (let i = 0; i < b.defs.length; i++) {
    const d = b.defs[i];
    const expectedNum = i + 4;
    if (d.num !== expectedNum) {
      console.error(`ERROR: ${b.topic} item ${i} has num ${d.num}, expected ${expectedNum}`);
      errors++;
    }
    if (newSlugs.has(d.slug)) {
      console.error(`ERROR: Duplicate new slug in batch: ${d.slug}`);
      errors++;
    }
    if (existingSlugs.has(d.slug)) {
      console.error(`ERROR: Slug collision with existing question bank: ${d.slug}`);
      errors++;
    }
    newSlugs.add(d.slug);

    if (!d.solutionPg || !d.solutionMy) {
      console.error(`ERROR: Missing solution in ${b.topic} num ${d.num}`);
      errors++;
    }
    if (d.expectedColumns.length === 0) {
      console.error(`ERROR: No expected columns in ${b.topic} num ${d.num}`);
      errors++;
    }
    if (d.hints.length < 3) {
      console.error(`ERROR: Hints < 3 in ${b.topic} num ${d.num}`);
      errors++;
    }
  }
}

if (errors === 0) {
  console.log("All 4 Level 7 batches passed integrity checks! Total new definitions: 116");
} else {
  console.error(`Integrity check failed with ${errors} errors.`);
  process.exit(1);
}
