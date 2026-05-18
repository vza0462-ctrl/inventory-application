const pool = require("../db/pool");

async function getDashboardSummary() {
  const [summaryResult, recentItemsResult] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM category)::INT AS category_count,
        (SELECT COUNT(*) FROM items)::INT AS item_count,
        (SELECT COUNT(*) FROM usernames)::INT AS staff_count,
        (SELECT COALESCE(SUM(quantity), 0) FROM items)::INT AS stock_units,
        (
          SELECT COALESCE(SUM(price * quantity), 0)
          FROM items
        )::NUMERIC(12, 2) AS inventory_value;
    `),
    pool.query(`
      SELECT
        items.id,
        items.itemname,
        items.sku,
        items.quantity,
        items.price,
        category.name AS category_name,
        usernames.username
      FROM items
      INNER JOIN category ON category.id = items.category_id
      INNER JOIN usernames ON usernames.id = items.user_id
      ORDER BY items.create_at DESC, items.id DESC
      LIMIT 5;
    `),
  ]);

  return {
    summary: summaryResult.rows[0],
    recentItems: recentItemsResult.rows,
  };
}

async function getCategoryList() {
  const result = await pool.query(`
    SELECT
      category.id,
      category.name,
      category.description,
      COUNT(items.id)::INT AS item_count,
      COALESCE(SUM(items.quantity), 0)::INT AS stock_units
    FROM category
    LEFT JOIN items ON items.category_id = category.id
    GROUP BY category.id
    ORDER BY category.name ASC;
  `);

  return result.rows;
}

async function getCategoryById(id) {
  const result = await pool.query(
    `
      SELECT id, name, description
      FROM category
      WHERE id = $1;
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

async function getCategoryDetail(id) {
  const [categoryResult, itemsResult] = await Promise.all([
    getCategoryById(id),
    pool.query(
      `
        SELECT
          items.id,
          items.itemname,
          items.sku,
          items.price,
          items.quantity,
          usernames.username
        FROM items
        INNER JOIN usernames ON usernames.id = items.user_id
        WHERE items.category_id = $1
        ORDER BY items.itemname ASC;
      `,
      [id],
    ),
  ]);

  if (!categoryResult) {
    return null;
  }

  return {
    category: categoryResult,
    items: itemsResult.rows,
  };
}

async function createCategory({ name, description }) {
  const result = await pool.query(
    `
      INSERT INTO category (name, description)
      VALUES ($1, $2)
      RETURNING id;
    `,
    [name, description],
  );

  return result.rows[0];
}

async function updateCategory(id, { name, description }) {
  const result = await pool.query(
    `
      UPDATE category
      SET name = $1, description = $2
      WHERE id = $3
      RETURNING id;
    `,
    [name, description, id],
  );

  return result.rows[0] ?? null;
}

async function getCategoryDeleteData(id) {
  const detail = await getCategoryDetail(id);

  if (!detail) {
    return null;
  }

  return {
    category: detail.category,
    items: detail.items,
    canDelete: detail.items.length === 0,
  };
}

async function deleteCategory(id) {
  await pool.query("DELETE FROM category WHERE id = $1;", [id]);
}

async function getUserList() {
  const result = await pool.query(`
    SELECT
      usernames.id,
      usernames.username,
      COUNT(items.id)::INT AS item_count,
      COALESCE(SUM(items.quantity), 0)::INT AS stock_units
    FROM usernames
    LEFT JOIN items ON items.user_id = usernames.id
    GROUP BY usernames.id
    ORDER BY usernames.username ASC;
  `);

  return result.rows;
}

