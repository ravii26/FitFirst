/* FitFirst prototype — deterministic recommendation engine (MASTER_PLAN §5.5–5.7, simplified).
   "AI sees, rules decide": every number below comes from a written rule, and every pick can be explained. */
(function () {
  const FF = window.FF, E = (FF.engine = {});
  E.LAMBDA = { off: 0, low: 0.03, medium: 0.06, high: 0.09 };
  /* palette: how well a colour family sits with an undertone (1 = favoured, .7 = fine, .4 = less ideal) */
  const PAL = {
    warm: { red: 1, maroon: 1, rust: 1, mustard: 1, gold: 1, olive: 1, green: 0.7, teal: 0.7, ivory: 0.8, navy: 0.7, pink: 0.6, blue: 0.5, purple: 0.5, pastel: 0.45, black: 0.6 },
    cool: { blue: 1, navy: 1, purple: 1, pink: 1, green: 1, teal: 1, pastel: 0.8, black: 0.8, maroon: 0.7, ivory: 0.6, red: 0.6, gold: 0.45, mustard: 0.4, rust: 0.4, olive: 0.45 },
    neutral: { red: 0.8, maroon: 0.85, rust: 0.7, mustard: 0.7, gold: 0.75, olive: 0.75, green: 0.85, teal: 0.85, ivory: 0.75, navy: 0.85, pink: 0.8, blue: 0.8, purple: 0.8, pastel: 0.7, black: 0.75 },
    olive: { green: 1, teal: 1, maroon: 1, rust: 0.9, purple: 0.8, navy: 0.8, gold: 0.7, olive: 0.6, red: 0.7, pink: 0.6, blue: 0.7, ivory: 0.6, mustard: 0.45, pastel: 0.45, black: 0.7 },
  };
  /* fit-goal rules: goal -> { silhouette or fabric: [effect, reasonKey] } */
  const GOAL = {
    balance_hips: { aline: [0.3, 'g_hips_aline'], anarkali: [0.3, 'g_hips_flare'], flared: [0.3, 'g_hips_flare'], kaftan: [0.1, 'g_hips_flow'], slim: [-0.25], straight: [-0.05], drape: [0.1, 'g_hips_flow'] },
    define_waist: { peplum: [0.3, 'g_waist'], wrap: [0.35, 'g_waist'], anarkali: [0.25, 'g_waist'], flared: [0.2, 'g_waist'], empire: [0.1, 'g_waist'], kaftan: [-0.25], relaxed: [-0.2], drape: [0.1, 'g_waist_drape'] },
    look_taller: { straight: [0.3, 'g_tall_line'], empire: [0.2, 'g_tall_line'], slim: [0.2, 'g_tall_line'], structured: [0.15, 'g_tall_line'], drape: [0.1, 'g_tall_line'], peplum: [-0.15], kaftan: [-0.1] },
    streamline_mid: { empire: [0.35, 'g_mid'], straight: [0.25, 'g_mid'], aline: [0.15, 'g_mid'], kaftan: [0.15, 'g_mid'], drape: [0.05], peplum: [-0.3], wrap: [-0.1], slim: [-0.2] },
    broaden_shoulders: { structured: [0.35, 'g_shoulder'], regular: [0.05], relaxed: [-0.1], slim: [-0.05] },
    relaxed: { kaftan: [0.35, 'g_relax'], relaxed: [0.3, 'g_relax'], aline: [0.15, 'g_relax'], regular: [0.15, 'g_relax'], straight: [0.1], structured: [-0.2], slim: [-0.2], peplum: [-0.1] },
  };
  const FLOW = ['georgette', 'chiffon', 'crepe'], STIFF = ['organza', 'tissue'];
  const ADJ = (sys, size) => { const a = FF.TAX.sizes[sys] || [], i = a.indexOf(size); return i < 0 ? [] : [a[i - 1], a[i + 1]].filter(Boolean); };
  const skinL = (tone) => FF.lum(FF.TAX.monk[tone - 1]);

  /* which size (if any) of product p can serve this profile? */
  E.sizeMatch = (p, pr) => {
    const sys = FF.sizeSystem(p);
    if (p.unstitched) return FF.stockTotal(p) > 0 ? { kind: 'unstitched', size: 'FREE', f: 0.97 } : null;
    if (sys === 'FREE') return p.stock.FREE > 0 ? { kind: 'free', size: 'FREE', f: 0.97 } : null;
    const want = pr.sizes && pr.sizes[sys]; if (!want) { const any = Object.keys(p.stock).find((s) => p.stock[s] > 0); return any ? { kind: 'unknown', size: null, f: 0.9 } : null; }
    if (p.stock[want] > 0) return { kind: 'exact', size: want, f: 1 };
    const adj = ADJ(sys, want).find((s) => p.stock[s] > 0);
    if (adj && p.alter) return { kind: 'alterable', size: adj, f: 0.9 };
    if (adj) return { kind: 'adjacent', size: adj, f: 0.8 };
    return null;
  };

  /* suitability components, each 0..1 or null when its inputs are unknown */
  E.score = (p, pr) => {
    const reasons = [], comp = {};
    /* colour */
    if (pr.undertone && pr.undertone !== 'unknown' || pr.tone) {
      const hue = pr.undertone && PAL[pr.undertone] ? PAL[pr.undertone][p.family] ?? 0.6 : 0.6;
      let contrast = 0.65, wash = 0;
      if (pr.tone) { const gap = Math.abs(FF.lum(p.hex) - skinL(pr.tone)); const target = pr.contrast === 'high' ? 50 : pr.contrast === 'low' ? 22 : 36; contrast = FF.clamp(1 - Math.abs(gap - target) / 55, 0.2, 1); if (gap < 9 && ['ivory', 'gold', 'pastel', 'black'].includes(p.family)) wash = 0.35; }
      const metal = p.pattern === 'zari' ? (pr.undertone === 'warm' ? 0.05 : pr.undertone === 'cool' ? -0.03 : 0) : 0;
      /* undertone carries at most ~0.3 of the colour score when it was only a quiz answer */
      comp.colour = FF.clamp(0.45 * hue + 0.3 * contrast + 0.25 * 0.7 - wash + metal, 0, 1);
      if (hue >= 0.95) reasons.push({ k: 'c_' + pr.undertone, w: comp.colour + 0.05, v: { colour: p.colour } });
      else if (contrast >= 0.85 && pr.tone) reasons.push({ k: 'c_contrast', w: comp.colour, v: { colour: p.colour } });
    } else comp.colour = null;
    /* silhouette vs fit goals */
    if (pr.goals && pr.goals.length) {
      let s = 0.6; const rs = [];
      pr.goals.forEach((g) => { const rule = (GOAL[g] || {})[p.sil]; if (rule) { s += rule[0]; if (rule[1] && rule[0] > 0) rs.push({ k: rule[1], w: 0.6 + rule[0] }); } if (g === 'streamline_mid') { if (FLOW.includes(p.fabric)) { s += 0.12; rs.push({ k: 'g_mid_flow', w: 0.72, v: { fabric: p.fabric } }); } if (STIFF.includes(p.fabric)) s -= 0.2; } if (g === 'look_taller' && p.border >= 2) s -= 0.15; if (g === 'look_taller' && p.pattern === 'stripes') s += 0.1; });
      comp.sil = FF.clamp(s, 0, 1); rs.sort((a, b) => b.w - a.w); if (rs[0]) reasons.push(rs[0]);
    } else comp.sil = null;
    /* proportion */
    if (pr.height) { let v = 0.7; if (pr.height === 'petite') { v = p.border >= 2 ? 0.35 : p.border === 1 ? 0.75 : 0.85; if (p.border <= 1 && p.shape === 'saree') reasons.push({ k: 'h_petite', w: 0.7 }); } if (pr.height === 'tall') { v = p.border >= 2 ? 0.95 : 0.7; if (p.border >= 2) reasons.push({ k: 'h_tall', w: 0.8 }); } comp.prop = v; } else comp.prop = null;
    /* occasion */
    if (pr.occasion) { comp.occ = p.occ.includes(pr.occasion) ? 1 : 0.4; if (comp.occ === 1) reasons.push({ k: 'o_fit', w: 0.55, v: { occasion: pr.occasion } }); } else comp.occ = null;
    /* preferences */
    if ((pr.likes && pr.likes.length) || (pr.dislikes && pr.dislikes.length)) { comp.pref = pr.likes.includes(p.family) ? 1 : pr.dislikes.includes(p.family) ? 0 : 0.5; if (comp.pref === 1) reasons.push({ k: 'p_like', w: 0.75, v: { colour: p.colour } }); } else comp.pref = null;
    const w = FF.groupOf(p).w; let tw = 0, ts = 0; Object.keys(w).forEach((k) => { if (comp[k] != null) { tw += w[k]; ts += w[k] * comp[k]; } });
    let S = tw ? ts / tw : 0.62; /* nothing known: neutral, so ranking falls back to variety and availability */
    S = p.conf * S + (1 - p.conf) * 0.5; /* unreviewed AI tags shrink toward neutral */
    reasons.sort((a, b) => b.w - a.w);
    return { S, comp, reasons };
  };

  E.business = (p) => {
    const [fresh, dead] = FF.agePolicy(p), age = FF.ageDays(p);
    const aging = FF.clamp((age - fresh) / (dead - fresh), 0, 1);
    const push = FF.db.pushes.find((x) => x.pid === p.id && x.active && x.until > Date.now());
    const over = FF.stockTotal(p) >= 10 ? 0.4 : 0;
    const B = Math.max(aging, 0.8 * over, push ? 0.7 : 0) / (1 + (p.imp7 || 0) / 20);
    return { B, age, aging, push };
  };

  /* main entry. opts: {lambda, holdout, relax} */
  E.recommend = (pr, opts) => {
    opts = opts || {}; const st = FF.db.settings; const holdout = !!opts.holdout; const lambda = holdout ? 0 : E.LAMBDA[opts.lambda || st.lambda];
    const stats = { live: 0, dept: 0, category: 0, occasion: 0, size: 0, budget: 0 }; const near = [];
    let pool = FF.db.products.filter((p) => p.status === 'LIVE'); stats.live = pool.length;
    pool = pool.filter((p) => p.dept === pr.dept); stats.dept = pool.length;
    if (pr.cats && pr.cats.length) pool = pool.filter((p) => pr.cats.includes(p.cat)); stats.category = pool.length;
    let p2 = pr.occasion ? pool.filter((p) => p.occ.includes(pr.occasion)) : pool; stats.occasion = p2.length;
    const sized = []; p2.forEach((p) => { const m = E.sizeMatch(p, pr); if (m && m.kind !== 'adjacent') sized.push([p, m]); else if (m) near.push({ p, m, why: 'near_size' }); }); stats.size = sized.length;
    const inB = []; sized.forEach(([p, m]) => { if (!pr.budget || p.price <= pr.budget * 1.15) inB.push([p, m]); else if (p.price <= pr.budget * 1.4) near.push({ p, m, why: 'over_budget' }); }); stats.budget = inB.length;
    if (pr.occasion) pool.filter((p) => !p.occ.includes(pr.occasion)).forEach((p) => { const m = E.sizeMatch(p, pr); if (m && m.kind !== 'adjacent' && (!pr.budget || p.price <= pr.budget * 1.15)) near.push({ p, m, why: 'other_occasion' }); });
    let items = inB.map(([p, m]) => { const sc = E.score(p, pr), bz = E.business(p); return { p, pid: p.id, m, S: sc.S * m.f, comp: sc.comp, reasons: sc.reasons, B: bz.B, age: bz.age, aging: bz.aging, push: bz.push }; });
    const top = Math.max(0, ...items.map((i) => i.S));
    items = items.filter((i) => i.S >= Math.max(0.45, top - 0.3)); /* show gate, relative to the best match */
    items.forEach((i) => { i.eligible = i.S >= Math.max(0.6, top - 0.12) && i.B > 0.05; i.boost = i.eligible ? lambda * i.B : 0; i.final = i.S + i.boost; });
    items.sort((a, b) => b.final - a.final);
    /* at most N boosted items in the top 5 */
    const cap = st.maxBoost; for (let guard = 0; guard < 10; guard++) { const b5 = items.slice(0, 5).filter((i) => i.boost > 0.004); if (b5.length <= cap) break; const drop = b5.sort((a, b) => a.B - b.B)[0]; drop.boost = 0; drop.final = drop.S; drop.capped = true; items.sort((a, b) => b.final - a.final); }
    /* variety: greedy re-rank with a penalty for repeating category + colour family */
    const out = [], rest = items.slice(); while (rest.length && out.length < 9) { let bi = 0, bv = -1; rest.forEach((c, i) => { const sim = Math.max(0, ...out.map((o) => (o.p.family === c.p.family ? 0.5 : 0) + (o.p.cat === c.p.cat ? 0.2 : 0) + (o.p.pattern === c.p.pattern ? 0.1 : 0))); const v = 0.75 * c.final - 0.25 * sim * 0.4; if (v > bv) { bv = v; bi = i; } }); out.push(rest.splice(bi, 1)[0]); }
    out.forEach((i, k) => { i.rank = k + 1; i.boosted = i.boost > 0.004; i.offer = i.p.offer || (i.push && i.push.offer) || null; });
    const alts = []; near.forEach((n) => { if (!alts.some((a) => a.p.id === n.p.id) && !out.some((o) => o.pid === n.p.id)) alts.push(n); });
    const gap = out.length < 3 ? { cat: (pr.cats || [])[0] || 'any', size: (pr.sizes && Object.values(pr.sizes)[0]) || 'any', budget: pr.budget || 0, occasion: pr.occasion || 'any', palette: pr.undertone || 'any', had: out.length, reason: stats.category === 0 ? 'No stock in this category' : stats.occasion === 0 ? 'Nothing for this occasion' : stats.size === 0 ? 'Nothing in this size' : stats.budget === 0 ? 'Nothing in this budget' : 'Too few suitable pieces' } : null;
    return { heroes: out.slice(0, 3), more: out.slice(3, 9), all: out, alts: alts.slice(0, 4), stats, gap, lambda, holdout };
  };

  /* "Suits" card: computed from the same rules, so it changes when a rule changes */
  E.suits = (p) => {
    const ut = ['warm', 'cool', 'neutral', 'olive'].map((u) => [u, PAL[u][p.family] ?? 0.6]);
    const goals = Object.keys(GOAL).map((g) => [g, ((GOAL[g][p.sil] || [0])[0]) + (g === 'streamline_mid' && FLOW.includes(p.fabric) ? 0.12 : 0) - (g === 'streamline_mid' && STIFF.includes(p.fabric) ? 0.2 : 0)]);
    const less = []; if (p.border >= 2) less.push('petite frames (broad border)'); ut.filter((x) => x[1] <= 0.45).forEach((x) => less.push(x[0] + ' undertones')); goals.filter((x) => x[1] <= -0.2).forEach((x) => less.push('goal “' + FF.TAX.goals[x[0]].toLowerCase() + '”'));
    return { undertones: ut.filter((x) => x[1] >= 0.85).map((x) => x[0]), goals: goals.filter((x) => x[1] >= 0.15).map((x) => FF.TAX.goals[x[0]]), height: p.border >= 2 ? 'average or tall' : 'any height', occasions: p.occ, less };
  };

  /* staff talking points: allowed to be richer than the shopper line, never used for ranking */
  E.talk = (i) => { const p = i.p, t = []; t.push(`${FF.cap(p.fabric)} in ${p.colour.toLowerCase()}${p.pattern !== 'solid' ? ', ' + p.pattern + ' work' : ''}.`); if (i.m.kind === 'alterable') t.push(`Stock is ${i.m.size}; can be altered to fit.`); if (p.unstitched) t.push(FF.db.settings.stitching ? 'Unstitched — offer in-house stitching.' : 'Unstitched — stitching required.'); if (i.offer) t.push('On offer: ' + i.offer + '.'); return t; };
})();
