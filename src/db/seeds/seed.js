require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const pool = require('../../config/db');

async function seedCategories() {
  console.log('Kategoriler ekleniyor...');

  // Ana kategoriler
  const { rows: anaKategoriler } = await pool.query(`
    INSERT INTO categories (name, slug, description, display_order) VALUES
      ('Tablolar', 'tablolar', 'Ahşap tablo ve duvar süslemeleri', 1),
      ('Hediyelik Eşyalar', 'hediyelik-esyalar', 'Özel tasarım hediyelik ahşap ürünler', 2),
      ('Ev Eşyaları', 'ev-esyalari', 'Dekoratif ve kullanışlı ahşap ev ürünleri', 3)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
  `);

  const tabloId = anaKategoriler.find(r => r.slug === 'tablolar')?.id;

  if (tabloId) {
    await pool.query(`
      INSERT INTO categories (parent_id, name, slug, description, display_order) VALUES
        ($1, 'Manzara Tabloları', 'manzara-tablolari', 'Doğa ve şehir manzarası ahşap tablolar', 1),
        ($1, 'Soyut Tablolar', 'soyut-tablolar', 'Modern soyut ahşap tablo tasarımları', 2),
        ($1, 'Kişiye Özel Tablolar', 'kişiye-ozel-tablolar', 'İsim, tarih veya fotoğraf baskılı tablolar', 3),
        ($1, 'Çerçeveli Tablolar', 'cerceveli-tablolar', 'Ahşap çerçeveli duvar tabloları', 4)
      ON CONFLICT (slug) DO NOTHING
    `, [tabloId]);
  }

  console.log('Kategoriler eklendi.');
}

