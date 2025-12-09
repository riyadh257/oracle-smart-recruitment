import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('Checking for missing tables...');

// Get all existing tables
const [existingTables] = await connection.query('SHOW TABLES');
const tableNames = existingTables.map(t => Object.values(t)[0]);

console.log(`Found ${tableNames.length} existing tables`);
console.log('Schema defines', Object.keys(schema).filter(k => k.endsWith('s') || k === 'users').length, 'table exports');

// The schema is already defined, we just need to run the migration
console.log('\nAttempting to create missing tables using drizzle-kit push...');
await connection.end();

process.exit(0);
