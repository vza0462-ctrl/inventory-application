const pool = require("./pool");

async function runSetup() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS category (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      );
    `);

    await client.query(`
      ALTER TABLE category
      ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
    `);

    await client.query(`
      UPDATE category
      SET description = 'General inventory category'
      WHERE description IS NULL OR BTRIM(description) = '';
    `);

    await client.query(`
      ALTER TABLE category
      ALTER COLUMN name SET NOT NULL,
      ALTER COLUMN description SET NOT NULL;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS usernames (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        username VARCHAR(255)
      );
    `);

    await client.query(`
      UPDATE usernames
      SET username = CONCAT('staff-', id)
      WHERE username IS NULL OR BTRIM(username) = '';
    `);

    await client.query(`
      ALTER TABLE usernames
      ALTER COLUMN username SET NOT NULL;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE schemaname = 'public' AND indexname = 'usernames_username_key'
        ) THEN
          CREATE UNIQUE INDEX usernames_username_key ON usernames (username);
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        itemname VARCHAR(255),
        price NUMERIC(10, 2) DEFAULT 0.00,
        create_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER,
        category_id INTEGER
      );
    `);

    await client.query(`
      ALTER TABLE items
      ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS sku VARCHAR(40),
      ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;
    `);

    await client.query(`
      UPDATE items
      SET itemname = CONCAT('Item ', id)
      WHERE itemname IS NULL OR BTRIM(itemname) = '';
    `);

    await client.query(`
      UPDATE items
      SET description = ''
      WHERE description IS NULL;
    `);

    await client.query(`
      UPDATE items
      SET sku = CONCAT('SKU-', LPAD(id::TEXT, 4, '0'))
      WHERE sku IS NULL OR BTRIM(sku) = '';
    `);

    await client.query(`
      UPDATE items
      SET price = 0
      WHERE price IS NULL;
    `);

    await client.query(`
      UPDATE items
      SET quantity = 0
      WHERE quantity IS NULL;
    `);

    await client.query(`
      ALTER TABLE items
      ALTER COLUMN itemname SET NOT NULL,
      ALTER COLUMN description SET NOT NULL,
      ALTER COLUMN sku SET NOT NULL,
      ALTER COLUMN price SET NOT NULL,
      ALTER COLUMN create_at SET NOT NULL,
      ALTER COLUMN quantity SET NOT NULL;
    `);

    await client.query(`
      ALTER TABLE items
      DROP CONSTRAINT IF EXISTS items_category_id_fkey,
      DROP CONSTRAINT IF EXISTS items_user_id_fkey,
      DROP CONSTRAINT IF EXISTS items_price_nonnegative,
      DROP CONSTRAINT IF EXISTS items_quantity_nonnegative;
    `);

    await client.query(`
      ALTER TABLE items
      ADD CONSTRAINT items_price_nonnegative CHECK (price >= 0),
      ADD CONSTRAINT items_quantity_nonnegative CHECK (quantity >= 0);
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE schemaname = 'public' AND indexname = 'items_sku_key'
        ) THEN
          CREATE UNIQUE INDEX items_sku_key ON items (sku);
        END IF;
      END $$;
    `);

    await client.query(`
      ALTER TABLE items
      ALTER COLUMN category_id SET NOT NULL,
      ALTER COLUMN user_id SET NOT NULL;
    `);

    await client.query(`
      ALTER TABLE items
      ADD CONSTRAINT items_category_id_fkey
        FOREIGN KEY (category_id)
        REFERENCES category(id)
        ON DELETE RESTRICT,
      ADD CONSTRAINT items_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES usernames(id)
        ON DELETE RESTRICT;
    `);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runSetup()
    .then(async () => {
      console.log("Database schema is ready.");
      await pool.end();
    })
    .catch(async (error) => {
      console.error("Failed to set up the database schema.", error);
      await pool.end();
      process.exitCode = 1;
    });
}

module.exports = { runSetup };