async function seedProducts() {
  console.log('Ürünler ekleniyor...');

  // Kategori id'lerini al
  const { rows: cats } = await pool.query(
    `SELECT id, slug FROM categories WHERE slug IN ('manzara-tablolari','soyut-tablolar','kişiye-ozel-tablolar','hediyelik-esyalar','ev-esyalari', 'cerceveli-tablolar')`
  );
  const catMap = {};
  cats.forEach(c => (catMap[c.slug] = c.id));

  const products = [
    {
      category_slug: 'manzara-tablolari',
      name: 'Orman Manzarası Ahşap Tablo',
      slug: 'orman-manzarasi-ahsap-tablo',
      description: 'Yoğun orman manzarasının ahşap üzerine lazer baskı tekniğiyle işlendiği duvar tablosu. Doğal ahşabın dokusuyla birlikte eşsiz bir görünüm sunar.',
      pricing_type: 'per_cm2',
      base_price: 359.90,
      price_per_cm2: 0.45,
      min_width_cm: 20, max_width_cm: 120,
      min_height_cm: 20, max_height_cm: 80,
      stock_quantity: 50,
      is_featured: true,
      is_weekly_pick: true,
    },
    {
      category_slug: 'manzara-tablolari',
      name: 'Deniz Feneri Ahşap Tablo',
      slug: 'deniz-feneri-ahsap-tablo',
      description: 'Gün batımında deniz fenerinin büyüleyici görüntüsü. Kayın ağacı üzerine UV baskı.',
      pricing_type: 'per_cm2',
      base_price: 329.90,
      price_per_cm2: 0.42,
      min_width_cm: 30, max_width_cm: 100,
      min_height_cm: 20, max_height_cm: 70,
      stock_quantity: 30,
      is_featured: true,
      is_weekly_pick: false,
    },
    {
      category_slug: 'soyut-tablolar',
      name: 'Geometrik Desen Ahşap Tablo',
      slug: 'geometrik-desen-ahsap-tablo',
      description: 'Modern geometrik desenlerle süslenmiş minimalist ahşap tablo. Ofis ve oturma odaları için idealdir.',
      pricing_type: 'formula',
      base_price: 449.90,
      formula_json: { a: 0.5, b: 150 },
      min_width_cm: 25, max_width_cm: 100,
      min_height_cm: 25, max_height_cm: 100,
      stock_quantity: 40,
      is_featured: true,
      is_weekly_pick: false,
    },
    {
      category_slug: 'kişiye-ozel-tablolar',
      name: 'İsme Özel Ahşap Tablo',
      slug: 'isme-ozel-ahsap-tablo',
      description: 'Kişiye özel isim, tarih veya mesaj yazılabilir ahşap tablo. Doğum günü, yıl dönümü ve özel günler için mükemmel hediye.',
      pricing_type: 'per_cm2',
      base_price: 279.90,
      price_per_cm2: 0.60,
      min_width_cm: 20, max_width_cm: 80,
      min_height_cm: 15, max_height_cm: 60,
      stock_quantity: 999,
      is_featured: false,
      is_weekly_pick: true,
    },
    {
      category_slug: 'hediyelik-esyalar',
      name: 'Ahşap Anahtar Askısı',
      slug: 'ahsap-anahtar-askisi',
      description: '5 kancalı dekoratif ahşap anahtar askısı. Giriş holü için şık ve kullanışlı tasarım.',
      pricing_type: 'fixed',
      base_price: 249.90,
      stock_quantity: 75,
      is_featured: false,
      is_weekly_pick: true,
    },
    {
      category_slug: 'hediyelik-esyalar',
      name: 'Kişiye Özel Ahşap Kalemlik',
      slug: 'kişiye-ozel-ahsap-kalemlik',
      description: 'İsim veya logo kazıma yapılabilen masaüstü ahşap kalemlik. Kurumsal hediye için ideal.',
      pricing_type: 'fixed',
      base_price: 189.90,
      stock_quantity: 60,
      is_featured: true,
      is_weekly_pick: false,
    },
    {
      category_slug: 'ev-esyalari',
      name: 'Ahşap Sunum Tahtası',
      slug: 'ahsap-sunum-tahtasi',
      description: 'Peynir, meze ve atıştırmalıklar için doğal ceviz ağacından yapılmış sunum tahtası.',
      pricing_type: 'fixed',
      base_price: 399.90,
      stock_quantity: 25,
      is_featured: true,
      is_weekly_pick: false,
    },
    {
      category_slug: 'ev-esyalari',
      name: 'Ahşap Fotoğraf Çerçevesi',
      slug: 'ahsap-fotograf-cercevesi',
      description: '10x15 cm fotoğraf için el yapımı meşe ağacı çerçeve. Masa üstü veya duvara asılabilir.',
      pricing_type: 'fixed',
      base_price: 149.90,
      stock_quantity: 80,
      is_featured: false,
      is_weekly_pick: false,
    },
    // Adding 3 more interesting products:
    {
      category_slug: 'kişiye-ozel-tablolar',
      name: 'Kişiye Özel Bebek Doğum Panosu',
      slug: 'kisiye-ozel-bebek-dogum-panosu',
      description: 'Bebeğinizin adı, doğum tarihi, saati, kilosu ve boyunun yer aldığı özel tasarım ahşap anı panosu. Lazer kazıma ile hazırlanır.',
      pricing_type: 'fixed',
      base_price: 299.90,
      stock_quantity: 150,
      is_featured: true,
      is_weekly_pick: false,
    },
    {
      category_slug: 'ev-esyalari',
      name: 'Epoksi ve Ceviz Ahşap Bardak Altlığı',
      slug: 'epoksi-ceviz-bardak-altligi',
      description: "Okyanus mavisi epoksi reçine ile birleştirilmiş doğal ceviz ağacı bardak altlığı seti (4'lü paket). Hem dekoratif hem dayanıklı.",
      pricing_type: 'fixed',
      base_price: 349.90,
      stock_quantity: 40,
      is_featured: false,
      is_weekly_pick: true,
    },
    {
      category_slug: 'manzara-tablolari',
      name: 'Minimalist Dağ Etekleri Ahşap Tablo',
      slug: 'minimalist-dag-etekleri-ahsap-tablo',
      description: 'İskandinav ve minimalist ev dekorasyonları için tasarlanmış soyut dağ manzaralı katmanlı ahşap duvar panosu 3D efektli.',
      pricing_type: 'per_cm2',
      base_price: 549.90,
      price_per_cm2: 0.65,
      min_width_cm: 40, max_width_cm: 150,
      min_height_cm: 30, max_height_cm: 100,
      stock_quantity: 20,
      is_featured: true,
      is_weekly_pick: true,
    }
  ];

  for (const p of products) {
    const catId = catMap[p.category_slug];
    if (!catId) { console.log(`Kategori bulunamadı: ${p.category_slug}`); continue; }

    await pool.query(
      `INSERT INTO products
         (category_id, name, slug, description, pricing_type, base_price, price_per_cm2,
          formula_json, min_width_cm, max_width_cm, min_height_cm, max_height_cm,
          stock_quantity, is_featured, is_weekly_pick)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (slug) DO NOTHING`,
      [
        catId, p.name, p.slug, p.description,
        p.pricing_type, p.base_price || null, p.price_per_cm2 || null,
        p.formula_json ? JSON.stringify(p.formula_json) : null,
        p.min_width_cm || null, p.max_width_cm || null,
        p.min_height_cm || null, p.max_height_cm || null,
        p.stock_quantity, p.is_featured, p.is_weekly_pick,
      ]
    );
    console.log(`  [OK] ${p.name}`);
  }

  console.log('Ürünler eklendi.');
}

