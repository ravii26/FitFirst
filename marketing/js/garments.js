/* Drawn garment illustrations, adapted from prototype_v2/js/core.js so the marketing
   page stays self-contained. These are illustrations, not product photographs. */
(function () {
  'use strict';
  var gid = 0;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var shade = function (hex, f) {
    var n = parseInt(hex.slice(1), 16);
    var c = function (v) { return Math.round(clamp(f > 0 ? v + (255 - v) * f : v * (1 + f), 0, 255)); };
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(function (v) { return c(v).toString(16).padStart(2, '0'); }).join('');
  };
  var pattern = function (id, kind, a) {
    var p = {
      dots: '<circle cx="6" cy="6" r="1.7" fill="' + a + '"/>',
      bandhani: '<circle cx="5" cy="5" r="1.4" fill="none" stroke="' + a + '" stroke-width="1"/><circle cx="11" cy="11" r="1" fill="' + a + '"/>',
      floral: '<circle cx="8" cy="8" r="2.2" fill="' + a + '"/><circle cx="8" cy="4.6" r="1.2" fill="' + a + '" opacity=".7"/><circle cx="11.2" cy="9.5" r="1.2" fill="' + a + '" opacity=".7"/><circle cx="4.8" cy="9.5" r="1.2" fill="' + a + '" opacity=".7"/>',
      block: '<path d="M8 2l5 6-5 6-5-6z" fill="none" stroke="' + a + '" stroke-width="1.2"/>',
      zari: '<path d="M0 8h16M8 0v16" stroke="' + a + '" stroke-width=".7" opacity=".7"/><circle cx="8" cy="8" r="1.3" fill="' + a + '"/>',
      embroidered: '<path d="M2 8q3-5 6 0t6 0" fill="none" stroke="' + a + '" stroke-width="1"/>',
    }[kind];
    return p ? '<pattern id="' + id + '" width="16" height="16" patternUnits="userSpaceOnUse">' + p + '</pattern>' : '';
  };
  var tunic = function (o) {
    var sw = o.sw || 34, hw = o.hw || 40, len = o.len || 130, sl = o.sl || 26, ww = o.ww, top = 46;
    var L = 100, y2 = top + len;
    var s = function (x) { return L + x; }, m = function (x) { return L - x; };
    var waist = ww ? 'L' + m(ww) + ',' + (top + 62) : '', waistR = ww ? 'L' + s(ww) + ',' + (top + 62) : '';
    return 'M' + m(13) + ',' + top + ' L' + m(sw) + ',' + (top + 9) + ' L' + m(sw + sl * 0.5) + ',' + (top + 9 + sl) +
      ' L' + m(sw + sl * 0.5 - 15) + ',' + (top + 16 + sl) + ' L' + m(sw - 7) + ',' + (top + 36) + ' ' + waist +
      ' L' + m(hw) + ',' + y2 + ' L' + s(hw) + ',' + y2 + ' ' + waistR + ' L' + s(sw - 7) + ',' + (top + 36) +
      ' L' + s(sw + sl * 0.5 - 15) + ',' + (top + 16 + sl) + ' L' + s(sw + sl * 0.5) + ',' + (top + 9 + sl) +
      ' L' + s(sw) + ',' + (top + 9) + ' L' + s(13) + ',' + top + ' Q100,' + (top + 16) + ' ' + m(13) + ',' + top + ' Z';
  };
  var SHAPES = {
    saree: function (b, a, f, bh) {
      return '<rect x="42" y="38" width="116" height="178" rx="3" fill="' + b + '"/><rect x="42" y="38" width="116" height="178" rx="3" fill="' + f + '"/>' +
        '<rect x="118" y="38" width="40" height="178" fill="' + a + '" opacity=".92"/><rect x="118" y="38" width="40" height="178" fill="' + f + '" opacity=".5"/>' +
        '<rect x="42" y="' + (216 - bh) + '" width="116" height="' + bh + '" fill="' + a + '"/>' +
        '<path d="M42 98h76M42 158h76" stroke="' + shade(b, -0.25) + '" stroke-width="1" opacity=".5"/><path d="M118 38v178" stroke="' + shade(a, -0.3) + '" stroke-width="1.5"/>';
    },
    kurti: function (b, a, f) { var d = tunic({ hw: 46, len: 140, sl: 22 }); return '<path d="' + d + '" fill="' + b + '"/><path d="' + d + '" fill="' + f + '"/><path d="M100 62v34" stroke="' + a + '" stroke-width="2.4"/><path d="M54 180h92v6H54z" fill="' + a + '" opacity=".85"/>'; },
    straight: function (b, a, f) { var d = tunic({ hw: 36, len: 166, sl: 34 }); return '<path d="' + d + '" fill="' + b + '"/><path d="' + d + '" fill="' + f + '"/><path d="M100 62v44" stroke="' + a + '" stroke-width="2.4"/><circle cx="100" cy="74" r="1.8" fill="' + a + '"/><circle cx="100" cy="88" r="1.8" fill="' + a + '"/>'; },
    anarkali: function (b, a, f) { var d = tunic({ hw: 72, len: 172, sl: 34, ww: 24 }); return '<path d="' + d + '" fill="' + b + '"/><path d="' + d + '" fill="' + f + '"/><path d="M76 108h48" stroke="' + a + '" stroke-width="3"/><path d="M28 212h144v6H28z" fill="' + a + '"/><path d="M88 110l-22 100M112 110l22 100M100 110v100" stroke="' + shade(b, -0.22) + '" stroke-width="1" opacity=".6"/>'; },
    kurtaset: function (b, a, f) { var d = tunic({ hw: 38, len: 132, sl: 36 }); return '<path d="M76 170h20l-3 54H74zM104 170h20l2 54h-19z" fill="' + shade(a, 0.1) + '"/><path d="' + d + '" fill="' + b + '"/><path d="' + d + '" fill="' + f + '"/><path d="M100 62v40" stroke="' + a + '" stroke-width="2.4"/>'; },
    lehenga: function (b, a, f) {
      return '<path d="M74 44h52l6 30-10 18H78L68 74z" fill="' + shade(b, -0.12) + '"/><path d="M80 100h40l52 118H28z" fill="' + b + '"/><path d="M80 100h40l52 118H28z" fill="' + f + '"/>' +
        '<path d="M35 202h130l7 16H28z" fill="' + a + '"/><path d="M80 100h40v7H80z" fill="' + a + '"/><path d="M92 107l-26 96M108 107l26 96M100 107v96" stroke="' + shade(b, -0.25) + '" stroke-width="1" opacity=".55"/>';
    },
    sherwani: function (b, a, f) {
      var d = tunic({ hw: 40, len: 174, sl: 40, sw: 36 });
      return '<path d="' + d + '" fill="' + b + '"/><path d="' + d + '" fill="' + f + '"/><path d="M92 46h16v9H92z" fill="' + a + '"/><path d="M100 56v160" stroke="' + shade(b, -0.3) + '" stroke-width="1.2"/>' +
        [70, 88, 106, 124, 142].map(function (y) { return '<circle cx="103" cy="' + y + '" r="2.2" fill="' + a + '"/>'; }).join('');
    },
  };

  /* Illustrative pieces. Names, prices and stock are made up. */
  var PIECES = {
    'teal-saree': { name: 'Teal silk saree, zari border', shape: 'saree', hex: '#1F5A5E', hex2: '#B8892F', pattern: 'zari', border: 1 },
    'indigo-saree': { name: 'Indigo bandhani saree', shape: 'saree', hex: '#2B3A67', hex2: '#C7B27A', pattern: 'bandhani', border: 2 },
    'rose-saree': { name: 'Rosewood georgette saree', shape: 'saree', hex: '#8E3B4B', hex2: '#D9B36A', pattern: 'floral', border: 1 },
    'rust-anarkali': { name: 'Rust anarkali, floral', shape: 'anarkali', hex: '#A5482B', hex2: '#E3C58A', pattern: 'floral' },
    'maroon-lehenga': { name: 'Maroon lehenga, embroidered', shape: 'lehenga', hex: '#7A1F2E', hex2: '#C9A24B', pattern: 'embroidered' },
    'mustard-kurta': { name: 'Mustard straight kurta', shape: 'straight', hex: '#C89B2C', hex2: '#6B4A12', pattern: 'block' },
    'sage-kurti': { name: 'Sage cotton kurti', shape: 'kurti', hex: '#7E9A78', hex2: '#3F5A3C', pattern: 'dots' },
    'ivory-kurta-set': { name: 'Ivory kurta set', shape: 'kurtaset', hex: '#E4D8BC', hex2: '#8C6D3B', pattern: null },
    'navy-sherwani': { name: 'Navy sherwani', shape: 'sherwani', hex: '#1F2A44', hex2: '#C9A24B', pattern: 'embroidered' },
  };

  var render = function (key) {
    var p = PIECES[key]; if (!p) return '';
    var id = 'mg' + (++gid);
    var acc = p.hex2 || shade(p.hex, -0.3);
    var pat = pattern(id, p.pattern, p.pattern === 'zari' ? '#C9A24B' : shade(acc, 0.1));
    var fill = pat ? 'url(#' + id + ')' : 'none';
    var body = SHAPES[p.shape](p.hex, acc, fill, 8 + (p.border || 0) * 9);
    return '<svg viewBox="0 0 200 250" role="img" aria-label="' + p.name + ' (illustration, not a product photo)" preserveAspectRatio="xMidYMid slice">' +
      '<defs>' + pat + '</defs><rect width="200" height="250" fill="#EDE5D4"/>' +
      '<g stroke="rgba(40,30,10,.22)" stroke-width=".8" stroke-linejoin="round">' + body + '</g></svg>';
  };

  window.FFG = { render: render, pieces: PIECES };
})();
