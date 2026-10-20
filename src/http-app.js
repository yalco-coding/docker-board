import express from 'express';
export function createHttpApp({ store, title, version, staticDir, commit = 'local' }) {
  const app = express(); app.disable('x-powered-by'); app.use(express.json({ limit: '16kb' }));
  app.get('/health', async (_req, res) => {
    try { await store.health(); res.json({ status: 'ok', storage: 'mysql' }); }
    catch { res.status(503).json({ status: 'error', storage: 'mysql' }); }
  });
  app.get('/version', (_req, res) => res.json({ version, commit }));
  app.get('/api/config', (_req, res) => res.json({ title, version }));
  app.get('/api/notes', async (_req, res) => res.json(await store.list()));
  app.post('/api/notes', async (req, res) => {
    const input = req.body || {}, clean = {};
    for (const [key, max] of [['title', 80], ['author', 30], ['body', 2000]]) {
      if (typeof input[key] !== 'string' || !input[key].trim() || input[key].trim().length > max) {
        return res.status(400).json({ message: '제목 80자, 작성자 30자, 내용 2,000자 이내로 모두 입력해주세요.' });
      }
      clean[key] = input[key].trim();
    }
    res.status(201).json(await store.add(clean));
  });
  app.use(express.static(staticDir));
  app.use((_req, res) => res.status(404).json({ message: '요청한 주소를 찾을 수 없어요.' }));
  app.use((error, _req, res, _next) => {
    console.error(`Request failed: ${error.code || error.name}`);
    res.status(error.status === 413 ? 413 : error instanceof SyntaxError ? 400 : 500)
      .json({ message: '요청을 처리하지 못했어요.' });
  });
  return app;
}