async function seedProductImages() {
  console.log('Ürün görselleri ekleniyor...');

  const { rows: products } = await pool.query('SELECT id, slug FROM products');
  const productMap = {};
  products.forEach(p => (productMap[p.slug] = p.id));

  const imageMap = {
    'orman-manzarasi-ahsap-tablo': [
      'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&h=800&fit=crop',
    ],
    'deniz-feneri-ahsap-tablo': [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=800&fit=crop',
    ],
    'geometrik-desen-ahsap-tablo': [
      'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1605106702842-01a887a31122?w=800&h=800&fit=crop',
    ],
    'isme-ozel-ahsap-tablo': [
      'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1596079890744-c1a0462d0975?w=800&h=800&fit=crop',
    ],
    'ahsap-anahtar-askisi': [
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800&h=800&fit=crop',
    ],
    'kişiye-ozel-ahsap-kalemlik': [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=800&h=800&fit=crop',
    ],
    'ahsap-sunum-tahtasi': [
      'https://images.unsplash.com/photo-1607877361964-d8afca04e3a7?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1573521193826-58c7dc2e13e3?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1528825871115-3581a5e0591f?w=800&h=800&fit=crop',
    ],
    'ahsap-fotograf-cercevesi': [
      'https://images.unsplash.com/photo-1582053433976-25c00369fc93?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1596079890744-c1a0462d0975?w=800&h=800&fit=crop',
    ],
    'kisiye-ozel-bebek-dogum-panosu': [
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=800&fit=crop',
    ],
    'epoksi-ceviz-bardak-altligi': [
      'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1605106702842-01a887a31122?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=800&fit=crop',
    ],
    'minimalist-dag-etekleri-ahsap-tablo': [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=800&fit=crop',
    ],
  };

  for (const [slug, images] of Object.entries(imageMap)) {
    const productId = productMap[slug];
    if (!productId) { console.log(`  [SKIP] Ürün bulunamadı: ${slug}`); continue; }

    // Zaten görseli varsa atla
    const { rows: existing } = await pool.query(
      'SELECT COUNT(*) FROM product_images WHERE product_id = $1', [productId]
    );
    if (parseInt(existing[0].count) > 0) {
      console.log(`  [SKIP] ${slug} — zaten görselleri var`);
      continue;
    }

    for (let i = 0; i < images.length; i++) {
      await pool.query(
        `INSERT INTO product_images (product_id, firebase_url, storage_path, display_order, is_primary)
         VALUES ($1, $2, $3, $4, $5)`,
        [productId, images[i], `seeds/${slug}/${i + 1}.jpg`, i, i === 0]
      );
    }
    console.log(`  [OK] ${slug} — ${images.length} görsel`);
  }

  console.log('Ürün görselleri eklendi.');
}

