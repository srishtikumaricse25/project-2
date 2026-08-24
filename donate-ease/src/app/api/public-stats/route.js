import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');

export async function GET() {
  try {
    const db = getDb();

    const itemsRes = db.prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM donations').get();
    const verifiedOrgsRes = db.prepare("SELECT COUNT(*) as total FROM organizations WHERE verification_status = 'verified'").get();
    const donationsRes = db.prepare('SELECT COUNT(*) as total FROM donations').get();
    const completedRes = db.prepare("SELECT COUNT(*) as total FROM donations WHERE status = 'completed'").get();
    const donorsRes = db.prepare("SELECT COUNT(*) as total FROM users WHERE role = 'donor'").get();
    const citiesRes = db.prepare('SELECT COUNT(DISTINCT city) as total FROM users WHERE city IS NOT NULL').get();

    return NextResponse.json({
      totalItemsDonated: itemsRes.total || 0,
      verifiedNGOs: verifiedOrgsRes.total || 0,
      totalDonations: donationsRes.total || 0,
      completedDonations: completedRes.total || 0,
      totalDonors: donorsRes.total || 0,
      activeCities: citiesRes.total || 0,
    });
  } catch (error) {
    console.error('Public stats error:', error);
    return NextResponse.json({
      totalItemsDonated: 0,
      verifiedNGOs: 0,
      totalDonations: 0,
      completedDonations: 0,
      totalDonors: 0,
      activeCities: 0,
    });
  }
}
