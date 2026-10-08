import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('content/questions/postgresql').filter(f => f.startsWith('scenario-'));
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join('content/questions/postgresql', f), 'utf8'));
  const db = data[0]?.database_id;
  const tables = [...new Set(data.flatMap((d: any) => d.tables_involved || []))];
  const prefix = data[0]?.id?.split('-').slice(0, 3).join('-');
  console.log(`${f.padEnd(35)} count: ${data.length} | db: ${db.padEnd(16)} | prefix: ${prefix} | tables: ${tables.join(', ')}`);
}
