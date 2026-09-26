'use strict';
/* =========================================================
   db.js — Cơ sở dữ liệu SQLite
   Bảng: shops, users, sessions, products, partners,
         batches, batch_items, batch_costs, imports, sells, money, payments
   ========================================================= */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'qlbh.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  tax_code TEXT NOT NULL DEFAULT '',
  slogan TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  display TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'owner',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_shop ON users(shop_id);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  code TEXT NOT NULL DEFAULT '',
  name_vi TEXT NOT NULL DEFAULT '',
  name_zh TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  cost REAL NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  min_stock REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
CREATE TABLE IF NOT EXISTS partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'customer',
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_partners_shop ON partners(shop_id, kind);

/* ===== LÔ HÀNG ===== */
CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  code TEXT NOT NULL DEFAULT '',
  partner_id INTEGER,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  note TEXT NOT NULL DEFAULT '',
  stock_in INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_batches_shop ON batches(shop_id);

CREATE TABLE IF NOT EXISTS batch_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  qty REAL NOT NULL DEFAULT 0,
  cost REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bitems_batch ON batch_items(batch_id);

CREATE TABLE IF NOT EXISTS batch_costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'goods',
  label TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  paid INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bcosts_batch ON batch_costs(batch_id);

CREATE TABLE IF NOT EXISTS imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  partner_id INTEGER,
  qty REAL NOT NULL DEFAULT 0,
  cost REAL NOT NULL DEFAULT 0,
  supplier TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_imports_shop ON imports(shop_id);
