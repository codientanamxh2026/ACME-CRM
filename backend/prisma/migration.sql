CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'staff',
  department    TEXT,
  phone         TEXT,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id                TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  code              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  contact_person    TEXT,
  phone             TEXT NOT NULL,
  email             TEXT,
  address           TEXT,
  status            TEXT NOT NULL DEFAULT 'lead',
  grp               TEXT DEFAULT 'Doanh nghiep',
  revenue           NUMERIC DEFAULT 0,
  notes             TEXT,
  assigned_staff_id TEXT REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  sku         TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  category    TEXT DEFAULT 'Hang hoa thong dung',
  unit        TEXT DEFAULT 'Cai',
  cost_price  NUMERIC DEFAULT 0,
  sale_price  NUMERIC DEFAULT 0,
  stock       INTEGER DEFAULT 0,
  min_stock   INTEGER DEFAULT 5,
  status      TEXT DEFAULT 'in_stock',
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  order_number    TEXT UNIQUE NOT NULL,
  customer_id     TEXT NOT NULL REFERENCES customers(id),
  customer_name   TEXT NOT NULL,
  subtotal        NUMERIC DEFAULT 0,
  discount        NUMERIC DEFAULT 0,
  total_amount    NUMERIC DEFAULT 0,
  status          TEXT DEFAULT 'pending',
  payment_status  TEXT DEFAULT 'unpaid',
  payment_method  TEXT DEFAULT 'bank_transfer',
  created_by      TEXT REFERENCES users(id),
  created_by_name TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id         TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  name       TEXT NOT NULL,
  sku        TEXT NOT NULL,
  price      NUMERIC NOT NULL,
  quantity   INTEGER DEFAULT 1,
  total      NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dynamic_tables (
  id               TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  title            TEXT NOT NULL,
  source_file_name TEXT NOT NULL,
  stored_file_path TEXT,
  row_count        INTEGER DEFAULT 0,
  columns          JSONB DEFAULT '[]',
  rows             JSONB DEFAULT '[]',
  imported_by      TEXT,
  imported_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  action      TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id     TEXT,
  user_name   TEXT,
  ts          TIMESTAMPTZ DEFAULT NOW()
);