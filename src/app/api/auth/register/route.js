import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { hashPassword, signToken } = require('@/lib/auth');

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, role, city, pin_code, org_name, registration_number, contact_person, org_address, org_city, service_area, org_type, website } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 });
    }

    if (!['donor', 'ngo'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be donor or ngo.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const db = getDb();

    // Check existing user
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const password_hash = hashPassword(password);

    const insertUser = db.prepare(
      `INSERT INTO users (name, email, phone, password_hash, role, city, pin_code, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = insertUser.run(name, email, phone || null, password_hash, role, city || null, pin_code || null, role === 'donor' ? 1 : 0);
    const userId = result.lastInsertRowid;

    // If NGO, create organization
    if (role === 'ngo') {
      const insertOrg = db.prepare(
        `INSERT INTO organizations (user_id, org_name, registration_number, contact_person, phone, email, address, city, service_area, org_type, website, verification_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
      );
      insertOrg.run(
        userId,
        org_name || name,
        registration_number || null,
        contact_person || name,
        phone || null,
        email,
        org_address || null,
        org_city || city || null,
        service_area ? JSON.stringify(service_area) : null,
        org_type || 'ngo',
        website || null
      );
    }

    const token = signToken({ id: Number(userId), email, role, name });

    const user = { id: Number(userId), name, email, role, city, phone };

    return NextResponse.json({ token, user, message: 'Registration successful' }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
