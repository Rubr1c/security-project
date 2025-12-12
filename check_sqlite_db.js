const Database = require('better-sqlite3');
const db = new Database('sqlite.db', { verbose: console.log });
try {
  const indices = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'users'"
    )
    .all();
  console.log(
    'Indices in sqlite.db:',
    indices.map((i) => i.name)
  );
} catch (e) {
  console.log('Error:', e.message);
}
