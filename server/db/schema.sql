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
CREATE TABLE IF NOT EXISTS categories (
 id SERIAL PRIMARY KEY,
 name VARCHAR(150) NOT NULL UNIQUE
);
INSERT INTO categories (name)
 SELECT DISTINCT category_name FROM products
 ON CONFLICT (name) DO NOTHING;
UPDATE products p SET category_id=c.id FROM categories c WHERE c.name=p.category_name AND p.category_id<>c.id;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='products_category_fk') THEN
  ALTER TABLE products ADD CONSTRAINT products_category_fk FOREIGN KEY (category_id) REFERENCES categories(id);
 END IF;
END $$;
ALTER TABLE products ADD COLUMN IF NOT EXISTS demo_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS products_demo_key ON products (demo_key);
CREATE TABLE IF NOT EXISTS app_migrations (version TEXT PRIMARY KEY);

