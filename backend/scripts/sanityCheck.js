import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

async function sanityCheck() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set in backend/.env");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const nowResult = await pool.query("SELECT NOW() as now");
    const tablesResult = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name`
    );

    console.log("✓ DB connection OK:", nowResult.rows[0].now);
    console.log(
      "✓ Public tables:",
      tablesResult.rows.map((r) => r.table_name).join(", ") || "(none)"
    );
  } finally {
    await pool.end();
  }
}

sanityCheck().catch((error) => {
  console.error("✗ Sanity check failed:", error.message);
  process.exit(1);
});
