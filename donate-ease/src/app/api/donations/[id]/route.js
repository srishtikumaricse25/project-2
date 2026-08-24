import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request, { params }) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const donation = db.prepare(
      `SELECT d.*, c.name as category_name, c.icon as category_icon, c.slug as category_slug,
              u.name as donor_name, u.phone as donor_phone, u.email as donor_email, u.city as donor_city,
              o.org_name, o.verification_status as org_verification
       FROM donations d
       LEFT JOIN categories c ON d.category_id = c.id
       LEFT JOIN users u ON d.donor_id = u.id
       LEFT JOIN organizations o ON d.organization_id = o.id
       WHERE d.id = ? OR d.donation_id = ?`
    ).get(id, id);

    if (!donation) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    // Status history
    const history = db.prepare(
      `SELECT dsh.*, u.name as changed_by_name
       FROM donation_status_history dsh
       LEFT JOIN users u ON dsh.changed_by = u.id
       WHERE dsh.donation_id = ?
       ORDER BY dsh.created_at ASC`
    ).all(donation.id);

    return NextResponse.json({ donation, history });
  } catch (error) {
    console.error('Get donation error:', error);
    return NextResponse.json({ error: 'Failed to fetch donation' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes, rejection_reason, cancellation_reason, received_qty, accepted_qty, rejected_qty, distributed_qty, distribution_date, distribution_notes } = body;

    const db = getDb();
    const donation = db.prepare('SELECT * FROM donations WHERE id = ? OR donation_id = ?').get(id, id);

    if (!donation) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    if (status) {
      // Record status change
      db.prepare(
        'INSERT INTO donation_status_history (donation_id, from_status, to_status, changed_by, notes) VALUES (?, ?, ?, ?, ?)'
      ).run(donation.id, donation.status, status, decoded.id, notes || `Status changed to ${status}`);

      const updates = ['status = ?', 'updated_at = datetime("now")'];
      const updateParams = [status];

      if (rejection_reason) { updates.push('rejection_reason = ?'); updateParams.push(rejection_reason); }
      if (cancellation_reason) { updates.push('cancellation_reason = ?'); updateParams.push(cancellation_reason); }
      if (received_qty !== undefined) { updates.push('received_qty = ?'); updateParams.push(received_qty); }
      if (accepted_qty !== undefined) { updates.push('accepted_qty = ?'); updateParams.push(accepted_qty); }
      if (rejected_qty !== undefined) { updates.push('rejected_qty = ?'); updateParams.push(rejected_qty); }
      if (distributed_qty !== undefined) { updates.push('distributed_qty = ?'); updateParams.push(distributed_qty); }
      if (distribution_date) { updates.push('distribution_date = ?'); updateParams.push(distribution_date); }
      if (distribution_notes) { updates.push('distribution_notes = ?'); updateParams.push(distribution_notes); }

      updateParams.push(donation.id);
      db.prepare(`UPDATE donations SET ${updates.join(', ')} WHERE id = ?`).run(...updateParams);

      const notificationMessages = {
        accepted: { 
          title: '🔔 NGO Accepted', 
          type: 'donation_accepted',
          message: (donation, orgName) => `${orgName || 'NGO'} accepted your donation ${donation.donation_id} (${donation.quantity}x ${donation.item_type}).`
        },
        rejected: { 
          title: '🔔 Donation Declined', 
          type: 'donation_rejected',
          message: (donation, orgName) => `${orgName || 'NGO'} declined donation ${donation.donation_id}.`
        },
        pickup_scheduled: { 
          title: '🔔 Pickup Scheduled', 
          type: 'pickup_scheduled',
          message: (donation, orgName) => `Your donation ${donation.donation_id} will be collected on ${donation.pickup_date || 'scheduled date'} during the slot ${donation.pickup_time_slot || 'scheduled time'}.`
        },
        picked_up: { 
          title: '🔔 Item Collected', 
          type: 'donation_collected',
          message: (donation, orgName) => `Your donation ${donation.donation_id} has been collected by the courier partner.`
        },
        received: { 
          title: '🔔 Donation Received', 
          type: 'donation_received',
          message: (donation, orgName) => `Your donated items have been received by ${orgName || 'the NGO'}.`
        },
        distributed: { 
          title: '🔔 Donation Distributed 🤝', 
          type: 'donation_distributed',
          message: (donation, orgName) => `Your donation ${donation.donation_id} has been distributed to beneficiaries.`
        },
        completed: { 
          title: '🔔 Donation Completed 🌟', 
          type: 'donation_completed',
          message: (donation, orgName) => `Thank you! Your donation ${donation.donation_id} is officially complete. You gained 10 impact points!`
        },
        cancelled: { 
          title: '🔔 Donation Cancelled', 
          type: 'donation_cancelled',
          message: (donation) => `Your donation ${donation.donation_id} has been cancelled.`
        },
      };

      const notif = notificationMessages[status];
      if (notif) {
        let orgName = 'Hope Foundation';
        if (donation.organization_id) {
          const org = db.prepare('SELECT org_name FROM organizations WHERE id = ?').get(donation.organization_id);
          if (org) orgName = org.org_name;
        }

        // Notify donor
        db.prepare(
          'INSERT INTO notifications (user_id, type, title, message, donation_id) VALUES (?, ?, ?, ?, ?)'
        ).run(donation.donor_id, notif.type, notif.title,
          notif.message(donation, orgName),
          donation.id);
      }

      // Update completed count if completed
      if (status === 'completed') {
        db.prepare('UPDATE users SET completed_donations = completed_donations + 1, impact_score = impact_score + 10 WHERE id = ?').run(donation.donor_id);
      }
    }

    return NextResponse.json({ message: 'Donation updated successfully' });
  } catch (error) {
    console.error('Update donation error:', error);
    return NextResponse.json({ error: 'Failed to update donation' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const donation = db.prepare('SELECT * FROM donations WHERE id = ? OR donation_id = ?').get(id, id);

    if (!donation) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    // FR-DON-05: Donor shall not delete a donation once status = COMPLETED
    if (donation.status === 'completed') {
      return NextResponse.json({
        error: 'Completed donations cannot be deleted for auditability and impact tracking.'
      }, { status: 400 });
    }

    // Ensure donor or admin owns/deletes it
    if (decoded.role !== 'admin' && donation.donor_id !== decoded.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare('DELETE FROM donations WHERE id = ?').run(donation.id);
    return NextResponse.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    console.error('Delete donation error:', error);
    return NextResponse.json({ error: 'Failed to delete donation' }, { status: 500 });
  }
}
