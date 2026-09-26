/* app.js — phần 1: khung, tiện ích, modal, điều hướng */
(function () {
  'use strict';
  var S = window.Store, I = window.Icon;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html !== undefined) n.innerHTML = html; return n; }
  function esc(s) { return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function money(n) { return S.fmtMoney(n); }
  function num(n) { return (Number(n) || 0).toLocaleString('vi-VN'); }
  function dateStr(i) { return S.fmtDate(i); }
  function today() { return S.todayISO(); }
  function prodName(p) { if (!p) return '—';
    if (window.LANG === 'zh') return p.name_zh || p.name_vi || p.code || '—';
    return p.name_vi || p.name_zh || p.code || '—'; }
  function prodNameAlt(p) { if (!p) return ''; var m = prodName(p);
    var o = window.LANG === 'zh' ? p.name_vi : p.name_zh; return (o && o !== m) ? o : ''; }
  function partnerName(id) { var p = S.Partners.get(id); return p ? p.name : '—'; }

  function toast(msg, kind) {
    var w = $('#toastWrap'), t = el('div', 'toast' + (kind ? ' ' + kind : ''));
    t.appendChild(el('span', 'tic', kind === 'err' ? I.warn({ w: 17 }) : I.check({ w: 17 })));
    t.appendChild(el('span', '', esc(msg)));
    w.appendChild(t);
    setTimeout(function () { t.classList.add('hide'); setTimeout(function () { t.remove(); }, 260); }, 2600);
  }

  var modal = {
    open: function (o) {
      $('#modalTitle').textContent = o.title || '';
      var b = $('#modalBody'); b.innerHTML = '';
      if (typeof o.body === 'string') b.innerHTML = o.body; else if (o.body) b.appendChild(o.body);
      var f = $('#modalFoot'); f.innerHTML = '';
      (o.buttons || []).forEach(function (bt) {
        var btn = el('button', 'btn ' + (bt.kind || 'ghost'));
        btn.innerHTML = '<span class="bi">' + (bt.icon || '') + '</span><em>' + esc(bt.label) + '</em>';
        btn.addEventListener('click', function () {
          if (bt.onClick) { var r = bt.onClick(); if (r === false) return; }
          if (bt.keepOpen !== true) modal.close(); });
        f.appendChild(btn); });
      $('#modal').hidden = false; document.body.classList.add('noscroll');
      if (o.onMount) o.onMount(b);
      return b;
    },
    close: function () { $('#modal').hidden = true; document.body.classList.remove('noscroll'); },
    confirm: function (m, yes) {
      modal.open({ title: window.t('ok') + '?',
        body: '<p style="font-size:.9rem;line-height:1.55">' + esc(m) + '</p>',
        buttons: [{ label: window.t('cancel'), kind: 'ghost' }, { label: window.t('ok'), kind: 'danger', onClick: yes }] });
    }
  };

  var PAGES = ['dashboard','products','batch','sell','stock','debt','money','report','staff','settings'];
  var NAVI = { dashboard:'dash', products:'box', batch:'batch', sell:'cart', stock:'stack',
    debt:'scale', money:'wallet', report:'chart', staff:'users', settings:'gear' };
  var cur = 'dashboard';

  function goto(page) {
    if (PAGES.indexOf(page) < 0) page = 'dashboard';
    cur = page;
    $$('.page').forEach(function (p) { p.classList.toggle('active', p.id === 'page-' + page); });
    $$('.nav-item').forEach(function (n) { n.classList.toggle('active', n.dataset.page === page); });
    $('#pageTitle').textContent = window.t('nav_' + page);
    closeSidebar(); window.scrollTo(0, 0);
    renderPage(page);
  }
  function renderPage(page) {
    var B = window.App.builders;
    var fn = { dashboard:'renderDashboard', products:'renderProducts', batch:'renderBatchPage',
      sell:'renderSellPage', stock:'renderStock', debt:'renderDebt', money:'renderMoney',
      report:'renderReport', staff:'renderStaff', settings:'renderSettings' }[page];
    try { if (fn && B[fn]) B[fn](); } catch (e) { console.warn('renderPage:', e); }
  }
  function renderAll() { renderPage(cur); }
  function openSidebar() { $('#sidebar').classList.add('open'); $('#scrim').classList.add('show'); }
  function closeSidebar() { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('show'); }
  function applyLang() {
    document.documentElement.lang = window.LANG;
    $$('[data-i18n]').forEach(function (n) { n.textContent = window.t(n.dataset.i18n); });
    $$('[data-i18n-ph]').forEach(function (n) { n.placeholder = window.t(n.dataset.i18nPh); });
    var lb = $('#langLabel'); if (lb) lb.textContent = window.LANG === 'vi' ? '中文' : 'Tiếng Việt';
    if (window.App.applyRole && S.user) window.App.applyRole();
  }
  function toggleLang() {
    window.setLang(window.LANG === 'vi' ? 'zh' : 'vi');
    applyLang();
    if (window.App.builders.updateShopTitle) window.App.builders.updateShopTitle();
    renderPage(cur);
    toast(window.LANG === 'zh' ? '已切换为中文' : 'Đã chuyển sang Tiếng Việt', 'ok');
  }
  function emptyBox(t, s, ic) {
    var d = el('div', 'empty');
    d.appendChild(el('div', 'eic', (I[ic] || I.box)({ w: 46, sw: 1.4 })));
    d.appendChild(el('div', 'empty-title', esc(window.t(t))));
    if (s) d.appendChild(el('div', 'empty-sub', esc(window.t(s))));
    return d;
  }
  function statCard(lk, val, cls) {
    var d = el('div', 'stat' + (cls ? ' ' + cls : ''));
    d.appendChild(el('div', 'stat-label', esc(window.t(lk))));
    d.appendChild(el('div', 'stat-value', val));
    return d;
  }

  window.App = {
    $: $, $$: $$, el: el, esc: esc, money: money, num: num, dateStr: dateStr, today: today,
    prodName: prodName, prodNameAlt: prodNameAlt, partnerName: partnerName,
    toast: toast, modal: modal, goto: goto, renderPage: renderPage, renderAll: renderAll,
    openSidebar: openSidebar, closeSidebar: closeSidebar,
    applyLang: applyLang, toggleLang: toggleLang, emptyBox: emptyBox,
    builders: { statCard: statCard, updateShopTitle: function () {} }
  };
  window.App.getPage = function () { return cur; };
  window.__navi = NAVI;
})();

/* app.js — phần 2: SẢN PHẨM + TỒN KHO */
(function () {
  'use strict';
  var A = window.App, S = window.Store, I = window.Icon;
  var $ = A.$, el = A.el, esc = A.esc, money = A.money, num = A.num,
      prodName = A.prodName, prodNameAlt = A.prodNameAlt, toast = A.toast, modal = A.modal, emptyBox = A.emptyBox;

  A.builders.prodFilter = '';
  A.builders.renderProducts = function () {
    var box = $('#prodList'); if (!box) return; box.innerHTML = '';
    var q = (A.builders.prodFilter || '').trim().toLowerCase();
    var list = S.Products.all();
    if (q) list = list.filter(function (p) {
      return (p.name_vi || '').toLowerCase().indexOf(q) >= 0 || (p.name_zh || '').toLowerCase().indexOf(q) >= 0 ||
             (p.code || '').toLowerCase().indexOf(q) >= 0; });
    list.sort(function (a, b) { return String(a.code || '').localeCompare(String(b.code || '')); });
    if (!list.length) {
      var e = emptyBox(q ? 'no_data' : 'no_products', q ? 'search' : 'no_products_hint', 'box');
      if (!q) { var b = el('button', 'btn primary sm');
        b.innerHTML = '<span class="bi">' + I.plus({ w: 15 }) + '</span><em>' + esc(window.t('add_product')) + '</em>';
        b.style.marginTop = '14px'; b.addEventListener('click', function () { productForm(); });
        e.appendChild(b); }
      box.appendChild(e); return; }
    var sm = S.Stock.all();
    list.forEach(function (p) {
      var row = el('div', 'row-item');
      row.appendChild(el('div', 'thumb', esc((p.name_vi || p.name_zh || '?').trim().charAt(0).toUpperCase())));
      var m = el('div', 'ri-main');
      m.appendChild(el('div', 'ri-title', esc(prodName(p))));
      var sub = el('div', 'ri-sub'), alt = prodNameAlt(p);
      if (p.code) sub.appendChild(el('span', '', esc(p.code)));
      if (alt) sub.appendChild(el('span', '', esc(alt)));
      sub.appendChild(el('span', '', esc(window.t('cost_price')) + ': ' + esc(money(p.cost))));
      sub.appendChild(el('span', '', esc(window.t('sell_price')) + ': ' + esc(money(p.price))));
      sub.appendChild(el('span', '', esc(window.t('stock')) + ': ' + num(sm[p.id] || 0) + ' ' + esc(p.unit || '')));
      m.appendChild(sub); row.appendChild(m);
      var acts = el('div', 'ri-actions');
      var be = el('button', 'icon-btn sm edit', I.edit({ w: 16 })); be.addEventListener('click', function () { productForm(p); });
      var bd = el('button', 'icon-btn sm del', I.trash({ w: 16 }));
      bd.addEventListener('click', function () { modal.confirm(window.t('confirm_delete'), async function () {
        try { await S.Products.remove(p.id); toast(window.t('product_deleted'), 'ok'); A.renderAll(); }
        catch (er) { toast(A.errMsg(er.code), 'err'); } }); });
      acts.appendChild(be); acts.appendChild(bd); row.appendChild(acts); box.appendChild(row); });
  };

  function productForm(p) {
    var isEdit = !!p, body = el('div', 'form');
    body.innerHTML =
      '<div class="row2"><div class="field"><label>' + esc(window.t('product_code')) + '</label><input type="text" id="pfCode" value="' + esc(p ? p.code : '') + '"></div>' +
      '<div class="field"><label>' + esc(window.t('unit')) + '</label><input type="text" id="pfUnit" value="' + esc(p ? p.unit : '') + '"></div></div>' +
      '<div class="field"><label>' + esc(window.t('product_name_vi')) + '</label><input type="text" id="pfVi" value="' + esc(p ? p.name_vi : '') + '"></div>' +
      '<div class="field"><label>' + esc(window.t('product_name_zh')) + '</label><input type="text" id="pfZh" value="' + esc(p ? p.name_zh : '') + '"></div>' +
      '<div class="row2"><div class="field"><label>' + esc(window.t('cost_price')) + '</label><input type="number" id="pfCost" value="' + (p ? p.cost : 0) + '"></div>' +
      '<div class="field"><label>' + esc(window.t('sell_price')) + '</label><input type="number" id="pfPrice" value="' + (p ? p.price : 0) + '"></div></div>' +
      '<div class="field"><label>' + esc(window.t('min_stock')) + '</label><input type="number" id="pfMin" value="' + (p ? p.min_stock : 0) + '"></div>';
    modal.open({ title: isEdit ? window.t('edit_product') : window.t('add_product'), body: body,
      buttons: [{ label: window.t('cancel'), kind: 'ghost' },
      { label: window.t('save'), kind: 'primary', icon: I.save({ w: 16 }), onClick: async function () {
        var code = $('#pfCode').value.trim(), vi = $('#pfVi').value.trim(), zh = $('#pfZh').value.trim();
        if (!vi && !zh) { toast(window.t('required'), 'err'); return false; }
        if (code) { var d = S.Products.byCode(code);
          if (d && (!isEdit || Number(d.id) !== Number(p.id))) { toast(window.t('product_code_exists'), 'err'); return false; } }
        var pl = { code: code, name_vi: vi, name_zh: zh, unit: $('#pfUnit').value.trim(),
          cost: Number($('#pfCost').value) || 0, price: Number($('#pfPrice').value) || 0, min_stock: Number($('#pfMin').value) || 0 };
        try { if (isEdit) { await S.Products.update(p.id, pl); toast(window.t('product_updated'), 'ok'); }
          else { await S.Products.create(pl); toast(window.t('product_added'), 'ok'); } }
        catch (er) { toast(A.errMsg(er.code), 'err'); return false; }
        A.renderAll(); } }] });
  }
  A.builders.openProductForm = productForm;

  A.builders.stockFilter = '';
  A.builders.renderStock = function () {
    var map = S.Stock.all(), warns = S.Stock.warnings();
    var st = $('#stockStats');
    if (st) { st.innerHTML = '';
      st.appendChild(A.builders.statCard('stock_count', num(S.Products.all().length), ''));
      st.appendChild(A.builders.statCard('stock_total_value', money(S.Stock.totalValue()), 'blue'));
      st.appendChild(A.builders.statCard('stock_low', num(warns.filter(function (w) { return (map[w.product.id] || 0) > 0; }).length), 'amber'));
      st.appendChild(A.builders.statCard('stock_out_of', num(warns.filter(function (w) { return (map[w.product.id] || 0) <= 0; }).length), 'red')); }
    var box = $('#stockList'); if (!box) return; box.innerHTML = '';
    var q = (A.builders.stockFilter || '').trim().toLowerCase();
    var list = S.Products.all();
    if (q) list = list.filter(function (p) {
      return (p.name_vi || '').toLowerCase().indexOf(q) >= 0 || (p.name_zh || '').toLowerCase().indexOf(q) >= 0 ||
             (p.code || '').toLowerCase().indexOf(q) >= 0; });
    list.sort(function (a, b) { return (map[a.id] || 0) - (map[b.id] || 0); });
    if (!list.length) { box.appendChild(emptyBox('no_products', 'no_products_hint', 'stack')); return; }
    list.forEach(function (p) {
      var qty = map[p.id] || 0, min = Number(p.min_stock) || 0, cls = 'ok', key = 'stock_ok';
      if (qty <= 0) { cls = 'out'; key = 'stock_out_of'; } else if (qty <= min) { cls = 'low'; key = 'stock_low'; }
      var row = el('div', 'row-item');
      row.appendChild(el('div', 'thumb', esc((p.name_vi || p.name_zh || '?').trim().charAt(0).toUpperCase())));
      var m = el('div', 'ri-main');
      m.appendChild(el('div', 'ri-title', esc(prodName(p))));
      var sub = el('div', 'ri-sub'), alt = prodNameAlt(p);
      if (p.code) sub.appendChild(el('span', '', esc(p.code)));
      if (alt) sub.appendChild(el('span', '', esc(alt)));
      sub.appendChild(el('span', '', esc(window.t('min_stock')) + ': ' + num(min)));
      sub.appendChild(el('span', '', esc(window.t('cost_price')) + ': ' + esc(money(p.cost))));
      m.appendChild(sub); row.appendChild(m);
      var r = el('div', 'ri-right');
      r.appendChild(el('div', 'ri-amount', num(qty) + ' <span style="font-size:.72rem;font-weight:600;color:var(--ink-3)">' + esc(p.unit || '') + '</span>'));
      var w2 = el('div', '', ''); w2.style.marginTop = '4px';
      w2.appendChild(el('span', 'badge ' + cls, esc(window.t(key))));
      r.appendChild(w2); row.appendChild(r); box.appendChild(row); });
  };
})();

