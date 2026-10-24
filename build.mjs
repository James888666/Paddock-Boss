import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const styles = ['base.css', 'setup.css', 'app.css', 'pages.css', 'season.css', 'race.css', 'end.css', 'offseason.css']
  .map((f) => `/* ---- ${f} ---- */\n${read(`src/${f}`)}`)
  .join('\n');
const scripts = ['circuit-art.js', 'historical-tracks.js', 'data.js', 'app.js', 'actions.js', 'screens.js', 'schedule.js', 'dashboard.js', 'seasonpages.js', 'race.js', 'seasonend.js', 'offseason.js']
  .map((f) => `/* ---- ${f} ---- */\n${read(`src/${f}`)}`)
  .join('\n');

const template = read('src/index.template.html');
const html = template
  .replace('/*__STYLES__*/', () => styles)
  .replace('/*__SCRIPTS__*/', () => `(function(){\n'use strict';\n${scripts}\n})();`);

fs.writeFileSync(path.join(root, 'index.html'), html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`Built index.html (${kb} KB)`);