async function seedQuestions() {
  console.log('Örnek sorular ekleniyor...');

  // Seed kullanıcıları oluştur (yoksa ekle)
  const { rows: seedUsers } = await pool.query(`
    INSERT INTO users (firebase_uid, email, display_name, role) VALUES
      ('seed_admin_001', 'admin@poiwood.com', 'Poiwood Admin', 'admin'),
      ('seed_user_001', 'ayse@example.com', 'Ayşe Yılmaz', 'customer'),
      ('seed_user_002', 'mehmet@example.com', 'Mehmet Kaya', 'customer')
    ON CONFLICT (firebase_uid) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING id, role
  `);

  const adminId = seedUsers.find(u => u.role === 'admin')?.id;
  const customers = seedUsers.filter(u => u.role === 'customer');
  const userId1 = customers[0]?.id;
  const userId2 = customers[1]?.id || userId1;

  if (!userId1) {
    console.log('  [SKIP] Kullanıcı oluşturulamadı.');
    return;
  }

  const { rows: products } = await pool.query('SELECT id, slug FROM products');
  const pm = {};
  products.forEach(p => (pm[p.slug] = p.id));

  const questions = [
    // Orman Manzarası
    {
      product_slug: 'orman-manzarasi-ahsap-tablo',
      items: [
        { user: userId1, q: 'Bu tablonun ağırlığı yaklaşık kaç kg?', a: 'Boyuta göre değişmekle birlikte 40x40 cm bir tablo yaklaşık 1.2 kg gelmektedir.' },
        { user: userId2, q: 'Duvar askı aparatı ile birlikte mi geliyor?', a: 'Evet, tüm tablolarımız arkasında montaj aparatı takılı olarak gönderilmektedir.' },
        { user: userId1, q: 'Baskı kalitesi nasıl, solma yapar mı?', a: 'UV baskı teknolojisi kullanıyoruz, en az 10 yıl solmadan kalır. Direkt güneş ışığından uzak tutmanızı öneririz.' },
      ]
    },
    // Deniz Feneri
    {
      product_slug: 'deniz-feneri-ahsap-tablo',
      items: [
        { user: userId2, q: 'Kayın ağacı dışında başka ağaç seçeneği var mı?', a: 'Şu an için kayın ağacı kullanıyoruz. Özel sipariş ile ceviz ağacı da mümkün, lütfen iletişime geçin.' },
        { user: userId1, q: 'Banyo gibi nemli alanlarda kullanılabilir mi?', a: null },
      ]
    },
    // Geometrik Desen
    {
      product_slug: 'geometrik-desen-ahsap-tablo',
      items: [
        { user: userId1, q: 'Renk seçenekleri mevcut mu? Siyah-beyaz istersem olur mu?', a: 'Evet, sipariş notuna istediğiniz renk kombinasyonunu yazabilirsiniz. Siyah-beyaz çok tercih ediliyor.' },
        { user: userId2, q: 'Bu ürünü ofis için toplu sipariş verebilir miyiz?', a: 'Tabii ki! 10 adet ve üzeri toplu siparişlerde %10 indirim uygulanmaktadır. Kurumsal satış için bize ulaşın.' },
      ]
    },
    // Ahşap Sunum Tahtası
    {
      product_slug: 'ahsap-sunum-tahtasi',
      items: [
        { user: userId1, q: 'Gıdayla temas etmesi güvenli mi? Hangi yağ ile işleniyor?', a: 'Gıdaya uygun mineral yağ ile işlenmektedir. FDA onaylı ve tamamen güvenlidir.' },
        { user: userId2, q: 'Bulaşık makinesine atılabilir mi?', a: 'Hayır, ahşap ürünleri bulaşık makinesine atmayınız. Ilık su ve hafif deterjanla elde yıkayıp kurulayınız.' },
        { user: userId1, q: 'Boyutları tam olarak nedir?', a: null },
      ]
    },
    // Bebek Doğum Panosu
    {
      product_slug: 'kisiye-ozel-bebek-dogum-panosu',
      items: [
        { user: userId2, q: 'Sipariş verdikten kaç gün sonra kargoya verilir?', a: 'Kişiye özel ürünlerimiz 2-3 iş günü içinde hazırlanıp kargoya teslim edilmektedir.' },
        { user: userId1, q: 'Fotoğraf da ekletebilir miyiz panoya?', a: 'Şu an için lazer kazıma ile metin bazlı tasarım yapıyoruz. Fotoğraf baskılı seçenek yakında eklenecek.' },
      ]
    },
    // Epoksi Bardak Altlığı
    {
      product_slug: 'epoksi-ceviz-bardak-altligi',
      items: [
        { user: userId1, q: 'Epoksi kısmı sıcak bardak koyunca erimeye yapar mı?', a: 'Hayır, kullandığımız epoksi reçine 120°C sıcaklığa dayanıklıdır. Sıcak çay/kahve bardağı koyabilirsiniz.' },
        { user: userId2, q: 'Farklı renk seçenekleri var mı? Yeşil tonlarında olabilir mi?', a: null },
      ]
    },
  ];

  for (const group of questions) {
    const productId = pm[group.product_slug];
    if (!productId) { console.log(`  [SKIP] Ürün bulunamadı: ${group.product_slug}`); continue; }

    // Zaten sorusu varsa atla
    const { rows: existing } = await pool.query(
      'SELECT COUNT(*) FROM product_questions WHERE product_id = $1', [productId]
    );
    if (parseInt(existing[0].count) > 0) {
      console.log(`  [SKIP] ${group.product_slug} — zaten soruları var`);
      continue;
    }

    for (const item of group.items) {
      const { rows } = await pool.query(
        `INSERT INTO product_questions (product_id, user_id, question_text, is_visible)
         VALUES ($1, $2, $3, true) RETURNING id`,
        [productId, item.user, item.q]
      );

      if (item.a && adminId) {
        await pool.query(
          `UPDATE product_questions SET answer_text = $1, answered_by = $2, answered_at = NOW() WHERE id = $3`,
          [item.a, adminId, rows[0].id]
        );
      }
    }
    console.log(`  [OK] ${group.product_slug} — ${group.items.length} soru`);
  }

  console.log('Örnek sorular eklendi.');
}

