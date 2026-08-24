import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET() {
  try {
    const db = getDb();
    const categories = db.prepare(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC'
    ).all();

    // Get item types for each category
    const itemTypes = db.prepare('SELECT * FROM item_types WHERE is_active = 1').all();
    const categoriesWithTypes = categories.map(cat => ({
      ...cat,
      accepted_conditions: JSON.parse(cat.accepted_conditions || '[]'),
      item_types: itemTypes.filter(it => it.category_id === cat.id),
    }));

    return NextResponse.json({ categories: categoriesWithTypes });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const decoded = getUserFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { name, description, icon, accepted_conditions, item_types } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const db = getDb();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
    if (existing) {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 409 });
    }

    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM categories').get();
    const result = db.prepare(
      'INSERT INTO categories (name, slug, description, icon, accepted_conditions, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, slug, description || null, icon || '📦', JSON.stringify(accepted_conditions || ['new', 'like_new', 'good', 'fair']), (maxOrder.max || 0) + 1);

    if (item_types && item_types.length > 0) {
      const insertItem = db.prepare('INSERT INTO item_types (category_id, name, slug) VALUES (?, ?, ?)');
      for (const it of item_types) {
        const itSlug = it.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        insertItem.run(result.lastInsertRowid, it, itSlug);
      }
    }

    return NextResponse.json({ id: Number(result.lastInsertRowid), message: 'Category created' }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
