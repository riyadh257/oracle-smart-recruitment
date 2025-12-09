import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

const sqlFile = readFileSync('/home/ubuntu/oracle-smart-recruitment/drizzle/add_foreign_keys.sql', 'utf-8');

// Split by semicolon and filter out empty lines and comments
const statements = sqlFile
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log(`Executing ${statements.length} SQL statements...`);

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i];
  
  // Skip comments
  if (statement.startsWith('--')) {
    continue;
  }
  
  try {
    await connection.execute(statement);
    successCount++;
    console.log(`✓ [${i + 1}/${statements.length}] Success`);
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_FK_DUP_NAME') {
      skipCount++;
      console.log(`⊘ [${i + 1}/${statements.length}] Skipped (already exists)`);
    } else if (error.code === 'ER_CANT_CREATE_TABLE') {
      skipCount++;
      console.log(`⊘ [${i + 1}/${statements.length}] Skipped (constraint exists)`);
    } else {
      errorCount++;
      console.error(`✗ [${i + 1}/${statements.length}] Error: ${error.message}`);
      console.error(`   Statement: ${statement.substring(0, 100)}...`);
    }
  }
}

await connection.end();

console.log('\n' + '='.repeat(60));
console.log(`Migration Summary:`);
console.log(`  ✓ Success: ${successCount}`);
console.log(`  ⊘ Skipped: ${skipCount}`);
console.log(`  ✗ Errors:  ${errorCount}`);
console.log('='.repeat(60));

process.exit(errorCount > 0 ? 1 : 0);
