import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get all tables
const [tables] = await connection.query("SHOW TABLES");
const tableNames = tables.map(t => Object.values(t)[0]);

console.log(`Found ${tableNames.length} tables to drop`);

// Drop all tables
for (const tableName of tableNames) {
  console.log(`Dropping ${tableName}...`);
  await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
}

console.log("All tables dropped successfully");
await connection.end();
