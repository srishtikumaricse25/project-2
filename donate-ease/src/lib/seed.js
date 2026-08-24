const { getDb } = require('./db');
const { hashPassword } = require('./auth');

function seed() {
  const db = getDb();

  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  console.log('Seeding database...');

  // ---- Pickup Slots ----
  const insertSlot = db.prepare('INSERT INTO pickup_slots (slot_label, start_time, end_time) VALUES (?, ?, ?)');
  const slots = [
    ['Morning (9:00 - 11:00)', '09:00', '11:00'],
    ['Late Morning (11:00 - 13:00)', '11:00', '13:00'],
    ['Afternoon (14:00 - 16:00)', '14:00', '16:00'],
    ['Evening (16:00 - 18:00)', '16:00', '18:00'],
  ];
  for (const s of slots) insertSlot.run(...s);

  // ---- Categories ----
  const insertCategory = db.prepare(
    'INSERT INTO categories (name, slug, description, icon, accepted_conditions, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const categories = [
    ['Clothing', 'clothing', 'Shirts, pants, dresses, jackets, and more', '👕', '["new","like_new","good","fair"]', 1],
    ['Winter Wear', 'winter-wear', 'Jackets, sweaters, shawls, and blankets', '🧥', '["new","like_new","good","fair"]', 2],
    ['Children\'s Clothing', 'childrens-clothing', 'Kids clothes, school uniforms, and baby wear', '👶', '["new","like_new","good"]', 3],
    ['Footwear', 'footwear', 'Shoes, sandals, boots, and slippers', '👟', '["new","like_new","good"]', 4],
    ['Bedding & Linens', 'bedding-linens', 'Blankets, bedsheets, pillows, and towels', '🛏️', '["new","like_new","good"]', 5],
    ['Kitchen & Utensils', 'kitchen-utensils', 'Cookware, dishes, utensils, and small appliances', '🍳', '["new","like_new","good"]', 6],
    ['Books & Stationery', 'books-stationery', 'Textbooks, notebooks, novels, and school supplies', '📚', '["new","like_new","good","fair"]', 7],
    ['Toys & Games', 'toys-games', 'Stuffed animals, board games, puzzles, and outdoor toys', '🧸', '["new","like_new","good"]', 8],
    ['Bags & Accessories', 'bags-accessories', 'School bags, purses, backpacks, and accessories', '🎒', '["new","like_new","good"]', 9],
    ['Furniture', 'furniture', 'Tables, chairs, shelves, and small furniture', '🪑', '["new","like_new","good","fair"]', 10],
    ['Electronics', 'electronics', 'Working phones, laptops, chargers, and small devices', '📱', '["new","like_new","good"]', 11],
  ];
  for (const c of categories) insertCategory.run(...c);

  // ---- Item Types ----
  const insertItemType = db.prepare('INSERT INTO item_types (category_id, name, slug) VALUES (?, ?, ?)');
  const itemTypes = [
    [1, 'Shirts', 'shirts'], [1, 'T-Shirts', 't-shirts'], [1, 'Pants', 'pants'],
    [1, 'Dresses', 'dresses'], [1, 'Sarees', 'sarees'], [1, 'Kurtas', 'kurtas'],
    [2, 'Jackets', 'jackets'], [2, 'Sweaters', 'sweaters'], [2, 'Shawls', 'shawls'],
    [3, 'Kids Tops', 'kids-tops'], [3, 'Kids Pants', 'kids-pants'], [3, 'School Uniforms', 'school-uniforms'],
    [4, 'Shoes', 'shoes'], [4, 'Sandals', 'sandals'], [4, 'Boots', 'boots'],
    [5, 'Blankets', 'blankets'], [5, 'Bedsheets', 'bedsheets'], [5, 'Pillows', 'pillows'],
    [6, 'Utensils', 'utensils'], [6, 'Cookware', 'cookware'], [6, 'Small Appliances', 'small-appliances'],
    [7, 'Textbooks', 'textbooks'], [7, 'Notebooks', 'notebooks'], [7, 'Novels', 'novels'],
    [8, 'Stuffed Animals', 'stuffed-animals'], [8, 'Board Games', 'board-games'], [8, 'Puzzles', 'puzzles'],
    [9, 'School Bags', 'school-bags'], [9, 'Backpacks', 'backpacks'],
    [10, 'Tables', 'tables'], [10, 'Chairs', 'chairs'], [10, 'Shelves', 'shelves'],
    [11, 'Mobile Phones', 'mobile-phones'], [11, 'Laptops', 'laptops'], [11, 'Chargers', 'chargers'],
  ];
  for (const it of itemTypes) insertItemType.run(...it);

  // ---- Prohibited Items ----
  const insertProhibited = db.prepare('INSERT INTO prohibited_items (name, description) VALUES (?, ?)');
  const prohibited = [
    ['Weapons & Ammunition', 'Any type of weapons, knives, or ammunition'],
    ['Hazardous Chemicals', 'Paints, solvents, pesticides, or any toxic chemicals'],
    ['Explosives & Flammables', 'Firecrackers, fuel, or highly flammable materials'],
    ['Unsafe Medical Equipment', 'Used syringes, expired medicines, or contaminated medical supplies'],
    ['Illegal Substances', 'Controlled drugs or any illegal materials'],
    ['Severely Damaged Items', 'Items that are completely non-functional, torn beyond repair, or unusable'],
    ['Expired Food Products', 'Any food items past their expiration date'],
    ['Recalled Products', 'Products officially recalled by manufacturers'],
  ];
  for (const p of prohibited) insertProhibited.run(...p);

  // ---- Users ----
  const insertUser = db.prepare(
    `INSERT INTO users (name, email, phone, password_hash, role, city, pin_code, is_verified, donation_count, completed_donations, impact_score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const adminPass = hashPassword('admin123');
  const userPass = hashPassword('password123');

  // Admin
  insertUser.run('Admin User', 'admin@donateease.org', '9000000001', adminPass, 'admin', 'Mumbai', '400001', 1, 0, 0, 0);

  // Donors
  insertUser.run('Priya Sharma', 'priya@example.com', '9100000001', userPass, 'donor', 'Mumbai', '400002', 1, 8, 6, 85);
  insertUser.run('Rahul Verma', 'rahul@example.com', '9100000002', userPass, 'donor', 'Delhi', '110001', 1, 5, 3, 52);
  insertUser.run('Anita Desai', 'anita@example.com', '9100000003', userPass, 'donor', 'Bangalore', '560001', 1, 3, 2, 30);

  // NGO users
  insertUser.run('Hope Foundation', 'hope@example.com', '9200000001', userPass, 'ngo', 'Mumbai', '400003', 1, 0, 0, 0);
  insertUser.run('Care For All', 'care@example.com', '9200000002', userPass, 'ngo', 'Delhi', '110002', 1, 0, 0, 0);
  insertUser.run('Helping Hands Trust', 'helping@example.com', '9200000003', userPass, 'ngo', 'Patna', '800001', 0, 0, 0, 0);

  // ---- Organizations ----
  const insertOrg = db.prepare(
    `INSERT INTO organizations (user_id, org_name, registration_number, contact_person, phone, email, address, city, service_area, org_type, website, verification_status, accepted_categories)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  insertOrg.run(5, 'Hope Foundation', 'NGO-MH-2020-1234', 'Meera Joshi', '9200000001', 'hope@example.com',
    '45 Relief Road, Andheri West', 'Mumbai', '["400001","400002","400003","400004","400005"]',
    'ngo', 'https://hopefoundation.org', 'verified', '[1,2,3,4,5,6,7,8]');

  insertOrg.run(6, 'Care For All', 'NGO-DL-2019-5678', 'Arjun Kapoor', '9200000002', 'care@example.com',
    '12 Charity Lane, Connaught Place', 'Delhi', '["110001","110002","110003","110004"]',
    'orphanage', 'https://careforall.org', 'verified', '[1,2,3,5,7,8]');

  insertOrg.run(7, 'Helping Hands Trust', 'NGO-BR-2021-9012', 'Sunil Kumar', '9200000003', 'helping@example.com',
    '78 Gandhi Maidan', 'Patna', '["800001","800002","800003"]',
    'community_org', null, 'pending', '[1,2,5]');

  // ---- Sample Donations ----
  const insertDonation = db.prepare(
    `INSERT INTO donations (donation_id, donor_id, organization_id, category_id, item_type, quantity, condition, description, status, pickup_address, pickup_city, pickup_pin_code, pickup_date, pickup_time_slot, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertHistory = db.prepare(
    `INSERT INTO donation_status_history (donation_id, from_status, to_status, changed_by, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  );

  // Completed donation
  insertDonation.run('DON-2026-000001', 2, 1, 2, 'Jackets', 5, 'good',
    'Clean and lightly used winter jackets, suitable for adults.',
    'completed', '12 Marine Drive, Apartment 5A', 'Mumbai', '400002',
    '2026-07-15', 'Morning (9:00 - 11:00)', '2026-07-10T08:00:00', '2026-07-20T14:00:00');
  insertHistory.run(1, null, 'submitted', 2, 'Donation created', '2026-07-10T08:00:00');
  insertHistory.run(1, 'submitted', 'accepted', 5, 'Accepted by Hope Foundation', '2026-07-11T10:00:00');
  insertHistory.run(1, 'accepted', 'pickup_scheduled', 5, 'Pickup scheduled', '2026-07-12T09:00:00');
  insertHistory.run(1, 'pickup_scheduled', 'picked_up', 5, 'Items collected', '2026-07-15T10:30:00');
  insertHistory.run(1, 'picked_up', 'received', 5, 'Items received at center', '2026-07-16T11:00:00');
  insertHistory.run(1, 'received', 'distributed', 5, 'Distributed to families', '2026-07-18T15:00:00');
  insertHistory.run(1, 'distributed', 'completed', 5, 'Donation completed', '2026-07-20T14:00:00');

  // Accepted donation pending pickup
  insertDonation.run('DON-2026-000002', 2, 1, 1, 'T-Shirts', 10, 'like_new',
    'Brand new t-shirts, assorted sizes and colors.',
    'pickup_scheduled', '12 Marine Drive, Apartment 5A', 'Mumbai', '400002',
    '2026-08-12', 'Afternoon (14:00 - 16:00)', '2026-08-05T10:00:00', '2026-08-07T09:00:00');
  insertHistory.run(2, null, 'submitted', 2, 'Donation created', '2026-08-05T10:00:00');
  insertHistory.run(2, 'submitted', 'accepted', 5, 'Accepted', '2026-08-06T11:00:00');
  insertHistory.run(2, 'accepted', 'pickup_scheduled', 5, 'Pickup scheduled for Aug 12', '2026-08-07T09:00:00');

  // Newly submitted
  insertDonation.run('DON-2026-000003', 3, 2, 7, 'Textbooks', 15, 'good',
    'School textbooks for classes 5-10, CBSE curriculum.',
    'submitted', '45 Rajpath, Sector 7', 'Delhi', '110001',
    '2026-08-14', 'Morning (9:00 - 11:00)', '2026-08-08T14:00:00', '2026-08-08T14:00:00');
  insertHistory.run(3, null, 'submitted', 3, 'Donation created', '2026-08-08T14:00:00');

  // In-progress donation
  insertDonation.run('DON-2026-000004', 4, 1, 5, 'Blankets', 8, 'new',
    'New fleece blankets, bought in bulk but unused.',
    'received', '22 MG Road, 3rd Floor', 'Bangalore', '560001',
    '2026-08-01', 'Evening (16:00 - 18:00)', '2026-07-28T16:00:00', '2026-08-05T10:00:00');
  insertHistory.run(4, null, 'submitted', 4, 'Donation created', '2026-07-28T16:00:00');
  insertHistory.run(4, 'submitted', 'accepted', 5, 'Accepted', '2026-07-29T09:00:00');
  insertHistory.run(4, 'accepted', 'pickup_scheduled', 5, 'Pickup scheduled', '2026-07-30T10:00:00');
  insertHistory.run(4, 'pickup_scheduled', 'picked_up', 5, 'Collected', '2026-08-01T17:00:00');
  insertHistory.run(4, 'picked_up', 'received', 5, 'Received at warehouse', '2026-08-05T10:00:00');

  // Another submitted donation
  insertDonation.run('DON-2026-000005', 2, 2, 8, 'Board Games', 4, 'good',
    'Ludo, Chess, Carrom, and Scrabble sets.',
    'submitted', '12 Marine Drive, Apartment 5A', 'Mumbai', '400002',
    '2026-08-16', 'Late Morning (11:00 - 13:00)', '2026-08-09T12:00:00', '2026-08-09T12:00:00');
  insertHistory.run(5, null, 'submitted', 2, 'Donation created', '2026-08-09T12:00:00');

  // ---- Donation Requests (NGO demand) ----
  const insertRequest = db.prepare(
    `INSERT INTO donation_requests (organization_id, category_id, item_type, quantity_needed, quantity_fulfilled, priority, required_before, description, beneficiary_category, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  insertRequest.run(1, 2, 'Blankets', 100, 25, 'high', '2026-10-15',
    'Winter is approaching. We need blankets for families in informal settlements.', 'families', 'active');
  insertRequest.run(2, 3, 'School Uniforms', 50, 10, 'urgent', '2026-08-20',
    'New academic session starting. Children need uniforms urgently.', 'children', 'active');
  insertRequest.run(1, 7, 'Textbooks', 200, 80, 'medium', '2026-09-01',
    'Textbooks for classes 1-10, any board curriculum.', 'children', 'partially_fulfilled');

  // ---- Notifications ----
  const insertNotification = db.prepare(
    `INSERT INTO notifications (user_id, type, title, message, donation_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  insertNotification.run(2, 'donation_accepted', 'Donation Accepted! 🎉',
    'Your donation of 10 T-Shirts has been accepted by Hope Foundation.', 2, 0, '2026-08-06T11:00:00');
  insertNotification.run(2, 'pickup_scheduled', 'Pickup Scheduled 📦',
    'Your pickup is scheduled for Aug 12, 2:00 PM - 4:00 PM.', 2, 0, '2026-08-07T09:00:00');
  insertNotification.run(2, 'donation_completed', 'Donation Completed ✅',
    'Your donation of 5 Jackets has been distributed to families in need.', 1, 1, '2026-07-20T14:00:00');
  insertNotification.run(5, 'new_donation', 'New Donation Request 📩',
    'Priya Sharma wants to donate 10 T-Shirts. Review and accept?', 2, 0, '2026-08-05T10:00:00');
  insertNotification.run(5, 'new_donation', 'New Donation Request 📩',
    'Anita Desai wants to donate 8 Blankets.', 4, 1, '2026-07-28T16:00:00');

  // ---- Sample Complaint ----
  const insertComplaint = db.prepare(
    `INSERT INTO complaints (reporter_id, donation_id, type, description, status) VALUES (?, ?, ?, ?, ?)`
  );
  insertComplaint.run(3, null, 'other', 'I scheduled a pickup but nobody arrived at the given time. This is very inconvenient.', 'open');

  // Update user donation counts
  db.prepare('UPDATE users SET donation_count = 3, completed_donations = 1 WHERE id = 2').run();
  db.prepare('UPDATE users SET donation_count = 1, completed_donations = 0 WHERE id = 3').run();
  db.prepare('UPDATE users SET donation_count = 1, completed_donations = 0 WHERE id = 4').run();

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Test accounts:');
  console.log('  Admin:  admin@donateease.org / admin123');
  console.log('  Donor:  priya@example.com / password123');
  console.log('  NGO:    hope@example.com / password123');
}

module.exports = { seed };

// Run directly if called from CLI
if (require.main === module) {
  seed();
}