async function seedReviews() {
  console.log('Örnek yorumlar ekleniyor...');

  // Seed kullanıcılarını al
  const { rows: seedUsers } = await pool.query(`
    INSERT INTO users (firebase_uid, email, display_name, role) VALUES
      ('seed_user_003', 'zeynep@example.com', 'Zeynep Demir', 'customer'),
      ('seed_user_004', 'ali@example.com', 'Ali Öztürk', 'customer'),
      ('seed_user_005', 'elif@example.com', 'Elif Arslan', 'customer')
    ON CONFLICT (firebase_uid) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING id
  `);

  const { rows: existingUsers } = await pool.query(
    "SELECT id, display_name FROM users WHERE firebase_uid IN ('seed_user_001','seed_user_002','seed_user_003','seed_user_004','seed_user_005')"
  );
  const userIds = existingUsers.map(u => u.id);

  if (userIds.length < 2) {
    console.log('  [SKIP] Yeterli kullanıcı bulunamadı.');
    return;
  }

  const { rows: products } = await pool.query('SELECT id, slug FROM products');
  const pm = {};
  products.forEach(p => (pm[p.slug] = p.id));

  const reviewData = [
    {
      product_slug: 'orman-manzarasi-ahsap-tablo',
      items: [
        { user: 0, rating: 5, comment: 'Harika bir tablo! Ahşap dokusu gerçekten çok güzel, oturma odamıza harika uydu. Lazer baskı kalitesi beklediğimden çok daha iyi çıktı.', reply: 'Güzel yorumunuz için çok teşekkür ederiz! Keyifle kullanmanız dileğiyle.', images: ['https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&h=400&fit=crop'] },
        { user: 1, rating: 4, comment: 'Genel olarak memnunum, renkleri çok doğal görünüyor. Sadece kargoda küçük bir çizik oluşmuş ama ürün kalitesi gayet iyi.', reply: 'Kargo sürecindeki aksaklık için özür dileriz. Size yeni bir ürün gönderebiliriz, lütfen müşteri hizmetlerimize ulaşın.' },
        { user: 2, rating: 5, comment: 'Annemin doğum gününe aldım, bayıldı! Paketleme de çok özenli ve şıktı. Teşekkürler Poiwood.', reply: null, images: ['https://images.unsplash.com/photo-1582053433976-25c00369fc93?w=400&h=400&fit=crop'] },
        { user: 3, rating: 4, comment: 'İkinci kez alıyorum, bu sefer yatak odası için. Kalite tutarlı, memnunum.', reply: null },
      ]
    },
    {
      product_slug: 'deniz-feneri-ahsap-tablo',
      items: [
        { user: 1, rating: 5, comment: 'Gün batımı renkleri ahşap üzerinde inanılmaz duruyor. Misafirlerimiz her geldiğinde soruyor nereden aldığımızı!', reply: 'Çok teşekkürler! Misafirlerinize de selamlarımızı iletin.', images: ['https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=400&h=400&fit=crop'] },
        { user: 3, rating: 3, comment: 'Ürün güzel ama beklediğimden biraz küçük geldi. Boyut bilgilerini daha dikkatli okumam gerekirmiş.', reply: 'Değerli yorumunuz için teşekkürler. Sipariş öncesi boyut bilgilerine dikkat edilmesini öneriyoruz, iade sürecinde size yardımcı olabiliriz.' },
        { user: 4, rating: 5, comment: 'Yazlık eve aldım, deniz teması ile mükemmel uyum sağladı. Ahşabın kokusu da çok güzel.', reply: null },
      ]
    },
    {
      product_slug: 'geometrik-desen-ahsap-tablo',
      items: [
        { user: 0, rating: 5, comment: 'Ofisimde duvarıma astım, minimalist tasarımı tam istediğim gibiydi. Profesyonel bir görünüm katıyor.', reply: 'Ofisinizde güzel durduğuna sevindik! Kurumsal siparişlerde indirimlerimiz de mevcut.', images: ['https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop'] },
        { user: 2, rating: 4, comment: 'Tasarımı çok şık, modern evlere çok yakışıyor. Tek eksik duvara montaj vidaları kutuda yoktu.', reply: 'Geri bildiriminiz için teşekkürler! Montaj aparatı konusunu inceliyoruz, bir sonraki siparişinizde eklemiş olacağız.' },
      ]
    },
    {
      product_slug: 'ahsap-sunum-tahtasi',
      items: [
        { user: 2, rating: 5, comment: 'Ceviz ağacının doğal dokusu muhteşem. Peynir tabağı olarak kullanıyoruz, misafirler çok beğeniyor.', reply: null, images: ['https://images.unsplash.com/photo-1607877361964-d8afca04e3a7?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400&h=400&fit=crop'] },
        { user: 4, rating: 5, comment: 'Düğün hediyesi olarak aldım, çok beğenildi. Kaliteli ve şık bir hediye arayanlar için ideal.', reply: 'Mutlu günlerinizde tercih ettiğiniz için teşekkürler!' },
        { user: 0, rating: 4, comment: 'Güzel ürün, sadece boyutu düşündüğümden biraz küçüktü. Ama kalitesi tartışılmaz.', reply: null },
      ]
    },
    {
      product_slug: 'ahsap-anahtar-askisi',
      items: [
        { user: 3, rating: 5, comment: 'Giriş holümüzün yıldızı oldu! 5 kancası da çok sağlam, üzerine araba anahtarı bile asabiliyorsunuz.', reply: 'Beğenmenize çok sevindik!' },
        { user: 1, rating: 4, comment: 'Tasarımı güzel ve kullanışlı. Montajı da çok kolaydı, 10 dakikada hallettim.', reply: null },
      ]
    },
    {
      product_slug: 'kisiye-ozel-bebek-dogum-panosu',
      items: [
        { user: 4, rating: 5, comment: 'Kızımın doğum bilgileriyle yaptırdık, odasında harika duruyor! Lazer kazıma çok temiz ve okunaklı.', reply: 'Minik prensesinize sağlıklı günler dileriz! Yorumunuz için teşekkürler.', images: ['https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop'] },
        { user: 0, rating: 5, comment: 'Baby shower hediyesi olarak aldım, anne adayı çok duygulandı. Kesinlikle farklı ve anlamlı bir hediye.', reply: null },
        { user: 2, rating: 4, comment: 'Çok tatlı bir ürün. Sadece yazı fontu seçeneği olsa daha iyi olurdu ama yine de çok memnunum.', reply: 'Font seçeneği önerinizi not ettik, ilerleyen dönemde eklemeyi planlıyoruz. Teşekkürler!' },
      ]
    },
    {
      product_slug: 'epoksi-ceviz-bardak-altligi',
      items: [
        { user: 1, rating: 5, comment: 'Okyanus mavisi epoksi gerçekten çok güzel! Her biri birbirinden farklı desende, el yapımı olduğu belli.', reply: null, images: ['https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=400&h=400&fit=crop'] },
        { user: 3, rating: 4, comment: 'Çok şık görünüyor, sehpamızda dekoratif olarak da kullanıyoruz. Fiyat-performans olarak gayet iyi.', reply: 'Güzel yorumunuz için teşekkürler! Farklı renk seçeneklerimiz de yakında gelecek.' },
      ]
    },
    {
      product_slug: 'minimalist-dag-etekleri-ahsap-tablo',
      items: [
        { user: 0, rating: 5, comment: '3D katmanlı efekt gerçekten çok etkileyici! İskandinav dekorasyonumuza biçilmiş kaftan. Boyutu da tam istediğim gibi.', reply: 'Harika bir tercih yapmışsınız! İskandinav temasıyla mükemmel uyum sağladığına sevindik.', images: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&h=400&fit=crop'] },
        { user: 4, rating: 5, comment: 'Bu tabloya bayıldım, farklı açılardan baktıkça farklı detaylar keşfediyorsunuz. Gerçek bir sanat eseri.', reply: null },
        { user: 2, rating: 4, comment: 'Çok güzel ama kargo biraz uzun sürdü. Ürünün kendisi mükemmel kalitede.', reply: 'Kargo süreciyle ilgili geri bildiriminiz için teşekkürler, lojistik partnerimizle bu konuyu değerlendiriyoruz.' },
      ]
    },
  ];

  for (const group of reviewData) {
    const productId = pm[group.product_slug];
    if (!productId) { console.log(`  [SKIP] Ürün bulunamadı: ${group.product_slug}`); continue; }

    const { rows: existing } = await pool.query(
      'SELECT COUNT(*) FROM reviews WHERE product_id = $1', [productId]
    );
    if (parseInt(existing[0].count) > 0) {
      console.log(`  [SKIP] ${group.product_slug} — zaten yorumları var`);
      continue;
    }

    for (const item of group.items) {
      const userId = userIds[item.user % userIds.length];
      const { rows } = await pool.query(
        `INSERT INTO reviews (product_id, user_id, rating, comment, is_approved)
         VALUES ($1, $2, $3, $4, true) RETURNING id`,
        [productId, userId, item.rating, item.comment]
      );

      if (item.reply) {
        const { rows: admins } = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        if (admins[0]) {
          await pool.query(
            'UPDATE reviews SET admin_reply = $1 WHERE id = $2',
            [item.reply, rows[0].id]
          );
        }
      }

      // Yorum fotoğrafları
      if (item.images?.length) {
        for (let idx = 0; idx < item.images.length; idx++) {
          await pool.query(
            `INSERT INTO review_images (review_id, firebase_url, storage_path, display_order)
             VALUES ($1, $2, $3, $4)`,
            [rows[0].id, item.images[idx], `seeds/reviews/${rows[0].id}/${idx}.jpg`, idx]
          );
        }
      }
    }
    console.log(`  [OK] ${group.product_slug} — ${group.items.length} yorum`);
  }

  console.log('Örnek yorumlar eklendi.');
}

/* ============================================================
   SEED ORDERS — Test kullanıcısı için siparişler
   ============================================================ */
async function seedOrders() {
  console.log('Örnek siparişler ekleniyor...');

  const TEST_USER_ID = 'cffe2565-73b3-4a9d-bc96-ad325eba2aa1';

  // Kullanıcı var mı kontrol et
  const { rows: userCheck } = await pool.query('SELECT id FROM users WHERE id = $1', [TEST_USER_ID]);
  if (!userCheck[0]) {
    console.log('  [SKIP] Test kullanıcısı bulunamadı.');
    return;
  }

  // Zaten sipariş var mı
  const { rows: existingOrders } = await pool.query(
    'SELECT COUNT(*) FROM orders WHERE user_id = $1', [TEST_USER_ID]
  );
  if (parseInt(existingOrders[0].count) > 0) {
    console.log('  [SKIP] Siparişler zaten mevcut.');
    return;
  }

  const { rows: products } = await pool.query('SELECT id, name, base_price, slug FROM products LIMIT 6');
  const { rows: images } = await pool.query(
    `SELECT pi.product_id, pi.firebase_url FROM product_images pi WHERE pi.is_primary = true`
  );
  const imgMap = {};
  images.forEach(i => (imgMap[i.product_id] = i.firebase_url));

  if (products.length < 3) {
    console.log('  [SKIP] Yeterli ürün yok.');
    return;
  }

  const orders = [
    {
      order_number: 'POI-20260315-A1B2',
      status: 'delivered',
      shipping_name: 'Elif Test', shipping_phone: '05551234567',
      shipping_address: 'Caferağa Mah. Moda Cad. No:12/3', shipping_city: 'İstanbul', shipping_district: 'Kadıköy', shipping_zip: '34710',
      cargo_company: 'Yurtiçi Kargo', cargo_tracking_no: 'YK123456789',
      items: [
        { product_idx: 0, quantity: 1 },
        { product_idx: 1, quantity: 2 },
      ],
      created_at: "2026-03-15 10:30:00+03",
    },
    {
      order_number: 'POI-20260320-C3D4',
      status: 'shipped',
      shipping_name: 'Elif Test', shipping_phone: '05551234567',
      shipping_address: 'Caferağa Mah. Moda Cad. No:12/3', shipping_city: 'İstanbul', shipping_district: 'Kadıköy', shipping_zip: '34710',
      cargo_company: 'Aras Kargo', cargo_tracking_no: 'AR987654321',
      items: [
        { product_idx: 2, quantity: 1 },
      ],
      created_at: "2026-03-20 14:15:00+03",
    },
    {
      order_number: 'POI-20260327-E5F6',
      status: 'pending',
      shipping_name: 'Elif Test', shipping_phone: '05551234567',
      shipping_address: 'Fenerbahçe Mah. Bağdat Cad. No:45/A', shipping_city: 'İstanbul', shipping_district: 'Kadıköy', shipping_zip: '34726',
      items: [
        { product_idx: 3, quantity: 1 },
        { product_idx: 4, quantity: 1 },
        { product_idx: 0, quantity: 1 },
      ],
      created_at: "2026-03-27 09:00:00+03",
    },
  ];

  for (const o of orders) {
    const orderItems = o.items.map(i => {
      const p = products[i.product_idx];
      return { ...i, product: p, unit_price: parseFloat(p.base_price) };
    });

    const subtotal = orderItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const shippingFee = subtotal >= 500 ? 0 : 49.90;
    const totalAmount = subtotal + shippingFee;

    const { rows: [order] } = await pool.query(
      `INSERT INTO orders (order_number, user_id, status,
        shipping_name, shipping_phone, shipping_address, shipping_city, shipping_district, shipping_zip,
        subtotal, shipping_fee, total_amount,
        cargo_company, cargo_tracking_no, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)
       ON CONFLICT (order_number) DO NOTHING
       RETURNING id`,
      [o.order_number, TEST_USER_ID, o.status,
       o.shipping_name, o.shipping_phone, o.shipping_address, o.shipping_city, o.shipping_district, o.shipping_zip,
       subtotal.toFixed(2), shippingFee.toFixed(2), totalAmount.toFixed(2),
       o.cargo_company || null, o.cargo_tracking_no || null, o.created_at]
    );

    if (!order) continue;

    for (const item of orderItems) {
      const totalPrice = item.unit_price * item.quantity;
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image_url, quantity, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [order.id, item.product.id, item.product.name, imgMap[item.product.id] || null,
         item.quantity, item.unit_price.toFixed(2), totalPrice.toFixed(2)]
      );
    }

    console.log(`  [OK] ${o.order_number} — ${o.status}`);
  }

  // İlk sipariş (delivered) için yorum ekle — test kullanıcısından
  const { rows: deliveredOrder } = await pool.query(
    "SELECT id FROM orders WHERE order_number = 'POI-20260315-A1B2'"
  );
  if (deliveredOrder[0]) {
    const p = products[0];
    await pool.query(
      `INSERT INTO reviews (user_id, product_id, order_id, rating, comment, is_approved)
       VALUES ($1, $2, $3, 5, 'Harika bir ürün! Çok memnun kaldım, kalite ve renkleri muhteşem. Kesinlikle tavsiye ediyorum.', true)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [TEST_USER_ID, p.id, deliveredOrder[0].id]
    );
    console.log('  [OK] Test kullanıcısı yorumu eklendi (delivered sipariş)');
  }

  console.log('Örnek siparişler eklendi.');
}

async function run() {
  try {
    await seedCategories();
    await seedProducts();
    await seedProductImages();
    await seedQuestions();
    await seedReviews();
    await seedOrders();
    console.log('\nSeed tamamlandı!');
  } catch (err) {
    console.error('Seed hatası:', err);
  } finally {
    await pool.end();
  }
}

run();
