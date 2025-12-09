import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function seedData() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log("Starting data seeding...");

  try {
    // Seed pricing plans
    console.log("Seeding pricing plans...");
    const response = await fetch("http://localhost:3000/api/trpc/pricing.seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const pricingResult = await response.json();
    console.log("Pricing plans seeded:", pricingResult);

    // Seed testimonials
    console.log("Seeding testimonials...");
    const testimonialsResponse = await fetch("http://localhost:3000/api/trpc/testimonials.seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const testimonialsResult = await testimonialsResponse.json();
    console.log("Testimonials seeded:", testimonialsResult);

    // Seed blog posts
    console.log("Seeding blog posts...");
    const blogResponse = await fetch("http://localhost:3000/api/trpc/blog.seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const blogResult = await blogResponse.json();
    console.log("Blog posts seeded:", blogResult);

    console.log("✅ All marketing data seeded successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedData();
