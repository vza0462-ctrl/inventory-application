# Summit Supply Inventory

An Express and PostgreSQL inventory management app for an imaginary outdoor store.

## Database design

The app uses three related tables:

1. `category`
   - `id`
   - `name`
   - `description`
2. `usernames`
   - `id`
   - `username`
3. `items`
   - `id`
   - `itemname`
   - `description`
   - `sku`
   - `price`
   - `quantity`
   - `create_at`
   - `category_id`
   - `user_id`

## Relationships

1. One category can contain many items.
2. One staff owner in `usernames` can manage many items.
3. Every item must belong to exactly one category and one staff owner.

## Delete behavior

1. Categories cannot be deleted while items still belong to them.
2. Staff owners cannot be deleted while items are still assigned to them.
3. Items can be deleted directly.

This keeps the app from silently deleting inventory records when a parent record is removed.

## Scripts

1. `npm start` runs the Express server on `http://localhost:3000`.
2. `npm run dev` runs the server in watch mode.
3. `npm run lint` checks the code with ESLint.
4. `npm run db:setup` creates or aligns the database schema.
5. `npm run db:seed` recreates dummy data for local development.

## Database connection defaults

The app connects to PostgreSQL with these default values:

- `PGHOST=127.0.0.1`
- `PGPORT=5432`
- `PGDATABASE=inventory`
- `PGUSER=thata`
- `PGPASSWORD=mypassword@`

Override them with environment variables if your local setup is different.

## Getting started

1. Start PostgreSQL with Docker Compose.
2. Run `npm install`.
3. Run `npm run db:setup`.
4. Run `npm run db:seed`.
5. Run `npm start`.
