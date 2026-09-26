'use strict';
/* =========================================================
   index.js — Máy chủ API Quản Lý Bán Hàng (có Lô hàng)
   ========================================================= */
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const D = require('./db');
const Shops = D.Shops, Users = D.Users, Sessions = D.Sessions, Products = D.Products;
const Partners = D.Partners, Batches = D.Batches, Imports = D.Imports, Sells = D.Sells;
const Money = D.Money, Payments = D.Payments, Debts = D.Debts;

const app = express();
const PORT = process.env.PORT || 10020;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

app.disable('x-powered-by');
app.use(express.json({ limit: '12mb' }));
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

function tok() { return crypto.randomBytes(32).toString('hex'); }
function todayISO() {
  var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function ok(res, data) { res.json({ ok: true, data: data === undefined ? null : data }); }
function fail(res, c, m) { res.status(c).json({ ok: false, error: m || 'error' }); }
function shopPub(s) {
  return { id: s.id, name: s.name, currency: s.currency, phone: s.phone || '',
    address: s.address || '', tax_code: s.tax_code || '', slogan: s.slogan || '' };
}
function auth(req, res, next) {
  var tk = req.headers['x-auth-token'] || '';
  if (!tk) { var h = req.headers.authorization || ''; tk = h.indexOf('Bearer ') === 0 ? h.slice(7) : ''; }
  if (!tk) tk = req.query.token || '';
  if (!tk) return fail(res, 401, 'no_token');
  var s = Sessions.get(tk);
  if (!s) return fail(res, 401, 'invalid_token');
  var u = Users.get(s.user_id);
  if (!u || !u.active) return fail(res, 401, 'user_inactive');
  req.user = u; req.shopId = u.shop_id; req.token = tk;
  next();
}
function ownerOnly(req, res, next) {
  if (req.user.role !== 'owner') return fail(res, 403, 'owner_only');
  next();
}

/* ================= AUTH ================= */
app.post('/api/register', function (req, res) {
  var b = req.body || {};
  if (!b.shopName || !b.username || !b.password) return fail(res, 400, 'missing_fields');
  if (String(b.username).length < 3) return fail(res, 400, 'username_short');
  if (String(b.password).length < 6) return fail(res, 400, 'password_short');
  if (Users.byUsername(b.username)) return fail(res, 409, 'username_taken');
  var shop = Shops.create(String(b.shopName).trim(), b.currency === 'CNY' ? 'CNY' : 'VND');
  var user = Users.create(shop.id, String(b.username).trim(), bcrypt.hashSync(String(b.password), 10), String(b.display || b.username).trim(), 'owner');
  var t = tok(); Sessions.create(t, user.id, 30);
  ok(res, { token: t, user: { id: user.id, username: user.username, display: user.display, role: user.role }, shop: shopPub(shop) });
});

app.post('/api/login', function (req, res) {
  var b = req.body || {};
  if (!b.username || !b.password) return fail(res, 400, 'missing_fields');
  var u = Users.byUsername(String(b.username).trim());
  if (!u) return fail(res, 401, 'wrong_credentials');
  if (!u.active) return fail(res, 403, 'user_inactive');
  if (!bcrypt.compareSync(String(b.password), u.password)) return fail(res, 401, 'wrong_credentials');
  var shop = Shops.get(u.shop_id);
  var t = tok(); Sessions.create(t, u.id, 30);
  ok(res, { token: t, user: { id: u.id, username: u.username, display: u.display, role: u.role }, shop: shopPub(shop) });
});

app.post('/api/logout', auth, function (req, res) { Sessions.remove(req.token); ok(res, true); });

app.get('/api/me', auth, function (req, res) {
  var shop = Shops.get(req.shopId);
  ok(res, { user: { id: req.user.id, username: req.user.username, display: req.user.display, role: req.user.role }, shop: shopPub(shop) });
});

/* ================= SHOP ================= */
app.put('/api/shop', auth, ownerOnly, function (req, res) {
  var b = req.body || {};
  var s = Shops.update(req.shopId, {
    name: b.name !== undefined ? String(b.name).trim() : undefined,
    currency: b.currency === 'CNY' ? 'CNY' : (b.currency === 'VND' ? 'VND' : undefined),
    phone: b.phone !== undefined ? String(b.phone).trim() : undefined,
    address: b.address !== undefined ? String(b.address).trim() : undefined,
    tax_code: b.tax_code !== undefined ? String(b.tax_code).trim() : undefined,
    slogan: b.slogan !== undefined ? String(b.slogan).trim() : undefined
  });
  ok(res, shopPub(s));
});

/* ================= USERS ================= */
app.get('/api/users', auth, ownerOnly, function (req, res) { ok(res, Users.listByShop(req.shopId)); });

app.post('/api/users', auth, ownerOnly, function (req, res) {
  var b = req.body || {};
  if (!b.username || !b.password) return fail(res, 400, 'missing_fields');
  if (String(b.username).length < 3) return fail(res, 400, 'username_short');
  if (String(b.password).length < 6) return fail(res, 400, 'password_short');
  if (Users.byUsername(b.username)) return fail(res, 409, 'username_taken');
  var u = Users.create(req.shopId, String(b.username).trim(), bcrypt.hashSync(String(b.password), 10),
    String(b.display || b.username).trim(), b.role === 'owner' ? 'owner' : 'staff');
  ok(res, { id: u.id, username: u.username, display: u.display, role: u.role, active: u.active });
});

app.put('/api/users/:id', auth, ownerOnly, function (req, res) {
  var id = Number(req.params.id), u = Users.get(id);
  if (!u || u.shop_id !== req.shopId) return fail(res, 404, 'not_found');
  var b = req.body || {};
  if (b.role === 'staff' && u.role === 'owner' && Users.countByRole(req.shopId, 'owner') <= 1) return fail(res, 400, 'last_owner');
  if (b.active === false && u.id === req.user.id) return fail(res, 400, 'cannot_disable_self');
  var up = Users.update(id, { display: b.display, role: b.role, active: b.active });
  if (b.password) {
    if (String(b.password).length < 6) return fail(res, 400, 'password_short');
    Users.setPassword(id, bcrypt.hashSync(String(b.password), 10));
  }
  ok(res, { id: up.id, username: up.username, display: up.display, role: up.role, active: up.active });
});

app.delete('/api/users/:id', auth, ownerOnly, function (req, res) {
  var id = Number(req.params.id), u = Users.get(id);
  if (!u || u.shop_id !== req.shopId) return fail(res, 404, 'not_found');
  if (u.id === req.user.id) return fail(res, 400, 'cannot_delete_self');
  if (u.role === 'owner' && Users.countByRole(req.shopId, 'owner') <= 1) return fail(res, 400, 'last_owner');
  Sessions.removeByUser(id); Users.remove(id);
  ok(res, true);
});

/* ================= SNAPSHOT ================= */
function snapshot(sid) {
  var shop = Shops.get(sid);
  return {
    shop: shopPub(shop),
    products: Products.list(sid),
    partners: Partners.list(sid),
    batches: Batches.list(sid, 400),
    imports: Imports.list(sid, 500),
    sells: Sells.list(sid, 500),
    money: Money.list(sid, 500),
    payments: Payments.list(sid, 1500)
  };
}
app.get('/api/data', auth, function (req, res) { ok(res, snapshot(req.shopId)); });

/* ================= PRODUCTS ================= */
app.post('/api/products', auth, function (req, res) {
  var b = req.body || {};
  if (!b.name_vi && !b.name_zh) return fail(res, 400, 'missing_fields');
  if (b.code && Products.byCode(req.shopId, b.code)) return fail(res, 409, 'product_code_exists');
  ok(res, Products.create(req.shopId, b));
});
app.put('/api/products/:id', auth, function (req, res) {
  var id = Number(req.params.id), b = req.body || {};
  if (b.code) { var d = Products.byCode(req.shopId, b.code); if (d && d.id !== id) return fail(res, 409, 'product_code_exists'); }
  var p = Products.update(req.shopId, id, b);
  if (!p) return fail(res, 404, 'not_found');
  ok(res, p);
});
app.delete('/api/products/:id', auth, ownerOnly, function (req, res) {
  Products.remove(req.shopId, Number(req.params.id)); ok(res, true);
});

/* ================= PARTNERS ================= */
app.get('/api/partners', auth, function (req, res) {
  var k = req.query.kind === 'supplier' ? 'supplier' : (req.query.kind === 'customer' ? 'customer' : null);
  ok(res, Partners.list(req.shopId, k));
});
app.post('/api/partners', auth, function (req, res) {
  var b = req.body || {};
  if (!b.name || !String(b.name).trim()) return fail(res, 400, 'missing_fields');
  var kind = b.kind === 'supplier' ? 'supplier' : 'customer';
  if (Partners.findByName(req.shopId, kind, b.name)) return fail(res, 409, 'partner_exists');
  ok(res, Partners.create(req.shopId, b));
});
app.put('/api/partners/:id', auth, function (req, res) {
  var id = Number(req.params.id), b = req.body || {};
  var c = Partners.get(req.shopId, id);
  if (!c) return fail(res, 404, 'not_found');
  if (b.name) { var d = Partners.findByName(req.shopId, c.kind, b.name); if (d && d.id !== id) return fail(res, 409, 'partner_exists'); }
  ok(res, Partners.update(req.shopId, id, b));
});
app.delete('/api/partners/:id', auth, ownerOnly, function (req, res) {
  var id = Number(req.params.id), p = Partners.get(req.shopId, id);
  if (!p) return fail(res, 404, 'not_found');
  var kind = p.kind === 'supplier' ? 'supplier' : 'customer';
  var row = Debts.summary(req.shopId, kind).partners.filter(function (x) { return x.partner.id === id; })[0];
  if (row && row.debt > 0) return fail(res, 400, 'has_debt');
  D.db.prepare('UPDATE batches SET partner_id=NULL WHERE shop_id=? AND partner_id=?').run(req.shopId, id);
  D.db.prepare('UPDATE imports SET partner_id=NULL WHERE shop_id=? AND partner_id=?').run(req.shopId, id);
  D.db.prepare('UPDATE sells SET partner_id=NULL WHERE shop_id=? AND partner_id=?').run(req.shopId, id);
  D.db.prepare('UPDATE payments SET partner_id=NULL WHERE shop_id=? AND partner_id=?').run(req.shopId, id);
  Partners.remove(req.shopId, id);
  ok(res, true);
});

/* =========================================================
   BATCHES — Lô hàng
   ========================================================= */
app.get('/api/batches', auth, function (req, res) { ok(res, Batches.list(req.shopId, 400)); });

app.get('/api/batches/:id', auth, function (req, res) {
  var b = Batches.get(req.shopId, Number(req.params.id));
  if (!b) return fail(res, 404, 'not_found');
  ok(res, b);
});

app.post('/api/batches', auth, function (req, res) {
  var b = req.body || {};
  if (!b.items || !b.items.length) return fail(res, 400, 'missing_fields');
  for (var i = 0; i < b.items.length; i++) {
    if (!Products.get(req.shopId, Number(b.items[i].product_id))) return fail(res, 400, 'product_not_found');
    if (!(Number(b.items[i].qty) > 0)) return fail(res, 400, 'missing_fields');
  }
  var partnerId = b.partner_id ? Number(b.partner_id) : null;
  if (!partnerId && b.supplier) partnerId = Partners.ensure(req.shopId, 'supplier', b.supplier, b.supplier_phone);
  var date = b.date || todayISO();

  var batch = Batches.create(req.shopId, {
    code: b.code, partner_id: partnerId, date: date, status: 'open', note: b.note
  });

  b.items.forEach(function (it) {
    Batches.addItem(req.shopId, batch.id, { product_id: Number(it.product_id), qty: Number(it.qty), cost: Number(it.cost) || 0 });
  });

  (b.costs || []).forEach(function (c) {
    if (!(Number(c.amount) > 0)) return;
    Batches.addCost(req.shopId, batch.id, {
      kind: c.kind || 'goods', label: c.label || '', amount: Number(c.amount),
      date: c.date || date, paid: !!c.paid, note: c.note
    });
    if (c.paid) {
      Money.create(req.shopId, { type: 'out', category: 'import', amount: Number(c.amount),
        descr: 'Trả lô ' + batch.code + (c.label ? ' — ' + c.label : ''), date: c.date || date }, req.user.id);
    }
  });

  Batches.applyCost(req.shopId, batch.id);
  ok(res, Batches.get(req.shopId, batch.id));
});

/* Thêm khoản chi phí / thanh toán vào lô */
app.post('/api/batches/:id/costs', auth, function (req, res) {
  var id = Number(req.params.id);
  var b = Batches.get(req.shopId, id);
  if (!b) return fail(res, 404, 'not_found');
  var c = req.body || {};
  if (!(Number(c.amount) > 0)) return fail(res, 400, 'missing_fields');

  Batches.addCost(req.shopId, id, {
    kind: c.kind || 'goods', label: c.label || '', amount: Number(c.amount),
    date: c.date || todayISO(), paid: !!c.paid, note: c.note
  });
  if (c.paid) {
    Money.create(req.shopId, { type: 'out', category: 'import', amount: Number(c.amount),
      descr: 'Trả lô ' + b.code + (c.label ? ' — ' + c.label : ''), date: c.date || todayISO() }, req.user.id);
  }
  Batches.applyCost(req.shopId, id);
  ok(res, Batches.get(req.shopId, id));
});

app.delete('/api/batches/:id/costs/:cid', auth, ownerOnly, function (req, res) {
  var id = Number(req.params.id);
  if (!Batches.get(req.shopId, id)) return fail(res, 404, 'not_found');
  Batches.removeCost(req.shopId, id, Number(req.params.cid));
  Batches.applyCost(req.shopId, id);
  ok(res, Batches.get(req.shopId, id));
});

app.post('/api/batches/:id/items', auth, function (req, res) {
  var id = Number(req.params.id);
  var b = Batches.get(req.shopId, id);
  if (!b) return fail(res, 404, 'not_found');
  var it = req.body || {};
  var pid = Number(it.product_id);
  if (!pid || !(Number(it.qty) > 0)) return fail(res, 400, 'missing_fields');
  if (!Products.get(req.shopId, pid)) return fail(res, 400, 'product_not_found');
  Batches.addItem(req.shopId, id, { product_id: pid, qty: Number(it.qty), cost: Number(it.cost) || 0 });
  Batches.applyCost(req.shopId, id);
  ok(res, Batches.get(req.shopId, id));
});

app.delete('/api/batches/:id/items/:iid', auth, ownerOnly, function (req, res) {
  var id = Number(req.params.id);
  if (!Batches.get(req.shopId, id)) return fail(res, 404, 'not_found');
  Batches.removeItem(req.shopId, id, Number(req.params.iid));
  Batches.applyCost(req.shopId, id);
  ok(res, Batches.get(req.shopId, id));
});

app.put('/api/batches/:id', auth, function (req, res) {
  var id = Number(req.params.id);
  var b = Batches.update(req.shopId, id, req.body || {});
  if (!b) return fail(res, 404, 'not_found');
  ok(res, b);
});

app.delete('/api/batches/:id', auth, ownerOnly, function (req, res) {
  Batches.remove(req.shopId, Number(req.params.id)); ok(res, true);
});

/* ================= IMPORTS (nhập trực tiếp) ================= */
app.post('/api/imports', auth, function (req, res) {
  var b = req.body || {};
  var pid = Number(b.product_id), qty = Number(b.qty);
  if (!pid || !qty || qty <= 0) return fail(res, 400, 'missing_fields');
  var p = Products.get(req.shopId, pid);
  if (!p) return fail(res, 404, 'not_found');
  var cost = Number(b.cost) || p.cost || 0, date = b.date || todayISO();
  var partnerId = b.partner_id ? Number(b.partner_id) : null;
  if (!partnerId && b.supplier) partnerId = Partners.ensure(req.shopId, 'supplier', b.supplier, b.supplier_phone);
  var sup = partnerId ? ((Partners.get(req.shopId, partnerId) || {}).name || '') : (b.supplier || '');
  var imp = Imports.create(req.shopId, { product_id: pid, partner_id: partnerId, qty: qty, cost: cost, supplier: sup, date: date, note: b.note });
  Products.setCost(req.shopId, pid, cost);
  var total = qty * cost, paidNow = Math.max(0, Math.min(Number(b.paid) || 0, total));
  if (paidNow > 0) {
    Payments.create(req.shopId, { partner_id: partnerId, ref_type: 'import', ref_id: imp.id, amount: paidNow, date: date, note: 'Trả khi nhập hàng' }, req.user.id);
    Money.create(req.shopId, { type: 'out', category: 'import', amount: paidNow, descr: 'Nhập kho: ' + (p.name_vi || p.name_zh || p.code) + ' x' + qty, date: date }, req.user.id);
  }
  ok(res, Object.assign({}, imp, { total: total, paid: paidNow, debt: total - paidNow }));
});
app.delete('/api/imports/:id', auth, ownerOnly, function (req, res) {
  Imports.remove(req.shopId, Number(req.params.id)); ok(res, true);
});

/* ================= SELLS ================= */
app.post('/api/sells', auth, function (req, res) {
  var b = req.body || {}, items = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return fail(res, 400, 'empty_cart');
  var imp = Imports.sumQtyByProduct(req.shopId), sold = Sells.sumQtyByProduct(req.shopId);

  /* Tồn từ lô hàng */
  var batchQty = {};
  Batches.list(req.shopId, 400).forEach(function (bt) {
    if (!bt.stock_in) return;
    var full = Batches.get(req.shopId, bt.id);
    full.items.forEach(function (it) {
      batchQty[it.product_id] = (batchQty[it.product_id] || 0) + (Number(it.qty) || 0);
    });
  });
  var stockOf = function (pid) {
    return (imp[pid] || 0) + (batchQty[pid] || 0) - (sold[pid] || 0);
  };

  for (var i = 0; i < items.length; i++) {
    var pid = Number(items[i].productId), q = Number(items[i].qty) || 0;
    if (!Products.get(req.shopId, pid)) return fail(res, 400, 'product_not_found');
    if (q > stockOf(pid)) return fail(res, 400, 'not_enough_stock');
  }

  var date = b.date || todayISO();
  var partnerId = b.partner_id ? Number(b.partner_id) : null;
  if (!partnerId && b.customer) partnerId = Partners.ensure(req.shopId, 'customer', b.customer, b.customer_phone);
  var custName = partnerId ? ((Partners.get(req.shopId, partnerId) || {}).name || '') : (b.customer || '');

  var sale = Sells.create(req.shopId, { items: items, discount: b.discount, customer: custName, partner_id: partnerId, date: date, note: b.note }, req.user.id);
  var paidNow = Math.max(0, Math.min(Number(b.paid) || 0, Number(sale.total) || 0));
  if (paidNow > 0) {
    Payments.create(req.shopId, { partner_id: partnerId, ref_type: 'sell', ref_id: sale.id, amount: paidNow, date: date, note: 'Thu khi bán hàng' }, req.user.id);
    Money.create(req.shopId, { type: 'in', category: 'sell', amount: paidNow, descr: 'Bán hàng' + (custName ? ' — ' + custName : ''), date: date }, req.user.id);
  }
  ok(res, Object.assign({}, sale, { paid: paidNow, debt: (Number(sale.total) || 0) - paidNow }));
});
app.delete('/api/sells/:id', auth, ownerOnly, function (req, res) {
  Sells.remove(req.shopId, Number(req.params.id)); ok(res, true);
});

/* ================= MONEY ================= */
app.post('/api/money', auth, function (req, res) {
  var b = req.body || {}, amount = Number(b.amount);
  if (!amount || amount <= 0) return fail(res, 400, 'missing_fields');
  ok(res, Money.create(req.shopId, { type: b.type, category: b.category, amount: amount, descr: b.descr, date: b.date || todayISO() }, req.user.id));
});
app.delete('/api/money/:id', auth, ownerOnly, function (req, res) {
  Money.remove(req.shopId, Number(req.params.id)); ok(res, true);
});

/* ================= PAYMENTS ================= */
app.post('/api/payments', auth, function (req, res) {
  var b = req.body || {}, amount = Number(b.amount);
  if (!amount || amount <= 0) return fail(res, 400, 'missing_fields');
  var rt = b.ref_type === 'import' ? 'import' : 'sell';
  var partnerId = b.partner_id ? Number(b.partner_id) : null;

  if (b.ref_id && rt === 'sell') {
    var refId = Number(b.ref_id);
    var row = Sells.get(req.shopId, refId);
    if (!row) return fail(res, 404, 'not_found');
    if (!partnerId && row.partner_id) partnerId = row.partner_id;
    var paidOn = Payments.listByRef(req.shopId, 'sell').filter(function (p) { return Number(p.ref_id) === refId; })
      .reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0);
    if (amount > Math.max(0, (Number(row.total) || 0) - paidOn) + 1) return fail(res, 400, 'over_payment');
  } else if (partnerId) {
    var kind = rt === 'sell' ? 'customer' : 'supplier';
    var rw = Debts.summary(req.shopId, kind).partners.filter(function (x) { return Number(x.partner.id) === partnerId; })[0];
    var remain = rw ? rw.debt : 0;
    if (remain <= 0) return fail(res, 400, 'over_payment');
    if (amount > remain + 1) return fail(res, 400, 'over_payment');
  }

  var pay = Payments.create(req.shopId, {
    partner_id: partnerId, ref_type: rt, ref_id: b.ref_id ? Number(b.ref_id) : null,
    amount: amount, date: b.date || todayISO(), note: b.note || ''
  }, req.user.id);

  var pName = partnerId ? ((Partners.get(req.shopId, partnerId) || {}).name || '') : '';
  Money.create(req.shopId, {
    type: rt === 'sell' ? 'in' : 'out', category: rt === 'sell' ? 'collect' : 'pay_supplier', amount: amount,
    descr: (rt === 'sell' ? 'Thu công nợ' : 'Trả nhà cung cấp') + (pName ? ' — ' + pName : ''), date: pay.date
  }, req.user.id);
  ok(res, pay);
});
app.delete('/api/payments/:id', auth, ownerOnly, function (req, res) {
  Payments.remove(req.shopId, Number(req.params.id)); ok(res, true);
});

