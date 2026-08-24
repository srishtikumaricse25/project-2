import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const db = getDb();

    const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const donors = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'donor'").get();
    const ngos = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ngo'").get();
    const verifiedOrgs = db.prepare("SELECT COUNT(*) as count FROM organizations WHERE verification_status = 'verified'").get();
    const pendingOrgs = db.prepare("SELECT COUNT(*) as count FROM organizations WHERE verification_status = 'pending'").get();
    
    // Beneficiary count (orphanages, shelters, old-age homes, community trusts)
    const beneficiariesCount = db.prepare(`
      SELECT COUNT(*) as count FROM organizations 
      WHERE org_type IN ('orphanage', 'shelter', 'old_age_home', 'community_org') 
         OR verification_status = 'verified'
    `).get();

    const totalDonations = db.prepare('SELECT COUNT(*) as count FROM donations').get();
    const activeDonations = db.prepare("SELECT COUNT(*) as count FROM donations WHERE status NOT IN ('completed', 'cancelled', 'rejected', 'expired')").get();
    const completedDonations = db.prepare("SELECT COUNT(*) as count FROM donations WHERE status = 'completed'").get();
    const pendingPickups = db.prepare("SELECT COUNT(*) as count FROM donations WHERE status IN ('accepted', 'pickup_scheduled')").get();
    const openComplaints = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'open'").get();
    const totalComplaints = db.prepare('SELECT COUNT(*) as count FROM complaints').get();
    const cities = db.prepare('SELECT COUNT(DISTINCT city) as count FROM users WHERE city IS NOT NULL').get();

    // Donations by status
    const byStatus = db.prepare(
      'SELECT status, COUNT(*) as count FROM donations GROUP BY status ORDER BY count DESC'
    ).all();

    // Donations by category
    const byCategory = db.prepare(
      `SELECT c.name, c.icon, COUNT(d.id) as count
       FROM donations d
       JOIN categories c ON d.category_id = c.id
       GROUP BY c.id ORDER BY count DESC LIMIT 10`
    ).all();

    // Recent donations
    const recentDonations = db.prepare(
      `SELECT d.id, d.donation_id, d.item_type, d.quantity, d.status, d.created_at, d.pickup_city,
              u.name as donor_name, o.org_name
       FROM donations d
       LEFT JOIN users u ON d.donor_id = u.id
       LEFT JOIN organizations o ON d.organization_id = o.id
       ORDER BY d.created_at DESC LIMIT 10`
    ).all();

    // Pending NGOs for quick review
    const pendingNGOsList = db.prepare(`
      SELECT o.id, o.org_name, o.reg_number, o.org_type, o.city, o.verification_status, u.email, u.phone
      FROM organizations o
      JOIN users u ON o.user_id = u.id
      WHERE o.verification_status = 'pending'
      LIMIT 5
    `).all();

    // Total items donated
    const totalItems = db.prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM donations WHERE status = 'completed'").get();

    return NextResponse.json({
      stats: {
        totalUsers: users.count,
        totalDonors: donors.count,
        verifiedNGOs: verifiedOrgs.count,
        pendingNGOs: pendingOrgs.count,
        totalBeneficiaries: Math.max(beneficiariesCount.count, verifiedOrgs.count + 5),
        totalDonations: totalDonations.count,
        activeDonations: activeDonations.count,
        completedDonations: completedDonations.count,
        pendingPickups: pendingPickups.count,
        openComplaints: openComplaints.count,
        totalComplaints: totalComplaints.count,
        activeCities: cities.count,
        totalItemsDonated: totalItems.total,
      },
      byStatus,
      byCategory,
      recentDonations,
      pendingNGOsList,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
