const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST ?? "127.0.0.1",
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? "inventory",
  user: process.env.PGUSER ?? "thata",
  password: process.env.PGPASSWORD ?? "mypassword@",
});

pool.on("error", (error) => {
  console.error("Unexpected database error", error);
});

module.exports = pool;
