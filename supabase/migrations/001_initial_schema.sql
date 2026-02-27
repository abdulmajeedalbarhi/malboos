-- ============================================================
-- Malboos PWA — Initial Database Schema
-- Supabase / PostgreSQL Migration
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'owner', 'branch_manager', 'cashier');
CREATE TYPE item_type AS ENUM ('sale', 'rental', 'both');
CREATE TYPE item_status AS ENUM ('available', 'rented', 'sold', 'reserved', 'damaged');
CREATE TYPE transaction_type AS ENUM ('sale', 'rental_payment', 'rental_deposit', 'refund');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer');
CREATE TYPE rental_status AS ENUM ('booked', 'active', 'overdue', 'returned', 'completed', 'cancelled');
CREATE TYPE period_type AS ENUM ('weekly', 'monthly');
CREATE TYPE period_status AS ENUM ('open', 'pending_approval', 'approved', 'closed', 'reopened');

-- ============================================================
-- TABLES
-- ============================================================

-- Shops (Top-level tenant)
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Branches (belong to a Shop)
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Profiles (linked to Supabase Auth)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'cashier',
  shop_id UUID REFERENCES shops(id),
  branch_id UUID REFERENCES branches(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories (Clothing types)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  description TEXT
);

-- Seed default categories
INSERT INTO categories (name, name_ar) VALUES
  ('Bisht', 'بشت'),
  ('Shaal', 'شال'),
  ('Massar', 'مصر'),
  ('Khanjar', 'خنجر'),
  ('Saif', 'سيف'),
  ('Kummah', 'كمة');

-- Inventory Items
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  item_type item_type NOT NULL DEFAULT 'sale',
  purchase_price DECIMAL(10, 3) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10, 3) NOT NULL DEFAULT 0,
  rental_price_daily DECIMAL(10, 3) NOT NULL DEFAULT 0,
  deposit_amount DECIMAL(10, 3) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  attributes JSONB DEFAULT '{}',
  image_urls TEXT[] DEFAULT '{}',
  status item_status NOT NULL DEFAULT 'available',
  is_high_value BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT,
  id_image_url TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Financial Periods
CREATE TABLE financial_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  period_type period_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status period_status NOT NULL DEFAULT 'open',
  submitted_by UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  total_sales DECIMAL(10, 3) NOT NULL DEFAULT 0,
  total_rentals DECIMAL(10, 3) NOT NULL DEFAULT 0,
  total_refunds DECIMAL(10, 3) NOT NULL DEFAULT 0,
  comments TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  cashier_id UUID NOT NULL REFERENCES user_profiles(id),
  customer_id UUID REFERENCES customers(id),
  financial_period_id UUID REFERENCES financial_periods(id),
  type transaction_type NOT NULL,
  total_amount DECIMAL(10, 3) NOT NULL DEFAULT 0,
  discount DECIMAL(10, 3) NOT NULL DEFAULT 0,
  final_amount DECIMAL(10, 3) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  notes TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transaction Items (line items)
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 3) NOT NULL,
  subtotal DECIMAL(10, 3) NOT NULL
);

-- Rentals
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  cashier_id UUID NOT NULL REFERENCES user_profiles(id),
  start_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  returned_date TIMESTAMPTZ,
  status rental_status NOT NULL DEFAULT 'booked',
  deposit_paid DECIMAL(10, 3) NOT NULL DEFAULT 0,
  rental_fee DECIMAL(10, 3) NOT NULL DEFAULT 0,
  overdue_fee DECIMAL(10, 3) NOT NULL DEFAULT 0,
  notes TEXT,
  reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_branches_shop_id ON branches(shop_id);
CREATE INDEX idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);
CREATE INDEX idx_user_profiles_branch_id ON user_profiles(branch_id);
CREATE INDEX idx_user_profiles_shop_id ON user_profiles(shop_id);
CREATE INDEX idx_inventory_items_branch_id ON inventory_items(branch_id);
CREATE INDEX idx_inventory_items_category_id ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_transactions_branch_id ON transactions(branch_id);
CREATE INDEX idx_transactions_cashier_id ON transactions(cashier_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_rentals_branch_id ON rentals(branch_id);
CREATE INDEX idx_rentals_customer_id ON rentals(customer_id);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_rentals_due_date ON rentals(due_date);
CREATE INDEX idx_financial_periods_branch_id ON financial_periods(branch_id);
CREATE INDEX idx_financial_periods_status ON financial_periods(status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_periods ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: Get user's profile by auth ID
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS user_profiles AS $$
  SELECT * FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_branch_id()
RETURNS UUID AS $$
  SELECT branch_id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_shop_id()
RETURNS UUID AS $$
  SELECT shop_id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Categories: readable by all authenticated users
CREATE POLICY "Categories are viewable by authenticated users"
  ON categories FOR SELECT
  TO authenticated
  USING (TRUE);

-- User Profiles: users can see their own profile, admins see all
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR get_my_role() = 'admin'
    OR (get_my_role() = 'owner' AND shop_id = get_my_shop_id())
    OR (get_my_role() = 'branch_manager' AND branch_id = get_my_branch_id())
  );

-- Shops: admin sees all, owner sees own shop
CREATE POLICY "Shops viewable by role"
  ON shops FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'admin'
    OR id = get_my_shop_id()
  );

