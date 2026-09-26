/* api.js — Giao tiếp máy chủ */
(function () {
  'use strict';
  var TK = 'qlbh.token';
  var st = { token: localStorage.getItem(TK) || '', user: null, shop: null,
    products: [], partners: [], batches: [], imports: [], sells: [], money: [], payments: [] };

  async function req(m, url, body) {
    var o = { method: m, headers: {} };
    if (st.token) o.headers['X-Auth-Token'] = st.token;
    if (body !== undefined) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(body); }
    var r;
    try { r = await fetch(url, o); } catch (e) { var er = new Error('err_network'); er.code = 'err_network'; throw er; }
    var j = null; try { j = await r.json(); } catch (e) { j = null; }
    if (!r.ok || !j || j.ok !== true) {
      var c = (j && j.error) ? j.error : 'error';
      if (r.status === 401) { clear(); if (window.Auth && window.Auth.onExpired) window.Auth.onExpired(); }
      var e2 = new Error(c); e2.code = c; throw e2;
    }
    return j.data;
  }
  function save(d) { st.token = d.token; st.user = d.user; st.shop = d.shop; localStorage.setItem(TK, d.token); }
  function clear() {
    st.token = ''; st.user = null; st.shop = null;
    st.products = []; st.partners = []; st.batches = []; st.imports = []; st.sells = []; st.money = []; st.payments = [];
    localStorage.removeItem(TK);
  }
  function isLoggedIn() { return !!st.token && !!st.user; }
  async function loadAll() {
    var d = await req('GET', '/api/data');
    st.shop = d.shop; st.products = d.products || []; st.partners = d.partners || [];
    st.batches = d.batches || []; st.imports = d.imports || []; st.sells = d.sells || [];
    st.money = d.money || []; st.payments = d.payments || [];
    return d;
  }

  var Auth = {
    register: async function (p) { var d = await req('POST', '/api/register', p); save(d); return d; },
    login: async function (p) { var d = await req('POST', '/api/login', p); save(d); return d; },
    logout: async function () { try { await req('POST', '/api/logout'); } catch (e) {} clear(); },
    me: async function () { var d = await req('GET', '/api/me'); st.user = d.user; st.shop = d.shop; return d; },
    onExpired: null
  };

  var Products = {
    all: function () { return st.products.slice(); },
    get: function (id) { id = Number(id); return st.products.filter(function (p) { return Number(p.id) === id; })[0] || null; },
    byCode: function (c) { var x = String(c || '').trim().toLowerCase();
      return st.products.filter(function (p) { return String(p.code || '').toLowerCase() === x; })[0] || null; },
    create: async function (p) { var r = await req('POST', '/api/products', p); st.products.push(r); return r; },
    update: async function (id, p) { var r = await req('PUT', '/api/products/' + id, p);
      st.products = st.products.map(function (x) { return Number(x.id) === Number(id) ? r : x; }); return r; },
    remove: async function (id) { await req('DELETE', '/api/products/' + id);
      st.products = st.products.filter(function (x) { return Number(x.id) !== Number(id); }); }
  };
  Products.findByCode = Products.byCode;

  var Partners = {
    all: function (k) { return k ? st.partners.filter(function (p) { return p.kind === k; }) : st.partners.slice(); },
    get: function (id) { id = Number(id); return st.partners.filter(function (p) { return Number(p.id) === id; })[0] || null; },
    findByName: function (k, n) { n = String(n || '').trim().toLowerCase();
      return st.partners.filter(function (p) { return p.kind === k && String(p.name || '').toLowerCase() === n; })[0] || null; },
    create: async function (p) { var r = await req('POST', '/api/partners', p); st.partners.push(r); return r; },
    update: async function (id, p) { var r = await req('PUT', '/api/partners/' + id, p);
      st.partners = st.partners.map(function (x) { return Number(x.id) === Number(id) ? r : x; }); return r; },
    remove: async function (id) { await req('DELETE', '/api/partners/' + id);
      st.partners = st.partners.filter(function (x) { return Number(x.id) !== Number(id); }); await loadAll(); }
  };

  /* Tính tổng kết lô hàng ở client (dùng cho danh sách) */
  function batchSummary(b) {
    /* Danh sách chỉ có metadata; cần gọi API chi tiết để có items/costs */
    return b.summary || null;
  }

  var Batches = {
    all: function () { return st.batches.slice(); },
    get: function (id) { id = Number(id); return st.batches.filter(function (b) { return Number(b.id) === id; })[0] || null; },
    async detail(id) { return await req('GET', '/api/batches/' + id); },
    async create(p) { var r = await req('POST', '/api/batches', p); await loadAll(); return r; },
    async addCost(id, c) { var r = await req('POST', '/api/batches/' + id + '/costs', c); await loadAll(); return r; },
    async removeCost(id, cid) { var r = await req('DELETE', '/api/batches/' + id + '/costs/' + cid); await loadAll(); return r; },
    async addItem(id, it) { var r = await req('POST', '/api/batches/' + id + '/items', it); await loadAll(); return r; },
    async removeItem(id, iid) { var r = await req('DELETE', '/api/batches/' + id + '/items/' + iid); await loadAll(); return r; },
    async update(id, p) { var r = await req('PUT', '/api/batches/' + id, p); await loadAll(); return r; },
    async remove(id) { await req('DELETE', '/api/batches/' + id); await loadAll(); },
    /* Tồn từ lô */
    qtyByProduct: function () {
      var m = {};
      st.batches.forEach(function (b) {
        if (!b.stock_in) return;
        (b.items || []).forEach(function (it) {
          m[it.product_id] = (m[it.product_id] || 0) + (Number(it.qty) || 0);
        });
      });
      return m;
    }
  };

  var Imports = {
    all: function () { return st.imports.slice(); },
    get: function (id) { id = Number(id); return st.imports.filter(function (i) { return Number(i.id) === id; })[0] || null; },
    create: async function (r) { var x = await req('POST', '/api/imports', r); await loadAll(); return x; },
    remove: async function (id) { await req('DELETE', '/api/imports/' + id);
      st.imports = st.imports.filter(function (x) { return Number(x.id) !== Number(id); }); }
  };

  var Stock = {
    qty: function (pid) {
      pid = Number(pid);
      var q = 0;
      st.imports.forEach(function (i) { if (Number(i.product_id) === pid) q += Number(i.qty) || 0; });
      st.batches.forEach(function (b) {
        if (!b.stock_in) return;
        (b.items || []).forEach(function (it) { if (Number(it.product_id) === pid) q += Number(it.qty) || 0; });
      });
      st.sells.forEach(function (s) { (s.items || []).forEach(function (it) {
        if (Number(it.productId) === pid) q -= Number(it.qty) || 0; }); });
      return q;
    },
    all: function () {
      var m = {};
      st.products.forEach(function (p) { m[p.id] = 0; });
      st.imports.forEach(function (i) { if (m[i.product_id] !== undefined) m[i.product_id] += Number(i.qty) || 0; });
      st.batches.forEach(function (b) {
        if (!b.stock_in) return;
        (b.items || []).forEach(function (it) { if (m[it.product_id] !== undefined) m[it.product_id] += Number(it.qty) || 0; });
      });
      st.sells.forEach(function (s) { (s.items || []).forEach(function (it) {
        if (m[it.productId] !== undefined) m[it.productId] -= Number(it.qty) || 0; }); });
      return m;
    },
    totalValue: function () {
      var m = Stock.all(), v = 0;
      st.products.forEach(function (p) { var q = m[p.id] || 0; if (q > 0) v += q * (Number(p.cost) || 0); });
      return v;
    },
    warnings: function () {
      var m = Stock.all();
      return st.products.filter(function (p) { return (m[p.id] || 0) <= (Number(p.min_stock) || 0); })
        .map(function (p) { return { product: p, qty: m[p.id] || 0 }; });
    }
  };

  var Sells = {
    all: function () { return st.sells.slice(); },
    get: function (id) { id = Number(id); return st.sells.filter(function (s) { return Number(s.id) === id; })[0] || null; },
    create: async function (r) { var x = await req('POST', '/api/sells', r); await loadAll(); return x; },
    remove: async function (id) { await req('DELETE', '/api/sells/' + id);
      st.sells = st.sells.filter(function (x) { return Number(x.id) !== Number(id); }); },
    revenueInRange: function (f, t) { return st.sells.reduce(function (s, x) {
      if (x.adjust || (f && x.date < f) || (t && x.date > t)) return s; return s + (Number(x.total) || 0); }, 0); },
    costInRange: function (f, t) { return st.sells.reduce(function (s, x) {
      if (x.adjust || (f && x.date < f) || (t && x.date > t)) return s;
      return s + (x.items || []).reduce(function (a, it) { return a + it.qty * (Number(it.cost) || 0); }, 0); }, 0); },
    countInRange: function (f, t) { return st.sells.filter(function (x) {
      return !x.adjust && !(f && x.date < f) && !(t && x.date > t); }).length; }
  };

  var Money = {
    all: function () { return st.money.slice(); },
    create: async function (r) { var x = await req('POST', '/api/money', r); st.money.unshift(x); return x; },
    remove: async function (id) { await req('DELETE', '/api/money/' + id);
      st.money = st.money.filter(function (x) { return Number(x.id) !== Number(id); }); },
    incomeInRange: function (f, t) { return st.money.reduce(function (s, m) {
      return (m.type !== 'in' || (f && m.date < f) || (t && m.date > t)) ? s : s + (Number(m.amount) || 0); }, 0); },
    expenseInRange: function (f, t) { return st.money.reduce(function (s, m) {
      return (m.type !== 'out' || (f && m.date < f) || (t && m.date > t)) ? s : s + (Number(m.amount) || 0); }, 0); }
  };

  var Payments = {
    all: function () { return st.payments.slice(); },
    ofRef: function (rt, rid) { return st.payments.filter(function (p) { return p.ref_type === rt && Number(p.ref_id) === Number(rid); }); },
    paidOnRef: function (rt, rid) { return Payments.ofRef(rt, rid).reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0); },
    create: async function (r) { await req('POST', '/api/payments', r); await loadAll(); },
    remove: async function (id) { await req('DELETE', '/api/payments/' + id); await loadAll(); }
  };

  var Debts = {
    summary: function (kind) {
      var isC = kind !== 'supplier', rt = isC ? 'sell' : 'import';
      var rows = isC ? st.sells.filter(function (s) { return !s.adjust && s.partner_id; })
                     : st.imports.filter(function (i) { return i.partner_id; });
      var tb = {}, cb = {};
      rows.forEach(function (r) { var pid = Number(r.partner_id);
        var amt = isC ? (Number(r.total) || 0) : (Number(r.qty) || 0) * (Number(r.cost) || 0);
        tb[pid] = (tb[pid] || 0) + amt; cb[pid] = (cb[pid] || 0) + 1; });

      /* Với NCC: cộng nợ từ lô hàng */
      var bd = {}, bc = {};
      if (!isC) {
        st.batches.forEach(function (b) {
          if (!b.partner_id) return;
          var s = b.summary;
          if (!s) return;
          bd[b.partner_id] = (bd[b.partner_id] || 0) + s.debt;
          bc[b.partner_id] = (bc[b.partner_id] || 0) + 1;
        });
      }

      var pb = {};
      st.payments.forEach(function (p) { if (p.ref_type !== rt) return;
        var pid = Number(p.partner_id) || 0; if (!pid) return;
        pb[pid] = (pb[pid] || 0) + (Number(p.amount) || 0); });
      /* NCC: cộng tiền đã trả trong lô */
      var bp = {};
      if (!isC) {
        st.batches.forEach(function (b) {
          if (!b.partner_id || !b.summary) return;
          bp[b.partner_id] = (bp[b.partner_id] || 0) + (b.summary.paidTotal || 0);
        });
      }

      var ps = st.partners.filter(function (p) { return isC ? p.kind !== 'supplier' : p.kind === 'supplier'; });
      var gT = 0, gP = 0, gD = 0;
      var list = ps.map(function (p) { var id = Number(p.id), tot = tb[id] || 0, pd = pb[id] || 0;
        var bb = isC ? 0 : (bd[id] || 0);
        var pd2 = pd + (isC ? 0 : (bp[id] || 0));
        var cnt = (cb[id] || 0) + (bc[id] || 0);
        var debt = isC ? (tot - pd) : bb;
        if (!isC && bb === 0 && tot > 0) debt = tot - pd;
        gT += tot; gP += pd2; gD += debt;
        return { partner: p, total: Math.round(tot), paid: Math.round(pd2), debt: Math.round(debt), invoiceCount: cnt }; });
      list.sort(function (a, b) { return b.debt - a.debt; });
      return { partners: list, grand: { total: Math.round(gT), paid: Math.round(gP), debt: Math.round(gD) } };
    },
    async detail(kind, pid) { return await req('GET', '/api/debts/' + kind + '/' + pid); },
    totals: function () {
      var r = Debts.summary('customer').grand, p = Debts.summary('supplier').grand;
      return { receivable: r.debt, payable: p.debt, net: r.debt - p.debt };
    }
  };

  var Staff = {
    list: async function () { return await req('GET', '/api/users'); },
    create: async function (p) { return await req('POST', '/api/users', p); },
    update: async function (id, p) { return await req('PUT', '/api/users/' + id, p); },
    remove: async function (id) { return await req('DELETE', '/api/users/' + id); }
  };

  var Settings = {
    get: function () { var s = st.shop || {};
      return { shopName: s.name || '', currency: s.currency || 'VND', phone: s.phone || '',
        address: s.address || '', taxCode: s.tax_code || '', slogan: s.slogan || '' }; },
    save: async function (p) { var c = st.shop || {};
      var b = { name: p.shopName !== undefined ? p.shopName : (c.name || ''),
        currency: p.currency !== undefined ? p.currency : c.currency,
        phone: p.phone !== undefined ? p.phone : (c.phone || ''),
        address: p.address !== undefined ? p.address : (c.address || ''),
        tax_code: p.taxCode !== undefined ? p.taxCode : (c.tax_code || ''),
        slogan: p.slogan !== undefined ? p.slogan : (c.slogan || '') };
      var d = await req('PUT', '/api/shop', b); st.shop = d; return d; }
  };

  function pad(n) { return String(n).padStart(2, '0'); }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDaysISO(iso, n) { var p = String(iso).split('-').map(Number);
    var dt = new Date(p[0], p[1] - 1, p[2]); dt.setDate(dt.getDate() + n);
    return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
  function fmtMoney(n) { var v = Math.round(Number(n) || 0);
    var c = (st.shop && st.shop.currency) || 'VND';
    return c === 'CNY' ? ('¥' + v.toLocaleString('vi-VN')) : (v.toLocaleString('vi-VN') + ' ₫'); }
  function fmtDate(iso) { if (!iso) return ''; var p = String(iso).split('-');
    return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : iso; }

  window.Store = {
    Auth: Auth, Products: Products, Partners: Partners, Batches: Batches, Imports: Imports,
    Stock: Stock, Sells: Sells, Money: Money, Payments: Payments, Debts: Debts, Staff: Staff, Settings: Settings,
    loadAll: loadAll, isLoggedIn: isLoggedIn, clearSession: clear,
    todayISO: todayISO, addDaysISO: addDaysISO, fmtMoney: fmtMoney, fmtDate: fmtDate,
    get user() { return st.user; }, get shop() { return st.shop; }, get token() { return st.token; }
  };
})();
