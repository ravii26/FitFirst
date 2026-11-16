/* FitFirst prototype — logic shared by the phone and the back office: GST, receipts, sale recording */
(function () {
  const FF = window.FF;
  const store = () => FF.db.stores.find((s) => s.id === FF.db.storeId);
  FF.store = store;
  /* GST as data (MASTER_PLAN §7.3): slab is decided by the price actually charged per piece, after discount.
     Fabric HSN chapters (50–55: most sarees, dress material) stay at 5%. Prices are tax-inclusive. */
  FF.gstLine = (l) => { const p = FF.prod(l.pid), unit = l.price - (l.disc || 0) / l.qty, fabric = p && /^5[0-5]/.test(p.hsn), rate = fabric ? 5 : unit <= 2500 ? 5 : 18, gross = unit * l.qty, taxable = (gross * 100) / (100 + rate); return { rate, gross, taxable, tax: gross - taxable, hsn: p ? p.hsn : '62', unit }; };
  FF.totals = (lines, billDisc) => { let sub = 0, disc = billDisc || 0, tax = 0; const by = {}; lines.forEach((l) => { const g = FF.gstLine(l); sub += l.price * l.qty; disc += l.disc || 0; tax += g.tax; (by[g.rate] = by[g.rate] || { taxable: 0, tax: 0 }); by[g.rate].taxable += g.taxable; by[g.rate].tax += g.tax; }); const total = Math.round(sub - disc); return { sub, disc, total, tax: Math.round(tax), by }; };
  FF.docName = (d) => ({ TAX_INVOICE: 'Tax Invoice', BILL_OF_SUPPLY: 'Bill of Supply', RECEIPT: 'Receipt' }[d] || 'Receipt');
  FF.receipt = (s) => { const st = store(), tt = FF.totals(s.lines); const row = (a, b) => `<div class="rr"><span>${a}</span><span>${b}</span></div>`;
    return `<div class="receipt printable"><div class="center"><b>${FF.esc(st.name)}</b><br>${FF.esc(st.area)}<br>${s.doc !== 'RECEIPT' ? 'GSTIN ' + st.gstin + '<br>' : ''}<b>${FF.docName(s.doc)}</b></div><hr>${row('No. ' + s.no, FF.fmtDT(s.at))}${s.customer ? row('Customer', FF.esc(s.customer.name || '') + (s.customer.gstin ? ' · ' + s.customer.gstin : '')) : ''}<hr>${s.lines.map((l) => { const g = FF.gstLine(l); return `<div>${FF.esc(l.name)} (${l.size})</div>${row(`&nbsp;${l.qty} × ${FF.inr(l.price)}${l.disc ? ' − ' + FF.inr(l.disc) : ''} · HSN ${g.hsn} · ${s.doc === 'TAX_INVOICE' ? g.rate + '%' : ''}`, FF.inr(g.gross))}`; }).join('')}<hr>${row('Subtotal', FF.inr(tt.sub))}${tt.disc ? row('Discount', '− ' + FF.inr(tt.disc)) : ''}${s.doc === 'TAX_INVOICE' ? Object.entries(tt.by).map(([r, v]) => row(`CGST ${r / 2}% + SGST ${r / 2}% on ${FF.inr(v.taxable)}`, FF.inr(v.tax))).join('') : ''}${row('<b>TOTAL (incl. tax)</b>', '<b>' + FF.inr(s.total) + '</b>')}<hr>${s.pay.map((p) => row(p.mode + (p.ref ? ' · ' + p.ref : ''), FF.inr(p.amt))).join('')}${s.visit ? `<hr><div class="center">FitFirst visit ${s.visit}</div>` : ''}${(s.returns || []).length ? `<hr><div>Credit notes: ${s.returns.map((r) => r.no).join(', ')}</div>` : ''}<hr><div class="center">Exchange within 7 days with this bill.<br>Thank you — visit again!</div></div>`; };
  /* Record a sale atomically: check stock for every line first, then write sale + movements + visit outcome together. */
  FF.recordSale = (o) => {
    for (const l of o.lines) { const p = FF.prod(l.pid); if (!p || (p.stock[l.size] || 0) < l.qty) return { error: `${l.name} (${l.size}) is no longer in stock` }; }
    const b = FF.db.settings.billing, tt = FF.totals(o.lines), now = Date.now();
    const no = o.source === 'BILLING' ? `${b.series}/26-27/${String(b.next++).padStart(5, '0')}` : 'APP-' + (900 + FF.db.sales.length);
    const v = o.visit ? FF.db.visits.find((x) => x.code === o.visit) : null;
    const lines = o.lines.map((l) => { const p = FF.prod(l.pid), age = FF.ageDays(p); const rec = !!(v && v.picks.some((x) => x.pid === l.pid)); FF.moveStock(p, l.size, -l.qty, 'SALE', no); return Object.assign({}, l, { rec, age, aged: FF.ageBand(p) !== 'fresh' }); });
    const sale = { id: FF.uid('s'), no, at: now, source: o.source, visit: o.visit || null, staff: o.staff || (FF.me() || {}).id || null, lines, total: tt.total, tax: tt.tax, pay: o.pay, doc: o.doc || 'TAX_INVOICE', customer: o.customer || null, attribution: v ? o.attribution || 'STAFF_LINKED' : 'NONE', returns: [], offline: !!FF.db.settings.flags.offline };
    FF.db.sales.push(sale);
    if (v) { v.status = 'PURCHASED'; v.sale = sale.id; v.mins = Math.max(1, Math.round((now - v.at) / 60000)); lines.forEach((l) => { const pk = v.picks.find((x) => x.pid === l.pid); if (pk) pk.state = 'bought'; }); v.events.push({ at: now, type: 'sale', text: `Sale ${no} · ${FF.inr(tt.total)} · ${sale.attribution === 'QR_SCAN' ? 'QR scanned at billing' : sale.attribution === 'HANDOFF_CODE' ? 'code on bill' : 'linked by staff'}` }); }
    FF.audit('Recorded sale', no, FF.inr(tt.total) + (o.visit ? ' · visit ' + o.visit : '')); FF.save(); return { sale };
  };
  FF.pickText = (pk) => (pk.reasons || []).map((r) => { const l = FF.lang; FF.lang = 'en'; const s = FF.reasonText(r); FF.lang = l; return s; });
})();
