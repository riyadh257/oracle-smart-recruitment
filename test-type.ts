import { employers, type Employer } from "./drizzle/schema";
import { getDb } from "./server/db";

async function test() {
  const db = await getDb();
  if (!db) return;
  
  const allEmployers = await db.select().from(employers);
  const employer = allEmployers[0];
  
  // This should show what properties are available
  if (employer) {
    console.log(employer.contactEmail);
  }
}
