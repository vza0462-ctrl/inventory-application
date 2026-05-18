const { Pool } = require("pg");

function getPoolConfig() {
  if (process.env.DATABASE_URL) {
    const shouldUseSsl = process.env.PGSSLMODE !== "disable";

    return {
      connectionString: process.env.DATABASE_URL,
      ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    host: process.env.PGHOST ?? "127.0.0.1",
    port: Number(process.env.PGPORT ?? 5432),
    database: process.env.PGDATABASE ?? "inventory",
    user: process.env.PGUSER ?? "thata",
    password: process.env.PGPASSWORD ?? "mypassword@",
  };
}

const pool = new Pool(getPoolConfig());

pool.on("error", (error) => {
  console.error("Unexpected database error", error);
});

module.exports = pool;
