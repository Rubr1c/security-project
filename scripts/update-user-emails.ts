import { Database } from 'bun:sqlite';

const updates = [
  { from: 'admin@hospital.com', to: 'alizaghloul64@gmail.com', role: 'admin' as const },
  { from: 'doctor@hospital.com', to: 'alizaghloul155@gmail.com', role: 'doctor' as const },
  { from: 'doctor2@hospital.com', to: 'alizaghloul360@gmail.com', role: 'doctor' as const },
  { from: 'nurse@hospital.com', to: 'alyshatroll@gmail.com', role: 'nurse' as const },
  { from: 'nurse2@hospital.com', to: 'esportsezclan@gmail.com', role: 'nurse' as const },
] as const;

async function run() {
  console.log('🔁 Updating user emails...\n');

  const nowIso = new Date().toISOString();
  const db = new Database('db.sqlite');
  db.exec('PRAGMA foreign_keys = ON;');

  for (const u of updates) {
    const exists = db.query('SELECT id FROM users WHERE email = ?').get(u.from);
    if (!exists) {
      console.log(`⚠️  Not found: ${u.from} (skipped)`);
      continue;
    }

    db.query(
      `UPDATE users
       SET email = ?,
           role = ?,
           email_verified_at = ?,
           otp_hash = NULL,
           otp_expires_at = NULL,
           otp_last_sent_at = NULL,
           otp_attempts = 0,
           updated_at = ?
       WHERE email = ?`
    ).run(u.to, u.role, nowIso, nowIso, u.from);

    console.log(`✅ ${u.from} → ${u.to} (${u.role})`);
  }

  console.log('\n✨ Done.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
  });


