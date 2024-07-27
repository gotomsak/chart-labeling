import { openDB } from "../utils/db";

(async () => {
  const db = await openDB();
  await db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)');
  console.log('Database initialized');
})();