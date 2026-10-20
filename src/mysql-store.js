import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
export function databaseOptions(env = process.env) {
  for (const key of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
    if (!env[key]) throw new Error(`Missing ${key}`);
  }
  const port = Number(env.DB_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid DB_PORT');
  return { host: env.DB_HOST, port, database: env.DB_NAME, user: env.DB_USER,
    password: env.DB_PASSWORD, charset: 'utf8mb4', timezone: 'Z',
    connectionLimit: 4, connectTimeout: 3000, waitForConnections: true, queueLimit: 20 };
}
export async function createMysqlStore(options, seedPath) {
  const pool = mysql.createPool(options);
  try {
    await pool.query('SELECT 1');
    await pool.query(`CREATE TABLE IF NOT EXISTS notes (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(80) NOT NULL,
      author VARCHAR(30) NOT NULL,
      body TEXT NOT NULL,
      created_at DATETIME(3) NOT NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
    await pool.query(`CREATE TABLE IF NOT EXISTS app_meta (
      meta_key VARCHAR(40) PRIMARY KEY, meta_value VARCHAR(40) NOT NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
    await pool.execute('INSERT IGNORE INTO app_meta (meta_key, meta_value) VALUES (?, ?)', ['seeded', '0']);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute('SELECT meta_value FROM app_meta WHERE meta_key = ? FOR UPDATE', ['seeded']);
      if (rows[0].meta_value === '0') {
        const seed = JSON.parse(await readFile(seedPath, 'utf8'));
        for (const note of seed) {
          await connection.execute('INSERT INTO notes (id, title, author, body, created_at) VALUES (?, ?, ?, ?, ?)',
            [note.id, note.title, note.author, note.body, new Date(note.createdAt)]);
        }
        await connection.execute('UPDATE app_meta SET meta_value = ? WHERE meta_key = ?', ['1', 'seeded']);
      }
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  } catch (error) { await pool.end(); throw error; }
  const toNote = row => ({ id: row.id, title: row.title, author: row.author,
    body: row.body, createdAt: row.created_at.toISOString() });
  return {
    async health() { await pool.query('SELECT 1'); },
    async list() {
      const [rows] = await pool.query('SELECT id, title, author, body, created_at FROM notes ORDER BY id DESC');
      return rows.map(toNote);
    },
    async add(input) {
      const createdAt = new Date();
      const [result] = await pool.execute('INSERT INTO notes (title, author, body, created_at) VALUES (?, ?, ?, ?)',
        [input.title, input.author, input.body, createdAt]);
      return { id: result.insertId, ...input, createdAt: createdAt.toISOString() };
    },
    close: () => pool.end()
  };
}