async function getUserById(id) {
  const result = await pool.query(
    `
      SELECT id, username
      FROM usernames
      WHERE id = $1;
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

async function getUserDetail(id) {
  const [user, itemsResult] = await Promise.all([
    getUserById(id),
    pool.query(
      `
        SELECT
          items.id,
          items.itemname,
          items.sku,
          items.quantity,
          items.price,
          category.id AS category_id,
          category.name AS category_name
        FROM items
        INNER JOIN category ON category.id = items.category_id
        WHERE items.user_id = $1
        ORDER BY items.itemname ASC;
      `,
      [id],
    ),
  ]);

  if (!user) {
    return null;
  }

  return {
    user,
    items: itemsResult.rows,
  };
}

async function createUser({ username }) {
  const result = await pool.query(
    `
      INSERT INTO usernames (username)
      VALUES ($1)
      RETURNING id;
    `,
    [username],
  );

  return result.rows[0];
}

async function updateUser(id, { username }) {
  const result = await pool.query(
    `
      UPDATE usernames
      SET username = $1
      WHERE id = $2
      RETURNING id;
    `,
    [username, id],
  );

  return result.rows[0] ?? null;
}

async function getUserDeleteData(id) {
  const detail = await getUserDetail(id);

  if (!detail) {
    return null;
  }

  return {
    user: detail.user,
    items: detail.items,
    canDelete: detail.items.length === 0,
  };
}

async function deleteUser(id) {
  await pool.query("DELETE FROM usernames WHERE id = $1;", [id]);
}

async function getItemList(search = "") {
  const query = search.trim();
  const result = await pool.query(
    `
      SELECT
        items.id,
        items.itemname,
        items.description,
        items.sku,
        items.quantity,
        items.price,
        items.create_at,
        category.id AS category_id,
        category.name AS category_name,
        usernames.id AS user_id,
        usernames.username
      FROM items
      INNER JOIN category ON category.id = items.category_id
      INNER JOIN usernames ON usernames.id = items.user_id
      WHERE
        $1 = ''
        OR items.itemname ILIKE '%' || $1 || '%'
        OR items.sku ILIKE '%' || $1 || '%'
        OR category.name ILIKE '%' || $1 || '%'
        OR usernames.username ILIKE '%' || $1 || '%'
      ORDER BY items.itemname ASC;
    `,
    [query],
  );

  return result.rows;
}

async function getItemById(id) {
  const result = await pool.query(
    `
      SELECT
        items.id,
        items.itemname,
        items.description,
        items.sku,
        items.price,
        items.quantity,
        items.create_at,
        category.id AS category_id,
        category.name AS category_name,
        usernames.id AS user_id,
        usernames.username
      FROM items
      INNER JOIN category ON category.id = items.category_id
      INNER JOIN usernames ON usernames.id = items.user_id
      WHERE items.id = $1;
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

async function createItem(item) {
  const result = await pool.query(
    `
      INSERT INTO items
        (itemname, description, sku, price, quantity, category_id, user_id)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `,
    [
      item.itemname,
      item.description,
      item.sku,
      item.price,
      item.quantity,
      item.categoryId,
      item.userId,
    ],
  );

  return result.rows[0];
}

async function updateItem(id, item) {
  const result = await pool.query(
    `
      UPDATE items
      SET
        itemname = $1,
        description = $2,
        sku = $3,
        price = $4,
        quantity = $5,
        category_id = $6,
        user_id = $7
      WHERE id = $8
      RETURNING id;
    `,
    [
      item.itemname,
      item.description,
      item.sku,
      item.price,
      item.quantity,
      item.categoryId,
      item.userId,
      id,
    ],
  );

  return result.rows[0] ?? null;
}

async function deleteItem(id) {
  await pool.query("DELETE FROM items WHERE id = $1;", [id]);
}

async function getItemDeleteData(id) {
  return getItemById(id);
}

async function getFormOptions() {
  const [categoriesResult, usersResult] = await Promise.all([
    pool.query(`
      SELECT id, name
      FROM category
      ORDER BY name ASC;
    `),
    pool.query(`
      SELECT id, username
      FROM usernames
      ORDER BY username ASC;
    `),
  ]);

  return {
    categories: categoriesResult.rows,
    users: usersResult.rows,
  };
}

module.exports = {
  createCategory,
  createItem,
  createUser,
  deleteCategory,
  deleteItem,
  deleteUser,
  getCategoryById,
  getCategoryDeleteData,
  getCategoryDetail,
  getCategoryList,
  getDashboardSummary,
  getFormOptions,
  getItemById,
  getItemDeleteData,
  getItemList,
  getUserById,
  getUserDeleteData,
  getUserDetail,
  getUserList,
  updateCategory,
  updateItem,
  updateUser,
};
