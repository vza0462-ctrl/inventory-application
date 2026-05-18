const pool = require("./pool");
const { runSetup } = require("./setup");

const categories = [
  {
    name: "Camping Gear",
    description: "Shelter, sleeping, and camp kitchen essentials.",
  },
  {
    name: "Trail Footwear",
    description: "Hiking shoes and boots for day trips and long treks.",
  },
  {
    name: "Backpacks",
    description: "Packs sized for commuting, day hikes, and expeditions.",
  },
  {
    name: "Hydration",
    description: "Bottles, reservoirs, and filters for clean water.",
  },
];

const staffMembers = [
  "ava.m",
  "liam.stock",
  "noah.floor",
];

const items = [
  {
    itemname: "Summit Dome Tent",
    description: "A lightweight two-person tent with aluminum poles.",
    sku: "CAMP-001",
    price: 189.99,
    quantity: 8,
    category: "Camping Gear",
    username: "ava.m",
  },
  {
    itemname: "Ridge Lantern",
    description: "Rechargeable lantern with three brightness levels.",
    sku: "CAMP-002",
    price: 34.5,
    quantity: 21,
    category: "Camping Gear",
    username: "noah.floor",
  },
  {
    itemname: "Alpine Hiker Boot",
    description: "Water-resistant hiking boot with reinforced toe cap.",
    sku: "FOOT-101",
    price: 124.0,
    quantity: 14,
    category: "Trail Footwear",
    username: "liam.stock",
  },
  {
    itemname: "Switchback Daypack",
    description: "A 24-liter daypack with laptop sleeve and rain cover.",
    sku: "PACK-301",
    price: 79.95,
    quantity: 17,
    category: "Backpacks",
    username: "ava.m",
  },
  {
    itemname: "River Filter Bottle",
    description: "Filtered water bottle for travel and trail refill stops.",
    sku: "HYDR-210",
    price: 42.75,
    quantity: 25,
    category: "Hydration",
    username: "liam.stock",
  },
];

async function seedDatabase() {
  await runSetup();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("TRUNCATE items, category, usernames RESTART IDENTITY CASCADE;");

    const categoryIds = new Map();
    for (const category of categories) {
      const result = await client.query(
        `
          INSERT INTO category (name, description)
          VALUES ($1, $2)
          RETURNING id;
        `,
        [category.name, category.description],
      );

      categoryIds.set(category.name, result.rows[0].id);
    }

    const staffIds = new Map();
    for (const username of staffMembers) {
      const result = await client.query(
        `
          INSERT INTO usernames (username)
          VALUES ($1)
          RETURNING id;
        `,
        [username],
      );

      staffIds.set(username, result.rows[0].id);
    }

    for (const item of items) {
      await client.query(
        `
          INSERT INTO items
            (itemname, description, sku, price, quantity, category_id, user_id)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7);
        `,
        [
          item.itemname,
          item.description,
          item.sku,
          item.price,
          item.quantity,
          categoryIds.get(item.category),
          staffIds.get(item.username),
        ],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      console.log("Dummy inventory data loaded.");
      await pool.end();
    })
    .catch(async (error) => {
      console.error("Failed to seed the database.", error);
      await pool.end();
      process.exitCode = 1;
    });
}

module.exports = { seedDatabase };
