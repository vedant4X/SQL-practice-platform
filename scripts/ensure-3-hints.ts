import fs from "fs";
import path from "path";

const files = [
  "src/lib/curriculum/questions/level1-basics.ts",
  "src/lib/curriculum/questions/level2-functions.ts",
  "src/lib/curriculum/questions/level3-grouping.ts",
  "src/lib/curriculum/questions/level4-joins.ts",
  "src/lib/curriculum/questions/level5-subqueries.ts",
  "src/lib/curriculum/questions/level6-set-operators.ts",
  "src/lib/curriculum/questions/level7-intermediate.ts",
  "src/lib/curriculum/questions/level8-window.ts",
  "src/lib/curriculum/questions/level9-advanced.ts",
  "src/lib/curriculum/questions/level10-scenarios.ts",
];

for (const file of files) {
  const filePath = path.resolve(process.cwd(), file);
  let content = fs.readFileSync(filePath, "utf-8");

  // Regex to match hints: [ ... ]
  content = content.replace(/hints:\s*\[([\s\S]*?)\]/g, (match, hintBody) => {
    // Extract individual string literals from hintBody
    const rawHints: string[] = [];
    const strRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g;
    let m;
    while ((m = strRegex.exec(hintBody)) !== null) {
      rawHints.push(m[1] !== undefined ? m[1] : m[2]);
    }

    if (rawHints.length >= 3) {
      return match;
    }

    // If it has 2 hints:
    // hint 1 is conceptual, hint 2 is solution
    // We insert a step-by-step intermediate hint between them
    const newHints = [...rawHints];
    if (newHints.length === 1) {
      newHints.unshift("Start by reviewing the table columns in the database schema panel.");
      newHints.push("Review the solution syntax carefully before submitting.");
    } else if (newHints.length === 2) {
      const intermediate = "Focus on the required WHERE, JOIN, or GROUP BY clause conditions.";
      newHints.splice(1, 0, intermediate);
    }

    const formatted = newHints
      .map((h) => `      "${h.replace(/"/g, '\\"')}"`)
      .join(",\n");

    return `hints: [\n${formatted}\n    ]`;
  });

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`Updated hint counts in ${file}`);
}
console.log("All question hint counts normalized to >= 3 levels.");
