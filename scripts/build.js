import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['public/app.js', 'public/styles.css'], outdir: 'dist', minify: true, bundle: true, target: 'es2022' });
await writeFile('dist/index.html', await readFile('public/index.html'));
console.log('Built dist/index.html, dist/app.js, dist/styles.css');
