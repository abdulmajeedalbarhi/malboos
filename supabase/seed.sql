-- ============================================================
-- Malboos — Seed Data: Admin User, Shop, Branch
-- Run this in the Supabase SQL Editor AFTER the migration
-- ============================================================

-- 1. Confirm the admin user's email (so they can log in without email verification)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'abdulmajeedalbarhi@gmail.com';

-- 2. Create the main shop
INSERT INTO shops (id, name, name_ar, owner_user_id)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Malboos Main',
  'ملبوس الرئيسي',
  (SELECT id FROM auth.users WHERE email = 'abdulmajeedalbarhi@gmail.com')
);

-- 3. Create the main branch
INSERT INTO branches (id, shop_id, name, name_ar, address, phone)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Main Branch',
  'الفرع الرئيسي',
  'Muscat, Oman',
  '+968 2400 0000'
);

-- 4. Create the admin user profile
INSERT INTO user_profiles (auth_user_id, full_name, email, phone, role, shop_id, branch_id)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'abdulmajeedalbarhi@gmail.com'),
  'Abdulmajeed',
  'Abdulmajeedalbarhi@gmail.com',
  '+968 0000 0000',
  'admin',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001'
);

-- Verify
SELECT full_name, email, role FROM user_profiles;
