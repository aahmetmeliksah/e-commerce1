CREATE TABLE IF NOT EXISTS products (
 id SERIAL PRIMARY KEY,
 product_name VARCHAR(150) NOT NULL,
 product_description TEXT NOT NULL,
 category_name VARCHAR(150) NOT NULL,
 category_id INTEGER NOT NULL CHECK (category_id > 0),
 price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
 quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
 img_url TEXT NOT NULL DEFAULT ''
);
ALTER TABLE products ADD COLUMN IF NOT EXISTS img_url TEXT NOT NULL DEFAULT '';

