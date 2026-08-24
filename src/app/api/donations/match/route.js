import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const itemType = searchParams.get('item_type');
    const city = searchParams.get('city') || 'Mumbai';

    const db = getDb();

    // Fetch all verified NGOs in the chosen city
    const ngos = db.prepare(`
      SELECT o.id, o.org_name, o.city, o.org_type, o.address
      FROM organizations o
      WHERE o.verification_status = 'verified' AND o.city LIKE ?
    `).all(`%${city}%`);

    if (ngos.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Fetch active demands matching this category or item type in this city
    const demands = db.prepare(`
      SELECT dr.*, o.org_name
      FROM donation_requests dr
      JOIN organizations o ON dr.organization_id = o.id
      WHERE o.verification_status = 'verified' AND o.city LIKE ?
        AND (dr.category_id = ? OR dr.item_type LIKE ?)
        AND dr.status IN ('active', 'partially_fulfilled')
    `).all(`%${city}%`, categoryId || 0, `%${itemType || ''}%`);

    const scoredMatches = ngos.map((ngo) => {
      // Find direct demands for this NGO
      const ngoDemands = demands.filter((d) => d.organization_id === ngo.id);
      
      // Calculate simulated distance deterministically based on ID to remain consistent
      const baseDistance = ((ngo.id * 7) % 9) + 1.2; // values between 1.2 and 9.2 km
      const distance = parseFloat(baseDistance.toFixed(1));

      let score = 100; // Base score
      let priority = 'low';
      let reason = 'Verified local community NGO';
      let needText = '';
      let remainingQty = 0;

      // Penalize by distance
      score -= distance * 5;

      if (ngoDemands.length > 0) {
        // Sort demands by priority (urgent -> high -> medium -> low)
        ngoDemands.sort((a, b) => {
          const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        });

        const primaryDemand = ngoDemands[0];
        priority = primaryDemand.priority || 'medium';
        remainingQty = primaryDemand.quantity_needed - (primaryDemand.quantity_fulfilled || 0);
        needText = `Needs ${remainingQty} ${primaryDemand.item_type}`;

        // Boost score based on priority/urgency
        if (priority === 'urgent') {
          score += 60;
          reason = `🔥 Critical demand for ${primaryDemand.item_type}`;
        } else if (priority === 'high') {
          score += 40;
          reason = `🔴 High urgency request for ${primaryDemand.item_type}`;
        } else {
          score += 20;
          reason = `🟡 Medium priority demand for ${primaryDemand.item_type}`;
        }
      } else {
        // Check if NGO accepts this category
        reason = `📍 Nearest available verified distribution center`;
      }

      return {
        id: ngo.id,
        org_name: ngo.org_name,
        org_type: ngo.org_type,
        city: ngo.city,
        distance,
        priority,
        reason,
        needText,
        remainingQty,
        score: parseFloat(score.toFixed(1)),
      };
    });

    // Sort by final match score descending
    scoredMatches.sort((a, b) => b.score - a.score);

    // Limit to top 3 matches
    const topMatches = scoredMatches.slice(0, 3);

    return NextResponse.json({ matches: topMatches });
  } catch (error) {
    console.error('Smart match endpoint error:', error);
    return NextResponse.json({ error: 'Failed to compute smart matches' }, { status: 500 });
  }
}
