import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { createMysqlStore, databaseOptions } from './mysql-store.js';
import { createHttpApp } from './http-app.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaults = JSON.parse(await readFile(path.join(root, 'config/defaults.json'), 'utf8'));
const { version } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const title = process.env.APP_TITLE || defaults.title;
const port = Number(process.env.PORT || defaults.port);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
let store;
try { store = await createMysqlStore(databaseOptions(), path.join(root, 'data/notes.json')); }
catch (error) {
  console.error(`DB startup failed: ${error.code || error.message}; check DB_HOST, DB_NAME, DB_USER and the password file.`);
  process.exit(1);
}
const app = createHttpApp({ store, title, version, commit: process.env.BUILD_COMMIT || 'local',
  staticDir: path.join(root, existsSync(path.join(root, 'dist/index.html')) ? 'dist' : 'public') });
const server = app.listen(port, '0.0.0.0', () => console.log(`docker-board ${version} listening on 0.0.0.0:${port}; storage=mysql`));
let closing = false;
function shutdown() {
  if (closing) return;
  closing = true;
  const timer = setTimeout(() => process.exit(1), 10000); timer.unref();
  server.close(async () => { await store.close(); clearTimeout(timer); });
}
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
