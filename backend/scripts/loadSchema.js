import { readFile } from "fs/promises";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

async function loadSchema() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to backend/.env.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const sql = await readFile(new URL("../schema.sql", import.meta.url), "utf8");
    await pool.query(sql);
    console.log("✓ Schema loaded successfully.");
  } finally {
    await pool.end();
  }
}

loadSchema().catch((error) => {
  console.error("✗ Failed to load schema:", error.message);
  process.exit(1);
});
