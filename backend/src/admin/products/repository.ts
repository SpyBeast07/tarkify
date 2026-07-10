import { query } from '../../db.js';
import type {
  AdminProduct,
  ProductListItem,
  ProductListParams,
  CreateProductInput,
  UpdateProductInput,
} from './types.js';

function buildListWhere(params: ProductListParams): { clause: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.search) {
    conditions.push(`(p.name ILIKE $${idx} OR p.slug ILIKE $${idx})`);
    values.push(`%${params.search}%`);
    idx++;
  }

  if (params.status) {
    conditions.push(`p.status = $${idx}`);
    values.push(params.status);
    idx++;
  }

  if (params.visibility) {
    conditions.push(`p.visibility = $${idx}`);
    values.push(params.visibility);
    idx++;
  }

  if (params.category) {
    conditions.push(`p.category = $${idx}`);
    values.push(params.category);
    idx++;
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, values };
}

function buildOrderBy(sort: string): string {
  switch (sort) {
    case 'oldest': return 'p.created_at ASC';
    case 'updated': return 'p.updated_at DESC';
    case 'price': return 'p.price ASC';
    case 'name': return 'p.name ASC';
    default: return 'p.created_at DESC';
  }
}

export async function listProducts(params: ProductListParams): Promise<{ products: ProductListItem[]; total: number }> {
  const sort = params.sort ?? 'newest';
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const offset = (page - 1) * perPage;

  const { clause, values } = buildListWhere(params);

  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM products p ${clause}`,
    values,
  );
  const total = countResult.rows[0].count;

  const orderBy = buildOrderBy(sort);
  const listValues = [...values, perPage, offset];

  const result = await query<ProductListItem>(
    `SELECT
      p.id, p.slug, p.name, p.short_description,
      p.price, p.currency, p.status, p.visibility, p.category,
      p.version, p.download_key, p.created_at, p.updated_at
    FROM products p
    ${clause}
    ORDER BY ${orderBy}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    listValues,
  );

  return { products: result.rows, total };
}

export async function getProductById(id: string): Promise<AdminProduct | null> {
  const result = await query<AdminProduct>('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function getProductBySlug(slug: string): Promise<AdminProduct | null> {
  const result = await query<AdminProduct>('SELECT * FROM products WHERE slug = $1', [slug]);
  return result.rows[0] ?? null;
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  if (excludeId) {
    const result = await query('SELECT 1 FROM products WHERE slug = $1 AND id != $2', [slug, excludeId]);
    return result.rows.length > 0;
  }
  const result = await query('SELECT 1 FROM products WHERE slug = $1', [slug]);
  return result.rows.length > 0;
}

export async function createProduct(input: CreateProductInput): Promise<AdminProduct> {
  const status = input.status ?? 'draft';
  const active = status === 'published';
  const result = await query<AdminProduct>(
    `INSERT INTO products (
      slug, name, description, short_description, price, currency,
      category, tags, visibility, status, active, seo_title, seo_description,
      og_image, download_key, version, release_date, release_notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`,
    [
      input.slug,
      input.name,
      input.description ?? null,
      input.short_description ?? null,
      input.price,
      input.currency ?? 'INR',
      input.category ?? 'General',
      JSON.stringify(input.tags ?? []),
      input.visibility ?? 'public',
      status,
      active,
      input.seo_title ?? null,
      input.seo_description ?? null,
      input.og_image ?? null,
      input.download_key ?? null,
      input.version ?? '1.0.0',
      input.release_date || null,
      input.release_notes ?? null,
    ],
  );
  return result.rows[0];
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<AdminProduct | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      fields[key] = value;
    }
  }

  if (Object.keys(fields).length === 0) {
    return getProductById(id);
  }

  for (const [key, value] of Object.entries(fields)) {
    if (key === 'tags') {
      setClauses.push(`tags = $${idx}::jsonb`);
      values.push(JSON.stringify(value));
    } else {
      setClauses.push(`${key} = $${idx}`);
      values.push(value);
    }
    idx++;
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<AdminProduct>(
    `UPDATE products SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function updateProductStatus(id: string, status: string): Promise<AdminProduct | null> {
  const result = await query<AdminProduct>(
    `UPDATE products SET status = $1, updated_at = NOW(), active = $2 WHERE id = $3 RETURNING *`,
    [status, status === 'published', id],
  );
  return result.rows[0] ?? null;
}

export async function getProductAuditLog(productId: string): Promise<{ id: string; event: string; user_id: string | null; user_name: string | null; metadata: Record<string, unknown>; created_at: string }[]> {
  const result = await query<{ id: string; event: string; user_id: string | null; user_name: string | null; metadata: Record<string, unknown>; created_at: string }>(
    `SELECT
      a.id, a.event, a.user_id, u.name AS user_name,
      a.metadata, a.created_at
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE a.metadata->>'productId' = $1 OR a.metadata->>'product_id' = $1
    ORDER BY a.created_at DESC
    LIMIT 50`,
    [productId],
  );
  return result.rows;
}

export async function getCategories(): Promise<string[]> {
  const result = await query<{ category: string }>(
    `SELECT DISTINCT category FROM products ORDER BY category ASC`,
  );
  return result.rows.map(r => r.category);
}
