// Validates that every message key referenced in the code exists in messages/en.json.
// Run: node scripts/check-keys.mjs   (after each page conversion)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const en = JSON.parse(readFileSync(join(ROOT, 'messages', 'en.json'), 'utf8'));

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (e === 'node_modules' || e === '.next') continue;
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts)$/.test(e) && !e.endsWith('.d.ts')) acc.push(p);
  }
  return acc;
}

const files = walk(join(ROOT, 'src'));

const problems = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  if (!/useTranslations|getTranslations/.test(src)) continue;

  // namespace → variable names
  const nsVar = new Map();
  for (const m of src.matchAll(/useTranslations\(\s*'([\w.]+)'\s*\)/g)) {
    // find the variable it's assigned to: scan backwards for "const X ="
    const before = src.slice(0, m.index);
    const vm = [...before.matchAll(/const\s+(\w+)\s*=\s*$/g)];
    if (vm.length) nsVar.set(vm[vm.length - 1][1], m[1]);
  }
  for (const m of src.matchAll(/getTranslations\(\s*\{\s*locale[^}]*namespace:\s*'([\w.]+)'\s*\}\s*\)/g)) {
    const before = src.slice(0, m.index);
    const vm = [...before.matchAll(/const\s+(\w+)\s*=\s*await\s*$/g)];
    if (vm.length) nsVar.set(vm[vm.length - 1][1], m[1]);
  }
  if (nsVar.size === 0) continue;

  const lineNo = (idx) => src.slice(0, idx).split('\n').length;
  for (const [v, ns] of nsVar) {
    // t('key') or t.raw('key') usages, but only within the scope of this file where v is in scope.
    const re = new RegExp(`[^\\w.]${v}(?:\\.raw)?\\(\\s*'([^']+)'`, 'g');
    let m;
    while ((m = re.exec(src))) {
      const key = m[1];
      if (key.includes('.')) {
        const [head, ...rest] = key.split('.');
        let node = en[head];
        for (const part of rest) node = node?.[part];
        if (node === undefined) problems.push(`${file}:${lineNo(m.index)}  ${ns}.${key}  (${v})`);
      } else {
        if (!(key in (en[ns] ?? {}))) {
          problems.push(`${file}:${lineNo(m.index)}  ${ns}.${key}  (${v})`);
        }
      }
    }
  }
}

if (problems.length) {
  console.log(`✗ ${problems.length} missing message key(s):`);
  for (const p of [...new Set(problems)]) console.log('  ' + p);
  process.exit(1);
} else {
  console.log('✓ all message keys referenced in code exist in messages/en.json');
}
