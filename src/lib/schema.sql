-- ============================================
-- DonateEase — Database Schema
-- ============================================

-- Users table (all roles)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('donor', 'ngo', 'admin', 'collection_partner')),
  city TEXT,
  pin_code TEXT,
  photo TEXT,
  preferred_categories TEXT, -- JSON array of category IDs
  is_active INTEGER DEFAULT 1,
  is_verified INTEGER DEFAULT 0,
  donation_count INTEGER DEFAULT 0,
  completed_donations INTEGER DEFAULT 0,
  impact_score INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Organizations table (NGOs linked to user accounts)
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  org_name TEXT NOT NULL,
  registration_number TEXT,
  contact_person TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  service_area TEXT, -- JSON array of pin codes or city names
  org_type TEXT CHECK(org_type IN ('ngo', 'orphanage', 'old_age_home', 'shelter', 'community_org', 'other')),
  website TEXT,
  social_links TEXT, -- JSON
  documents TEXT, -- JSON array of uploaded doc paths
  verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending', 'under_review', 'verified', 'rejected', 'suspended')),
  verification_notes TEXT,
  verified_by INTEGER,
  verified_at TEXT,
  accepted_categories TEXT, -- JSON array of category IDs
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- Categories (admin-managed)
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- emoji or icon name
  accepted_conditions TEXT DEFAULT '["new","like_new","good","fair"]', -- JSON array
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Item types within categories
CREATE TABLE IF NOT EXISTS item_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Donations (core record)
CREATE TABLE IF NOT EXISTS donations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  donation_id TEXT UNIQUE NOT NULL, -- DON-YYYY-XXXXXX
  donor_id INTEGER NOT NULL,
  organization_id INTEGER,
  category_id INTEGER NOT NULL,
  item_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  condition TEXT NOT NULL CHECK(condition IN ('new', 'like_new', 'good', 'fair', 'repair_required')),
  description TEXT,
  photos TEXT, -- JSON array of photo paths
  size_weight TEXT,
  status TEXT DEFAULT 'submitted' CHECK(status IN (
    'draft', 'submitted', 'pending_acceptance', 'accepted', 'rejected',
    'pickup_scheduled', 'pickup_assigned', 'picked_up', 'received',
    'sorted', 'distributed', 'completed', 'cancelled', 'expired',
    'failed_pickup', 'disputed'
  )),
  pickup_address TEXT,
  pickup_city TEXT,
  pickup_pin_code TEXT,
  pickup_date TEXT,
  pickup_time_slot TEXT,
  pickup_instructions TEXT,
  pickup_contact_phone TEXT,
  rejection_reason TEXT,
  cancellation_reason TEXT,
  received_qty INTEGER,
  accepted_qty INTEGER,
  rejected_qty INTEGER,
  distributed_qty INTEGER,
  distribution_date TEXT,
  distribution_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (donor_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Donation status history (audit log)
CREATE TABLE IF NOT EXISTS donation_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  donation_id INTEGER NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (donation_id) REFERENCES donations(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Donation requests (NGO demand-driven)
CREATE TABLE IF NOT EXISTS donation_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  category_id INTEGER,
  item_type TEXT NOT NULL,
  quantity_needed INTEGER NOT NULL DEFAULT 1,
  quantity_fulfilled INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  required_before TEXT,
  description TEXT,
  beneficiary_category TEXT, -- e.g. 'children', 'families', 'elderly'
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'partially_fulfilled', 'fulfilled', 'expired', 'cancelled')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'donation_submitted', 'donation_accepted', 'pickup_scheduled', etc.
  title TEXT NOT NULL,
  message TEXT,
  donation_id INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (donation_id) REFERENCES donations(id)
);

-- Complaints / Disputes
CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL,
  donation_id INTEGER,
  type TEXT NOT NULL CHECK(type IN (
    'pickup_not_completed', 'wrong_status', 'damaged_items',
    'misrepresentation', 'ngo_misconduct', 'partner_misconduct',
    'harassment', 'fraudulent_account', 'other'
  )),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'under_review', 'resolved', 'rejected')),
  resolution TEXT,
  resolved_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT,
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (donation_id) REFERENCES donations(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Pickup time slots
CREATE TABLE IF NOT EXISTS pickup_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_label TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_active INTEGER DEFAULT 1
);

-- Prohibited items
CREATE TABLE IF NOT EXISTS prohibited_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_org ON donations(organization_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_donation_id ON donations(donation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(verification_status);
CREATE INDEX IF NOT EXISTS idx_status_history_donation ON donation_status_history(donation_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
