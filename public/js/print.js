/* print.js — In hoá đơn (80mm / A5 / A4) */
(function () {
  'use strict';
  var A = window.App, S = window.Store, I = window.Icon;
  var $ = A.$, el = A.el, esc = A.esc, num = A.num, toast = A.toast, modal = A.modal;
  var SIZE_KEY = 'qlbh.printSize';

  function printCSS(size) {
    var base = '*{margin:0;padding:0;box-sizing:border-box}' +
      "body{font-family:'Be Vietnam Pro','Noto Sans SC','PingFang SC','Microsoft YaHei',system-ui,sans-serif;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
      '.wrap{margin:0 auto;padding:6px}.shop-name{font-weight:800;text-align:center}.shop-line{text-align:center}' +
      '.title{text-align:center;font-weight:800;letter-spacing:.04em;margin:8px 0 6px}' +
      '.meta{display:flex;justify-content:space-between;gap:8px}' +
      '.sep{border-top:1px dashed #999;margin:7px 0}.sep-solid{border-top:1px solid #000;margin:7px 0}' +
      'table{width:100%;border-collapse:collapse}th,td{text-align:left;vertical-align:top}' +
      '.r{text-align:right}.c{text-align:center}.tot{font-weight:800}.debt{font-weight:800}' +
      '.thanks{text-align:center;margin-top:9px;font-style:italic}' +
      '.signs{display:flex;justify-content:space-between;margin-top:18px;text-align:center}' +
      '.signs>div{width:45%}.signs .lbl{font-weight:700}.signs .note{font-size:.85em;font-style:italic}.signs .space{height:44px}';
    if (size === '80mm') return base +
      '@page{size:80mm auto;margin:3mm}body{font-size:11px;line-height:1.35}.wrap{width:74mm;max-width:74mm}' +
      '.shop-name{font-size:13px}.shop-line{font-size:10px}.title{font-size:12px}' +
      'table.items{font-size:10.5px}table.items th{border-bottom:1px solid #000;padding-bottom:2px}table.items td{padding:2px 0}';
    if (size === 'a5') return base +
      '@page{size:A5;margin:10mm}body{font-size:12px;line-height:1.45}.wrap{width:100%;max-width:128mm}' +
      '.shop-name{font-size:17px}.shop-line{font-size:11px}.title{font-size:15px}' +
      'table.items{font-size:12px;border:1px solid #000}table.items th,table.items td{border:1px solid #000;padding:4px 6px}' +
      'table.items thead th{background:#f0f0f0}';
    return base +
      '@page{size:A4;margin:15mm}body{font-size:13px;line-height:1.5}.wrap{width:100%;max-width:180mm}' +
      '.shop-name{font-size:20px}.shop-line{font-size:12px}.title{font-size:17px;letter-spacing:.08em}' +
      'table.items{font-size:13px;border:1px solid #000}table.items th,table.items td{border:1px solid #000;padding:6px 8px}' +
      'table.items thead th{background:#f0f0f0}.signs .space{height:60px}';
  }

  function buildHTML(sale, size) {
    var st = S.Settings.get(), cur = st.currency === 'CNY' ? '¥' : '₫';
    var m2 = function (n) { return (Math.round(Number(n) || 0)).toLocaleString('vi-VN') + ' ' + cur; };
    var seller = (S.user && (S.user.display || S.user.username)) || '';
    var shopName = st.shopName || window.t('app_name');
    var info = '<div class="shop-name">' + esc(shopName) + '</div>';
    if (st.slogan) info += '<div class="shop-line">' + esc(st.slogan) + '</div>';
    if (st.address) info += '<div class="shop-line">' + esc(st.address) + '</div>';
    var ct = [];
    if (st.phone) ct.push(esc(window.t('shop_phone')) + ': ' + esc(st.phone));
    if (st.taxCode) ct.push(esc(window.t('tax_code')) + ': ' + esc(st.taxCode));
    if (ct.length) info += '<div class="shop-line">' + ct.join(' · ') + '</div>';

    var rows = '';
    (sale.items || []).forEach(function (it, i) {
      var p = S.Products.get(it.productId);
      rows += '<tr><td class="c">' + (i + 1) + '</td><td>' + esc(p ? A.prodName(p) : '—') + '</td>' +
        '<td class="c">' + num(it.qty) + '</td><td class="r">' + esc(m2(it.price)) + '</td>' +
        '<td class="r">' + esc(m2(it.qty * it.price)) + '</td></tr>'; });
    if (!rows) rows = '<tr><td colspan="5" class="c">' + esc(window.t('print_no_items')) + '</td></tr>';

    var paid = S.Payments.paidOnRef('sell', sale.id);
    var debt = Math.max(0, (Number(sale.total) || 0) - paid);
    var tt = '<div class="meta"><span>' + esc(window.t('subtotal_label')) + '</span><span>' + esc(m2(sale.subtotal || 0)) + '</span></div>';
    if (Number(sale.discount) > 0) tt += '<div class="meta"><span>' + esc(window.t('discount')) + '</span><span>−' + esc(m2(sale.discount)) + '</span></div>';
    tt += '<div class="meta tot"><span>' + esc(window.t('total_label')) + '</span><span>' + esc(m2(sale.total)) + '</span></div>';
    tt += '<div class="meta"><span>' + esc(window.t('paid_label_inv')) + '</span><span>' + esc(m2(paid)) + '</span></div>';
    if (debt > 0) tt += '<div class="meta debt"><span>' + esc(window.t('debt_label_inv')) + '</span><span>' + esc(m2(debt)) + '</span></div>';

    var signs = (size === '80mm') ? '' :
      '<div class="signs"><div><div class="lbl">' + esc(window.t('sign_buyer')) + '</div><div class="note">' + esc(window.t('sign_note')) + '</div><div class="space"></div></div>' +
      '<div><div class="lbl">' + esc(window.t('sign_seller')) + '</div><div class="note">' + esc(window.t('sign_note')) + '</div><div class="space"></div></div></div>';

    return '<!DOCTYPE html><html lang="' + window.LANG + '"><head><meta charset="UTF-8">' +
      '<title>' + esc(window.t('invoice_title')) + ' #' + esc(sale.id) + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&family=Noto+Sans+SC:wght@400;500;700;800&display=swap" rel="stylesheet">' +
      '<style>' + printCSS(size) + '</style></head><body><div class="wrap">' + info +
      '<div class="sep-solid"></div><div class="title">' + esc(window.t('invoice_title')) + '</div>' +
      '<div class="meta"><span>' + esc(window.t('invoice_no')) + ': <b>#' + esc(sale.id) + '</b></span><span>' + esc(window.t('invoice_date')) + ': ' + esc(A.dateStr(sale.date)) + '</span></div>' +
      '<div class="meta"><span>' + esc(window.t('buyer')) + ': <b>' + esc(sale.customer || window.t('walk_in')) + '</b></span></div>' +
      (seller ? '<div class="meta"><span>' + esc(window.t('seller')) + ': ' + esc(seller) + '</span></div>' : '') +
      '<div class="sep"></div><table class="items"><thead><tr>' +
      '<th class="c" style="width:8%">#</th><th>' + esc(window.t('item_col')) + '</th>' +
      '<th class="c" style="width:12%">' + esc(window.t('qty_col')) + '</th>' +
      '<th class="r" style="width:22%">' + esc(window.t('price_col')) + '</th>' +
      '<th class="r" style="width:24%">' + esc(window.t('amount_col')) + '</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="sep"></div>' + tt + '<div class="thanks">' + esc(window.t('thanks')) + '</div>' + signs +
      '</div><script>window.addEventListener("load",function(){setTimeout(function(){window.print();},350);});<\/script></body></html>';
  }

  function openPrint(saleId, size) {
    var sale = S.Sells.get(saleId);
    if (!sale) { toast(window.t('err_missing'), 'err'); return; }
    var w = window.open('', '_blank', 'width=800,height=900');
    if (!w) { toast(window.t('err_network'), 'err'); return; }
    w.document.open(); w.document.write(buildHTML(sale, size || '80mm')); w.document.close();
    try { w.focus(); } catch (e) {}
  }
  A.builders.openPrint = openPrint;

  var SIZES = [{ k: '80mm', l: 'size_80mm' }, { k: 'a5', l: 'size_a5' }, { k: 'a4', l: 'size_a4' }];

  A.builders.printDialog = function (saleId) {
    var size = localStorage.getItem(SIZE_KEY) || '80mm', okk = false;
    SIZES.forEach(function (s) { if (s.k === size) okk = true; });
    if (!okk) size = '80mm';
    var body = el('div', 'form');
    body.innerHTML = '<div class="field"><label>' + esc(window.t('print_size')) + '</label><select id="prSize">' +
      SIZES.map(function (s) { return '<option value="' + s.k + '"' + (s.k === size ? ' selected' : '') + '>' + esc(window.t(s.l)) + '</option>'; }).join('') +
      '</select></div><p class="hint">' + esc(window.t('print_hint')) + '</p>' +
      '<div id="prPrev" style="margin-top:10px;border:1px solid var(--line);border-radius:10px;padding:10px;background:#fafbfe;max-height:280px;overflow:auto"></div>';
    modal.open({ title: window.t('print_receipt'), body: body,
      onMount: function (b) {
        var sel = b.querySelector('#prSize');
        function draw() {
          var sale = S.Sells.get(saleId), box = b.querySelector('#prPrev');
          if (!sale || !box) return;
          var st = S.Settings.get(), cur = st.currency === 'CNY' ? '¥' : '₫';
          var m2 = function (n) { return (Math.round(Number(n) || 0)).toLocaleString('vi-VN') + ' ' + cur; };
          var paid = S.Payments.paidOnRef('sell', sale.id), debt = Math.max(0, (Number(sale.total) || 0) - paid);
          box.innerHTML = '<div style="text-align:center;font-weight:800">' + esc(st.shopName || window.t('app_name')) + '</div>' +
            (st.address ? '<div style="text-align:center;font-size:.75rem;color:var(--ink-3)">' + esc(st.address) + '</div>' : '') +
            (st.phone ? '<div style="text-align:center;font-size:.75rem;color:var(--ink-3)">' + esc(window.t('shop_phone')) + ': ' + esc(st.phone) + '</div>' : '') +
            '<div style="text-align:center;font-weight:800;margin:8px 0 5px">' + esc(window.t('invoice_title')) + '</div>' +
            '<div style="display:flex;justify-content:space-between;font-size:.78rem"><span>' + esc(window.t('invoice_no')) + ': #' + esc(sale.id) + '</span><span>' + esc(A.dateStr(sale.date)) + '</span></div>' +
            '<div style="font-size:.78rem">' + esc(window.t('buyer')) + ': <b>' + esc(sale.customer || window.t('walk_in')) + '</b></div>' +
            '<div style="border-top:1px dashed var(--line);margin:8px 0"></div>' +
            (sale.items || []).map(function (it) { var p = S.Products.get(it.productId);
              return '<div style="display:flex;justify-content:space-between;font-size:.78rem;padding:2px 0"><span>' + esc(p ? A.prodName(p) : '—') + ' × ' + num(it.qty) + '</span><span>' + esc(m2(it.qty * it.price)) + '</span></div>'; }).join('') +
            '<div style="border-top:1px dashed var(--line);margin:8px 0"></div>' +
            '<div style="display:flex;justify-content:space-between;font-size:.78rem"><span>' + esc(window.t('subtotal_label')) + '</span><span>' + esc(m2(sale.subtotal || 0)) + '</span></div>' +
            (Number(sale.discount) > 0 ? '<div style="display:flex;justify-content:space-between;font-size:.78rem"><span>' + esc(window.t('discount')) + '</span><span>−' + esc(m2(sale.discount)) + '</span></div>' : '') +
            '<div style="display:flex;justify-content:space-between;font-weight:800;font-size:.88rem;margin-top:4px"><span>' + esc(window.t('total_label')) + '</span><span>' + esc(m2(sale.total)) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;font-size:.78rem"><span>' + esc(window.t('paid_label_inv')) + '</span><span>' + esc(m2(paid)) + '</span></div>' +
            (debt > 0 ? '<div style="display:flex;justify-content:space-between;font-size:.78rem;font-weight:800;color:var(--amber)"><span>' + esc(window.t('debt_label_inv')) + '</span><span>' + esc(m2(debt)) + '</span></div>' : '') +
            '<div style="text-align:center;font-style:italic;font-size:.75rem;margin-top:9px">' + esc(window.t('thanks')) + '</div>';
        }
        draw();
        sel.addEventListener('change', function () { size = sel.value; localStorage.setItem(SIZE_KEY, size); draw(); });
      },
      buttons: [{ label: window.t('cancel'), kind: 'ghost' },
        { label: window.t('do_print'), kind: 'primary', icon: I.receipt({ w: 15 }), onClick: function () { openPrint(saleId, size); } }] });
  };
})();
