import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { hashPassword, signToken } = require('@/lib/auth');

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      role = 'donor',
      city,
      pin_code,
      pinCode,
      // NGO specific fields
      org_name,
      orgName,
      registration_number,
      registrationNumber,
      contact_person,
      contactPerson,
      org_address,
      orgAddress,
      org_city,
      orgCity,
      service_area,
      serviceArea,
      org_type,
      orgType,
      website
    } = body;

    const normalizedRole = (role || 'donor').toLowerCase().trim();
    const normalizedName = (name || '').trim();
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedPhone = (phone || '').trim();
    const normalizedCity = (city || org_city || orgCity || '').trim();
    const normalizedPinCode = (pin_code || pinCode || '').trim();

    // Safe development logging (NEVER log password)
    console.log(`[AUTH API] Registration request received for role: ${normalizedRole}, email: ${normalizedEmail}`);

    // 1. Required fields check
    if (!normalizedName) {
      return NextResponse.json(
        { success: false, error: 'Full name is required', message: 'Full name is required' },
        { status: 400 }
      );
    }

    if (!normalizedEmail) {
      return NextResponse.json(
        { success: false, error: 'Email address is required', message: 'Email address is required' },
        { status: 400 }
      );
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address', message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // 3. Password validation
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required', message: 'Password is required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long', message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // 4. Role validation
    if (!['donor', 'ngo'].includes(normalizedRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be donor or ngo.', message: 'Invalid role. Must be donor or ngo.' },
        { status: 400 }
      );
    }

    const db = getDb();

    // 5. Check duplicate email (case-insensitive)
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.', message: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // 6. Hash password securely
    const password_hash = hashPassword(password);

    // 7. Insert user
    const insertUser = db.prepare(
      `INSERT INTO users (name, email, phone, password_hash, role, city, pin_code, is_verified, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
    );
    const result = insertUser.run(
      normalizedName,
      normalizedEmail,
      normalizedPhone || null,
      password_hash,
      normalizedRole,
      normalizedCity || null,
      normalizedPinCode || null,
      normalizedRole === 'donor' ? 1 : 0
    );
    const userId = Number(result.lastInsertRowid);

    // 8. If NGO, create organization profile
    let organizationData = null;
    if (normalizedRole === 'ngo') {
      const finalOrgName = (org_name || orgName || normalizedName).trim();
      const finalRegNum = (registration_number || registrationNumber || '').trim();
      const finalContactPerson = (contact_person || contactPerson || normalizedName).trim();
      const finalAddress = (org_address || orgAddress || '').trim();
      const finalOrgCity = (org_city || orgCity || normalizedCity || '').trim();
      const finalServiceArea = service_area || serviceArea || null;
      const finalOrgType = (org_type || orgType || 'ngo').trim();
      const finalWebsite = (website || '').trim();

      const insertOrg = db.prepare(
        `INSERT INTO organizations (user_id, org_name, registration_number, contact_person, phone, email, address, city, service_area, org_type, website, verification_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
      );
      const orgResult = insertOrg.run(
        userId,
        finalOrgName,
        finalRegNum || null,
        finalContactPerson,
        normalizedPhone || null,
        normalizedEmail,
        finalAddress || null,
        finalOrgCity || null,
        finalServiceArea ? JSON.stringify(finalServiceArea) : null,
        finalOrgType,
        finalWebsite || null
      );

      organizationData = {
        id: Number(orgResult.lastInsertRowid),
        org_name: finalOrgName,
        verification_status: 'pending',
        org_type: finalOrgType,
      };
    }

    // 9. Generate JWT Token
    const token = signToken({
      id: userId,
      email: normalizedEmail,
      role: normalizedRole,
      name: normalizedName,
    });

    const user = {
      id: userId,
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      role: normalizedRole,
      city: normalizedCity,
      pin_code: normalizedPinCode,
      is_verified: normalizedRole === 'donor' ? 1 : 0,
      organization: organizationData,
    };

    return NextResponse.json(
      {
        success: true,
        token,
        user,
        message: 'Account created successfully!'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register API unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Registration failed. Please try again.',
        message: error.message || 'Registration failed. Please try again.'
      },
      { status: 500 }
    );
  }
}
