// Deploy build (run by Vercel, see vercel.json): copies the site into dist/ and puts the
// open roles from content/roles.json (edited by the client in Pages CMS) into the page.
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';

const esc = s => String(s ?? '').trim();
let roles = JSON.parse(await readFile('content/roles.json', 'utf8'));
if (!Array.isArray(roles)) throw new Error('content/roles.json must be a list of roles');
roles = roles
  .filter(r => r && esc(r.title))
  .map(r => ({ title: esc(r.title), location: esc(r.location), url: esc(r.url) || '#' }));

const page = await readFile('index.html', 'utf8');
const re = /(<script type="application\/json" id="rolesData">)[\s\S]*?(<\/script>)/;
if (!re.test(page)) throw new Error('rolesData block not found in index.html');
// "<" escaped so a role title can never close the script tag
const data = JSON.stringify(roles, null, 2).replace(/</g, '\\u003c');
const out = page.replace(re, (_, a, b) => a + '\n' + data + '\n' + b);

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await writeFile('dist/index.html', out);
await cp('images', 'dist/images', { recursive: true });
console.log('Built dist/ with ' + roles.length + ' open role(s).');
