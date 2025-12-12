const Database = require('better-sqlite3');
const db = new Database('C:/Users/aliza/Programming/JS/security-project/security-project/db.sqlite', { verbose: console.log });
const indices = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'users'").all();
console.log('Indices:', indices.map(i => i.name));