/* app.js — phần 3: LÔ HÀNG */
(function () {
  'use strict';
  var A = window.App, S = window.Store, I = window.Icon;
  var $ = A.$, $$ = A.$$, el = A.el, esc = A.esc, money = A.money, num = A.num,
      prodName = A.prodName, partnerName = A.partnerName, toast = A.toast, modal = A.modal, emptyBox = A.emptyBox;

  var KIND_ICON = { goods: 'box', shipping: 'truck', tax: 'tax', other: 'coin' };

  A.builders.renderBatchPage = function () {
    renderBatchList();
  };

  function renderBatchList() {
    var box = $('#batchList'); if (!box) return; box.innerHTML = '';
    var list = S.Batches.all();
    if (!list.length) { box.appendChild(emptyBox('no_batches', 'batch_hint', 'batch')); return; }

    list.forEach(function (b) {
      var s = b.summary || {};
      var open = b.status !== 'closed';
      var row = el('div', 'row-item tap');
      row.appendChild(el('div', 'thumb ' + (open ? 'amber' : 'green'), I.batch({ w: 18 })));
      var m = el('div', 'ri-main');
      var t = el('div', 'ri-title');
      t.innerHTML = esc(b.code) + ' · ' + esc(partnerName(b.partner_id)) +
        ' <span class="badge ' + (open ? 'low' : 'ok') + '">' + esc(window.t(open ? 'batch_open' : 'batch_closed')) + '</span>';
      m.appendChild(t);
      var sub = el('div', 'ri-sub');
      sub.appendChild(el('span', '', esc(A.dateStr(b.date))));
      sub.appendChild(el('span', '', (s.itemCount || 0) + ' ' + esc(window.t('item_count'))));
      sub.appendChild(el('span', '', esc(window.t('total_qty')) + ': ' + num(s.totalQty || 0)));
      m.appendChild(sub);
      var line2 = el('div', 'ri-sub'); line2.style.marginTop = '3px';
      line2.appendChild(el('span', '', esc(window.t('capital_total')) + ': ' + esc(money(s.capitalTotal || 0))));
      if ((s.debt || 0) > 0) {
        line2.appendChild(el('span', 'badge low', esc(window.t('debt_total')) + ': ' + esc(money(s.debt))));
      } else {
        line2.appendChild(el('span', 'badge ok', esc(window.t('no_debt'))));
      }
      m.appendChild(line2);
      row.appendChild(m);
      row.addEventListener('click', function () { openBatch(b.id); });
      box.appendChild(row);
    });
  }

  /* ---- Tạo lô hàng ---- */
  A.builders.batchForm = function (b) {
    var isEdit = !!b, body = el('div', 'form');
    body.innerHTML =
      '<div class="row2"><div class="field"><label>' + esc(window.t('batch_code')) + '</label>' +
      '<input type="text" id="btCode" value="' + esc(b ? b.code : '') + '" placeholder="Tự động"></div>' +
      '<div class="field"><label>' + esc(window.t('date')) + '</label><input type="date" id="btDate" value="' + (b ? b.date : A.today()) + '"></div></div>' +
      '<div class="field"><label>' + esc(window.t('supplier')) + '</label><select id="btPartner">' +
      '<option value="">' + esc(window.t('select_supplier')) + '</option>' +
      S.Partners.all('supplier').map(function (p) {
        return '<option value="' + p.id + '"' + (b && Number(b.partner_id) === Number(p.id) ? ' selected' : '') + '>' +
          esc(p.name) + (p.phone ? ' — ' + esc(p.phone) : '') + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>' + esc(window.t('note')) + '</label><input type="text" id="btNote" value="' + esc(b ? b.note : '') + '"></div>';
    modal.open({ title: isEdit ? window.t('edit_batch') : window.t('add_batch'), body: body,
      buttons: [{ label: window.t('cancel'), kind: 'ghost' },
      { label: window.t('save'), kind: 'primary', icon: I.save({ w: 16 }), onClick: async function () {
        var pl = { code: $('#btCode').value.trim(), date: $('#btDate').value || A.today(),
          partner_id: $('#btPartner').value || null, note: $('#btNote').value.trim() };
        try {
          if (isEdit) { await S.Batches.update(b.id, pl); toast(window.t('batch_updated'), 'ok'); A.renderAll(); }
          else {
            pl.items = []; pl.costs = [];
            var nb = await S.Batches.create(pl);
            toast(window.t('batch_created'), 'ok');
            setTimeout(function () { openBatch(nb.id); }, 200);
          }
        } catch (er) { toast(A.errMsg(er.code), 'err'); return false; } } }] });
  };

  /* ---- Mở chi tiết lô (popup lớn) ---- */
  async function openBatch(id) {
    var box = el('div', '');
    box.innerHTML = '<div style="padding:24px;text-align:center">…</div>';
    modal.open({ title: window.t('batch'), body: box, keepOpen: true,
      buttons: [{ label: window.t('close'), kind: 'ghost' }] });
    await drawBatch(id, box);
  }
  A.builders.openBatch = openBatch;

  async function drawBatch(id, box) {
    var b;
    try { b = await S.Batches.detail(id); }
    catch (e) { box.innerHTML = '<p class="hint">Lỗi tải lô hàng</p>'; return; }

    var s = b.summary, open = b.status !== 'closed';
    box.innerHTML = '';

    /* Header */
    var head = el('div', '');
    head.innerHTML =
      '<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">' +
      '<div><div style="font-size:1.05rem;font-weight:800">' + esc(b.code) + '</div>' +
      '<div class="hint">' + esc(partnerName(b.partner_id)) + ' · ' + esc(A.dateStr(b.date)) + '</div></div>' +
      '<span class="badge ' + (open ? 'low' : 'ok') + '">' + esc(window.t(open ? 'batch_open' : 'batch_closed')) + '</span></div>' +
      (b.note ? '<p class="hint" style="margin-top:4px">' + esc(b.note) + '</p>' : '');
    box.appendChild(head);

    /* Hàng hoá */
    box.appendChild(el('div', '', '<div style="font-size:.82rem;font-weight:800;margin:14px 0 8px">' +
      esc(window.t('batch_items')) + ' (' + s.itemCount + ')</div>'));
    if (!b.items.length) box.appendChild(el('p', 'hint', esc(window.t('no_products'))));
    else {
      var tbl = el('div', '');
      b.items.forEach(function (it) {
        var p = S.Products.get(it.product_id);
        var pi = s.perItem.filter(function (x) { return Number(x.item.id) === Number(it.id); })[0];
        var row = el('div', 'row-item');
        row.style.padding = '9px 0';
        var m = el('div', 'ri-main');
        m.appendChild(el('div', 'ri-title', esc(p ? prodName(p) : '—')));
        var sub = el('div', 'ri-sub');
        sub.appendChild(el('span', '', num(it.qty) + ' ' + esc(p ? (p.unit || '') : '') + ' × ' + esc(money(it.cost)) + ' = ' + esc(money(it.qty * it.cost))));
        m.appendChild(sub);
        if (pi) {
          var sub2 = el('div', 'ri-sub'); sub2.style.marginTop = '3px';
          sub2.appendChild(el('span', 'badge blue', esc(window.t('unit_cost')) + ': ' + esc(money(pi.unitCost))));
          sub2.appendChild(el('span', '', esc(window.t('alloc_label')) + ': ' + esc(money(pi.allocated))));
          m.appendChild(sub2);
        }
        row.appendChild(m);
        if (open) {
          var bd = el('button', 'icon-btn sm del', I.trash({ w: 14 }));
          bd.addEventListener('click', async function () {
            try { await S.Batches.removeItem(b.id, it.id); toast(window.t('item_deleted'), 'ok'); drawBatch(id, box); A.renderAll(); }
            catch (e) { toast(A.errMsg(e.code), 'err'); } });
          row.appendChild(bd);
        }
        tbl.appendChild(row);
      });
      box.appendChild(tbl);
    }
    if (open) {
      var ai = el('button', 'btn ghost sm');
      ai.style.cssText = 'margin-top:8px;width:100%';
      ai.innerHTML = '<span class="bi">' + I.plus({ w: 14 }) + '</span><em>' + esc(window.t('add_item')) + '</em>';
      ai.addEventListener('click', function () { addItemForm(b, function () { drawBatch(id, box); }); });
      box.appendChild(ai);
    }

    /* Các khoản */
    box.appendChild(el('div', '', '<div style="font-size:.82rem;font-weight:800;margin:16px 0 8px">' +
      esc(window.t('batch_costs')) + ' (' + b.costs.length + ')</div>'));
    if (!b.costs.length) box.appendChild(el('p', 'hint', esc(window.t('no_data'))));
    else {
      b.costs.forEach(function (c) {
        var row = el('div', 'row-item');
        row.style.padding = '9px 0';
        row.appendChild(el('div', 'thumb' + (c.kind === 'goods' ? '' : c.kind === 'tax' ? ' purple' : ' amber'),
          I[KIND_ICON[c.kind] || 'coin']({ w: 16 })));
        var m = el('div', 'ri-main');
        m.appendChild(el('div', 'ri-title', esc(c.label || window.t('kind_' + c.kind))));
        var sub = el('div', 'ri-sub');
        sub.appendChild(el('span', '', esc(A.dateStr(c.date))));
        sub.appendChild(el('span', '', esc(window.t('kind_' + c.kind))));
        sub.appendChild(el('span', 'badge ' + (c.paid ? 'ok' : 'low'), esc(window.t(c.paid ? 'cost_paid' : 'cost_unpaid'))));
        m.appendChild(sub); row.appendChild(m);
        var r = el('div', 'ri-right');
        r.appendChild(el('div', 'ri-amount', money(c.amount)));
        row.appendChild(r);
        if (open) {
          var bd = el('button', 'icon-btn sm del', I.trash({ w: 14 }));
          bd.addEventListener('click', function () { modal.confirm(window.t('confirm_delete'), async function () {
            try { await S.Batches.removeCost(b.id, c.id); toast(window.t('cost_deleted'), 'ok'); drawBatch(id, box); A.renderAll(); }
            catch (e) { toast(A.errMsg(e.code), 'err'); } }); });
          row.appendChild(bd);
        }
        box.appendChild(row);
      });
    }
    if (open) {
      var ac = el('button', 'btn primary sm');
      ac.style.cssText = 'margin-top:8px;width:100%';
      ac.innerHTML = '<span class="bi">' + I.plus({ w: 14 }) + '</span><em>' + esc(window.t('add_cost')) + '</em>';
      ac.addEventListener('click', function () { addCostForm(b, function () { drawBatch(id, box); }); });
      box.appendChild(ac);
    }

    /* Tổng kết */
    var sum2 = el('div', 'debt-sum');
    sum2.style.marginTop = '18px';
    sum2.innerHTML =
      '<div class="ds-item"><div class="l">' + esc(window.t('goods_total')) + '</div><div class="v">' + esc(money(s.goodsTotal)) + '</div></div>' +
      '<div class="ds-item"><div class="l">' + esc(window.t('extra_total')) + '</div><div class="v">' + esc(money(s.extraTotal)) + '</div></div>' +
      '<div class="ds-item"><div class="l">' + esc(window.t('capital_total')) + '</div><div class="v amber">' + esc(money(s.capitalTotal)) + '</div></div>';
    box.appendChild(sum2);
    var sum3 = el('div', 'debt-sum');
    sum3.innerHTML =
      '<div class="ds-item"><div class="l">' + esc(window.t('paid_total')) + '</div><div class="v green">' + esc(money(s.paidTotal)) + '</div></div>' +
      '<div class="ds-item"><div class="l">' + esc(window.t('debt_total')) + '</div><div class="v red">' + esc(money(s.debt)) + '</div></div>' +
      '<div class="ds-item"><div class="l">' + esc(window.t('unit_cost')) + '</div><div class="v">' + (s.perItem.length ? esc(money(s.perItem[0].unitCost)) : '—') + '</div></div>';
    box.appendChild(sum3);

    /* Nút chốt / mở lại */
    var foot = el('div', '');
    foot.style.marginTop = '14px';
    var tb = el('button', 'btn ' + (open ? 'green' : 'ghost') + ' full');
    tb.innerHTML = '<span class="bi">' + I[open ? 'lock' : 'unlock']({ w: 15 }) + '</span><em>' +
      esc(window.t(open ? 'close_batch' : 'reopen_batch')) + '</em>';
    tb.addEventListener('click', async function () {
      try {
        await S.Batches.update(b.id, { status: open ? 'closed' : 'open' });
        toast(window.t(open ? 'batch_closed_msg' : 'batch_open_msg'), 'ok');
        drawBatch(id, box); A.renderAll();
      } catch (e) { toast(A.errMsg(e.code), 'err'); }
    });
    foot.appendChild(tb);
    box.appendChild(foot);
  }

  /* ---- Form thêm mặt hàng ---- */
  function addItemForm(b, done) {
    var body = el('div', 'form');
    body.innerHTML =
      '<div class="field"><label>' + esc(window.t('product')) + '</label><select id="aiProd">' +
      S.Products.all().map(function (p) { return '<option value="' + p.id + '">' + esc(prodName(p)) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="row2"><div class="field"><label>' + esc(window.t('quantity')) + '</label><input type="number" id="aiQty" min="1" step="1" value="1"></div>' +
      '<div class="field"><label>' + esc(window.t('price')) + '</label><input type="number" id="aiCost" min="0" step="1" value="0"></div></div>';
    modal.open({ title: window.t('add_item'), body: body,
      buttons: [{ label: window.t('cancel'), kind: 'ghost' },
      { label: window.t('save'), kind: 'primary', icon: I.save({ w: 16 }), onClick: async function () {
        var pid = $('#aiProd').value, qty = Number($('#aiQty').value), cost = Number($('#aiCost').value) || 0;
        if (!pid || !qty || qty <= 0) { toast(window.t('required'), 'err'); return false; }
        try { await S.Batches.addItem(b.id, { product_id: Number(pid), qty: qty, cost: cost });
          toast(window.t('item_added'), 'ok'); A.renderAll(); done && done(); }
        catch (e) { toast(A.errMsg(e.code), 'err'); return false; } } }] });
  }

  /* ---- Form thêm khoản chi phí ---- */
  function addCostForm(b, done) {
    var body = el('div', 'form');
    body.innerHTML =
      '<div class="field"><label>' + esc(window.t('cost_kind')) + '</label><select id="acKind">' +
      ['goods','shipping','tax','other'].map(function (k) {
        return '<option value="' + k + '">' + esc(window.t('kind_' + k)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>' + esc(window.t('cost_label')) + '</label><input type="text" id="acLabel" placeholder="VD: Hóa đơn vận chuyển"></div>' +
      '<div class="row2"><div class="field"><label>' + esc(window.t('amount')) + '</label><input type="number" id="acAmt" min="1" step="1"></div>' +
      '<div class="field"><label>' + esc(window.t('date')) + '</label><input type="date" id="acDate" value="' + A.today() + '"></div></div>' +
      '<div class="field"><label>' + esc(window.t('status')) + '</label><select id="acPaid">' +
      '<option value="1">' + esc(window.t('cost_paid')) + '</option>' +
      '<option value="0">' + esc(window.t('cost_unpaid')) + '</option></select></div>';
    modal.open({ title: window.t('add_cost'), body: body,
      buttons: [{ label: window.t('cancel'), kind: 'ghost' },
      { label: window.t('save'), kind: 'primary', icon: I.save({ w: 16 }), onClick: async function () {
        var amt = Number($('#acAmt').value);
        if (!amt || amt <= 0) { toast(window.t('required'), 'err'); return false; }
        try {
          await S.Batches.addCost(b.id, {
            kind: $('#acKind').value, label: $('#acLabel').value.trim(), amount: amt,
            date: $('#acDate').value || A.today(), paid: $('#acPaid').value === '1'
          });
          toast(window.t('cost_added'), 'ok'); A.renderAll(); done && done();
        } catch (e) { toast(A.errMsg(e.code), 'err'); return false; } } }] });
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#btnAddBatch')) A.builders.batchForm(null);
  });
})();

/* app.js — phần 4: BÁN HÀNG + KHÁCH/NCC */
(function () {
  'use strict';
  var A = window.App, S = window.Store, I = window.Icon;
  var $ = A.$, el = A.el, esc = A.esc, money = A.money, num = A.num,
      prodName = A.prodName, toast = A.toast, modal = A.modal, emptyBox = A.emptyBox;

  var cart = [];
  A.builders.sellFilter = '';

  function fillCust() {
    var sel = $('#sellCustomer'); if (!sel) return;
    var c = sel.value; sel.innerHTML = '';
    var o0 = el('option', '', esc(window.t('walk_in'))); o0.value = ''; sel.appendChild(o0);
    S.Partners.all('customer').forEach(function (p) {
      var o = el('option', '', esc(p.name) + (p.phone ? ' — ' + esc(p.phone) : '')); o.value = p.id; sel.appendChild(o); });
    if (c) sel.value = c;
  }

  A.builders.renderSellPage = function () { fillCust(); renderPicker(); renderCart(); renderSellList(); };

  function renderPicker() {
    var box = $('#sellPicker'); if (!box) return; box.innerHTML = '';
    var q = (A.builders.sellFilter || '').trim().toLowerCase(), sm = S.Stock.all();
    var list = S.Products.all();
    if (q) list = list.filter(function (p) {
      return (p.name_vi || '').toLowerCase().indexOf(q) >= 0 || (p.name_zh || '').toLowerCase().indexOf(q) >= 0 ||
             (p.code || '').toLowerCase().indexOf(q) >= 0; });
    if (!list.length) { box.appendChild(emptyBox('no_products', 'no_products_hint', 'box')); return; }
    list.forEach(function (p) {
      var qty = sm[p.id] || 0, card = el('button', 'pick-card');
      card.type = 'button'; card.disabled = qty <= 0;
      card.innerHTML = '<div class="pick-name">' + esc(prodName(p)) + '</div>' +
        '<div class="pick-price">' + esc(money(p.price)) + '</div>' +
        '<div class="pick-stock">' + esc(window.t('cost_price')) + ': ' + esc(money(p.cost)) + ' · ' +
        esc(window.t('stock')) + ': ' + num(qty) + ' ' + esc(p.unit || '') + '</div>';
      card.addEventListener('click', function () { addCart(p.id); });
      box.appendChild(card); });
  }

  function addCart(pid) {
    var p = S.Products.get(pid); if (!p) return;
    var have = S.Stock.qty(pid);
    var line = cart.filter(function (c) { return Number(c.productId) === Number(pid); })[0];
    var q = line ? line.qty : 0;
    if (q + 1 > have) { toast(window.t('not_enough_stock'), 'err'); return; }
    if (line) line.qty += 1; else cart.push({ productId: Number(pid), qty: 1 });
    renderCart();
  }

  function totals() {
    var sub = 0;
    cart.forEach(function (c) { var p = S.Products.get(c.productId); if (p) sub += c.qty * (Number(p.price) || 0); });
    var d = Number($('#sellDiscount') ? $('#sellDiscount').value : 0) || 0;
    return { subtotal: sub, discount: d, total: Math.max(0, sub - d) };
  }

  function renderCart() {
    var box = $('#cartBox'); if (!box) return; box.innerHTML = '';
    var foot = $('#cartFoot'), cnt = $('#cartCount');
    if (cnt) cnt.textContent = String(cart.reduce(function (s, c) { return s + c.qty; }, 0));
    if (!cart.length) { if (foot) foot.hidden = true; box.appendChild(emptyBox('cart_empty', 'cart_empty_hint', 'cart')); return; }
    cart.forEach(function (c, idx) {
      var p = S.Products.get(c.productId); if (!p) return;
      var have = S.Stock.qty(p.id), line = el('div', 'cart-line');
      var m = el('div', 'cl-main');
      m.appendChild(el('div', 'cl-name', esc(prodName(p))));
      m.appendChild(el('div', 'cl-price', esc(money(p.price)) + ' · ' + esc(window.t('stock')) + ': ' + num(have)));
      line.appendChild(m);
      var qc = el('div', 'qty-ctrl');
      var mi = el('button', 'qty-btn', '−');
      mi.addEventListener('click', function () { if (cart[idx].qty > 1) cart[idx].qty -= 1; else cart.splice(idx, 1); renderCart(); });
      var pl = el('button', 'qty-btn', '+');
      pl.addEventListener('click', function () { if (cart[idx].qty + 1 > have) { toast(window.t('not_enough_stock'), 'err'); return; }
        cart[idx].qty += 1; renderCart(); });
      qc.appendChild(mi); qc.appendChild(el('span', 'qty-val', num(c.qty))); qc.appendChild(pl);
      line.appendChild(qc);
      line.appendChild(el('div', 'cl-sum', money(c.qty * (p.price || 0))));
      var rm = el('button', 'icon-btn sm del', I.close({ w: 14 }));
      rm.addEventListener('click', function () { cart.splice(idx, 1); renderCart(); });
      line.appendChild(rm); box.appendChild(line); });
    var t = totals();
    if ($('#cartSubtotal')) $('#cartSubtotal').textContent = money(t.subtotal);
    if ($('#cartTotal')) $('#cartTotal').textContent = money(t.total);
    var pe = $('#sellPaid'); if (pe && !pe.dataset.touched) pe.value = t.total;
    updDebt(); if (foot) foot.hidden = false;
  }

  function updDebt() {
    var t = totals(), paid = Number($('#sellPaid') ? $('#sellPaid').value : 0) || 0;
    var d = $('#cartDebt'); if (d) d.textContent = money(Math.max(0, t.total - paid));
  }

  document.addEventListener('input', function (e) {
    if (!e.target) return;
    if (e.target.id === 'sellDiscount') { var t = totals();
      if ($('#cartTotal')) $('#cartTotal').textContent = money(t.total);
      var pe = $('#sellPaid'); if (pe && !pe.dataset.touched) pe.value = t.total; updDebt(); }
    if (e.target.id === 'sellPaid') { e.target.dataset.touched = '1'; updDebt(); }
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('#btnCheckout'); if (!btn) return;
    if (!cart.length) { toast(window.t('cart_empty'), 'err'); return; }
    for (var i = 0; i < cart.length; i++) {
      var p = S.Products.get(cart[i].productId);
      if (p && cart[i].qty > S.Stock.qty(p.id)) { toast(window.t('not_enough_stock') + ': ' + prodName(p), 'err'); return; } }
    var t = totals();
    var items = cart.map(function (c) { var p = S.Products.get(c.productId);
      return { productId: c.productId, qty: c.qty, price: p.price || 0, cost: p.cost || 0 }; });
    var custId = $('#sellCustomer') ? $('#sellCustomer').value : '';
    var paid = Number($('#sellPaid') ? $('#sellPaid').value : 0) || 0;
    btn.disabled = true;
    (async function () {
      try {
        var sale = await S.Sells.create({ items: items, partner_id: custId || null, discount: t.discount, date: A.today(), paid: paid });
        cart = [];
        if ($('#sellCustomer')) $('#sellCustomer').value = '';
        if ($('#sellDiscount')) $('#sellDiscount').value = '0';
        var pe = $('#sellPaid'); if (pe) { pe.value = '0'; delete pe.dataset.touched; }
        toast(window.t('checkout_success') + ' · ' + money(sale.total) + (sale.debt > 0 ? ' · ' + window.t('debt') + ': ' + money(sale.debt) : ''), 'ok');
        A.renderAll(); setTimeout(function () { showReceipt(sale.id); }, 200);
      } catch (er) { toast(A.errMsg(er.code), 'err'); }
      finally { btn.disabled = false; }
    })();
  });

  function renderSellList() {
    var box = $('#sellList'); if (!box) return; box.innerHTML = '';
    var list = S.Sells.all().filter(function (s) { return !s.adjust; });
    if (!list.length) { box.appendChild(emptyBox('no_sells', 'no_sales_data', 'receipt')); return; }
    list.slice(0, 120).forEach(function (s) {
      var n = (s.items || []).reduce(function (a, i) { return a + i.qty; }, 0);
      var paid = S.Payments.paidOnRef('sell', s.id), debt = Math.max(0, (Number(s.total) || 0) - paid);
      var row = el('div', 'row-item tap');
      row.appendChild(el('div', 'thumb green', I.receipt({ w: 18 })));
      var m = el('div', 'ri-main');
      m.appendChild(el('div', 'ri-title', s.customer ? esc(s.customer) : esc(window.t('walk_in'))));
      var sub = el('div', 'ri-sub');
      sub.appendChild(el('span', '', esc(A.dateStr(s.date))));
      sub.appendChild(el('span', '', num(n) + ' ' + esc(window.t('items'))));
      m.appendChild(sub);
      if (debt > 0) { var w = el('div', 'ri-sub'); w.style.marginTop = '4px';
        w.appendChild(el('span', 'badge low', esc(window.t('remaining_debt')) + ': ' + esc(money(debt)))); m.appendChild(w); }
      row.appendChild(m);
      var rt = el('div', 'ri-right');
      rt.appendChild(el('div', 'ri-amount in', money(s.total)));
      if (debt <= 0) { var w2 = el('div', '', ''); w2.style.marginTop = '4px';
        w2.appendChild(el('span', 'badge ok', esc(window.t('no_debt')))); rt.appendChild(w2); }
      row.appendChild(rt);
      var acts = el('div', 'ri-actions');
      if (debt > 0 && s.partner_id) { var bp = el('button', 'icon-btn sm money', I.coin({ w: 15 }));
        bp.addEventListener('click', function (ev) { ev.stopPropagation(); A.builders.payForm('sell', s.id, s.partner_id, debt); });
        acts.appendChild(bp); }
      var bv = el('button', 'icon-btn sm edit', I.receipt({ w: 15 }));
      bv.addEventListener('click', function (ev) { ev.stopPropagation(); showReceipt(s.id); });
      var bpr = el('button', 'icon-btn sm money', I.download({ w: 15 }));
      bpr.title = window.t('print_receipt');
      bpr.addEventListener('click', function (ev) { ev.stopPropagation(); A.builders.printDialog(s.id); });
      var bd = el('button', 'icon-btn sm del', I.trash({ w: 15 }));
      bd.addEventListener('click', function (ev) { ev.stopPropagation();
        modal.confirm(window.t('confirm_delete'), async function () {
          try { await S.Sells.remove(s.id); toast(window.t('deleted'), 'ok'); A.renderAll(); }
          catch (er) { toast(A.errMsg(er.code), 'err'); } }); });
      acts.appendChild(bv); acts.appendChild(bpr); acts.appendChild(bd);
      row.appendChild(acts); row.addEventListener('click', function () { showReceipt(s.id); });
      box.appendChild(row); });
  }

  function showReceipt(saleId) {
    var s = S.Sells.get(saleId); if (!s) return;
    var shop = S.Settings.get().shopName || window.t('app_name');
    var paid = S.Payments.paidOnRef('sell', s.id), debt = Math.max(0, (Number(s.total) || 0) - paid);
    var lines = '';
    (s.items || []).forEach(function (it) {
      var p = S.Products.get(it.productId);
      lines += '<div class="rc-line"><span class="nm">' + esc(p ? prodName(p) : '—') + ' × ' + num(it.qty) + '</span><span>' + esc(money(it.qty * it.price)) + '</span></div>'; });
    var body = el('div', '', '<div class="receipt"><div class="rc-shop">' + esc(shop) + '</div>' +
      '<div class="rc-meta">' + esc(A.dateStr(s.date)) + (s.customer ? ' · ' + esc(s.customer) : '') + '</div>' +
      '<div class="rc-sep"></div>' + lines + '<div class="rc-sep"></div>' +
      '<div class="rc-line"><span class="nm">' + esc(window.t('total')) + '</span><span>' + esc(money(s.subtotal || 0)) + '</span></div>' +
      (s.discount ? '<div class="rc-line"><span class="nm">' + esc(window.t('discount')) + '</span><span>−' + esc(money(s.discount)) + '</span></div>' : '') +
      '<div class="rc-line tot"><span class="nm">' + esc(window.t('grand_total')) + '</span><span>' + esc(money(s.total)) + '</span></div>' +
      '<div class="rc-line"><span class="nm">' + esc(window.t('amount_paid')) + '</span><span>' + esc(money(paid)) + '</span></div>' +
      (debt > 0 ? '<div class="rc-line debt"><span class="nm">' + esc(window.t('remaining_debt')) + '</span><span>' + esc(money(debt)) + '</span></div>' : '') +
      '</div>');
    var btns = [{ label: window.t('close'), kind: 'ghost' },
      { label: window.t('print_receipt'), kind: 'primary', icon: I.receipt({ w: 15 }),
        onClick: function () { setTimeout(function () { A.builders.printDialog(s.id); }, 150); } }];
    if (debt > 0 && s.partner_id) btns.splice(1, 0, { label: window.t('pay_debt'), kind: 'green', icon: I.coin({ w: 15 }),
      onClick: function () { setTimeout(function () { A.builders.payForm('sell', s.id, s.partner_id, debt); }, 150); } });
    modal.open({ title: window.t('receipt'), body: body, buttons: btns });
  }
  A.builders.showReceipt = showReceipt;

  /* ---- Form thanh toán ---- */
  A.builders.payForm = function (refType, refId, partnerId, maxAmt) {
    var isSup = refType === 'import', partner = S.Partners.get(partnerId);
    var body = el('div', 'form');
    body.innerHTML = '<p style="font-size:.86rem;color:var(--ink-2)">' + esc(partner ? partner.name : '') + '<br>' +
      '<span style="font-size:.78rem;color:var(--ink-3)">' + esc(window.t('remaining_debt')) + ': <b style="color:var(--amber)">' + esc(money(maxAmt)) + '</b></span></p>' +
      '<div class="field"><label>' + esc(window.t('payment_amount')) + '</label><input type="number" id="payAmt" min="1" step="1" value="' + Math.round(maxAmt) + '"></div>' +
      '<div class="field"><label>' + esc(window.t('date')) + '</label><input type="date" id="payDate" value="' + A.today() + '"></div>' +
      '<div class="field"><label>' + esc(window.t('note')) + '</label><input type="text" id="payNote"></div>';
    modal.open({ title: isSup ? window.t('pay_supplier_debt') : window.t('pay_debt'), body: body,
      buttons: [{ label: window.t('cancel'), kind: 'ghost' },
      { label: window.t('save'), kind: 'primary', icon: I.save({ w: 16 }), onClick: async function () {
        var amt = Number($('#payAmt').value);
        if (!amt || amt <= 0) { toast(window.t('required'), 'err'); return false; }
        try { await S.Payments.create({ partner_id: partnerId, ref_type: refType, ref_id: refId,
          amount: amt, date: $('#payDate').value || A.today(), note: $('#payNote').value });
          toast(window.t('payment_added'), 'ok'); A.renderAll(); }
        catch (er) { toast(A.errMsg(er.code), 'err'); return false; } } }] });
  };
})();

/* app.js — phần 5: CÔNG NỢ + KHÁCH/NCC + THU CHI */
(function () {
  'use strict';
  var A = window.App, S = window.Store, I = window.Icon;
  var $ = A.$, $$ = A.$$, el = A.el, esc = A.esc, money = A.money, num = A.num,
      partnerName = A.partnerName, toast = A.toast, modal = A.modal, emptyBox = A.emptyBox;

  A.builders.debtTab = 'customer';
  A.builders.debtFilter = 'debt';

  A.builders.renderDebt = function () {
    var tab = A.builders.debtTab, isSup = tab === 'supplier';
    $$('#debtTab .seg-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === tab); });
    var t1 = $('#debtListTitle'); if (t1) t1.textContent = isSup ? window.t('debt_payable') : window.t('debt_receivable');

    var sum = S.Debts.summary(tab), tot = S.Debts.totals();
    var st = $('#debtStats');
    if (st) { st.innerHTML = '';
      st.appendChild(A.builders.statCard('total_invoice', money(sum.grand.total), ''));
      st.appendChild(A.builders.statCard('total_paid', money(sum.grand.paid), 'green'));
      st.appendChild(A.builders.statCard(isSup ? 'debt_payable' : 'debt_receivable', money(sum.grand.debt), 'amber'));
      st.appendChild(A.builders.statCard('debt_net', money(tot.net), tot.net >= 0 ? 'green' : 'red')); }

    var box = $('#debtList'); if (!box) return; box.innerHTML = '';
    var list = sum.partners;
    if (A.builders.debtFilter === 'debt') list = list.filter(function (x) { return x.debt > 0; });
    if (!list.length) { box.appendChild(emptyBox('no_data', isSup ? 'supplier_hint' : 'partner_hint', 'scale')); return; }

    list.forEach(function (it) {
      var p = it.partner, row = el('div', 'row-item tap');
      row.appendChild(el('div', 'thumb ' + (isSup ? 'purple' : 'amber'), esc((p.name || '?').charAt(0).toUpperCase())));
      var m = el('div', 'ri-main');
      m.appendChild(el('div', 'ri-title', esc(p.name)));
      var sub = el('div', 'ri-sub');
      if (p.phone) sub.appendChild(el('span', '', esc(p.phone)));
      sub.appendChild(el('span', '', it.invoiceCount + ' ' + esc(window.t('receipt_code'))));
      m.appendChild(sub);
      row.appendChild(m);
      var rt = el('div', 'ri-right');
      if (it.debt > 0) { rt.appendChild(el('div', 'ri-amount debt', money(it.debt)));
        rt.appendChild(el('div', 'ri-sub', esc(window.t('remaining_debt')))); }
      else { var w = el('div', '', ''); w.style.marginTop = '4px';
        w.appendChild(el('span', 'badge ok', esc(window.t('no_debt')))); rt.appendChild(w); }
      row.appendChild(rt);
      row.addEventListener('click', function () { A.builders.showDebtDetail(p.id, tab); });
      box.appendChild(row); });
  };

  A.builders.showDebtDetail = async function (partnerId, kind) {
    var body = el('div', '');
    body.innerHTML = '<div style="padding:20px;text-align:center">…</div>';
    modal.open({ title: window.t('debt_detail'), body: body, keepOpen: true,
      buttons: [{ label: window.t('close'), kind: 'ghost' }] });
    var d;
    try { d = await S.Debts.detail(kind, partnerId); }
    catch (e) { body.innerHTML = '<p class="hint">Lỗi tải dữ liệu</p>'; return; }

    var isSup = kind === 'supplier', p = d.partner;
    body.innerHTML = '';
    var sum = el('div', 'debt-sum');
    sum.innerHTML = '<div class="ds-item"><div class="l">' + esc(window.t('total_invoice')) + '</div><div class="v">' + esc(money(d.totals.total)) + '</div></div>' +
      '<div class="ds-item"><div class="l">' + esc(window.t('total_paid')) + '</div><div class="v green">' + esc(money(d.totals.paid)) + '</div></div>' +
      '<div class="ds-item"><div class="l">' + esc(window.t('total_debt')) + '</div><div class="v amber">' + esc(money(d.totals.debt)) + '</div></div>';
    body.appendChild(sum);
    if (p.phone || p.address) body.appendChild(el('p', 'hint', esc([p.phone, p.address].filter(Boolean).join(' · '))));

    body.appendChild(el('div', '', '<div style="font-size:.8rem;font-weight:800;color:var(--ink-2);margin-bottom:8px">' +
      esc(window.t('debt_invoices')) + ' (' + d.invoices.length + ')</div>'));
    if (!d.invoices.length) body.appendChild(emptyBox('no_invoices', '', 'receipt'));
    else d.invoices.forEach(function (iv) {
      var it = el('div', 'inv-item');
      var isBatch = iv.type === 'batch';
      it.innerHTML = '<div class="inv-head"><div><div class="inv-code">' +
        (isBatch ? esc(iv.label) : '#' + esc(iv.id)) + '</div>' +
        '<div class="inv-date">' + esc(A.dateStr(iv.date)) + (isBatch ? ' · ' + esc(window.t('batch')) : '') + '</div></div>' +
        '<div class="inv-amts"><div>' + esc(money(iv.amount)) + '</div></div></div>';
      body.appendChild(it); });

    if (d.payments.length) {
      body.appendChild(el('div', '', '<div style="font-size:.8rem;font-weight:800;color:var(--ink-2);margin:14px 0 8px">' +
        esc(window.t('debt_payments')) + ' (' + d.payments.length + ')</div>'));
      d.payments.slice().reverse().forEach(function (x) {
        var row = el('div', 'row-item'); row.style.padding = '9px 0';
        var m = el('div', 'ri-main');
        m.appendChild(el('div', 'ri-title', esc(money(x.amount))));
        m.appendChild(el('div', 'ri-sub', esc(A.dateStr(x.date)) + (x.note ? ' · ' + esc(x.note) : '')));
        row.appendChild(m);
        var bd = el('button', 'icon-btn sm del', I.trash({ w: 14 }));
        bd.addEventListener('click', function () { modal.confirm(window.t('confirm_delete'), async function () {
          try { await S.Payments.remove(x.id); toast(window.t('payment_deleted'), 'ok');
            A.builders.showDebtDetail(partnerId, kind); A.renderAll(); }
          catch (er) { toast(A.errMsg(er.code), 'err'); } }); });
        row.appendChild(bd); body.appendChild(row); });
    }
  };

  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var tb = e.target.closest('#debtTab .seg-btn');
    if (tb) { A.builders.debtTab = tb.dataset.tab; A.builders.renderDebt(); return; }
    var ch = e.target.closest('#debtFilter .chip');
    if (ch) { A.builders.debtFilter = ch.dataset.df;
      $$('#debtFilter .chip').forEach(function (c) { c.classList.toggle('active', c === ch); });
      A.builders.renderDebt(); }
  });

  /* ---- Danh bạ KH/NCC ---- */
  A.builders.partnerFilter = '';

  A.builders.renderPartnerList = function (kind, boxId, formFn) {
    var box = $(boxId); if (!box) return; box.innerHTML = '';
    var q = (A.builders.partnerFilter || '').trim().toLowerCase();
    var list = S.Partners.all(kind);
    if (q) list = list.filter(function (p) {
      return (p.name || '').toLowerCase().indexOf(q) >= 0 || (p.phone || '').toLowerCase().indexOf(q) >= 0; });
    if (!list.length) {
      var key = kind === 'supplier' ? 'no_suppliers' : 'no_customers';
      var hint = kind === 'supplier' ? 'supplier_hint' : 'partner_hint';
      var e = emptyBox(q ? 'no_data' : key, q ? 'search' : hint, 'users');
      if (!q) { var b = el('button', 'btn primary sm');
        b.innerHTML = '<span class="bi">' + I.plus({ w: 15 }) + '</span><em>' +
          esc(window.t(kind === 'supplier' ? 'add_supplier' : 'add_customer')) + '</em>';
        b.style.marginTop = '14px'; b.addEventListener('click', function () { formFn(null, kind); });
        e.appendChild(b); }
      box.appendChild(e); return; }
    var sum = S.Debts.summary(kind);
    list.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    list.forEach(function (p) {
      var d = sum.partners.filter(function (x) { return Number(x.partner.id) === Number(p.id); })[0];
      var debt = d ? d.debt : 0;
      var row = el('div', 'row-item');
      row.appendChild(el('div', 'thumb' + (kind === 'supplier' ? ' purple' : ''), esc((p.name || '?').charAt(0).toUpperCase())));
      var m = el('div', 'ri-main');
      m.appendChild(el('div', 'ri-title', esc(p.name)));
      var sub = el('div', 'ri-sub');
      if (p.phone) sub.appendChild(el('span', '', esc(p.phone)));
      if (p.address) sub.appendChild(el('span', '', esc(p.address)));
      m.appendChild(sub); row.appendChild(m);
      if (debt !== 0) { var r = el('div', 'ri-right');
        r.appendChild(el('div', 'ri-amount debt', money(Math.abs(debt))));
        row.appendChild(r); }
      var acts = el('div', 'ri-actions');
      var be = el('button', 'icon-btn sm edit', I.edit({ w: 15 })); be.addEventListener('click', function () { formFn(p, kind); });
      var bd = el('button', 'icon-btn sm del', I.trash({ w: 15 }));
      bd.addEventListener('click', function () { modal.confirm(window.t('confirm_delete'), async function () {
        try { await S.Partners.remove(p.id);
          toast(window.t(kind === 'supplier' ? 'supplier_deleted' : 'customer_deleted'), 'ok'); A.renderAll(); }
        catch (er) { toast(A.errMsg(er.code), 'err'); } }); });
      acts.appendChild(be); acts.appendChild(bd); row.appendChild(acts); box.appendChild(row); });
  };

  A.builders.partnerForm = function (p, kind) {
    var isEdit = !!p, isSup = kind === 'supplier', body = el('div', 'form');
    body.innerHTML =
      '<div class="field"><label>' + esc(window.t('partner_name')) + '</label><input type="text" id="paName" value="' + esc(p ? p.name : '') + '"></div>' +
      '<div class="field"><label>' + esc(window.t('phone')) + '</label><input type="tel" id="paPhone" value="' + esc(p ? p.phone : '') + '"></div>' +
      '<div class="field"><label>' + esc(window.t('address')) + '</label><input type="text" id="paAddr" value="' + esc(p ? p.address : '') + '"></div>' +
      '<div class="field"><label>' + esc(window.t('note')) + '</label><input type="text" id="paNote" value="' + esc(p ? p.note : '') + '"></div>';
    modal.open({ title: isEdit ? window.t(isSup ? 'edit_supplier' : 'edit_customer') : window.t(isSup ? 'add_supplier' : 'add_customer'),
      body: body, buttons: [{ label: window.t('cancel'), kind: 'ghost' },
      { label: window.t('save'), kind: 'primary', icon: I.save({ w: 16 }), onClick: async function () {
        var name = $('#paName').value.trim();
        if (!name) { toast(window.t('required'), 'err'); return false; }
        var pl = { kind: kind, name: name, phone: $('#paPhone').value.trim(),
          address: $('#paAddr').value.trim(), note: $('#paNote').value.trim() };
        try { if (isEdit) { await S.Partners.update(p.id, pl); toast(window.t(isSup ? 'supplier_updated' : 'customer_updated'), 'ok'); }
          else { await S.Partners.create(pl); toast(window.t(isSup ? 'supplier_added' : 'customer_added'), 'ok'); } }
        catch (er) { toast(A.errMsg(er.code), 'err'); return false; }
        A.renderAll(); } }] });
  };

  /* ---- THU CHI ---- */
  var mType = 'in', mFilter = 'all';
  var CATS_IN = ['sell', 'collect', 'other'];
  var CATS_OUT = ['import', 'pay_supplier', 'salary', 'rent', 'shipping', 'other'];

  A.builders.renderMoney = function () {
    fillCats();
    var d = $('#moneyDate'); if (d && !d.value) d.value = A.today();
    var st = $('#moneyStats');
    if (st) { st.innerHTML = '';
      var inc = S.Money.incomeInRange(null, null), exp = S.Money.expenseInRange(null, null);
      st.appendChild(A.builders.statCard('income_total', money(inc), 'green'));
      st.appendChild(A.builders.statCard('expense_total', money(exp), 'red'));
      st.appendChild(A.builders.statCard('balance', money(inc - exp), inc - exp >= 0 ? 'blue' : 'red')); }
    renderMList();
  };
  function fillCats() {
    var sel = $('#moneyCategory'); if (!sel) return;
    var cats = mType === 'in' ? CATS_IN : CATS_OUT;
    sel.innerHTML = '';
    cats.forEach(function (c) { var o = el('option', '', esc(window.t('cat_' + c))); o.value = c; sel.appendChild(o); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#moneyTypeSeg .seg-btn');
    if (b) { mType = b.dataset.type;
      $$('#moneyTypeSeg .seg-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
      fillCats(); return; }
    var c = e.target.closest && e.target.closest('#moneyFilter .chip');
    if (c) { mFilter = c.dataset.mf;
      $$('#moneyFilter .chip').forEach(function (x) { x.classList.toggle('active', x === c); });
      renderMList(); }
  });
  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'moneyForm') return;
    e.preventDefault();
    var amt = Number($('#moneyAmount').value);
    if (!amt || amt <= 0) { toast(window.t('required'), 'err'); return; }
    (async function () {
      try {
        await S.Money.create({ type: mType, category: $('#moneyCategory').value, amount: amt,
          descr: $('#moneyDesc').value, date: $('#moneyDate').value || A.today() });
        toast(window.t('saved'), 'ok');
        $('#moneyAmount').value = ''; $('#moneyDesc').value = ''; $('#moneyDate').value = A.today();
        A.renderAll();
      } catch (er) { toast(A.errMsg(er.code), 'err'); }
    })();
  });
  function renderMList() {
    var box = $('#moneyList'); if (!box) return; box.innerHTML = '';
    var list = S.Money.all();
    if (mFilter !== 'all') list = list.filter(function (m) { return m.type === mFilter; });
    if (!list.length) { box.appendChild(emptyBox('no_money', 'data_note', 'wallet')); return; }
    list.slice(0, 200).forEach(function (m) {
      var row = el('div', 'row-item');
      var th = el('div', 'thumb' + (m.type === 'in' ? ' green' : ''));
      th.innerHTML = m.type === 'in' ? I.arrowDown({ w: 18 }) : I.arrowUp({ w: 18 });
      row.appendChild(th);
      var m2 = el('div', 'ri-main');
      m2.appendChild(el('div', 'ri-title', esc(m.descr || window.t('cat_' + m.category))));
      var sub = el('div', 'ri-sub');
      sub.appendChild(el('span', '', esc(A.dateStr(m.date))));
      sub.appendChild(el('span', '', esc(window.t('cat_' + m.category))));
      m2.appendChild(sub); row.appendChild(m2);
      var r = el('div', 'ri-right');
      r.appendChild(el('div', 'ri-amount ' + (m.type === 'in' ? 'in' : 'out'), (m.type === 'in' ? '+' : '−') + money(m.amount)));
      row.appendChild(r);
      var acts = el('div', 'ri-actions');
      var bd = el('button', 'icon-btn sm del', I.trash({ w: 15 }));
      bd.addEventListener('click', function () { modal.confirm(window.t('confirm_delete'), async function () {
        try { await S.Money.remove(m.id); toast(window.t('deleted'), 'ok'); A.renderAll(); }
        catch (er) { toast(A.errMsg(er.code), 'err'); } }); });
      acts.appendChild(bd); row.appendChild(acts); box.appendChild(row); });
  }
})();

/* app.js — phần 6: TỔNG QUAN + BÁO CÁO + NHÂN VIÊN + CÀI ĐẶT + ĐĂNG NHẬP */
(function () {
  'use strict';
  var A = window.App, S = window.Store, I = window.Icon;
  var $ = A.$, $$ = A.$$, el = A.el, esc = A.esc, money = A.money, num = A.num,
      prodName = A.prodName, toast = A.toast, modal = A.modal, emptyBox = A.emptyBox;

  var ERR = { missing_fields: 'err_missing', username_short: 'err_username_short',
    password_short: 'err_password_short', username_taken: 'err_username_taken',
    wrong_credentials: 'err_wrong', user_inactive: 'err_inactive', err_network: 'err_network',
    owner_only: 'err_owner_only', not_enough_stock: 'not_enough_stock', empty_cart: 'err_empty_cart',
    last_owner: 'err_last_owner', no_token: 'err_wrong', invalid_token: 'err_wrong',
    product_code_exists: 'product_code_exists', partner_exists: 'partner_exists',
    over_payment: 'over_payment', has_debt: 'has_debt', not_found: 'err_missing',
    product_not_found: 'err_missing' };
  A.errMsg = function (code) { return window.t(ERR[code] || 'err_network'); };

  /* ---- TỔNG QUAN ---- */
  A.builders.renderDashboard = function () {
    var t = A.today();
    var rev = S.Sells.revenueInRange(t, t), cost = S.Sells.costInRange(t, t), profit = rev - cost;
    var dt = S.Debts.totals();
    var st = $('#dashStats');
    if (st) { st.innerHTML = '';
      st.appendChild(A.builders.statCard('dash_today_revenue', money(rev), 'blue'));
      st.appendChild(A.builders.statCard('dash_today_profit', money(profit), profit >= 0 ? 'green' : 'red'));
      st.appendChild(A.builders.statCard('dash_receivable', money(dt.receivable), 'amber'));
      st.appendChild(A.builders.statCard('dash_payable', money(dt.payable), 'purple')); }

    var wb = $('#dashWarn'); if (wb) { wb.innerHTML = '';
      var warns = S.Stock.warnings();
      if (!warns.length) wb.appendChild(el('div', 'ri-sub', esc(window.t('stock_no_warning'))));
      else warns.slice(0, 5).forEach(function (w) {
        var row = el('div', 'row-item');
        row.appendChild(el('div', 'thumb amber', I.warn({ w: 17 })));
        var m = el('div', 'ri-main');
        m.appendChild(el('div', 'ri-title', esc(prodName(w.product))));
        m.appendChild(el('div', 'ri-sub', esc(window.t('stock_now')) + ': ' + num(w.qty) + ' ' + esc(w.product.unit || '')));
        row.appendChild(m);
        row.appendChild(el('span', 'badge ' + (w.qty <= 0 ? 'out' : 'low'), esc(window.t(w.qty <= 0 ? 'stock_out_of' : 'stock_low'))));
        wb.appendChild(row); }); }

    var rb = $('#dashRecent'); if (rb) { rb.innerHTML = '';
      var recent = [];
      S.Sells.all().filter(function (s) { return !s.adjust; }).slice(0, 6).forEach(function (s) {
        recent.push({ kind: 'sell', date: s.date, created: s.created_at || 0, amount: s.total, label: s.customer || window.t('cat_sell') }); });
      S.Money.all().slice(0, 6).forEach(function (m) {
        recent.push({ kind: m.type, date: m.date, created: m.created_at || 0, amount: m.amount, label: m.descr || window.t('cat_' + m.category) }); });
      recent.sort(function (a, b) { return b.created - a.created; });
      if (!recent.length) rb.appendChild(emptyBox('dash_no_recent', 'no_sales_data', 'clock'));
      else recent.slice(0, 7).forEach(function (r) {
        var row = el('div', 'row-item');
        var th = el('div', 'thumb' + (r.kind === 'sell' ? ' green' : ''));
        th.innerHTML = I.arrowDown({ w: 17 }); row.appendChild(th);
        var m = el('div', 'ri-main');
        m.appendChild(el('div', 'ri-title', esc(r.label)));
        m.appendChild(el('div', 'ri-sub', esc(A.dateStr(r.date))));
        row.appendChild(m);
        var rt = el('div', 'ri-right');
        rt.appendChild(el('div', 'ri-amount ' + (r.kind === 'out' ? 'out' : 'in'), (r.kind === 'out' ? '−' : '+') + money(r.amount)));
        row.appendChild(rt); rb.appendChild(row); }); }
  };

  /* ---- BÁO CÁO ---- */
  A.builders.reportRange = '7d';
  A.builders.renderReport = function () {
    var td = A.today(), f = null, to = td, r = A.builders.reportRange;
    if (r === 'today') f = td;
    else if (r === '7d') f = S.addDaysISO(td, -6);
    else if (r === '30d') f = S.addDaysISO(td, -29);
    else if (r === '90d') f = S.addDaysISO(td, -89);
    var rev = S.Sells.revenueInRange(f, to), cogs = S.Sells.costInRange(f, to);
    var profit = rev - cogs, margin = rev > 0 ? (profit / rev * 100) : 0;
    var exp = S.Money.expenseInRange(f, to), inc = S.Money.incomeInRange(f, to), dt = S.Debts.totals();
    var st = $('#reportStats');
    if (st) { st.innerHTML = '';
      st.appendChild(A.builders.statCard('revenue', money(rev), 'blue'));
      st.appendChild(A.builders.statCard('cost', money(cogs), 'red'));
      st.appendChild(A.builders.statCard('profit', money(profit), profit >= 0 ? 'green' : 'red'));
      st.appendChild(A.builders.statCard('profit_margin', margin.toFixed(1) + '%', '')); }
    var tb = $('#reportTop'); if (tb) { tb.innerHTML = '';
      var agg = {};
      S.Sells.all().forEach(function (s) {
        if (s.adjust || (f && s.date < f) || (to && s.date > to)) return;
        (s.items || []).forEach(function (it) {
          if (!agg[it.productId]) agg[it.productId] = { qty: 0, revenue: 0, cost: 0 };
          agg[it.productId].qty += it.qty; agg[it.productId].revenue += it.qty * it.price;
          agg[it.productId].cost += it.qty * (Number(it.cost) || 0); }); });
      var tops = Object.keys(agg).map(function (pid) { return { p: S.Products.get(pid), qty: agg[pid].qty, revenue: agg[pid].revenue, cost: agg[pid].cost }; })
        .filter(function (x) { return x.qty > 0; }).sort(function (a, b) { return b.qty - a.qty; }).slice(0, 8);
      if (!tops.length) tb.appendChild(emptyBox('no_sales_data', 'no_sales_data', 'chart'));
      else { var mx = tops[0].qty || 1;
        tops.forEach(function (x, i) {
          var row = el('div', 'row-item');
          row.appendChild(el('div', 'thumb', String(i + 1)));
          var m = el('div', 'ri-main');
          m.appendChild(el('div', 'ri-title', esc(x.p ? prodName(x.p) : '—')));
          var bar = el('div', ''); bar.style.cssText = 'height:6px;border-radius:99px;background:var(--blue-050);margin-top:6px;overflow:hidden';
          var fl = el('div', ''); fl.style.cssText = 'height:100%;width:' + Math.round(x.qty / mx * 100) + '%;background:linear-gradient(90deg,var(--blue-500),var(--blue-700))';
          bar.appendChild(fl); m.appendChild(bar);
          var pl = el('div', 'ri-sub'); pl.style.marginTop = '4px';
          pl.appendChild(el('span', 'badge ok', esc(window.t('profit')) + ': ' + esc(money(x.revenue - x.cost))));
          m.appendChild(pl); row.appendChild(m);
          var rt = el('div', 'ri-right');
          rt.appendChild(el('div', 'ri-amount', num(x.qty)));
          rt.appendChild(el('div', 'ri-sub', esc(money(x.revenue))));
          row.appendChild(rt); tb.appendChild(row); }); } }
    var tbl = $('#reportTable'); if (tbl) { tbl.innerHTML = '';
      [{ l: window.t('revenue'), v: money(rev), c: '' }, { l: window.t('cost'), v: money(cogs), c: '' },
       { l: window.t('profit'), v: money(profit), c: profit >= 0 ? 'in' : 'out' },
       { l: window.t('income_total'), v: money(inc), c: 'in' },
       { l: window.t('expense_total'), v: money(exp), c: 'out' },
       { l: window.t('balance'), v: money(inc - exp), c: (inc - exp) >= 0 ? 'in' : 'out' },
       { l: window.t('debt_total_receivable'), v: money(dt.receivable), c: 'in' },
       { l: window.t('debt_total_payable'), v: money(dt.payable), c: 'out' }].forEach(function (r2) {
        var row = el('div', 'row-item');
        var m = el('div', 'ri-main'); m.appendChild(el('div', 'ri-title', esc(r2.l))); row.appendChild(m);
        var rt = el('div', 'ri-right'); rt.appendChild(el('div', 'ri-amount ' + r2.c, r2.v)); row.appendChild(rt);
        tbl.appendChild(row); }); }
  };
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('#reportRange .chip'); if (!c) return;
    A.builders.reportRange = c.dataset.r;
    $$('#reportRange .chip').forEach(function (x) { x.classList.toggle('active', x === c); });
    A.builders.renderReport();
  });

  /* ---- NHÂN VIÊN ---- */
  A.builders.renderStaff = async function () {
    var box = $('#staffList'); if (!box) return;
    box.innerHTML = '<div style="padding:20px;text-align:center">…</div>';
    var list = [];
    try { list = await S.Staff.list(); }
    catch (er) { box.innerHTML = ''; box.appendChild(emptyBox('err_owner_only', 'staff_hint', 'users')); return; }
    box.innerHTML = '';
    if (!list.length) { box.appendChild(emptyBox('no_data', 'staff_hint', 'users')); return; }
    list.forEach(function (u) {
      var isMe = S.user && Number(u.id) === Number(S.user.id);
      var row = el('div', 'row-item');
      if (isMe) row.style.background = 'var(--blue-050)';
      row.appendChild(el('div', 'thumb', esc((u.display || u.username || '?').charAt(0).toUpperCase())));
      var m = el('div', 'ri-main');
      var t = el('div', 'ri-title');
      t.innerHTML = esc(u.display || u.username) + (isMe ? ' <span class="badge blue">' + esc(window.t('you')) + '</span>' : '');
      m.appendChild(t); m.appendChild(el('div', 'ri-sub', '@' + esc(u.username)));
      row.appendChild(m);
      var bd = el('div', '', ''); bd.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex-shrink:0';
      bd.appendChild(el('span', 'badge ' + (u.role === 'owner' ? 'blue' : 'gray'), esc(window.t(u.role === 'owner' ? 'role_owner' : 'role_staff'))));
      if (!u.active) bd.appendChild(el('span', 'badge out', esc(window.t('inactive'))));
      row.appendChild(bd);
      var acts = el('div', 'ri-actions');
      var be = el('button', 'icon-btn sm edit', I.edit({ w: 15 })); be.addEventListener('click', function () { staffForm(u, isMe); });
      acts.appendChild(be);
      if (!isMe) { var bx = el('button', 'icon-btn sm del', I.trash({ w: 15 }));
        bx.addEventListener('click', function () { modal.confirm(window.t('confirm_delete'), async function () {
          try { await S.Staff.remove(u.id); toast(window.t('staff_deleted'), 'ok'); A.builders.renderStaff(); }
          catch (er) { toast(A.errMsg(er.code), 'err'); } }); });
        acts.appendChild(bx); }
      row.appendChild(acts); box.appendChild(row); });
  };
  function staffForm(u, isMe) {
    var isEdit = !!u, body = el('div', 'form');
    body.innerHTML = '<div class="field"><label>' + esc(window.t('username')) + '</label><input type="text" id="stUser" value="' + esc(u ? u.username : '') + '"' + (isEdit ? ' disabled' : '') + '></div>' +
      '<div class="field"><label>' + esc(window.t('display_name')) + '</label><input type="text" id="stDisplay" value="' + esc(u ? u.display : '') + '"></div>' +
      '<div class="field"><label>' + esc(window.t('password')) + '</label><input type="password" id="stPass" placeholder="' + esc(window.t(isEdit ? 'leave_blank_password' : 'password')) + '"></div>' +
      '<div class="field"><label>' + esc(window.t('role')) + '</label><select id="stRole"' + (isMe ? ' disabled' : '') + '>' +
      '<option value="staff"' + (u && u.role === 'staff' ? ' selected' : '') + '>' + esc(window.t('role_staff')) + '</option>' +
      '<option value="owner"' + (u && u.role === 'owner' ? ' selected' : '') + '>' + esc(window.t('role_owner')) + '</option></select></div>' +
      (isEdit && !isMe ? '<div class="field"><label>' + esc(window.t('status')) + '</label><select id="stActive">' +
        '<option value="1"' + (u.active ? ' selected' : '') + '>' + esc(window.t('active')) + '</option>' +
        '<option value="0"' + (!u.active ? ' selected' : '') + '>' + esc(window.t('inactive')) + '</option></select></div>' : '');
    modal.open({ title: isEdit ? window.t('staff') : window.t('add_staff'), body: body,
      buttons: [{ label: window.t('cancel'), kind: 'ghost' },
      { label: window.t('save'), kind: 'primary', icon: I.save({ w: 16 }), onClick: async function () {
        var pass = $('#stPass').value;
        if (!isEdit && !pass) { toast(window.t('required'), 'err'); return false; }
        var pl = { display: $('#stDisplay').value.trim(), role: $('#stRole').disabled ? u.role : $('#stRole').value };
        if (pass) pl.password = pass;
        var ae = $('#stActive'); if (ae) pl.active = ae.value === '1';
        try { if (isEdit) { await S.Staff.update(u.id, pl); toast(window.t('staff_updated'), 'ok'); }
          else { pl.username = $('#stUser').value.trim();
            if (!pl.username) { toast(window.t('required'), 'err'); return false; }
            await S.Staff.create(pl); toast(window.t('staff_added'), 'ok'); }
          A.builders.renderStaff(); }
        catch (er) { toast(A.errMsg(er.code), 'err'); return false; } } }] });
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#btnAddStaff')) staffForm(null);
  });

  /* ---- CÀI ĐẶT ---- */
  A.builders.renderSettings = function () {
    var st = S.Settings.get();
    if ($('#shopNameInput')) $('#shopNameInput').value = st.shopName || '';
    if ($('#shopPhone')) $('#shopPhone').value = st.phone || '';
    if ($('#shopAddress')) $('#shopAddress').value = st.address || '';
    if ($('#shopTax')) $('#shopTax').value = st.taxCode || '';
    if ($('#shopSlogan')) $('#shopSlogan').value = st.slogan || '';
    if ($('#setLang')) $('#setLang').value = window.LANG;
    if ($('#setCurrency')) $('#setCurrency').value = st.currency || 'VND';
    var box = $('#accountInfo');
    if (box && S.user) { box.innerHTML = '';
      [{ l: window.t('display_name'), v: S.user.display || S.user.username },
       { l: window.t('username'), v: '@' + S.user.username },
       { l: window.t('role'), v: window.t(S.user.role === 'owner' ? 'role_owner' : 'role_staff') },
       { l: window.t('shop_name'), v: (S.shop && S.shop.name) || '' }].forEach(function (r) {
        var row = el('div', 'row-item');
        var m = el('div', 'ri-main');
        m.appendChild(el('div', 'ri-title', esc(r.v)));
        m.appendChild(el('div', 'ri-sub', esc(r.l)));
        row.appendChild(m); box.appendChild(row); }); }
  };
  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'shopForm') return;
    e.preventDefault();
    (async function () {
      try {
        await S.Settings.save({ shopName: $('#shopNameInput') ? $('#shopNameInput').value.trim() : undefined,
          currency: $('#setCurrency').value,
          phone: $('#shopPhone') ? $('#shopPhone').value.trim() : undefined,
          address: $('#shopAddress') ? $('#shopAddress').value.trim() : undefined,
          taxCode: $('#shopTax') ? $('#shopTax').value.trim() : undefined,
          slogan: $('#shopSlogan') ? $('#shopSlogan').value.trim() : undefined });
        if ($('#setLang').value !== window.LANG) { window.setLang($('#setLang').value); A.applyLang(); }
        A.builders.updateShopTitle(); toast(window.t('saved'), 'ok'); A.renderAll();
      } catch (er) { toast(A.errMsg(er.code), 'err'); }
    })();
  });
  A.builders.updateShopTitle = function () {
    var st = S.Settings.get();
    if ($('#shopTitle')) $('#shopTitle').textContent = st.shopName || window.t('app_name');
    if ($('#sideSub')) $('#sideSub').textContent = window.t('app_sub');
  };

  /* ---- ĐĂNG NHẬP ---- */
  var Auth = {
    show: function () { $('#authScreen').hidden = false; document.body.classList.remove('noscroll');
      $('#loginForm').hidden = false; $('#registerForm').hidden = true; },
    hide: function () { $('#authScreen').hidden = true; },
    switchTo: function (f) { $('#loginForm').hidden = (f !== 'login'); $('#registerForm').hidden = (f !== 'register'); },
    onExpired: function () { Auth.show(); toast(window.t('err_wrong'), 'err'); }
  };
  S.Auth.onExpired = Auth.onExpired;
  window.Auth = Auth; A.Auth = Auth;

  document.addEventListener('submit', async function (e) {
    if (!e.target) return;
    if (e.target.id === 'loginForm') {
      e.preventDefault();
      var btn = $('#lgBtn'), un = $('#lgUsername').value.trim(), pw = $('#lgPassword').value;
      if (!un || !pw) { toast(window.t('err_missing'), 'err'); return; }
      btn.disabled = true; btn.querySelector('em').textContent = window.t('logging_in');
      try { await S.Auth.login({ username: un, password: pw }); await A.bootApp();
        toast(window.t('welcome_back') + ', ' + (S.user.display || S.user.username), 'ok'); }
      catch (er) { toast(A.errMsg(er.code), 'err'); }
      finally { btn.disabled = false; btn.querySelector('em').textContent = window.t('login'); }
      return;
    }
    if (e.target.id === 'registerForm') {
      e.preventDefault();
      var b2 = $('#rgBtn'), sn = $('#rgShop').value.trim(), u2 = $('#rgUsername').value.trim(), p2 = $('#rgPassword').value;
      if (!sn || !u2 || !p2) { toast(window.t('err_missing'), 'err'); return; }
      b2.disabled = true; b2.querySelector('em').textContent = window.t('registering');
      try { await S.Auth.register({ shopName: sn, username: u2, password: p2, display: $('#rgDisplay').value.trim() });
        await A.bootApp(); toast(window.t('register_success'), 'ok'); }
      catch (er) { toast(A.errMsg(er.code), 'err'); }
      finally { b2.disabled = false; b2.querySelector('em').textContent = window.t('register'); }
    }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    if (e.target.closest('#goRegister')) { Auth.switchTo('register'); return; }
    if (e.target.closest('#goLogin')) { Auth.switchTo('login'); return; }
    if (e.target.closest('#authLang')) { A.toggleLang(); return; }
    if (e.target.closest('#btnLogout')) {
      modal.confirm(window.t('confirm_logout'), async function () {
        await S.Auth.logout(); Auth.show(); $('#lgPassword').value = ''; }); }
  });

  A.applyRole = function () {
    var isStaff = !S.user || S.user.role !== 'owner';
    document.body.classList.toggle('is-staff', isStaff);
    if (S.user) { if ($('#meName')) $('#meName').textContent = S.user.display || S.user.username;
      if ($('#meRole')) $('#meRole').textContent = window.t(S.user.role === 'owner' ? 'role_owner' : 'role_staff');
      if ($('#meAvatar')) $('#meAvatar').textContent = (S.user.display || S.user.username || '?').charAt(0).toUpperCase(); }
    if ($('#logoutIcon')) $('#logoutIcon').innerHTML = I.close({ w: 15 });
  };
  A.bootApp = async function () {
    var ld = $('#appLoading'); if (ld) ld.hidden = false;
    try { await S.loadAll(); } catch (er) { console.warn('loadAll', er); }
    if (ld) ld.hidden = true;
    Auth.hide(); A.applyRole(); A.builders.updateShopTitle(); A.goto('dashboard');
  };

  function initIcons() {
    $$('.nav-item').forEach(function (n) { var ic = n.querySelector('.ni');
      if (ic) ic.innerHTML = (I[window.__navi[n.dataset.page]] || I.dash)({ w: 19 }); });
    if ($('#menuBtn')) $('#menuBtn').innerHTML = I.menu({ w: 21 });
    if ($('#modalClose')) $('#modalClose').innerHTML = I.close({ w: 18 });
    if ($('.lt-icon')) $('.lt-icon').innerHTML = I.globe({ w: 16 });
    if ($('#btnAddProduct')) $('#btnAddProduct').querySelector('.bi').innerHTML = I.plus({ w: 16 });
    if ($('#btnAddStaff')) $('#btnAddStaff').querySelector('.bi').innerHTML = I.plus({ w: 15 });
    if ($('#btnAddBatch')) $('#btnAddBatch').querySelector('.bi').innerHTML = I.plus({ w: 16 });
    $$('.quick-btn').forEach(function (b) { var mp = { batch: 'plus', products: 'plus', sell: 'cart', debt: 'scale' };
      var ic = b.querySelector('.qic'); if (ic) ic.innerHTML = (I[mp[b.dataset.goto]] || I.plus)({ w: 20 }); });
    var b = $('#btnCheckout .bi'); if (b) b.innerHTML = I.check({ w: 17 });
    var c = $('#moneyForm .btn .bi'); if (c) c.innerHTML = I.save({ w: 16 });
    $$('#moneyTypeSeg .seg-btn').forEach(function (x) { x.querySelector('.bi').innerHTML = x.dataset.type === 'in' ? I.arrowDown({ w: 16 }) : I.arrowUp({ w: 16 }); });
    $$('#debtTab .seg-btn').forEach(function (x) { x.querySelector('.bi').innerHTML = x.dataset.tab === 'customer' ? I.arrowDown({ w: 16 }) : I.arrowUp({ w: 16 }); });
    $$('.search-box .si').forEach(function (s) { s.innerHTML = I.search({ w: 16 }); });
  }

  function bindEvents() {
    $$('.nav-item').forEach(function (n) { n.addEventListener('click', function () { A.goto(n.dataset.page); }); });
    $$('.quick-btn').forEach(function (b) { b.addEventListener('click', function () { A.goto(b.dataset.goto); }); });
    $$('.link-btn').forEach(function (b) { b.addEventListener('click', function () { A.goto(b.dataset.goto); }); });
    if ($('#menuBtn')) $('#menuBtn').addEventListener('click', A.openSidebar);
    if ($('#scrim')) $('#scrim').addEventListener('click', A.closeSidebar);
    if ($('#langToggle')) $('#langToggle').addEventListener('click', A.toggleLang);
    if ($('#langToggleSm')) $('#langToggleSm').addEventListener('click', A.toggleLang);
    if ($('#modalClose')) $('#modalClose').addEventListener('click', function () { modal.close(); });
    if ($('#modal')) $('#modal').addEventListener('click', function (e) { if (e.target.id === 'modal') modal.close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#modal') && !$('#modal').hidden) modal.close(); });
    var bind = function (id, fn) { var n = $(id); if (n) n.addEventListener('input', fn); };
    bind('#prodSearch', function (e) { A.builders.prodFilter = e.target.value; A.builders.renderProducts(); });
    bind('#stockSearch', function (e) { A.builders.stockFilter = e.target.value; A.builders.renderStock(); });
    bind('#sellSearch', function (e) { A.builders.sellFilter = e.target.value; A.builders.renderSellPage(); });
    if ($('#btnAddProduct')) $('#btnAddProduct').addEventListener('click', function () { A.builders.openProductForm(); });
  }

  async function boot() {
    A.applyLang(); initIcons(); bindEvents(); A.builders.updateShopTitle();
    if (S.isLoggedIn()) { try { await S.Auth.me(); await A.bootApp(); return; } catch (e) { S.clearSession(); } }
    Auth.show();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
