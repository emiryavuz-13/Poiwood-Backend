const pool = require('../../config/db');

function calculatePrice(product, width, height) {
  const { pricing_type, base_price, price_per_cm2, formula_json } = product;
  if (pricing_type === 'fixed') return parseFloat(base_price);
  if (pricing_type === 'per_cm2') return parseFloat((width * height * price_per_cm2).toFixed(2));
  if (pricing_type === 'formula') {
    const { a, b } = formula_json;
    return parseFloat((a * width * height + b).toFixed(2));
  }
  return null;
}

async function getAll({ category_id, is_featured, is_weekly_pick, search, sort, min_price, max_price, page = 1, limit = 20 }) {
  const conditions = ['p.is_active = true'];
  const params = [];
  let i = 1;

  if (category_id) {
    conditions.push(`(p.category_id = $${i} OR p.category_id IN (SELECT id FROM categories WHERE parent_id = $${i}))`);
    params.push(category_id);
    i++;
  }
  if (is_featured === 'true') { conditions.push(`p.is_featured = true`); }
  if (is_weekly_pick === 'true') { conditions.push(`p.is_weekly_pick = true`); }
  if (search) { conditions.push(`p.name ILIKE $${i++}`); params.push(`%${search}%`); }
  if (min_price) { conditions.push(`COALESCE(p.sale_price, p.base_price) >= $${i++}`); params.push(parseFloat(min_price)); }
  if (max_price) { conditions.push(`COALESCE(p.sale_price, p.base_price) <= $${i++}`); params.push(parseFloat(max_price)); }

  const where = conditions.join(' AND ');
  const offset = (page - 1) * limit;

  const sortOptions = {
    'price_asc': 'COALESCE(p.sale_price, p.base_price) ASC NULLS LAST',
    'price_desc': 'COALESCE(p.sale_price, p.base_price) DESC NULLS LAST',
    'name_asc': 'p.name ASC',
    'name_desc': 'p.name DESC',
    'newest': 'p.created_at DESC',
    'oldest': 'p.created_at ASC',
    'popular': 'avg_rating DESC NULLS LAST, review_count DESC',
  };
  const orderBy = sortOptions[sort] || 'p.created_at DESC';

  const { rows } = await pool.query(
    `SELECT p.*, c.name AS category_name,
            (SELECT pi.firebase_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_image,
            (SELECT pi.thumbnail_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_thumbnail,
            ROUND(AVG(r.rating), 1) AS avg_rating,
            COUNT(DISTINCT r.id) AS review_count
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = true
     WHERE ${where}
     GROUP BY p.id, c.name
     ORDER BY ${orderBy}
     LIMIT $${i++} OFFSET $${i++}`,
    [...params, limit, offset]
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM products p WHERE ${where}`, params
  );

  return { products: rows, total: parseInt(countRows[0].count), page: parseInt(page), limit: parseInt(limit) };
}

async function getAllAdmin({ search, category_id, stock, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (search) { conditions.push(`p.name ILIKE $${i++}`); params.push(`%${search}%`); }
  if (category_id) { conditions.push(`(p.category_id = $${i} OR p.category_id IN (SELECT id FROM categories WHERE parent_id = $${i}))`); params.push(category_id); i++; }
  if (stock === 'out') { conditions.push('p.stock_quantity <= 0'); }
  else if (stock === 'in') { conditions.push('p.stock_quantity > 0'); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (page - 1) * limit;

  const { rows } = await pool.query(
    `SELECT p.*, c.name AS category_name,
            (SELECT pi.firebase_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_image,
            (SELECT pi.thumbnail_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_thumbnail,
            (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id)::int AS image_count
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    [...params, limit, offset]
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM products p ${where}`, params
  );

  return { products: rows, total: parseInt(countRows[0].count), page: parseInt(page), limit: parseInt(limit) };
}

async function getBySlug(slug) {
  const { rows } = await pool.query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
            cp.name AS parent_category_name, cp.slug AS parent_category_slug,
            ROUND(AVG(r.rating), 1) AS avg_rating,
            COUNT(DISTINCT r.id) AS review_count
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN categories cp ON c.parent_id = cp.id
     LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = true
     WHERE p.slug = $1 AND p.is_active = true
     GROUP BY p.id, c.name, c.slug, cp.name, cp.slug`,
    [slug]
  );
  if (!rows[0]) return null;

  const { rows: images } = await pool.query(
    'SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order',
    [rows[0].id]
  );
  return { ...rows[0], images };
}

async function getById(id) {
  const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  if (!rows[0]) return null;
  const { rows: images } = await pool.query(
    'SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order',
    [id]
  );
  return { ...rows[0], images };
}

async function getFeatured() {
  return (await getAll({ is_featured: 'true', limit: 8 })).products;
}

async function getWeeklyPicks() {
  return (await getAll({ is_weekly_pick: 'true', limit: 6 })).products;
}

async function computePrice(product, width, height) {
  if (product.pricing_type !== 'fixed') {
    const { min_width_cm, max_width_cm, min_height_cm, max_height_cm } = product;
    if (min_width_cm && width < min_width_cm) throw new Error(`Minimum genişlik: ${min_width_cm} cm`);
    if (max_width_cm && width > max_width_cm) throw new Error(`Maksimum genişlik: ${max_width_cm} cm`);
    if (min_height_cm && height < min_height_cm) throw new Error(`Minimum yükseklik: ${min_height_cm} cm`);
    if (max_height_cm && height > max_height_cm) throw new Error(`Maksimum yükseklik: ${max_height_cm} cm`);
  }
  return calculatePrice(product, width, height);
}

async function create(data) {
  const {
    category_id, name, slug, description,
    pricing_type, base_price, price_per_cm2, formula_json,
    min_width_cm, max_width_cm, min_height_cm, max_height_cm,
    stock_quantity, is_featured, is_weekly_pick,
    discount_type, discount_value,
  } = data;

  // sale_price hesapla
  let sale_price = null;
  if (discount_type && discount_value > 0 && base_price) {
    if (discount_type === 'percentage') {
      sale_price = Math.round((base_price * (1 - discount_value / 100)) * 100) / 100;
    } else {
      sale_price = Math.max(0, Math.round((base_price - discount_value) * 100) / 100);
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO products
       (category_id, name, slug, description, pricing_type, base_price, price_per_cm2,
        formula_json, min_width_cm, max_width_cm, min_height_cm, max_height_cm,
        stock_quantity, is_featured, is_weekly_pick, discount_type, discount_value, sale_price)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
    [category_id, name, slug, description || null, pricing_type || 'fixed',
     base_price || null, price_per_cm2 || null, formula_json || null,
     min_width_cm || null, max_width_cm || null, min_height_cm || null, max_height_cm || null,
     stock_quantity || 0, is_featured || false, is_weekly_pick || false,
     discount_type || null, discount_value || null, sale_price]
  );
  return rows[0];
}

async function update(id, data) {
  const fields = [
    'category_id','name','slug','description','pricing_type','base_price',
    'price_per_cm2','formula_json','min_width_cm','max_width_cm','min_height_cm',
    'max_height_cm','stock_quantity','is_featured','is_weekly_pick','is_active',
    'discount_type','discount_value','sale_price'
  ];
  const updates = [];
  const params = [];
  let i = 1;

  // sale_price otomatik hesapla
  if (data.discount_type !== undefined || data.discount_value !== undefined || data.base_price !== undefined) {
    const current = await getById(id);
    const basePrice = parseFloat(data.base_price !== undefined ? data.base_price : current.base_price) || 0;
    const discType = data.discount_type !== undefined ? data.discount_type : current.discount_type;
    const discValue = parseFloat(data.discount_value !== undefined ? data.discount_value : current.discount_value) || 0;

    if (discType && discValue > 0) {
      if (discType === 'percentage') {
        data.sale_price = Math.round((basePrice * (1 - discValue / 100)) * 100) / 100;
      } else {
        data.sale_price = Math.max(0, Math.round((basePrice - discValue) * 100) / 100);
      }
    } else {
      data.sale_price = null;
      data.discount_type = null;
      data.discount_value = null;
    }
  }

  fields.forEach(f => {
    if (data[f] !== undefined) {
      updates.push(`${f} = $${i++}`);
      params.push(data[f]);
    }
  });
  if (!updates.length) return getById(id);
  params.push(id);
  const { rows } = await pool.query(
    `UPDATE products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
    params
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rows } = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  return rows[0] || null;
}

async function addImage(productId, { firebase_url, storage_path, display_order, is_primary, thumbnail_url }) {
  if (is_primary) {
    await pool.query('UPDATE product_images SET is_primary = false WHERE product_id = $1', [productId]);
  }
  const { rows } = await pool.query(
    `INSERT INTO product_images (product_id, firebase_url, storage_path, display_order, is_primary, thumbnail_url)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [productId, firebase_url, storage_path, display_order || 0, is_primary || false, thumbnail_url || null]
  );
  return rows[0];
}

async function setPrimaryImage(productId, imageId, thumbnailUrl) {
  await pool.query('UPDATE product_images SET is_primary = false WHERE product_id = $1', [productId]);
  let query, params;
  if (thumbnailUrl) {
    query = 'UPDATE product_images SET is_primary = true, thumbnail_url = $3 WHERE id = $1 AND product_id = $2 RETURNING *';
    params = [imageId, productId, thumbnailUrl];
  } else {
    query = 'UPDATE product_images SET is_primary = true WHERE id = $1 AND product_id = $2 RETURNING *';
    params = [imageId, productId];
  }
  const { rows } = await pool.query(query, params);
  return rows[0] || null;
}

async function removeImage(productId, imageId) {
  const { rows } = await pool.query(
    'DELETE FROM product_images WHERE id = $1 AND product_id = $2 RETURNING storage_path, is_primary',
    [imageId, productId]
  );
  if (!rows[0]) return null;

  // Silinen ana fotoğrafsa, sıradaki fotoğrafı otomatik ana yap
  if (rows[0].is_primary) {
    await pool.query(
      `UPDATE product_images SET is_primary = true
       WHERE id = (SELECT id FROM product_images WHERE product_id = $1 ORDER BY display_order LIMIT 1)`,
      [productId]
    );
  }

  return rows[0];
}

module.exports = { getAll, getAllAdmin, getBySlug, getById, getFeatured, getWeeklyPicks, computePrice, create, update, remove, addImage, setPrimaryImage, removeImage };