-- Branches: admin sees all, owner sees branches in own shop, others see own branch
CREATE POLICY "Branches viewable by role"
  ON branches FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'admin'
    OR shop_id = get_my_shop_id()
  );

-- Inventory Items: branch-scoped access
CREATE POLICY "Inventory viewable by branch"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'admin'
    OR branch_id IN (SELECT id FROM branches WHERE shop_id = get_my_shop_id())
    OR branch_id = get_my_branch_id()
  );

CREATE POLICY "Inventory insertable by branch staff"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_role() = 'admin'
    OR (get_my_role() IN ('owner', 'branch_manager') AND (
      branch_id = get_my_branch_id()
      OR branch_id IN (SELECT id FROM branches WHERE shop_id = get_my_shop_id())
    ))
  );

CREATE POLICY "Inventory updatable by branch staff"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (
    get_my_role() = 'admin'
    OR (get_my_role() IN ('owner', 'branch_manager') AND (
      branch_id = get_my_branch_id()
      OR branch_id IN (SELECT id FROM branches WHERE shop_id = get_my_shop_id())
    ))
  );

-- Customers: viewable by all authenticated users
CREATE POLICY "Customers viewable by authenticated"
  ON customers FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Customers insertable by authenticated"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Transactions: branch-scoped
CREATE POLICY "Transactions viewable by branch"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'admin'
    OR branch_id IN (SELECT id FROM branches WHERE shop_id = get_my_shop_id())
    OR branch_id = get_my_branch_id()
  );

CREATE POLICY "Transactions insertable by cashier"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_role() = 'admin'
    OR branch_id = get_my_branch_id()
  );

CREATE POLICY "Transactions updatable when not locked"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    (get_my_role() = 'admin')
    OR (NOT is_locked AND branch_id = get_my_branch_id())
    OR (get_my_role() IN ('owner', 'branch_manager') AND branch_id IN (SELECT id FROM branches WHERE shop_id = get_my_shop_id()))
  );

-- Transaction Items: follow transaction access
CREATE POLICY "Transaction items viewable"
  ON transaction_items FOR SELECT
  TO authenticated
  USING (
    transaction_id IN (SELECT id FROM transactions)
  );

CREATE POLICY "Transaction items insertable"
  ON transaction_items FOR INSERT
  TO authenticated
  WITH CHECK (
    transaction_id IN (SELECT id FROM transactions WHERE branch_id = get_my_branch_id())
    OR get_my_role() = 'admin'
  );

-- Rentals: branch-scoped
CREATE POLICY "Rentals viewable by branch"
  ON rentals FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'admin'
    OR branch_id IN (SELECT id FROM branches WHERE shop_id = get_my_shop_id())
    OR branch_id = get_my_branch_id()
  );

CREATE POLICY "Rentals insertable by branch"
  ON rentals FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_role() = 'admin'
    OR branch_id = get_my_branch_id()
  );

CREATE POLICY "Rentals updatable when not locked"
  ON rentals FOR UPDATE
  TO authenticated
  USING (
    get_my_role() = 'admin'
    OR (NOT is_locked AND branch_id = get_my_branch_id())
    OR (get_my_role() IN ('owner', 'branch_manager') AND branch_id IN (SELECT id FROM branches WHERE shop_id = get_my_shop_id()))
  );

-- Financial Periods: branch-scoped with role restrictions
CREATE POLICY "Financial periods viewable by branch"
  ON financial_periods FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'admin'
    OR branch_id IN (SELECT id FROM branches WHERE shop_id = get_my_shop_id())
    OR branch_id = get_my_branch_id()
  );

CREATE POLICY "Financial periods insertable by manager+"
  ON financial_periods FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_role() IN ('admin', 'owner', 'branch_manager')
  );

CREATE POLICY "Financial periods updatable by manager+"
  ON financial_periods FOR UPDATE
  TO authenticated
  USING (
    get_my_role() = 'admin'
    OR (get_my_role() = 'owner' AND branch_id IN (SELECT id FROM branches WHERE shop_id = get_my_shop_id()))
    OR (get_my_role() = 'branch_manager' AND branch_id = get_my_branch_id() AND status IN ('open', 'reopened'))
  );
