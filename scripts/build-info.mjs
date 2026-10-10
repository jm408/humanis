import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
let commit = process.env.HUMANIS_COMMIT || '';
if (!commit) { try { commit = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); } catch {} }
const info = { version: pkg.version, commit: /^[0-9a-f]{7,40}$/i.test(commit) ? commit.slice(0,7) : 'unknown', builtAt: new Date().toISOString() };
writeFileSync('src/buildInfo.generated.json', JSON.stringify(info));
