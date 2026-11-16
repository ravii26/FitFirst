/* FitFirst prototype — taxonomy, reference data and the demo seed.
   EVERYTHING here is synthetic. No number in this file is evidence about a real shop. */
(function () {
  const FF = window.FF;

  /* ---------- taxonomy (data, not code: MASTER_PLAN §4) ---------- */
  const G = {
    drapes: { name: 'Drapes', size: 'FREE', aging: 'occasion', w: { colour: 0.4, sil: 0.2, prop: 0.15, occ: 0.1, pref: 0.15 }, quick: ['FRONT', 'TAG'], full: ['FRONT', 'PALLU', 'BORDER', 'FABRIC', 'BLOUSE PIECE'], hsn: '5007', tryon: true },
    ethnic: { name: 'Ethnic tops & sets', size: 'ALPHA', aging: 'everyday', w: { colour: 0.35, sil: 0.3, prop: 0.1, occ: 0.1, pref: 0.15 }, quick: ['FRONT', 'TAG'], full: ['FRONT', 'BACK', 'NECKLINE', 'FABRIC'], hsn: '6204', tryon: true },
    lehenga: { name: 'Lehenga sets', size: 'ALPHA', aging: 'occasion', w: { colour: 0.35, sil: 0.3, prop: 0.1, occ: 0.1, pref: 0.15 }, quick: ['FRONT', 'TAG'], full: ['FRONT', 'SKIRT', 'CHOLI', 'DUPATTA', 'FABRIC'], hsn: '6204', tryon: true },
    mens: { name: "Men's ethnic", size: 'ALPHA', aging: 'occasion', w: { colour: 0.35, sil: 0.3, prop: 0.1, occ: 0.1, pref: 0.15 }, quick: ['FRONT', 'TAG'], full: ['FRONT', 'BACK', 'COLLAR', 'FABRIC'], hsn: '6203', tryon: true },
    wtops: { name: 'Western tops', size: 'ALPHA', aging: 'western', w: { colour: 0.35, sil: 0.3, prop: 0.1, occ: 0.1, pref: 0.15 }, quick: ['FRONT', 'TAG'], full: ['FRONT', 'BACK', 'FABRIC'], hsn: '6205', tryon: false },
    wbottoms: { name: 'Western bottoms', size: 'WAIST', aging: 'western', w: { colour: 0.2, sil: 0.45, prop: 0.1, occ: 0.1, pref: 0.15 }, quick: ['FRONT', 'TAG'], full: ['FRONT', 'BACK', 'FABRIC'], hsn: '6203', tryon: false },
    dresses: { name: 'Dresses', size: 'ALPHA', aging: 'western', w: { colour: 0.35, sil: 0.3, prop: 0.1, occ: 0.1, pref: 0.15 }, quick: ['FRONT', 'TAG'], full: ['FRONT', 'BACK', 'FABRIC'], hsn: '6204', tryon: false },
    kids: { name: 'Kids', size: 'AGE', aging: 'everyday', w: { colour: 0.3, sil: 0.1, prop: 0.1, occ: 0.25, pref: 0.25 }, quick: ['FRONT', 'TAG'], full: ['FRONT', 'BACK', 'FABRIC'], hsn: '6209', tryon: false },
  };
  const cat = (name, group, depts, shape) => ({ name, group, depts, shape, aging: G[group].aging });
  const CATS = {
    saree: cat('Saree', 'drapes', ['WOMEN'], 'saree'), dupatta: cat('Dupatta', 'drapes', ['WOMEN'], 'dupatta'),
    kurti: cat('Kurti', 'ethnic', ['WOMEN'], 'kurti'), kurta_set: cat('Kurta set', 'ethnic', ['WOMEN'], 'kurtaset'), anarkali: cat('Anarkali', 'ethnic', ['WOMEN'], 'anarkali'), dress_material: cat('Dress material', 'ethnic', ['WOMEN'], 'dupatta'),
    lehenga: cat('Lehenga', 'lehenga', ['WOMEN'], 'lehenga'),
    kurta_pyjama: cat('Kurta pyjama', 'mens', ['MEN'], 'kurtaset'), sherwani: cat('Sherwani', 'mens', ['MEN'], 'sherwani'), nehru_jacket: cat('Nehru jacket', 'mens', ['MEN'], 'nehru'),
    shirt: cat('Shirt', 'wtops', ['MEN'], 'shirt'), top: cat('Top', 'wtops', ['WOMEN'], 'top'), blazer: cat('Blazer', 'wtops', ['WOMEN'], 'blazer'),
    trousers: cat('Trousers', 'wbottoms', ['MEN'], 'trousers'), jeans: cat('Jeans', 'wbottoms', ['MEN'], 'trousers'), skirt: cat('Skirt', 'wbottoms', ['WOMEN'], 'skirt'),
    dress: cat('Dress', 'dresses', ['WOMEN'], 'dress'),
    kids_kurta: cat('Kids kurta set', 'kids', ['KIDS'], 'kurtaset'), kids_lehenga: cat('Kids lehenga', 'kids', ['KIDS'], 'lehenga'), kids_dress: cat('Kids frock', 'kids', ['KIDS'], 'dress'), kids_sherwani: cat('Kids sherwani', 'kids', ['KIDS'], 'sherwani'),
  };
  FF.TAX = {
    groups: G, cats: CATS,
    depts: { WOMEN: 'Women', MEN: 'Men', KIDS: 'Kids' },
    sizes: { ALPHA: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], WAIST: ['26', '28', '30', '32', '34', '36', '38'], AGE: ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'], FREE: ['FREE'] },
    occasions: ['daily', 'office', 'festive', 'wedding', 'party'],
    /* colour families with a representative swatch and Indian colour names */
    families: { red: ['Red', '#B3261E'], maroon: ['Maroon / wine', '#6E1423'], rust: ['Rust / kesari', '#C2571A'], mustard: ['Mustard / haldi', '#D9A21B'], gold: ['Gold / beige', '#C8A45A'], olive: ['Olive / mehendi', '#6B7A2A'], green: ['Emerald / bottle green', '#0F6B4F'], teal: ['Teal / firozi', '#0E8C8C'], blue: ['Blue / peacock', '#1F5FA8'], navy: ['Navy / indigo', '#1E2A52'], purple: ['Purple / jamuni', '#5B2A86'], pink: ['Rani pink / magenta', '#C2185B'], pastel: ['Pastels', '#D9C6E3'], ivory: ['Ivory / white', '#F1E9D8'], black: ['Black / charcoal', '#26262A'] },
    goals: { balance_hips: 'Balance hips', define_waist: 'Define waist', look_taller: 'Look taller', streamline_mid: 'Streamline the middle', broaden_shoulders: 'Broaden shoulders', relaxed: 'Relaxed and comfortable' },
    monk: ['#F6EDE4', '#F3E7DB', '#F7EAD0', '#EADABA', '#D7BD96', '#A07E56', '#825C43', '#604134', '#3A312A', '#292420'],
    rejectReasons: ['Colour not liked', 'Fit not right', 'Price too high', 'Fabric feel', 'Too heavy / too plain', 'Wanted another style', 'Family did not approve'],
    noBuyReasons: ['Just browsing', 'Price', 'Nothing in size', 'Will come back with family', 'Bought elsewhere / will compare', 'Did not like the picks'],
    roles: { OWNER: 'Owner', MANAGER: 'Manager', STAFF: 'Sales staff', INTAKE: 'Intake' },
  };
  FF.catName = (c) => (CATS[c] || {}).name || c;
  FF.groupOf = (p) => G[CATS[p.cat].group];
  FF.sizeSystem = (p) => (p.unstitched ? 'FREE' : FF.groupOf(p).size);
  FF.toneLabel = (pr) => (pr.tone ? `Tone ${pr.tone}` : 'Tone not given') + (pr.undertone && pr.undertone !== 'unknown' ? ` · ${pr.undertone} undertone` : '') + (pr.contrast && pr.contrast !== 'unknown' ? ` · ${pr.contrast} contrast` : '');

  /* ---------- products: [id, name, cat, price, mrp, colourName, hex, hex2, family, pattern, fabric, silhouette, border, occasions, stock, rack, ageDays, flags] ---------- */
  const P = [
    ['SR-1001', 'Banarasi Silk Saree', 'saree', 8900, 9500, 'Maroon', '#6E1423', '#C9A24B', 'maroon', 'zari', 'silk', 'drape', 3, 'wedding festive', 'FREE2', 'R1-S1', 210, ''],
    ['SR-1002', 'Kanjeevaram Silk Saree', 'saree', 14500, 15500, 'Peacock blue', '#1F5FA8', '#C9A24B', 'blue', 'zari', 'silk', 'drape', 3, 'wedding', 'FREE1', 'R1-S1', 320, ''],
    ['SR-1003', 'Bandhani Georgette Saree', 'saree', 3200, 3400, 'Rani pink', '#C2185B', '#F2C14E', 'pink', 'bandhani', 'georgette', 'drape', 1, 'festive party', 'FREE3', 'R1-S2', 45, ''],
    ['SR-1004', 'Chanderi Cotton-Silk Saree', 'saree', 2800, 2950, 'Haldi yellow', '#D9A21B', '#7A4A12', 'mustard', 'solid', 'chanderi', 'drape', 1, 'festive office', 'FREE2', 'R1-S2', 160, ''],
    ['SR-1005', 'Organza Floral Saree', 'saree', 4200, 4500, 'Lilac', '#CDB7E0', '#8E6BB0', 'pastel', 'floral', 'organza', 'drape', 0, 'party', 'FREE2', 'R1-S3', 95, ''],
    ['SR-1006', 'Patola Print Saree', 'saree', 5600, 6200, 'Bottle green', '#0F5B43', '#B3261E', 'green', 'block', 'silk', 'drape', 2, 'festive wedding', 'FREE1', 'R1-S3', 400, 'offer:Festive leftover · 10% off'],
    ['SR-1007', 'Chiffon Daily Saree', 'saree', 1450, 1500, 'Firozi', '#16A3A3', '#0C6E6E', 'teal', 'dots', 'chiffon', 'drape', 0, 'daily office', 'FREE5', 'R1-S4', 30, ''],
    ['SR-1008', 'Tissue Silk Saree', 'saree', 11800, 12500, 'Antique gold', '#C8A45A', '#8A6A22', 'gold', 'zari', 'tissue', 'drape', 2, 'wedding', 'FREE1', 'R1-S1', 510, ''],
    ['SR-1010', 'Crepe Printed Saree', 'saree', 2100, 2300, 'Wine', '#7B1E3C', '#E0B0A0', 'maroon', 'floral', 'crepe', 'drape', 0, 'office party', 'FREE3', 'R1-S4', 130, ''],
    ['DP-1101', 'Bandhej Dupatta', 'dupatta', 950, 999, 'Red', '#B3261E', '#F2C14E', 'red', 'bandhani', 'georgette', 'drape', 1, 'festive daily', 'FREE6', 'R1-S5', 70, ''],
    ['KT-2001', 'A-line Cotton Kurti', 'kurti', 1299, 1399, 'Mustard', '#D9A21B', '#7A3E12', 'mustard', 'block', 'cotton', 'aline', 0, 'daily office', 'S2 M3 L2 XL1 XXL0', 'R2-S1', 40, 'alter'],
    ['KT-2002', 'Straight Long Kurti', 'kurti', 1599, 1699, 'Navy', '#1E2A52', '#C9A24B', 'navy', 'solid', 'rayon', 'straight', 0, 'office daily', 'S1 M2 L4 XL3 XXL2', 'R2-S1', 120, 'alter'],
    ['KS-2003', 'Embroidered Anarkali Set', 'anarkali', 3499, 3799, 'Wine', '#6E1423', '#C9A24B', 'maroon', 'embroidered', 'georgette', 'anarkali', 1, 'festive wedding', 'S1 M2 L2 XL1 XXL0', 'R2-S2', 200, 'alter'],
    ['KS-2004', 'Straight Kurta Set with Dupatta', 'kurta_set', 2399, 2499, 'Mehendi green', '#6B7A2A', '#E8D9A0', 'olive', 'embroidered', 'cotton-silk', 'straight', 0, 'festive office', 'S2 M2 L1 XL2 XXL1', 'R2-S2', 85, 'alter'],
    ['KT-2005', 'Kaftan Kurti', 'kurti', 1099, 1199, 'Coral', '#E2725B', '#FBE3C8', 'rust', 'floral', 'cotton', 'kaftan', 0, 'daily', 'S3 M3 L3 XL2 XXL2', 'R2-S3', 25, ''],
    ['KS-2006', 'Peplum Sharara Set', 'kurta_set', 4299, 4599, 'Rani pink', '#C2185B', '#F2C14E', 'pink', 'embroidered', 'silk', 'peplum', 1, 'party festive wedding', 'S1 M1 L2 XL0 XXL0', 'R2-S3', 150, ''],
    ['KS-2007', 'Chikankari Kurta Set', 'kurta_set', 2899, 2999, 'Ivory', '#F1E9D8', '#CFC2A5', 'ivory', 'embroidered', 'cotton', 'straight', 0, 'festive office', 'S2 M3 L2 XL2 XXL1', 'R2-S4', 60, 'alter'],
    ['DM-2008', 'Bandhani Dress Material', 'dress_material', 1850, 1950, 'Teal', '#0E8C8C', '#F2C14E', 'teal', 'bandhani', 'cotton', 'unstitched', 0, 'festive daily', 'FREE4', 'R2-S5', 300, 'unstitched'],
    ['KT-2009', 'Festive Gota Kurti', 'kurti', 1799, 1899, 'Kesari', '#C2571A', '#F2C14E', 'rust', 'embroidered', 'chanderi', 'aline', 0, 'festive', 'S2 M2 L1 XL1 XXL0', 'R2-S4', 20, ''],
    ['KS-2011', 'Empire-line Long Kurta Set', 'kurta_set', 2199, 2399, 'Jamuni', '#5B2A86', '#D9C6E3', 'purple', 'solid', 'crepe', 'empire', 0, 'festive party office', 'S1 M2 L3 XL2 XXL2', 'R2-S5', 175, 'alter'],
    ['LH-3001', 'Bridal Zari Lehenga', 'lehenga', 28500, 29999, 'Sindoori red', '#A31621', '#C9A24B', 'red', 'zari', 'silk', 'flared', 3, 'wedding', 'S1 M1 L1 XL0', 'R3-S1', 380, 'alter'],
    ['LH-3002', 'Flared Lehenga, Plain Choli', 'lehenga', 12500, 13500, 'Jamuni', '#5B2A86', '#C9A24B', 'purple', 'embroidered', 'georgette', 'flared', 2, 'festive wedding', 'S1 M2 L1 XL1', 'R3-S1', 170, 'alter'],
    ['LH-3003', 'Pastel Mirror-work Lehenga', 'lehenga', 9800, 10500, 'Mint', '#BFE3D0', '#F0C9B8', 'pastel', 'dots', 'net', 'flared', 1, 'party festive', 'S2 M1 L1 XL0', 'R3-S2', 60, 'alter'],
    ['MK-4001', 'Cotton Kurta Pyjama', 'kurta_pyjama', 1899, 1999, 'Off-white', '#F1E9D8', '#D8CDB4', 'ivory', 'solid', 'cotton', 'straight', 0, 'daily festive', 'S2 M4 L3 XL2 XXL1', 'R4-S1', 50, ''],
    ['MK-4002', 'Silk-blend Kurta Set', 'kurta_pyjama', 3299, 3499, 'Maroon', '#6E1423', '#C9A24B', 'maroon', 'embroidered', 'silk', 'straight', 0, 'festive wedding', 'S1 M2 L2 XL1 XXL1', 'R4-S1', 190, ''],
    ['SH-4003', 'Jacquard Sherwani', 'sherwani', 18500, 19999, 'Ivory gold', '#EADFC4', '#C9A24B', 'gold', 'zari', 'jacquard', 'structured', 1, 'wedding', 'M1 L1 XL1 XXL0', 'R4-S2', 420, 'alter'],
    ['NJ-4004', 'Nehru Jacket', 'nehru_jacket', 2499, 2699, 'Navy', '#1E2A52', '#C9A24B', 'navy', 'solid', 'cotton-silk', 'structured', 0, 'festive office', 'S1 M2 L2 XL2 XXL1', 'R4-S2', 110, ''],
    ['MK-4005', 'Pathani Suit', 'kurta_pyjama', 2799, 2999, 'Black', '#26262A', '#55555C', 'black', 'solid', 'cotton', 'relaxed', 0, 'festive', 'S0 M1 L2 XL2 XXL1', 'R4-S3', 240, ''],
    ['MK-4006', 'Block-print Short Kurta', 'kurta_pyjama', 1199, 1299, 'Indigo', '#27408B', '#F1E9D8', 'navy', 'block', 'cotton', 'relaxed', 0, 'daily', 'S3 M3 L3 XL2 XXL1', 'R4-S3', 15, ''],
    ['WS-5001', 'Linen Shirt', 'shirt', 1799, 1899, 'Sky blue', '#9CC3E6', '#5E8DB8', 'blue', 'solid', 'linen', 'regular', 0, 'office daily', 'S2 M3 L3 XL1 XXL1', 'R5-S1', 35, ''],
    ['WS-5002', 'Checked Casual Shirt', 'shirt', 1399, 1499, 'Olive check', '#6B7A2A', '#2E3B12', 'olive', 'checks', 'cotton', 'regular', 0, 'daily', 'S1 M2 L4 XL3 XXL2', 'R5-S1', 150, ''],
    ['WT-5003', 'Formal Trousers', 'trousers', 1999, 2199, 'Charcoal', '#3A3A40', '#26262A', 'black', 'solid', 'poly-viscose', 'straight', 0, 'office', '30:2 32:3 34:2 36:1 38:1', 'R5-S2', 80, 'alter'],
    ['WJ-5004', 'Slim Jeans', 'jeans', 2299, 2499, 'Indigo', '#27408B', '#1A2B5E', 'navy', 'solid', 'denim', 'slim', 0, 'daily', '30:3 32:4 34:3 36:2 38:0', 'R5-S2', 200, ''],
    ['WD-5005', 'Wrap Dress', 'dress', 2699, 2899, 'Emerald', '#0F6B4F', '#0A4A37', 'green', 'solid', 'crepe', 'wrap', 0, 'party office', 'S1 M2 L2 XL1', 'R5-S3', 55, ''],
    ['WT-5006', 'Satin Top', 'top', 1299, 1399, 'Wine', '#7B1E3C', '#4E1226', 'maroon', 'solid', 'satin', 'relaxed', 0, 'party', 'S2 M2 L1 XL1', 'R5-S3', 130, ''],
    ['WB-5007', 'Tailored Blazer', 'blazer', 3999, 4299, 'Black', '#26262A', '#55555C', 'black', 'solid', 'poly-viscose', 'structured', 0, 'office party', 'S1 M1 L2 XL1', 'R5-S4', 220, 'alter'],
    ['WK-5008', 'A-line Skirt', 'skirt', 1499, 1599, 'Mustard', '#D9A21B', '#7A3E12', 'mustard', 'solid', 'cotton', 'aline', 0, 'daily office', '26:1 28:2 30:2 32:1', 'R5-S4', 70, ''],
    ['KD-6001', 'Boys Kurta Set', 'kids_kurta', 999, 1099, 'Haldi yellow', '#E3B020', '#7A3E12', 'mustard', 'solid', 'cotton', 'straight', 0, 'festive', '2-3Y:2 4-5Y:3 6-7Y:2 8-9Y:1 10-11Y:1', 'R6-S1', 45, ''],
    ['KD-6002', 'Girls Lehenga Choli', 'kids_lehenga', 1899, 1999, 'Rani pink', '#C2185B', '#F2C14E', 'pink', 'dots', 'net', 'flared', 1, 'festive wedding', '2-3Y:1 4-5Y:2 6-7Y:2 8-9Y:1 10-11Y:0', 'R6-S1', 260, ''],
    ['KD-6003', 'Party Frock', 'kids_dress', 899, 949, 'Sky blue', '#9CC3E6', '#FFFFFF', 'blue', 'floral', 'cotton', 'aline', 0, 'party daily', '2-3Y:2 4-5Y:2 6-7Y:3 8-9Y:2', 'R6-S2', 30, ''],
    ['KD-6004', 'Boys Sherwani', 'kids_sherwani', 2499, 2699, 'Maroon', '#6E1423', '#C9A24B', 'maroon', 'zari', 'jacquard', 'structured', 0, 'wedding', '4-5Y:1 6-7Y:1 8-9Y:1 10-11Y:1', 'R6-S2', 330, ''],
  ];
  const parseStock = (s) => { const o = {}; s.split(' ').forEach((t) => { if (t.startsWith('FREE')) o.FREE = +t.slice(4); else if (t.includes(':')) { const [k, v] = t.split(':'); o[k] = +v; } else { const m = t.match(/^([A-Z]+)(\d+)$/); o[m[1]] = +m[2]; } }); return o; };
  const mkProduct = (r, now) => { const [id, name, c, price, mrp, colour, hex, hex2, family, pattern, fabric, sil, border, occ, stock, rack, age, flags] = r; const offer = (flags.match(/offer:(.+)$/) || [])[1]; return { id, name, cat: c, dept: CATS[c].depts[0], shape: CATS[c].shape, price, mrp, colour, hex, hex2, family, pattern, fabric, sil, border, occ: occ.split(' '), stock: parseStock(stock), rack, receivedAt: now - age * FF.DAY, ageSource: age > 250 ? 'ESTIMATED_STAFF' : 'RECEIPT', status: 'LIVE', conf: 1, alter: flags.includes('alter'), unstitched: flags.includes('unstitched'), offer: offer || null, imp7: 0, hsn: G[CATS[c].group].hsn, barcode: '89' + String(FF.hash(id)).slice(0, 10), intake: age > 150 ? 'FULL' : 'QUICK', moves: [], lowFields: [] }; };

  /* ---------- seed ---------- */
  FF.seed = () => {
    const now = Date.now(), r = FF.rng(20261115);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const products = P.map((x) => mkProduct(x, now));
    products.forEach((p) => { p.imp7 = Math.floor(r() * 26); p.moves.push({ at: p.receivedAt, type: 'RECEIPT', size: 'all', qty: FF.stockTotal(p) + Math.floor(r() * 4), ref: 'Opening / inward', by: 'Imran Shaikh' }); });
    /* two pieces waiting in the review queue, with low-confidence fields */
    const rv = (row, low, aiFam) => { const p = mkProduct(row, now); p.status = 'IN_REVIEW'; p.conf = 0.6; p.lowFields = low; p.aiFamily = aiFam; return p; };
    products.push(rv(['KT-2010', 'Printed Rayon Kurti', 'kurti', 1399, 1499, 'Teal', '#0E8C8C', '#F1E9D8', 'teal', 'floral', 'rayon', 'aline', 0, 'daily office', 'S2 M2 L2 XL1 XXL1', 'R2-S6', 3, ''], [['silhouette', 0.52], ['fabric', 0.61]], 'blue'));
    products.push(rv(['SR-1009', 'Linen Saree with Zari Border', 'saree', 3600, 3800, 'Ash grey', '#9A9A9E', '#C9A24B', 'black', 'zari', 'linen', 'drape', 1, 'office festive', 'FREE2', 'R1-S5', 2, ''], [['occasions', 0.48], ['border width', 0.66]], 'ivory'));
    const staff = [
      { id: 'u1', name: 'Hetal Shah', role: 'OWNER', phone: '98250 11001', pin: '1111', active: true, code: 'HS' },
      { id: 'u2', name: 'Kiran Desai', role: 'MANAGER', phone: '98250 11002', pin: '1111', active: true, code: 'KD' },
      { id: 'u3', name: 'Meera Joshi', role: 'STAFF', phone: '98250 11003', pin: '1111', active: true, code: 'MJ' },
      { id: 'u4', name: 'Arjun Solanki', role: 'STAFF', phone: '98250 11004', pin: '1111', active: true, code: 'AS' },
      { id: 'u5', name: 'Pooja Rana', role: 'STAFF', phone: '98250 11005', pin: '1111', active: true, code: 'PR' },
      { id: 'u6', name: 'Imran Shaikh', role: 'INTAKE', phone: '98250 11006', pin: '1111', active: true, code: 'IS' },
    ];
    const floor = ['u3', 'u4', 'u5', 'u2'];
    const live = products.filter((p) => p.status === 'LIVE');
    /* 30 days of synthetic history */
    const visits = [], sales = [], baseline = [];
    let billNo = 100;
    const mkSale = (at, lines, src, visit, staffId) => { const total = FF.sum(lines, (l) => l.price * l.qty - l.disc); const s = { id: 's' + sales.length, no: src === 'BILLING' ? 'C1/26-27/' + String(++billNo).padStart(5, '0') : src === 'POS_FILE' ? 'TLY-' + (4000 + sales.length) : 'APP-' + (700 + sales.length), at, source: src, visit: visit || null, staff: staffId, lines, total, tax: Math.round(FF.sum(lines, (l) => { const v = l.price - l.disc / l.qty; return (v * l.qty * (v <= 2500 ? 5 : 18)) / (100 + (v <= 2500 ? 5 : 18)); })), pay: [{ mode: pick(['UPI', 'UPI', 'CASH', 'CARD']), amt: total }], doc: 'TAX_INVOICE', attribution: visit ? pick(['HANDOFF_CODE', 'HANDOFF_CODE', 'QR_SCAN', 'STAFF_LINKED']) : 'NONE', returns: [] }; sales.push(s); return s; };
    const line = (p, at, rec) => { const sizes = Object.keys(p.stock); const age = Math.round((at - p.receivedAt) / FF.DAY); const [f] = FF.db_aging[CATS[p.cat].aging]; return { pid: p.id, name: p.name, size: pick(sizes), qty: 1, price: p.price, mrp: p.mrp, disc: r() < 0.3 ? Math.round((p.price * (0.03 + r() * 0.07)) / 10) * 10 : 0, rec: !!rec, age, aged: age >= f }; };
    FF.db_aging = { western: [60, 180], everyday: [90, 270], occasion: [150, 450] };
    const clampT = (at) => (at > now - 120000 ? now - 300000 - Math.floor(r() * 4 * 3600000) : at); /* V2: today has activity too, never in the future */
    for (let d = 30; d >= 0; d--) {
      const day0 = new Date(now - d * FF.DAY); day0.setHours(11, 0, 0, 0); const t0 = day0.getTime(), wk = day0.getDay(), busy = wk === 0 || wk === 6 ? 1.45 : 1;
      const liveDay = d <= 21; /* FitFirst "went live" 21 days ago in the demo story */
      const nV = liveDay ? Math.round((d === 0 ? 4 + r() * 3 : 9 + r() * 7) * busy) : 0;
      for (let i = 0; i < nV; i++) {
        const at = clampT(t0 + Math.floor(r() * 9 * 3600000)), dept = r() < 0.62 ? 'WOMEN' : r() < 0.8 ? 'MEN' : 'KIDS', pool = live.filter((p) => p.dept === dept), holdout = r() < 0.1;
        const picks = []; while (picks.length < Math.min(5, pool.length)) { const p = pick(pool); if (!picks.includes(p)) picks.push(p); }
        const roll = r(), status = roll < 0.08 ? 'ABANDONED' : roll < 0.5 ? 'PURCHASED' : 'NO_PURCHASE', st = pick(floor), code = 'FF-' + Array.from({ length: 4 }, () => pick('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.split(''))).join('');
        const v = { id: 'v' + visits.length, code, at, channel: pick(['ASSISTED', 'ASSISTED', 'KIOSK', 'QR']), status, staff: status === 'ABANDONED' ? null : st, holdout, lang: pick(['en', 'en', 'gu', 'hi']), profiles: [{ label: 'Me', dept, cats: [picks[0].cat], occasion: pick(picks[0].occ), budget: pick([1500, 3000, 6000, 12000, 0]), size: null, height: pick(['petite', 'average', 'average', 'tall']), tone: 3 + Math.floor(r() * 6), undertone: pick(['warm', 'warm', 'cool', 'neutral']), contrast: pick(['medium', 'high', 'low']), goals: [], likes: [], dislikes: [] }], picks: picks.map((p, k) => ({ pid: p.id, rank: k + 1, state: 'shown', boosted: !holdout && FF_ageBandAt(p, at) !== 'fresh' && k < 2 })), shortlist: [], events: [], rating: status === 'PURCHASED' && r() < 0.6 ? pick([4, 5, 5, 3]) : null, mins: 12 + Math.floor(r() * 30), hist: true };
        if (status !== 'ABANDONED') { v.picks.forEach((x, k) => { if (r() < 0.55) { x.state = 'shortlisted'; v.shortlist.push(x.pid); if (r() < 0.7) x.state = r() < 0.5 ? 'tried' : 'rejected'; if (x.state === 'rejected') x.reason = pick(FF.TAX.rejectReasons); } }); }
        if (status === 'PURCHASED') { const agedPick = v.picks.find((x) => x.boosted); const boughtRec = r() < 0.72; const main = boughtRec ? (agedPick && r() < (holdout ? 0.12 : 0.42) ? agedPick : v.picks[Math.floor(r() * 3)]) : null; const lines = []; if (main) { main.state = 'bought'; lines.push(line(FF_p(products, main.pid), at, true)); } else lines.push(line(pick(pool), at, false)); if (r() < 0.25) lines.push(line(pick(pool), at, false)); const s = mkSale(Math.min(now - 60000, at + v.mins * 60000), lines, r() < 0.6 ? 'BILLING' : r() < 0.6 ? 'POS_FILE' : 'STAFF_APP', code, st); v.sale = s.id; } else if (status === 'NO_PURCHASE') v.noBuy = pick(FF.TAX.noBuyReasons);
        visits.push(v);
      }
      /* walk-in sales that never touched FitFirst */
      const nW = d === 0 ? 3 : Math.round((liveDay ? 7 : 13) * busy + r() * 4); let rev = 0;
      for (let i = 0; i < nW; i++) { const s = mkSale(clampT(t0 + Math.floor(r() * 9 * 3600000)), [line(pick(live), t0, false)], 'POS_FILE', null, pick(floor)); rev += s.total; }
      baseline.push({ date: FF.day(t0), kiosk: liveDay, footfall: Math.round((nV + nW) * (1.9 + r() * 0.5)), note: wk === 0 ? 'Sunday' : '' });
    }
    function FF_p(list, id) { return list.find((p) => p.id === id); }
    function FF_ageBandAt(p, at) { const a = (at - p.receivedAt) / FF.DAY, [f, dd] = FF.db_aging[CATS[p.cat].aging]; return a >= dd ? 'dead' : a >= f ? 'aged' : 'fresh'; }
    sales.sort((a, b) => a.at - b.at); visits.sort((a, b) => a.at - b.at);
    const gapRows = [['kurti', 'XL', 2000, 'festive', 'warm', 22, 1], ['saree', 'FREE', 1500, 'daily', 'cool', 14, 1], ['kurta_pyjama', 'XXL', 2500, 'wedding', 'warm', 11, 0], ['lehenga', 'XL', 15000, 'wedding', 'any', 9, 0], ['kids_lehenga', '10-11Y', 2000, 'festive', 'any', 7, 0], ['dress', 'XL', 3000, 'party', 'cool', 6, 1]];
    return {
      v: 5, createdAt: now, products, staff, visits, sales, baseline,
      gaps: gapRows.map((g, i) => ({ id: 'g' + i, cat: g[0], size: g[1], budget: g[2], occasion: g[3], palette: g[4], count: g[5], had: g[6], status: 'open' })),
      org: { name: 'Suvarna Retail LLP', plan: 'PRO' },
      stores: [{ id: 'st1', name: 'Suvarna Silks & Ethnic', area: 'C.G. Road, Ahmedabad', city: 'Ahmedabad', state: 'Gujarat', gstin: '24ABCDE1234F1Z5', reg: 'REGULAR', phone: '079 4000 1100' }, { id: 'st2', name: 'Suvarna Silks — Surat', area: 'Ghod Dod Road, Surat', city: 'Surat', state: 'Gujarat', gstin: '24ABCDE1234F2Z4', reg: 'REGULAR', phone: '0261 400 2200' }],
      storeId: 'st1',
      settings: {
        lambda: 'medium', maxBoost: 2, holdout: 10, costRatio: 55, aging: { western: [60, 180], everyday: [90, 270], occasion: [150, 450] }, langs: ['en', 'hi', 'gu'], stitching: true, mode: 'ASSISTED',
        tryon: { enabled: true, perVisit: 3, monthly: 100, used: 37, cats: ['drapes', 'ethnic', 'lehenga', 'mens'], kill: false },
        retention: { visitDays: 90, tryonHours: 24, billsMonths: 72 }, whatsapp: { summary: true, to: '98250 11001', time: '21:30' },
        pos: { path: 'B', level: 'L1', kind: 'Tally Prime', authority: false, lastSync: now - 20 * 3600000 },
        billing: { discLimit: 15, series: 'C1', next: billNo + 1, cn: 12, upi: 'suvarnasilks@okbank', printer: '80mm thermal' },
        pilot: { locked: true, lockedAt: now - 24 * FF.DAY, basketLift: 15, recConv: 30, usage: 40, start: now - 21 * FF.DAY, weeks: 6 },
        flags: { offline: false, aiOff: false, camDenied: false, lowLight: false, tryonFail: false }, onboarded: true, ruleset: '2026.10-pilot-1',
      },
      racks: ['R1-S1', 'R1-S2', 'R1-S3', 'R1-S4', 'R1-S5', 'R2-S1', 'R2-S2', 'R2-S3', 'R2-S4', 'R2-S5', 'R2-S6', 'R3-S1', 'R3-S2', 'R4-S1', 'R4-S2', 'R4-S3', 'R5-S1', 'R5-S2', 'R5-S3', 'R5-S4', 'R6-S1', 'R6-S2'],
      devices: [
        { id: 'd1', name: 'Counter tablet 1', kind: 'ASSISTED_TABLET', seen: now - 120000, ver: '2.3.1', active: true, calib: null },
        { id: 'd2', name: 'Entrance kiosk', kind: 'KIOSK', seen: now - 60000, ver: '2.3.1', active: true, calib: now + 9 * FF.DAY },
        { id: 'd3', name: 'Billing counter C1', kind: 'BILLING_COUNTER', seen: now - 30000, ver: '2.3.1', active: true, calib: null },
        { id: 'd4', name: 'Intake station', kind: 'INTAKE_STATION', seen: now - 26 * 3600000, ver: '2.2.9', active: true, calib: now - 2 * FF.DAY },
      ],
      pushes: [{ id: 'pu1', pid: 'SR-1006', reason: 'CLEARANCE', offer: 'Festive leftover · 10% off', spiff: 150, until: now + 12 * FF.DAY, active: true }, { id: 'pu2', pid: 'LH-3002', reason: 'OWNER_PICK', offer: '', spiff: 300, until: now + 20 * FF.DAY, active: true }],
      rulesets: [{ ver: 'v1-legacy', status: 'ARCHIVED', by: 'Migration', at: now - 60 * FF.DAY, note: 'Depth-only colour table from the pilot prototype' }, { ver: '2026.10-pilot-1', status: 'ACTIVE', by: 'Stylist review (pending sign-off)', at: now - 25 * FF.DAY, note: 'Undertone palettes, fit goals, per-group weights' }],
      suppliers: [{ id: 'sp1', name: 'Shree Balaji Textiles, Surat', gstin: '24AAACS1234A1Z1' }, { id: 'sp2', name: 'Kashi Weaves, Varanasi', gstin: '09AAACK5678B1Z2' }, { id: 'sp3', name: 'Jaipur Block Prints', gstin: '08AAACJ9012C1Z3' }],
      inwards: [{ id: 'in1', supplier: 'sp1', billNo: 'SBT/2291', at: now - 3 * FF.DAY, lines: [{ name: 'Printed Rayon Kurti', qty: 8, cost: 620, mrp: 1499 }], status: 'RECEIVED' }],
      labelQueue: ['KT-2010', 'SR-1009'], counts: [], syncRuns: [
        { id: 'sy1', at: now - 20 * 3600000, file: 'tally_sales_14nov.csv', kind: 'Sales', rows: 42, ok: 40, issues: 2, status: 'APPLIED' }, { id: 'sy0', at: now - 44 * 3600000, file: 'tally_sales_13nov.csv', kind: 'Sales', rows: 37, ok: 37, issues: 0, status: 'APPLIED' }],
      syncIssues: [{ id: 'i1', text: 'SKU "KT2002-L" not found — did you mean KT-2002 (size L)?', fix: 'Map to KT-2002 / L', done: false }, { id: 'i2', text: 'Tally shows −1 stock for SR-1004; FitFirst shows 2', fix: 'Open stock count for SR-1004', done: false }],
      consents: [], erasures: [], tryons: [], dayCloses: [], held: [], notify: [], help: [],
      audit: [{ at: now - 24 * FF.DAY, who: 'Hetal Shah', action: 'Locked kill threshold', entity: 'Pilot', detail: '15% basket · 30% rec. conversion · 40% usage' }, { at: now - 5 * FF.DAY, who: 'Kiran Desai', action: 'Reset PIN', entity: 'Staff', detail: 'Pooja Rana' }, { at: now - 2 * FF.DAY, who: 'Hetal Shah', action: 'Clearance priority → Medium', entity: 'Merch policy', detail: 'λ 0.06' }],
      taxRules: [{ id: 't1', hsn: '61–62', desc: 'Readymade garments', slabs: '5% up to ₹2,500 per piece · 18% above', from: '22 Sep 2025', active: true }, { id: 't2', hsn: '50–55', desc: 'Fabric, sarees, dress material', slabs: '5% flat', from: '1 Jul 2017', active: true }],
      notices: [{ ver: 'N-3', lang: 'English', from: now - 30 * FF.DAY }, { ver: 'N-3', lang: 'हिन्दी', from: now - 30 * FF.DAY }, { ver: 'N-3', lang: 'ગુજરાતી', from: now - 30 * FF.DAY }],
      models: [{ id: 'm1', job: 'Garment tagging', provider: 'AICredits gateway', model: 'gemini-2.5-flash-lite', status: 'ACTIVE', eval: 'category 93% · silhouette 90% (150-piece set)', retire: 'Unconfirmed — watch' }, { id: 'm2', job: 'Try-on render', provider: 'Gemini image', model: 'gemini-3.1-flash-image', status: 'ACTIVE', eval: '82% pass rubric (saree/kurta set)', retire: 'None announced' }, { id: 'm3', job: 'Try-on render (western)', provider: 'Vertex Virtual Try-On', model: 'virtual-try-on-001', status: 'STANDBY', eval: 'Not evaluated', retire: 'None announced' }],
    };
  };
})();