/* ================= DEBTS ================= */
app.get('/api/debts', auth, function (req, res) {
  ok(res, Debts.summary(req.shopId, req.query.kind === 'supplier' ? 'supplier' : 'customer'));
});
app.get('/api/debts/totals', auth, function (req, res) { ok(res, Debts.totals(req.shopId)); });
app.get('/api/debts/:kind/:partnerId', auth, function (req, res) {
  var kind = req.params.kind === 'supplier' ? 'supplier' : 'customer';
  var pid = Number(req.params.partnerId);
  if (!Partners.get(req.shopId, pid)) return fail(res, 404, 'not_found');
  ok(res, Debts.detail(req.shopId, kind, pid));
});

/* ================= STOCK ================= */
app.get('/api/stock', auth, function (req, res) {
  var imp = Imports.sumQtyByProduct(req.shopId);
  var sold = Sells.sumQtyByProduct(req.shopId);
  var batch = {};
  Batches.list(req.shopId, 400).forEach(function (bt) {
    if (!bt.stock_in) return;
    var full = Batches.get(req.shopId, bt.id);
    full.items.forEach(function (it) {
      batch[it.product_id] = (batch[it.product_id] || 0) + (Number(it.qty) || 0);
    });
  });
  var out = {};
  Products.list(req.shopId).forEach(function (p) {
    out[p.id] = (imp[p.id] || 0) + (batch[p.id] || 0) - (sold[p.id] || 0);
  });
  ok(res, out);
});

/* ================= HEALTH + SPA ================= */
app.get('/api/health', function (req, res) { ok(res, { status: 'up', time: new Date().toISOString() }); });
app.get(/^\/(?!api).*/, function (req, res) { res.sendFile(path.join(PUBLIC_DIR, 'index.html')); });

Sessions.clean();
setInterval(function () { Sessions.clean(); }, 21600000);

app.listen(PORT, '0.0.0.0', function () {
  console.log('=======================================');
  console.log('  QUAN LY BAN HANG (co Lo hang)');
  console.log('  Cong: ' + PORT);
  console.log('  Du lieu: ' + (process.env.DATA_DIR || './data'));
  console.log('=======================================');
});