CREATE TABLE IF NOT EXISTS sells (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  partner_id INTEGER,
  items TEXT NOT NULL DEFAULT '[]',
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  customer TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  adjust INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sells_shop ON sells(shop_id);
CREATE TABLE IF NOT EXISTS money (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  amount REAL NOT NULL DEFAULT 0,
  descr TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  user_id INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_money_shop ON money(shop_id);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  partner_id INTEGER,
  ref_type TEXT NOT NULL DEFAULT 'sell',
  ref_id INTEGER,
  amount REAL NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  user_id INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_shop ON payments(shop_id, ref_type);
`);

function hasColumn(t, c) {
  return db.prepare('PRAGMA table_info(' + t + ')').all().some(function (x) { return x.name === c; });
}
try {
  ['phone', 'address', 'tax_code', 'slogan'].forEach(function (c) {
    if (!hasColumn('shops', c)) db.exec("ALTER TABLE shops ADD COLUMN " + c + " TEXT NOT NULL DEFAULT ''");
  });
} catch (e) { console.warn('[migrate]', e.message); }

/* ===== SHOPS ===== */
const Shops = {
  create: function (name, cur) {
    const r = db.prepare('INSERT INTO shops (name,currency,created_at) VALUES (?,?,?)').run(name, cur || 'VND', Date.now());
    return Shops.get(r.lastInsertRowid);
  },
  get: function (id) { return db.prepare('SELECT * FROM shops WHERE id=?').get(id) || null; },
  update: function (id, p) {
    const s = Shops.get(id); if (!s) return null;
    db.prepare('UPDATE shops SET name=?,currency=?,phone=?,address=?,tax_code=?,slogan=? WHERE id=?')
      .run(p.name !== undefined ? p.name : s.name, p.currency !== undefined ? p.currency : s.currency,
        p.phone !== undefined ? p.phone : s.phone, p.address !== undefined ? p.address : s.address,
        p.tax_code !== undefined ? p.tax_code : s.tax_code, p.slogan !== undefined ? p.slogan : s.slogan, id);
    return Shops.get(id);
  }
};

/* ===== USERS ===== */
const Users = {
  create: function (sid, un, hash, disp, role) {
    const r = db.prepare('INSERT INTO users (shop_id,username,password,display,role,active,created_at) VALUES (?,?,?,?,?,1,?)')
      .run(sid, un, hash, disp || un, role || 'owner', Date.now());
    return Users.get(r.lastInsertRowid);
  },
  get: function (id) { return db.prepare('SELECT * FROM users WHERE id=?').get(id) || null; },
  byUsername: function (u) { return db.prepare('SELECT * FROM users WHERE username=? COLLATE NOCASE').get(u) || null; },
  listByShop: function (sid) {
    return db.prepare('SELECT id,shop_id,username,display,role,active,created_at FROM users WHERE shop_id=? ORDER BY id').all(sid);
  },
  update: function (id, p) {
    const u = Users.get(id); if (!u) return null;
    db.prepare('UPDATE users SET display=?,role=?,active=? WHERE id=?')
      .run(p.display !== undefined ? p.display : u.display, p.role !== undefined ? p.role : u.role,
        p.active !== undefined ? (p.active ? 1 : 0) : u.active, id);
    return Users.get(id);
  },
  setPassword: function (id, h) { db.prepare('UPDATE users SET password=? WHERE id=?').run(h, id); },
  remove: function (id) { db.prepare('DELETE FROM users WHERE id=?').run(id); },
  countByRole: function (sid, role) {
    const r = db.prepare('SELECT COUNT(*) AS c FROM users WHERE shop_id=? AND role=? AND active=1').get(sid, role);
    return r ? r.c : 0;
  }
};

/* ===== SESSIONS ===== */
const Sessions = {
  create: function (tk, uid, days) {
    const now = Date.now(), exp = now + (days || 30) * 86400000;
    db.prepare('INSERT INTO sessions (token,user_id,created_at,expires_at) VALUES (?,?,?,?)').run(tk, uid, now, exp);
    return { token: tk };
  },
  get: function (tk) {
    const s = db.prepare('SELECT * FROM sessions WHERE token=?').get(tk);
    if (!s) return null;
    if (s.expires_at < Date.now()) { Sessions.remove(tk); return null; }
    return s;
  },
  remove: function (tk) { db.prepare('DELETE FROM sessions WHERE token=?').run(tk); },
  removeByUser: function (uid) { db.prepare('DELETE FROM sessions WHERE user_id=?').run(uid); },
  clean: function () { db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now()); }
};

/* ===== PRODUCTS ===== */
const Products = {
  list: function (sid) { return db.prepare('SELECT * FROM products WHERE shop_id=? ORDER BY code,id').all(sid); },
  get: function (sid, id) { return db.prepare('SELECT * FROM products WHERE id=? AND shop_id=?').get(id, sid) || null; },
  byCode: function (sid, code) {
    if (!code) return null;
    return db.prepare('SELECT * FROM products WHERE shop_id=? AND LOWER(code)=LOWER(?)').get(sid, String(code).trim()) || null;
  },
  create: function (sid, p) {
    const r = db.prepare('INSERT INTO products (shop_id,code,name_vi,name_zh,unit,cost,price,min_stock,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(sid, p.code || '', p.name_vi || '', p.name_zh || '', p.unit || '',
        Number(p.cost) || 0, Number(p.price) || 0, Number(p.min_stock) || 0, Date.now());
    return Products.get(sid, r.lastInsertRowid);
  },
  update: function (sid, id, p) {
    const c = Products.get(sid, id); if (!c) return null;
    db.prepare('UPDATE products SET code=?,name_vi=?,name_zh=?,unit=?,cost=?,price=?,min_stock=? WHERE id=? AND shop_id=?')
      .run(p.code !== undefined ? p.code : c.code, p.name_vi !== undefined ? p.name_vi : c.name_vi,
        p.name_zh !== undefined ? p.name_zh : c.name_zh, p.unit !== undefined ? p.unit : c.unit,
        p.cost !== undefined ? Number(p.cost) || 0 : c.cost, p.price !== undefined ? Number(p.price) || 0 : c.price,
        p.min_stock !== undefined ? Number(p.min_stock) || 0 : c.min_stock, id, sid);
    return Products.get(sid, id);
  },
  remove: function (sid, id) { db.prepare('DELETE FROM products WHERE id=? AND shop_id=?').run(id, sid); },
  setCost: function (sid, id, cost) {
    if (cost > 0) db.prepare('UPDATE products SET cost=? WHERE id=? AND shop_id=?').run(Math.round(cost), id, sid);
  }
};

/* ===== PARTNERS ===== */
const Partners = {
  list: function (sid, kind) {
    if (kind) return db.prepare('SELECT * FROM partners WHERE shop_id=? AND kind=? ORDER BY name').all(sid, kind);
    return db.prepare('SELECT * FROM partners WHERE shop_id=? ORDER BY kind,name').all(sid);
  },
  get: function (sid, id) { return db.prepare('SELECT * FROM partners WHERE id=? AND shop_id=?').get(id, sid) || null; },
  findByName: function (sid, kind, name) {
    return db.prepare('SELECT * FROM partners WHERE shop_id=? AND kind=? AND name=? COLLATE NOCASE').get(sid, kind, String(name || '').trim()) || null;
  },
  create: function (sid, p) {
    const r = db.prepare('INSERT INTO partners (shop_id,kind,name,phone,address,note,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(sid, p.kind === 'supplier' ? 'supplier' : 'customer', String(p.name || '').trim(),
        String(p.phone || '').trim(), String(p.address || '').trim(), String(p.note || '').trim(), Date.now());
    return Partners.get(sid, r.lastInsertRowid);
  },
  update: function (sid, id, p) {
    const c = Partners.get(sid, id); if (!c) return null;
    db.prepare('UPDATE partners SET name=?,phone=?,address=?,note=? WHERE id=? AND shop_id=?')
      .run(p.name !== undefined ? String(p.name).trim() : c.name, p.phone !== undefined ? String(p.phone).trim() : c.phone,
        p.address !== undefined ? String(p.address).trim() : c.address, p.note !== undefined ? String(p.note).trim() : c.note, id, sid);
    return Partners.get(sid, id);
  },
  remove: function (sid, id) { db.prepare('DELETE FROM partners WHERE id=? AND shop_id=?').run(id, sid); },
  ensure: function (sid, kind, name, phone) {
    const n = String(name || '').trim(); if (!n) return null;
    const ex = Partners.findByName(sid, kind, n); if (ex) return ex.id;
    return Partners.create(sid, { kind: kind, name: n, phone: phone || '' }).id;
  }
};

/* =========================================================
   BATCHES — Lô hàng (nhập kho theo lô, tích luỹ chi phí)
   ========================================================= */
const Batches = {
  _parse: function (r) { return r ? Object.assign({}, r, { open: r.status !== 'closed' }) : null; },

  list: function (sid, lim) {
    return db.prepare('SELECT * FROM batches WHERE shop_id=? ORDER BY created_at DESC LIMIT ?')
      .all(sid, lim || 300).map(function (r) {
        var b = Batches._parse(r);
        b.items = db.prepare('SELECT * FROM batch_items WHERE batch_id=? ORDER BY id').all(b.id);
        b.costs = db.prepare('SELECT * FROM batch_costs WHERE batch_id=? ORDER BY date ASC, id ASC').all(b.id);
        b.summary = Batches.summary(sid, b.id);
        return b;
      });
  },

  get: function (sid, id) {
    const r = db.prepare('SELECT * FROM batches WHERE id=? AND shop_id=?').get(id, sid);
    if (!r) return null;
    const b = Batches._parse(r);
    b.items = db.prepare('SELECT * FROM batch_items WHERE batch_id=? ORDER BY id').all(id);
    b.costs = db.prepare('SELECT * FROM batch_costs WHERE batch_id=? ORDER BY date ASC, id ASC').all(id);
    b.summary = Batches.summary(sid, id);
    return b;
  },

  nextCode: function (sid) {
    const y = new Date().getFullYear();
    const r = db.prepare("SELECT COUNT(*) AS c FROM batches WHERE shop_id=?").get(sid);
    const n = (r ? r.c : 0) + 1;
    return 'LO-' + y + '-' + String(n).padStart(3, '0');
  },

  /* Tính tổng kết lô: tiền hàng, phí theo loại, giá vốn, đã trả, còn nợ, giá vốn từng SP */
  summary: function (sid, id) {
    const items = db.prepare('SELECT * FROM batch_items WHERE batch_id=? ORDER BY id').all(id);
    const costs = db.prepare('SELECT * FROM batch_costs WHERE batch_id=? ORDER BY date ASC, id ASC').all(id);

    const goodsTotal = items.reduce(function (s, it) { return s + (Number(it.qty) || 0) * (Number(it.cost) || 0); }, 0);

    /* Chi phí KHÔNG phải tiền hàng => phân bổ vào giá vốn */
    const extraCosts = costs.filter(function (c) { return c.kind !== 'goods'; });
    const extraTotal = extraCosts.reduce(function (s, c) { return s + (Number(c.amount) || 0); }, 0);

    /* Tiền đã trả: tất cả khoản có paid=1 */
    const paidTotal = costs.filter(function (c) { return c.paid; })
      .reduce(function (s, c) { return s + (Number(c.amount) || 0); }, 0);

    /* Tổng giá trị các khoản đã ghi (kể cả tiền hàng đã ghi) */
    const allCostTotal = costs.reduce(function (s, c) { return s + (Number(c.amount) || 0); }, 0);

    /* Giá vốn lô = tiền hàng + chi phí phụ */
    const capitalTotal = goodsTotal + extraTotal;

    /* Phân bổ theo GIÁ TRỊ từng mặt hàng */
    const perItem = items.map(function (it) {
      var value = (Number(it.qty) || 0) * (Number(it.cost) || 0);
      var share = goodsTotal > 0 ? (value / goodsTotal) : 0;
      var allocated = extraTotal * share;
      var itemCapital = value + allocated;
      var unitCost = (Number(it.qty) || 0) > 0 ? (itemCapital / Number(it.qty)) : 0;
      return {
        item: it,
        productId: it.product_id,
        qty: Number(it.qty) || 0,
        cost: Number(it.cost) || 0,
        goodsValue: Math.round(value),
        share: share,
        allocated: Math.round(allocated),
        capital: Math.round(itemCapital),
        unitCost: Math.round(unitCost)
      };
    });

    /* Còn nợ = giá vốn lô - đã trả (theo giá vốn, không theo khoản ghi) */
    const debt = Math.max(0, capitalTotal - paidTotal);

    return {
      goodsTotal: Math.round(goodsTotal),
      extraTotal: Math.round(extraTotal),
      extraCosts: extraCosts,
      paidTotal: Math.round(paidTotal),
      allCostTotal: Math.round(allCostTotal),
      capitalTotal: Math.round(capitalTotal),
      debt: Math.round(debt),
      perItem: perItem,
      itemCount: items.length,
      totalQty: items.reduce(function (s, it) { return s + (Number(it.qty) || 0); }, 0)
    };
  },

  create: function (sid, r) {
    const code = String(r.code || '').trim() || Batches.nextCode(sid);
    const i = db.prepare('INSERT INTO batches (shop_id,code,partner_id,date,status,note,stock_in,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(sid, code, r.partner_id || null, r.date, r.status || 'open', r.note || '', 0, Date.now());
    return Batches.get(sid, i.lastInsertRowid);
  },

  addItem: function (sid, batchId, it) {
    const b = Batches.get(sid, batchId); if (!b) return null;
    db.prepare('INSERT INTO batch_items (batch_id,product_id,qty,cost,created_at) VALUES (?,?,?,?,?)')
      .run(batchId, it.product_id, Number(it.qty) || 0, Number(it.cost) || 0, Date.now());
    return Batches.get(sid, batchId);
  },

  removeItem: function (sid, batchId, itemId) {
    db.prepare('DELETE FROM batch_items WHERE id=? AND batch_id=?').run(itemId, batchId);
    return Batches.get(sid, batchId);
  },

  addCost: function (sid, batchId, c) {
    const b = Batches.get(sid, batchId); if (!b) return null;
    db.prepare('INSERT INTO batch_costs (batch_id,kind,label,amount,date,paid,note,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(batchId, c.kind || 'goods', c.label || '', Number(c.amount) || 0, c.date, c.paid ? 1 : 0, c.note || '', Date.now());
    return Batches.get(sid, batchId);
  },

  removeCost: function (sid, batchId, costId) {
    db.prepare('DELETE FROM batch_costs WHERE id=? AND batch_id=?').run(costId, batchId);
    return Batches.get(sid, batchId);
  },

  update: function (sid, id, p) {
    const b = Batches.get(sid, id); if (!b) return null;
    db.prepare('UPDATE batches SET partner_id=?,date=?,status=?,note=? WHERE id=? AND shop_id=?')
      .run(p.partner_id !== undefined ? p.partner_id : b.partner_id,
        p.date !== undefined ? p.date : b.date,
        p.status !== undefined ? p.status : b.status,
        p.note !== undefined ? p.note : b.note, id, sid);
    return Batches.get(sid, id);
  },

  remove: function (sid, id) { db.prepare('DELETE FROM batches WHERE id=? AND shop_id=?').run(id, sid); },

  /* Cập nhật giá vốn bình quân cho tất cả sản phẩm có trong lô */
  applyCost: function (sid, id) {
    const b = Batches.get(sid, id); if (!b) return;
    b.summary.perItem.forEach(function (x) {
      if (x.unitCost > 0) Products.setCost(sid, x.productId, x.unitCost);
    });
    db.prepare('UPDATE batches SET stock_in=1 WHERE id=? AND shop_id=?').run(id, sid);
  },

  /* Giá vốn bình quân của 1 sản phẩm (từ các lô đã nhập kho) */
  avgCost: function (sid, productId) {
    const rows = db.prepare(`
      SELECT bi.qty, bi.cost, b.id AS batch_id
      FROM batch_items bi JOIN batches b ON b.id = bi.batch_id
      WHERE b.shop_id=? AND bi.product_id=? AND b.stock_in=1
    `).all(sid, productId);
    var totalQty = 0, totalValue = 0;
    rows.forEach(function (r) {
      var s = Batches.summary(sid, r.batch_id);
      var pi = s.perItem.filter(function (x) { return Number(x.productId) === Number(productId); })[0];
      if (pi) { totalQty += pi.qty; totalValue += pi.capital; }
    });
    return totalQty > 0 ? Math.round(totalValue / totalQty) : 0;
  }
};

/* ===== IMPORTS (nhập kho trực tiếp, không theo lô) ===== */
const Imports = {
  list: function (sid, lim) { return db.prepare('SELECT * FROM imports WHERE shop_id=? ORDER BY created_at DESC LIMIT ?').all(sid, lim || 500); },
  get: function (sid, id) { return db.prepare('SELECT * FROM imports WHERE id=? AND shop_id=?').get(id, sid) || null; },
  create: function (sid, r) {
    const i = db.prepare('INSERT INTO imports (shop_id,product_id,partner_id,qty,cost,supplier,date,note,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(sid, r.product_id, r.partner_id || null, Number(r.qty) || 0, Number(r.cost) || 0, r.supplier || '', r.date, r.note || '', Date.now());
    return Imports.get(sid, i.lastInsertRowid);
  },
  remove: function (sid, id) { db.prepare('DELETE FROM imports WHERE id=? AND shop_id=?').run(id, sid); },
  sumQtyByProduct: function (sid) {
    const rows = db.prepare('SELECT product_id,SUM(qty) AS q FROM imports WHERE shop_id=? GROUP BY product_id').all(sid);
    const m = {}; rows.forEach(function (r) { m[r.product_id] = Number(r.q) || 0; }); return m;
  }
};

/* ===== SELLS ===== */
const Sells = {
  list: function (sid, lim) {
    return db.prepare('SELECT * FROM sells WHERE shop_id=? ORDER BY created_at DESC LIMIT ?').all(sid, lim || 500).map(Sells._p);
  },
  get: function (sid, id) {
    const r = db.prepare('SELECT * FROM sells WHERE id=? AND shop_id=?').get(id, sid);
    return r ? Sells._p(r) : null;
  },
  _p: function (r) {
    if (!r) return null;
    var items = []; try { items = JSON.parse(r.items || '[]'); } catch (e) { items = []; }
    return Object.assign({}, r, { items: items, adjust: !!r.adjust });
  },
  create: function (sid, r, uid) {
    var items = (r.items || []).map(function (it) {
      return { productId: it.productId, qty: Number(it.qty) || 0, price: Number(it.price) || 0, cost: Number(it.cost) || 0 };
    });
    var sub = items.reduce(function (s, it) { return s + it.qty * it.price; }, 0);
    var disc = Number(r.discount) || 0, total = Math.max(0, sub - disc);
    var i = db.prepare('INSERT INTO sells (shop_id,partner_id,items,subtotal,discount,total,customer,date,note,adjust,user_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(sid, r.partner_id || null, JSON.stringify(items), sub, disc, total, r.customer || '', r.date, r.note || '', r.adjust ? 1 : 0, uid || null, Date.now());
    return Sells.get(sid, i.lastInsertRowid);
  },
  remove: function (sid, id) { db.prepare('DELETE FROM sells WHERE id=? AND shop_id=?').run(id, sid); },
  sumQtyByProduct: function (sid) {
    const rows = db.prepare('SELECT items FROM sells WHERE shop_id=?').all(sid);
    const m = {};
    rows.forEach(function (r) {
      var items = []; try { items = JSON.parse(r.items || '[]'); } catch (e) { items = []; }
      items.forEach(function (it) { m[it.productId] = (m[it.productId] || 0) + (Number(it.qty) || 0); });
    });
    return m;
  }
};

/* ===== MONEY ===== */
const Money = {
  list: function (sid, lim) { return db.prepare('SELECT * FROM money WHERE shop_id=? ORDER BY created_at DESC LIMIT ?').all(sid, lim || 500); },
  create: function (sid, r, uid) {
    const i = db.prepare('INSERT INTO money (shop_id,type,category,amount,descr,date,user_id,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(sid, r.type === 'out' ? 'out' : 'in', r.category || 'other', Number(r.amount) || 0, r.descr || '', r.date, uid || null, Date.now());
    return db.prepare('SELECT * FROM money WHERE id=?').get(i.lastInsertRowid);
  },
  remove: function (sid, id) { db.prepare('DELETE FROM money WHERE id=? AND shop_id=?').run(id, sid); }
};

/* ===== PAYMENTS ===== */
const Payments = {
  list: function (sid, lim) { return db.prepare('SELECT * FROM payments WHERE shop_id=? ORDER BY created_at DESC LIMIT ?').all(sid, lim || 1500); },
  listByRef: function (sid, rt) { return db.prepare('SELECT * FROM payments WHERE shop_id=? AND ref_type=? ORDER BY created_at DESC').all(sid, rt); },
  get: function (sid, id) { return db.prepare('SELECT * FROM payments WHERE id=? AND shop_id=?').get(id, sid) || null; },
  create: function (sid, r, uid) {
    const i = db.prepare('INSERT INTO payments (shop_id,partner_id,ref_type,ref_id,amount,date,note,user_id,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(sid, r.partner_id || null, r.ref_type === 'import' ? 'import' : 'sell', r.ref_id || null,
        Number(r.amount) || 0, r.date, r.note || '', uid || null, Date.now());
    return Payments.get(sid, i.lastInsertRowid);
  },
  remove: function (sid, id) { db.prepare('DELETE FROM payments WHERE id=? AND shop_id=?').run(id, sid); }
};

/* ===== DEBTS ===== */
const Debts = {
  summary: function (sid, kind) {
    var isC = kind !== 'supplier', rt = isC ? 'sell' : 'import';
    var inv = isC
      ? db.prepare('SELECT partner_id,SUM(total) AS amount,COUNT(*) AS cnt FROM sells WHERE shop_id=? AND adjust=0 AND partner_id IS NOT NULL GROUP BY partner_id').all(sid)
      : db.prepare('SELECT partner_id,SUM(qty*cost) AS amount,COUNT(*) AS cnt FROM imports WHERE shop_id=? AND partner_id IS NOT NULL GROUP BY partner_id').all(sid);

    /* Với NCC: cộng từ lô hàng (nợ + đã trả) */
    var batchDebt = {};
    var batchCnt = {};
    var batchPaid = {};
    if (!isC) {
      db.prepare("SELECT id,partner_id FROM batches WHERE shop_id=? AND partner_id IS NOT NULL").all(sid).forEach(function (b) {
        var s = Batches.summary(sid, b.id);
        batchDebt[b.partner_id] = (batchDebt[b.partner_id] || 0) + s.debt;
        batchPaid[b.partner_id] = (batchPaid[b.partner_id] || 0) + s.paidTotal;
        batchCnt[b.partner_id] = (batchCnt[b.partner_id] || 0) + 1;
      });
    }

    var paid = db.prepare('SELECT partner_id,SUM(amount) AS paid FROM payments WHERE shop_id=? AND ref_type=? AND partner_id IS NOT NULL GROUP BY partner_id').all(sid, rt);
    var pm = {}; paid.forEach(function (r) { pm[r.partner_id] = Number(r.paid) || 0; });
    var ps = db.prepare('SELECT * FROM partners WHERE shop_id=? AND kind=? ORDER BY name').all(sid, isC ? 'customer' : 'supplier');

    var gT = 0, gP = 0, gD = 0;
    var list = ps.map(function (p) {
      var iv = inv.filter(function (x) { return x.partner_id === p.id; })[0];
      var total = iv ? (Number(iv.amount) || 0) : 0;
      var pd = (pm[p.id] || 0) + (isC ? 0 : (batchPaid[p.id] || 0));
      var bd = isC ? 0 : (batchDebt[p.id] || 0);
      var cnt = iv ? iv.cnt : 0;
      if (!isC) cnt += (batchCnt[p.id] || 0);
      var debt = isC ? (total - pd) : bd;
      if (!isC && bd === 0 && total > 0) debt = total - pd;
      gT += total; gP += pd; gD += debt;
      return { partner: p, total: Math.round(total), paid: Math.round(pd), debt: Math.round(debt), invoiceCount: cnt };
    });
    list.sort(function (a, b) { return b.debt - a.debt; });
    return { partners: list, grand: { total: Math.round(gT), paid: Math.round(gP), debt: Math.round(gD) } };
  },

  detail: function (sid, kind, pid) {
    var isC = kind !== 'supplier', rt = isC ? 'sell' : 'import';
    var rows = [];

    if (isC) {
      db.prepare('SELECT id,date,total AS amount,customer AS label FROM sells WHERE shop_id=? AND partner_id=? AND adjust=0 ORDER BY date ASC,id ASC').all(sid, pid)
        .forEach(function (r) { rows.push({ id: r.id, date: r.date, amount: r.amount, label: r.label, type: 'sell' }); });
      var sp = db.prepare('SELECT * FROM payments WHERE shop_id=? AND ref_type=? AND partner_id=? ORDER BY date ASC,id ASC').all(sid, rt, pid);
      var byRef = {};
      sp.forEach(function (p) { if (p.ref_id) { var k = Number(p.ref_id); if (!byRef[k]) byRef[k] = []; byRef[k].push(p); } });
      var list = rows.map(function (iv) {
        var ps = byRef[Number(iv.id)] || [];
        var on = ps.reduce(function (s, x) { return s + (Number(x.amount) || 0); }, 0);
        return Object.assign({}, iv, { paid: Math.round(on), debt: Math.round(Math.max(0, iv.amount - on)), payments: ps });
      });
      var tt = list.reduce(function (s, x) { return s + x.amount; }, 0);
      var tp = sp.reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0);
      return { partner: Partners.get(sid, pid), invoices: list, payments: sp,
        totals: { total: Math.round(tt), paid: Math.round(tp), debt: Math.round(Math.max(0, tt - tp)) } };
    }

    /* NCC: liệt kê lô hàng + phiếu nhập */
    var batchPaid = 0;
    db.prepare('SELECT * FROM batches WHERE shop_id=? AND partner_id=? ORDER BY date ASC,id ASC').all(sid, pid)
      .forEach(function (b) {
        var s = Batches.summary(sid, b.id);
        batchPaid += s.paidTotal;
        rows.push({ id: b.id, date: b.date, amount: s.capitalTotal, label: b.code + ' · ' + (b.note || ''), type: 'batch', batch: b, sum: s });
      });
    db.prepare('SELECT i.id,i.date,(i.qty*i.cost) AS amount,i.supplier AS label FROM imports i WHERE i.shop_id=? AND i.partner_id=? ORDER BY i.date ASC,i.id ASC').all(sid, pid)
      .forEach(function (r) { rows.push({ id: r.id, date: r.date, amount: r.amount, label: r.label, type: 'import' }); });

    var ip = db.prepare('SELECT * FROM payments WHERE shop_id=? AND ref_type=? AND partner_id=? ORDER BY date ASC,id ASC').all(sid, rt, pid);
    var tt = rows.reduce(function (s, x) { return s + (Number(x.amount) || 0); }, 0);
    var tp = batchPaid + ip.reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0);
    return { partner: Partners.get(sid, pid), invoices: rows, payments: ip, batchPaid: Math.round(batchPaid),
      totals: { total: Math.round(tt), paid: Math.round(tp), debt: Math.round(Math.max(0, tt - tp)) } };
  },

  totals: function (sid) {
    var r = Debts.summary(sid, 'customer').grand, p = Debts.summary(sid, 'supplier').grand;
    return { receivable: r.debt, payable: p.debt, net: r.debt - p.debt };
  }
};

module.exports = { db: db, Shops: Shops, Users: Users, Sessions: Sessions, Products: Products,
  Partners: Partners, Batches: Batches, Imports: Imports, Sells: Sells, Money: Money, Payments: Payments, Debts: Debts };
