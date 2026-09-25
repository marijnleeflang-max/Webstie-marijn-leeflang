/*!
 * Document Automation Studio – interactieve productdemo
 * Een volledig in HTML/CSS/JS nagebouwde versie van de Document Understanding App,
 * met een automatische rondleiding (nep-cursor + ondertiteling) én een modus
 * waarin bezoekers zelf door de app kunnen klikken.
 *
 * Geen afhankelijkheden. Gebruik:
 *   <div data-acs-demo></div>
 *   <script src="/product-demo/demo.js" defer></script>
 */
(function () {
  'use strict';

  var SCRIPT = document.currentScript;
  var BASE = SCRIPT && SCRIPT.src ? SCRIPT.src.replace(/[^\/]*$/, '') : '';

  /* =====================================================================
     Instellingen (overschrijfbaar via data-attributen of URL-parameters)
     ===================================================================== */
  var DEFAULTS = {
    productName: 'Document Automation Studio',
    tagline: 'Automatiseer inkomende mail, verwerk documenten, verkort processen',
    ctaLabel: 'Plan een demo',
    ctaUrl: '/contact/',
    userName: 'Lisa Jansen',
    userEmail: 'lisa@bedrijf.nl',
    userRole: 'Admin',
    autoplay: true,
    chapter: 0,
    theme: 'auto',
    assets: BASE + 'assets/'
  };

  /* =====================================================================
     Hulpfuncties
     ===================================================================== */
  var CANCEL = { cancelled: true };
  var isCancel = function (e) { return e === CANCEL; };
  var swallow = function (e) { if (!isCancel(e)) console.error(e); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var easeInOut = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var linear = function (t) { return t; };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var fmtDate = function (d) { return pad(d.getDate()) + '-' + pad(d.getMonth() + 1) + '-' + d.getFullYear(); };
  var fmtDT = function (d) { return fmtDate(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  var eur = function (n) { return n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var round2 = function (n) { return Math.round(n * 100) / 100; };
  var sameDay = function (a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); };
  var readTime = function (t) { return t ? Math.max(2300, 800 + t.length * 48) : 0; };
  var DAYS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

  function daysAgo(n, h, m) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(h, m, Math.floor(Math.random() * 50), 0);
    if (d > new Date()) d = new Date(Date.now() - 25 * 60000);
    return d;
  }

  /* =====================================================================
     Iconen (lijn-iconen in Fluent-stijl)
     ===================================================================== */
  var ICONS = {
    home: '<path d="M3.5 10.5 12 3.5l8.5 7V20a.8.8 0 0 1-.8.8H15v-6H9v6H4.3a.8.8 0 0 1-.8-.8z"/>',
    upload: '<path d="M12 16V4m0 0-5 5m5-5 5 5M5 20h14"/>',
    queue: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="m8.2 12.4 2.5 2.5 5.1-5.3"/>',
    done: '<path d="M4 8h16v11.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM3 4h18v4H3zM10 12h4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    doctypes: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    cloud: '<path d="M7 18.5h10.2a4 4 0 0 0 .4-8 6 6 0 0 0-11.5 1.3A3.4 3.4 0 0 0 7 18.5z"/>',
    dashboard: '<path d="M4 20V11M10 20V5M16 20v-6M3 20.5h18"/>',
    mailtypes: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/><circle cx="18" cy="17" r="3.2" fill="currentColor" stroke="none"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.7 4.7l1.7 1.7M17.6 17.6l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.7 19.3l1.7-1.7M17.6 6.4l1.7-1.7"/>',
    chevDown: '<path d="m6 9 6 6 6-6"/>',
    chevLeft: '<path d="m15 6-6 6 6 6"/>',
    chevRight: '<path d="m9 6 6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    xCircle: '<circle cx="12" cy="12" r="8.5"/><path d="m9 9 6 6m0-6-6 6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    arrowRight: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    share: '<path d="M14 5h5v5M19 5l-8 8M17 14v5H5V7h5"/>',
    download: '<path d="M12 4v12m0 0-5-5m5 5 5-5M5 20h14"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.4"/>',
    help: '<path d="M9.3 9a2.7 2.7 0 1 1 3.9 2.4c-.7.4-1.2 1-1.2 1.8v.8M12 17.6v.4"/>',
    waffle: '<g fill="currentColor" stroke="none"><circle cx="5" cy="5" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="5" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/><circle cx="5" cy="19" r="1.6"/><circle cx="12" cy="19" r="1.6"/><circle cx="19" cy="19" r="1.6"/></g>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    zoomIn: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3M8.3 11h5.4M11 8.3v5.4"/>',
    zoomOut: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3M8.3 11h5.4"/>',
    history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5"/><path d="M3.5 3.5v5h5M12 7.5V12l3 2"/>',
    compress: '<path d="M4 14h6v6M20 10h-6V4M10 14l-6 6M14 10l6-6"/>',
    fit: '<path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
    user: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.2a6.5 6.5 0 0 1 11 0"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    reload: '<path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v5h-5"/>',
    sparkle: '<path d="M12 3.5 13.8 9l5.7 1.9-5.7 1.9L12 18.5l-1.8-5.7L4.5 10.9 10.2 9z"/>',
    team: '<circle cx="9" cy="9" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 7.5a2.6 2.6 0 1 1 0 5.2M17 14.2a5 5 0 0 1 3.5 4.8"/>',
    rules: '<path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
    pause: '<g fill="currentColor" stroke="none"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></g>',
    replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.7"/><path d="M4 3.5v5.2h5.2"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    hand: '<path d="M8.5 13V5.8a1.6 1.6 0 0 1 3.2 0V12m0-1.5V4.6a1.6 1.6 0 0 1 3.2 0V12m0-5.2a1.6 1.6 0 0 1 3.2 0v6.4c0 4-2.6 7.3-6.3 7.3-2.2 0-3.6-.9-5-2.9l-2.6-3.8a1.6 1.6 0 0 1 2.6-1.9l1.7 2.3"/>'
  };
  /* Afbeeldingen: los bestand naast demo.js, of ingebakken via window.ACS_ASSETS */
  function asset(o, name) { return (window.ACS_ASSETS && window.ACS_ASSETS[name]) || o.assets + name; }

  function icon(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  /* =====================================================================
     Klok: speeltijd die alleen doorloopt als de demo speelt (pauzeerbaar)
     ===================================================================== */
  function Clock() {
    var self = this;
    this.t = 0;
    this.speed = 1;
    this.playing = false;
    this.timers = [];
    this.anims = new Set();
    this.last = performance.now();
    function loop(now) {
      var dt = Math.min(now - self.last, 80);
      self.last = now;
      if (self.playing) self.t += dt * self.speed;
      if (self.timers.length) {
        var due = [], keep = [];
        for (var i = 0; i < self.timers.length; i++) (self.timers[i].at <= self.t ? due : keep).push(self.timers[i]);
        if (due.length) { self.timers = keep; due.forEach(function (x) { x.fn(); }); }
      }
      self.anims.forEach(function (a) { a(self.t); });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
  Clock.prototype.after = function (ms, fn) { this.timers.push({ at: this.t + ms, fn: fn }); };

  /* Context: een reeks acties die in één keer geannuleerd kan worden */
  function Ctx(clock, alive) { this.clock = clock; this.alive = alive; }
  Ctx.prototype.wait = function (ms) {
    var self = this;
    return new Promise(function (res, rej) {
      if (!self.alive()) return rej(CANCEL);
      self.clock.after(Math.max(0, ms), function () { self.alive() ? res() : rej(CANCEL); });
    });
  };
  Ctx.prototype.tween = function (ms, fn, ease) {
    var self = this, e = ease || easeInOut;
    return new Promise(function (res, rej) {
      if (!self.alive()) return rej(CANCEL);
      var t0 = self.clock.t;
      var a = function (t) {
        if (!self.alive()) { self.clock.anims.delete(a); return rej(CANCEL); }
        var p = ms <= 0 ? 1 : clamp((t - t0) / ms, 0, 1);
        fn(e(p), p);
        if (p >= 1) { self.clock.anims.delete(a); res(); }
      };
      fn(0, 0);
      self.clock.anims.add(a);
    });
  };

  /* =====================================================================
     Demodata
     ===================================================================== */
  var SUPPLIERS = {
    groeneOogst: { name: 'Groene Oogst B.V.', brand: 'GROENE OOGST', sub: 'VERSE GROENTEN & FRUIT · IMPORT', street: 'Veilingweg 12', city: '2675 BS Honselersdijk', vat: 'NL8530.12.345.B01', kvk: '61234567', color: '#2d6a2f' },
    rijnmond: { name: 'Rijnmond Groente & Fruit B.V.', brand: 'RIJNMOND', sub: 'GROENTE & FRUIT GROOTHANDEL', street: 'Havenweg 40', city: '3089 JH Rotterdam', vat: 'NL8622.44.019.B01', kvk: '24011223', color: '#1f5d8c' },
    frisch: { name: 'Frischkontor Hamburg GmbH', brand: 'FRISCHKONTOR', sub: 'OBST & GEMÜSE · HAMBURG', street: 'Großmarkt 7', city: '20097 Hamburg', vat: 'DE289114520', kvk: 'HRB 14522', color: '#8c3b1f' },
    vdl: { name: 'VDL Fresh Denmark ApS', brand: 'VDL FRESH', sub: 'NORDIC PRODUCE', street: 'Grønttorvet 6', city: '2500 Valby', vat: 'DK31224455', kvk: 'CVR 31224455', color: '#265a4a' }
  };
  var CUSTOMER = ['Versmarkt Noord B.V.', 't.a.v. Crediteurenadministratie', 'Industrieweg 8', '9403 AB Assen'];

  function invoiceDoc(o) {
    var base = 0;
    o.lines.forEach(function (l) { base += l[2] * l[4]; });
    base = round2(base);
    var vat = round2(base * (o.vatRate || 9) / 100);
    var total = round2(base + vat);
    var c = o.fc || [99, 99, 98, 97, 96];
    return {
      id: o.id, name: o.name, type: o.type || 'Facturen', channel: o.channel || 'Mail', up: o.up,
      conf: o.status === 'processing' ? null : o.conf, target: o.conf, status: o.status || 'validate', step: 0,
      kind: 'invoice', doneAt: o.doneAt || null, validation: o.validation || null,
      paper: { sup: o.sup, number: o.number, date: o.date, lines: o.lines, base: base, vat: vat, total: total, vatRate: o.vatRate || 9, title: o.title || 'FACTUUR', ref: o.ref || 'PO-88213' },
      fields: [
        { k: 'Afzender', v: o.sup.name, c: c[0] },
        { k: 'Factuurnummer', v: o.number, c: c[1] },
        { k: 'Documentdatum', v: fmtDate(o.date), c: c[2] },
        { k: 'Totaalbedrag inclusief BTW', v: '€ ' + eur(total), c: c[3] },
        { k: 'BTW bedrag', v: '€ ' + eur(vat), c: c[4] }
      ],
      tables: [{
        name: 'Factuurregels',
        cols: ['Omschrijving', 'Land van oorsprong', 'Aantal', 'Eenheid', 'Prijs'],
        rows: o.lines.map(function (l) { return [l[0], l[1], String(l[2]), l[3], eur(l[4])]; })
      }]
    };
  }

  function statementDoc(o) {
    var open = o.items.reduce(function (s, i) { return s + i[3]; }, 0);
    var c = o.fc || [100, 100, 100, 100];
    return {
      id: o.id, name: o.name, type: 'Statements', channel: 'Mail', up: o.up,
      conf: o.conf, target: o.conf, status: o.status || 'validate', step: 0, kind: 'statement',
      doneAt: o.doneAt || null, validation: o.validation || null,
      paper: { sender: o.sender, number: o.number, date: o.date, place: o.place, items: o.items, open: open },
      fields: [
        { k: 'Datum', v: fmtDate(o.date), c: c[0] },
        { k: 'Adres', v: o.sender.street + ', ' + o.sender.city, c: c[1] },
        { k: 'BTW Nummer', v: o.sender.vat, c: c[2] },
        { k: 'Naam', v: o.sender.name, c: c[3] }
      ],
      tables: [{
        name: 'Openstaande posten',
        cols: ['Factuurdatum', 'Vervaldatum', 'Factuurnummer', 'Bedrag'],
        rows: o.items.map(function (i) { return [fmtDate(i[0]), fmtDate(i[1]), i[2], eur(i[3])]; })
      }]
    };
  }

  function receiptDoc(o) {
    var lines = [
      ['3014256', 'huishoudemmer kunststof', '1', '1,88', '1,88'],
      ['2546443', 'multy schuurspons 10st', '1', '0,59', '0,59'],
      ['3217982', 'superfinn super ontvetter 750ml-w', '1', '1,64', '1,64'],
      ['2559223', 'harpic bleek gel 750ml', '1', '1,49', '1,49'],
      ['1102235', 'spargo microvezeldoek 3st', '3', '0,99', '2,97'],
      ['3220918', 'swiffer duster xxl starterset incl. 2st', '1', '5,79', '5,79'],
      ['3006312', 'luxe glas/polierdoek 42x68cm', '1', '0,99', '0,99'],
      ['3003079', 'ajax allesreiniger 1l lagoon flowers', '1', '1,59', '1,59'],
      ['2521121', 'spargo vloerdoek 2st special stripe', '2', '1,99', '3,98'],
      ['2566077', 'a good clean badkamerreiniger 750ml', '1', '1,48', '1,48'],
      ['220140', 'action huishouddoekjes 10st', '1', '1,35', '1,35'],
      ['3220917', 'swiffer duster starterset incl. 3 navul.', '1', '2,99', '2,99']
    ];
    return {
      id: o.id, name: o.name, type: 'Kassabonnen', channel: o.channel || 'Upload', up: o.up,
      conf: null, target: null, status: o.status || 'validate', step: 0, kind: 'receipt', noConf: true,
      doneAt: null, validation: null, paper: {},
      fields: [
        { k: 'Adres', v: 'Roggemolenstraat 2-4-6, Joure', c: null },
        { k: 'Totaal', v: '22,77', c: null },
        { k: 'Netto', v: '18,82', c: null },
        { k: 'Klantenpas', v: '1052101-000413', c: null },
        { k: 'Leverancier', v: 'Action Nederland BV', c: null },
        { k: 'BTW Specificatie', v: '21%', c: null },
        { k: 'Datum', v: '01-08-2026', c: null },
        { k: 'BTW', v: '3,95', c: null },
        { k: 'Bruto', v: '22,77', c: null }
      ],
      tables: [{ name: 'Artikelen', cols: ['Artikelnummer', 'Omschrijving', 'Aantal', 'Prijs per stuk', 'Bedrag'], rows: lines }]
    };
  }

  var GO_LINES = [
    ["Bio Avocado's Hass", 'PE', 16, '4KG', 18.50],
    ['Limoenen Tahiti', 'BR', 10, '5KG', 12.75],
    ['Mango Kent', 'PE', 8, '4KG', 14.20],
    ['Granaatappels Wonderful', 'ES', 6, '5KG', 13.44]
  ];

  var SAMPLES = {
    invoice: { key: 'invoice', name: 'Factuur_2026-10457.pdf', size: '248 KB', ext: 'PDF', type: 'Facturen' },
    statement: { key: 'statement', name: 'Rekeningoverzicht_01502.pdf', size: '162 KB', ext: 'PDF', type: 'Statements' },
    receipt: { key: 'receipt', name: 'Bonnetje_foto.jpg', size: '1,4 MB', ext: 'JPG', type: 'Kassabonnen' }
  };

  function docFromSample(sample, type, id) {
    var now = new Date();
    if (sample.key === 'invoice') {
      return invoiceDoc({ id: id, name: sample.name, type: type, channel: 'Upload', up: now, conf: 97, status: 'processing', sup: SUPPLIERS.groeneOogst, number: '2026-10457', date: now, lines: GO_LINES, fc: [99, 99, 98, 97, 96] });
    }
    if (sample.key === 'statement') {
      var d = statementDoc({
        id: id, name: sample.name, up: now, conf: 98, status: 'processing', number: '01502', date: now, place: 'Hoogstraten',
        sender: { name: 'Van Gorp Fruit NV', street: 'Leopoldstraat 21', city: '2320 Hoogstraten', vat: 'BE0456.789.123' },
        items: [[daysAgo(58, 9, 0), daysAgo(28, 9, 0), 'VK 629114', 1845.20], [daysAgo(20, 9, 0), daysAgo(-10, 9, 0), 'VK 634020', 2210.00]],
        fc: [100, 98, 99, 100]
      });
      d.type = type; d.conf = null; d.channel = 'Upload';
      return d;
    }
    var r = receiptDoc({ id: id, name: sample.name, up: now, status: 'processing' });
    r.type = type;
    return r;
  }

  var MAILTYPES = [
    ['Facturen', 'Facturen van leveranciers', 'Bijlagen naar documentverwerking', '#0f6a9a'],
    ['Statements & betaalverzoeken', 'Rekeningoverzichten en herinneringen', 'Bijlagen naar documentverwerking', '#5b2f7a'],
    ['Betaalspecificaties', 'Betaaladviezen van klanten', 'Bijlagen naar documentverwerking', '#a3136c'],
    ['Transportdocumenten', "CMR's en vrachtbrieven", 'Doorzetten naar logistiek@', '#2f7d57'],
    ["Creditnota's & klachten", 'Creditnota’s, klachten en commissie', 'Doorzetten naar klantenservice@', '#b35a00'],
    ['Onbelangrijke mails', 'Nieuwsbrieven en automatische meldingen', 'Archiveren', '#7d8590'],
    ['Uitval', 'Niet eenduidig te classificeren', 'Handmatige beoordeling', '#b3261e']
  ];

  function seedMails() {
    var rows = [
      [0, 8, 42, 'facturen@rijnmondgf.nl', 'Factuur GRN-26-010412', 1, 'Facturen'],
      [1, 16, 5, 'info@hofman-logistics.nl', 'Rekeningoverzicht september', 1, 'Statements & betaalverzoeken'],
      [2, 11, 12, 'noreply@vdlfresh.dk', 'Invoice VDL-DEN2602694', 1, 'Facturen'],
      [2, 10, 58, 'debiteuren@vangorpfruit.be', 'Overzicht openstaande posten 01414', 1, 'Statements & betaalverzoeken'],
      [2, 9, 31, 'nieuwsbrief@versvakblad.nl', 'Nieuwsbrief week 38', 0, 'Onbelangrijke mails'],
      [3, 15, 20, 'planning@transnoord.nl', 'CMR zending 88213', 2, 'Transportdocumenten'],
      [4, 14, 2, 'avis@frischkontor.de', 'Zahlungsavis 4471', 1, 'Betaalspecificaties'],
      [5, 16, 36, 'facturen@rijnmondgf.nl', 'Factuur GRN-26-010397', 1, 'Facturen'],
      [5, 16, 34, 'info@hofman-logistics.nl', 'Statement of account', 1, 'Statements & betaalverzoeken'],
      [5, 12, 11, 'no-reply@portal-leverancier.nl', 'Uw wachtwoord verloopt', 0, 'Onbelangrijke mails'],
      [6, 17, 3, 'k.devries@onbekend-domein.com', 'RE: vraag', 0, 'Uitval'],
      [6, 11, 45, 'facturen@rijnmondgf.nl', 'Factuur GRN-26-010355', 1, 'Facturen'],
      [6, 10, 20, 'betaling@hofman-logistics.nl', 'Betaalspecificatie week 37', 1, 'Betaalspecificaties'],
      [6, 9, 2, 'noreply@vdlfresh.dk', 'Invoice VDL-DEN2602611', 1, 'Facturen']
    ];
    return rows.map(function (r, i) {
      return { id: 'm' + i, at: daysAgo(r[0], r[1], r[2]), from: r[3], subject: r[4], att: r[5], cat: r[6], status: r[6] === 'Uitval' ? 'Fout' : 'Verwerkt' };
    });
  }

  function seedDocs() {
    var S = SUPPLIERS;
    var hof = { name: 'Hofman Logistics B.V.', street: 'Nijverheidsweg 3', city: '4231 DJ Meerkerk', vat: 'NL8190.33.781.B01' };
    var gorp = { name: 'Van Gorp Fruit NV', street: 'Leopoldstraat 21', city: '2320 Hoogstraten', vat: 'BE0456.789.123' };
    var rij = [['Paprika mix', 'NL', 24, '5KG', 9.80], ['Komkommers', 'NL', 30, 'DOOS', 7.25], ['Trostomaten', 'NL', 18, '6KG', 11.40]];
    var dk = [['Kartofler nye', 'DK', 40, '10KG', 8.90], ['Gulerødder', 'DK', 25, '10KG', 6.35]];
    var de = [['Äpfel Elstar', 'DE', 30, '12KG', 14.10], ['Birnen Conference', 'NL', 12, '12KG', 16.80]];
    return [
      invoiceDoc({ id: 'x1', name: 'GRN-26-010355 142210.pdf', up: daysAgo(6, 11, 46), conf: 97, status: 'done', validation: 'Automatisch', doneAt: daysAgo(6, 11, 52), sup: S.rijnmond, number: 'GRN-26-010355', date: daysAgo(7, 9, 0), lines: rij }),
      invoiceDoc({ id: 'x2', name: 'VDL-DEN2602611.pdf', up: daysAgo(6, 9, 3), conf: 99, status: 'done', validation: 'Automatisch', doneAt: daysAgo(6, 9, 8), sup: S.vdl, number: 'DEN2602611', date: daysAgo(8, 9, 0), lines: dk }),
      statementDoc({ id: 'd1', name: 'Hofman BV SOA 082426.pdf', up: daysAgo(5, 16, 34), conf: 95, sender: hof, number: '082426', date: daysAgo(6, 9, 0), place: 'Meerkerk', items: [[daysAgo(40, 9, 0), daysAgo(10, 9, 0), 'HL-26-7781', 1280.40], [daysAgo(12, 9, 0), daysAgo(-18, 9, 0), 'HL-26-7902', 964.00]], fc: [99, 95, 93, 98] }),
      invoiceDoc({ id: 'd2', name: 'GRN-26-010397 150607.pdf', up: daysAgo(5, 16, 36), conf: 96, sup: S.rijnmond, number: 'GRN-26-010397', date: daysAgo(6, 9, 0), lines: rij, fc: [99, 98, 97, 96, 96] }),
      invoiceDoc({ id: 'd3', name: 'Zahlungsavis 4471.pdf', up: daysAgo(4, 14, 3), conf: 56, sup: S.frisch, number: '4471', date: daysAgo(5, 9, 0), lines: de, title: 'ZAHLUNGSAVIS', fc: [92, 48, 71, 61, 55] }),
      invoiceDoc({ id: 'd4', name: 'Betaalspecificatie week 37.pdf', up: daysAgo(4, 10, 21), conf: 37, sup: S.rijnmond, number: 'BS-2637', date: daysAgo(5, 9, 0), lines: rij.slice(0, 2), title: 'BETAALSPECIFICATIE', fc: [88, 37, 64, 41, 39] }),
      statementDoc({ id: 'd5', name: 'Overz01414.pdf', up: daysAgo(2, 10, 59), conf: 100, sender: gorp, number: '01414', date: daysAgo(3, 9, 0), place: 'Hoogstraten', items: [[daysAgo(64, 9, 0), daysAgo(38, 9, 0), 'VK 628060', 2604.00], [daysAgo(30, 9, 0), daysAgo(-4, 9, 0), 'VK 633585', 2670.00]] }),
      invoiceDoc({ id: 'd6', name: 'VDL-DEN2602694.pdf', up: daysAgo(2, 11, 13), conf: 98, sup: S.vdl, number: 'DEN2602694', date: daysAgo(3, 9, 0), lines: dk, fc: [99, 99, 98, 98, 97] }),
      statementDoc({ id: 'd7', name: 'Hofman BV SOA 090126.pdf', up: daysAgo(1, 16, 6), conf: 91, sender: hof, number: '090126', date: daysAgo(1, 9, 0), place: 'Meerkerk', items: [[daysAgo(33, 9, 0), daysAgo(3, 9, 0), 'HL-26-7955', 1502.75]], fc: [96, 91, 92, 97] }),
      invoiceDoc({ id: 'd8', name: 'GRN-26-010412 150933.pdf', up: daysAgo(0, 8, 43), conf: 93, sup: S.rijnmond, number: 'GRN-26-010412', date: daysAgo(1, 9, 0), lines: rij, fc: [98, 95, 93, 94, 93] }),
      receiptDoc({ id: 'r1', name: '08abbe17-0d4d-4dd6-b284-c49fe3b27e88.jpg', up: daysAgo(0, 9, 12) })
    ];
  }

  function seedDoctypes() {
    return {
      Facturen: {
        desc: 'Inkoopfacturen', version: 22, autoValidate: false, criterion: 'Confidence-drempel', threshold: '0.9', team: 'Geen team ingesteld',
        fields: [['Afzender', 'Afzender', 'Data 1', 'Tekst', 'Ja'], ['Factuurnummer', 'Factuurnummer', 'Data 2', 'Tekst', 'Ja'], ['Documentdatum', 'Documentdatum', 'Data 3', 'Tekst', 'Nee'], ['Totaalbedrag inclusief BTW', 'Totaalbedrag inclusief BTW', 'Data 4', 'Tekst', 'Ja'], ['BTW bedrag', 'BTW bedrag', 'Data 5', 'Tekst', 'Nee']],
        table: 'Factuurregels', cols: ['Omschrijving', 'Land van oorsprong', 'Aantal', 'Eenheid', 'Prijs'],
        steps: [
          { name: 'Prebuilt-layout', model: 'prebuilt-layout', config: 'Documenten Uitlezen', prompt: '' },
          { name: 'GPT Prompt', model: 'gpt-4.1', config: 'Azure Agent', prompt: 'Azure GPT 4.1 prompt' }
        ]
      },
      Statements: {
        desc: 'Inkomende statements', version: 11, autoValidate: false, criterion: 'Confidence-drempel', threshold: '0.9', team: 'Statements',
        fields: [['Datum', 'Datum', 'Data 1', 'Tekst', 'Ja'], ['Adres', 'Adres', 'Data 2', 'Tekst', 'Nee'], ['BTW Nummer', 'BTW Nummer', 'Data 3', 'Tekst', 'Nee'], ['Naam', 'Naam', 'Data 4', 'Tekst', 'Ja']],
        table: 'Openstaande posten', cols: ['Factuurdatum', 'Vervaldatum', 'Factuurnummer', 'Bedrag'],
        steps: [
          { name: 'Prebuilt-layout', model: 'prebuilt-layout', config: 'Documenten Uitlezen', prompt: '' },
          { name: 'GPT Prompt', model: 'gpt-4.1', config: 'Azure Agent', prompt: 'Statements prompt' }
        ]
      },
      Kassabonnen: {
        desc: 'Bonnetjes en kassabonnen', version: 4, autoValidate: false, criterion: 'Alle verplichte velden gevuld', threshold: '0.9', team: 'Geen team ingesteld',
        fields: [['Leverancier', 'Leverancier', 'Data 1', 'Tekst', 'Ja'], ['Datum', 'Datum', 'Data 2', 'Tekst', 'Ja'], ['Totaal', 'Totaal', 'Data 3', 'Tekst', 'Ja'], ['BTW', 'BTW', 'Data 4', 'Tekst', 'Nee']],
        table: 'Artikelen', cols: ['Artikelnummer', 'Omschrijving', 'Aantal', 'Prijs per stuk', 'Bedrag'],
        steps: [
          { name: 'GPT Vision', model: 'gpt-4.1', config: 'Azure Agent', prompt: 'Kassabon prompt' }
        ]
      }
    };
  }

  var PROMPT_TEXT = [
    'Je bent een data-extractie-assistent voor documenten.',
    '',
    'Je krijgt de tekst van een document (uit een OCR/layout-stap), plus een specificatie van welke velden en tabelregels je moet extraheren. Deze specificatie bevat per veld de naam, het datatype en of het veld verplicht is.',
    '',
    'Regels:',
    '- Neem waarden letterlijk over zoals ze in het document staan.',
    '- Laat een veld leeg als je het niet met zekerheid kunt vinden.',
    '- Noteer datums als DD-MM-JJJJ.',
    '',
    'Geef het resultaat terug als JSON:',
    '{ "velden": { "<veldnaam>": "<waarde>" },',
    '  "tabellen": { "<tabelnaam>": [ { "<kolom>": "<waarde>" } ] } }'
  ].join('\n');

  var MODEL_HELP = 'Kies een voorgedefinieerd model of typ zelf een deployment-naam of agent-ID. Het voorvoegsel van de waarde bepaalt hoe hij aangeroepen wordt: "mistral…" = Mistral OCR, "prebuilt-…" = Azure Document Intelligence, "foundry-agent:&lt;agent-id&gt;" = een Foundry-agent, iets anders = een Foundry-model chat-aanroep (vereist een prompt). Meerdere stappen na elkaar (bijv. eerst OCR-layout, dan een Foundry-aanroep die de tekst daarvan gebruikt) maak je door meerdere verwerkingsstappen met oplopende volgorde toe te voegen.';

  function seed() {
    return {
      page: 'start', docId: null, docLoading: false, openDD: null, samplesOpen: false, modal: null,
      docs: seedDocs(), mails: seedMails(), dtc: seedDoctypes(), prompts: { 'Azure GPT 4.1 prompt': PROMPT_TEXT, 'Statements prompt': PROMPT_TEXT, 'Kassabon prompt': PROMPT_TEXT },
      upload: { type: null, file: null, busy: false }, dtName: 'Facturen', dtTab: 'algemeen', dashTab: 'docs',
      seq: 1, lastUploadId: null, showInactive: false
    };
  }

  /* =====================================================================
     Nagebouwde documenten ("papier")
     ===================================================================== */
  function leaf(color) {
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="' + color + '"/><path d="M14 31c0-10 8-17 21-18-1 13-8 20-18 20-1 0-2 0-3-2z" fill="#fff" opacity=".92"/><path d="M15 33c4-6 9-10 15-14" stroke="' + color + '" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  }
  function paperInvoice(p) {
    var s = p.sup;
    var rows = p.lines.map(function (l) {
      return '<tr><td>' + esc(l[0]) + '</td><td>' + l[1] + '</td><td class="r">' + l[2] + '</td><td>' + l[3] + '</td><td class="r">' + eur(l[4]) + '</td><td class="r">' + eur(round2(l[2] * l[4])) + '</td></tr>';
    }).join('');
    var due = new Date(p.date); due.setDate(due.getDate() + 30);
    return '<div class="paper">' +
      '<div class="inv-top"><div class="inv-brand">' + leaf(s.color) + '<div><strong style="color:' + s.color + '">' + esc(s.brand) + '</strong><small>' + esc(s.sub) + '</small></div></div>' +
      '<div class="inv-addr">' + esc(s.name) + '<br>' + esc(s.street) + '<br>' + esc(s.city) + '<br>BTW ' + esc(s.vat) + '<br>KvK ' + esc(s.kvk) + '</div></div>' +
      '<div class="inv-title">' + esc(p.title) + '</div>' +
      '<div class="inv-meta"><div><strong>Factuuradres</strong><br>' + CUSTOMER.map(esc).join('<br>') + '</div>' +
      '<dl><dt>Factuurnummer</dt><dd>' + esc(p.number) + '</dd><dt>Factuurdatum</dt><dd>' + fmtDate(p.date) + '</dd><dt>Vervaldatum</dt><dd>' + fmtDate(due) + '</dd><dt>Klantnummer</dt><dd>40128</dd><dt>Uw referentie</dt><dd>' + esc(p.ref) + '</dd></dl></div>' +
      '<table class="inv-lines"><thead><tr><th>Omschrijving</th><th>Herkomst</th><th class="r">Aantal</th><th>Eenheid</th><th class="r">Prijs</th><th class="r">Bedrag</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="inv-tot"><div><span>Basisbedrag btw</span><span>€ ' + eur(p.base) + '</span></div><div><span>BTW ' + p.vatRate + '%</span><span>€ ' + eur(p.vat) + '</span></div><div class="big"><span>Totaal incl. btw</span><span>€ ' + eur(p.total) + '</span></div></div>' +
      '<div class="inv-foot">Betalingscondities: 30 dagen na factuurdatum. Vermeld bij betaling altijd het factuurnummer.<br>IBAN NL00 DEMO 0123 4567 89 · BIC DEMONL2A · Op al onze leveringen zijn de algemene voorwaarden van toepassing.</div>' +
      '</div>';
  }
  function paperStatement(p) {
    var s = p.sender;
    var rows = p.items.map(function (i) {
      var overdue = i[1] < new Date();
      return '<tr><td>' + fmtDate(i[0]) + '</td><td>' + fmtDate(i[1]) + '</td><td>' + esc(i[2]) + '</td><td class="r">' + (overdue ? eur(i[3]) : '') + '</td><td class="r">' + (overdue ? '' : eur(i[3])) + '</td></tr>';
    }).join('');
    return '<div class="paper">' +
      '<div class="st-title">REKENINGOVERZICHT</div>' +
      '<div class="st-grid"><div><strong>' + esc(s.name) + '</strong><br>' + esc(s.street) + '<br>' + esc(s.city) + '<br>BTW ' + esc(s.vat) + '</div>' +
      '<div>' + esc(p.number) + '<br><br>' + CUSTOMER.map(esc).join('<br>') + '</div></div>' +
      '<div class="st-letter"><p style="text-align:right">' + esc(p.place) + ', ' + fmtDate(p.date) + '</p><p><u>Ref:</u> ' + esc(p.number) + '</p><p>Geachte,</p>' +
      '<p>Hierbij vindt u een overzicht van uw openstaande facturen.</p><p>Indien er vervallen facturen zijn, verzoeken wij u deze zo spoedig mogelijk te voldoen om verwijlintresten te vermijden.</p></div>' +
      '<table class="inv-lines"><thead><tr><th>Datum</th><th>Vervaldatum</th><th>Fact.nr</th><th class="r">Vervallen</th><th class="r">Niet vervallen</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p style="margin-top:22px;font-weight:700">TOTAAL TE BETALEN: ' + eur(p.open) + ' EUR</p>' +
      '<div class="inv-foot">Met vriendelijke groeten,<br>Afdeling boekhouding</div></div>';
  }

  /* =====================================================================
     De demo
     ===================================================================== */
  function Demo(root, opts) {
    this.root = root;
    this.o = opts;
    this.clock = new Clock();
    this.clock.speed = opts.speed || 1;
    this.scale = 1;
    this.token = 0;
    this.appEpoch = 0;
    this.chIndex = 0;
    this.chStart = 0;
    this.mode = 'auto';
    this.state = 'idle';
    this.capText = null;
    this.capAt = 0;
    this.S = seed();
    this.build();
    this.render({ anim: false });
    this.bind();
    this.layout();
  }

  Demo.prototype.$ = function (sel) { return this.root.querySelector(sel); };
  Demo.prototype.$$ = function (sel) { return Array.prototype.slice.call(this.root.querySelectorAll(sel)); };
  Demo.prototype.appCtx = function () {
    var self = this, ep = this.appEpoch;
    return new Ctx(this.clock, function () { return ep === self.appEpoch; });
  };

  /* ---------- opbouw van de DOM ---------- */
  Demo.prototype.build = function () {
    var o = this.o, A = o.assets;
    var chapters = CHAPTERS.map(function (c, i) {
      return '<button type="button" class="acs-ch" data-ch="' + i + '" style="--w:' + (c.est / 1000).toFixed(1) + '" aria-label="Hoofdstuk: ' + esc(c.label) + '"><span class="acs-ch-bar"><span class="acs-ch-fill"></span></span><span class="acs-ch-label">' + esc(c.label) + '</span></button>';
    }).join('');

    this.root.classList.add('acs');
    if (o.theme && o.theme !== 'auto') this.root.setAttribute('data-theme', o.theme);
    this.root.innerHTML =
      '<div class="acs-player">' +
        '<div class="acs-screen">' +
          '<div class="acs-viewport" role="region" aria-label="Interactieve demo van ' + esc(o.productName) + '">' +
            '<div class="acs-stage">' +
              this.buildIntro() + this.buildDiagram() + this.buildWindow() + this.buildOutro() +
              '<div class="acs-dragfile"><span class="pdf">PDF</span><span class="acs-df-name"></span></div>' +
              '<div class="acs-cursor">' +
                '<svg class="cur-arrow" viewBox="0 0 30 30"><path d="M6 3.5v20.2l5.2-5 3.4 7.8 3.6-1.6-3.4-7.6h7.3z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>' +
                '<svg class="cur-hand" viewBox="0 0 30 30"><path d="M11 14.5V5.2a2 2 0 0 1 4 0v7.6-1.6a2 2 0 0 1 4 0v2-1a2 2 0 0 1 4 0v6.3c0 5-2.8 8.7-7.4 8.7-2.6 0-4.3-1-5.9-3.4l-3.3-4.9a2 2 0 0 1 3.2-2.4z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round" transform="translate(-4 -1)"/></svg>' +
              '</div>' +
              '<div class="acs-shield" title="Klik om te pauzeren"></div>' +
            '</div>' +
            '<button type="button" class="acs-bigplay" aria-label="Afspelen">' + icon('play') + '</button>' +
            '<div class="acs-tryhint">' + icon('hand') + '<span>Je bestuurt de demo nu zelf. Klik gerust rond.</span><button type="button" data-acs="resume">Rondleiding hervatten</button></div>' +
          '</div>' +
          '<div class="acs-capclip"><div class="acs-caption" aria-live="polite"><span class="acs-caption-text"></span></div></div>' +
        '</div>' +
        '<div class="acs-controls">' +
          '<button type="button" class="acs-btn is-play" data-acs="toggle" aria-label="Afspelen">' + icon('play') + '</button>' +
          '<div class="acs-chapters" role="group" aria-label="Hoofdstukken">' + chapters + '</div>' +
          '<div class="acs-now"></div>' +
          '<button type="button" class="acs-btn is-try-btn" data-acs="try" aria-label="Zelf proberen">' + icon('hand') + '<span class="acs-lbl">Zelf proberen</span></button>' +
          '<button type="button" class="acs-btn is-icon" data-acs="restart" aria-label="Opnieuw beginnen" title="Opnieuw beginnen">' + icon('replay') + '</button>' +
          '<button type="button" class="acs-btn is-icon" data-acs="fullscreen" aria-label="Volledig scherm" title="Volledig scherm">' + icon('expand') + '</button>' +
        '</div>' +
      '</div>';

    this.viewport = this.$('.acs-viewport');
    this.stage = this.$('.acs-stage');
    this.main = this.$('.main');
    this.caption = this.$('.acs-caption');
    this.captionText = this.$('.acs-caption-text');
    this.cursorEl = this.$('.acs-cursor');
    this.cursor = { x: 760, y: 470 };
    this.placeCursor();
    this.initDiagram();
  };

  Demo.prototype.buildIntro = function () {
    return '<div class="acs-scene acs-intro">' +
      '<img class="acs-intro-logo" src="' + asset(this.o, 'peacock-logo.png') + '" alt="Peacock Intelligent Automation">' +
      '<div class="acs-intro-title"><h2>' + esc(this.o.productName) + '</h2><p>' + esc(this.o.tagline) + '</p></div>' +
      '</div>';
  };

  Demo.prototype.buildDiagram = function () {
    var N = '#1d3f73', T = '#19b6c8', M = '#a3136c';
    var box = function (inner) { return '<rect x="-34" y="-42" width="68" height="84" rx="9" fill="#fff" stroke="' + N + '" stroke-width="5"/>' + inner; };
    var lines = function (y0, n, w) { var s = ''; for (var i = 0; i < n; i++) s += '<rect x="-22" y="' + (y0 + i * 11) + '" width="' + (w || 44) * (i % 2 ? .75 : 1) + '" height="4.5" rx="2.2" fill="#c8d3e0"/>'; return s; };
    var ICON_ART = [
      box('<rect x="-22" y="-30" width="22" height="5" rx="2.5" fill="' + N + '"/><rect x="4" y="-30" width="18" height="5" rx="2.5" fill="' + T + '"/>' + [-20, -15, -12, -7, -3, 1, 5, 9, 12, 16, 19].map(function (x, i) { return '<rect x="' + x + '" y="-10" width="' + (i % 3 ? 2 : 3.5) + '" height="22" fill="' + N + '"/>'; }).join('') + '<rect x="-26" y="0" width="52" height="2.5" fill="' + M + '"/><circle cx="20" cy="30" r="6" fill="' + T + '"/>'),
      '<rect x="-24" y="-40" width="44" height="40" rx="4" fill="#f4f7fb" stroke="' + N + '" stroke-width="4"/><rect x="-44" y="-22" width="88" height="56" rx="6" fill="' + T + '" stroke="' + N + '" stroke-width="5"/><path d="M-44-18 0 12l44-30" fill="none" stroke="' + N + '" stroke-width="5" stroke-linejoin="round"/><circle cx="36" cy="30" r="15" fill="' + M + '"/><path d="M36 22v9M36 36v1" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
      '<rect x="-26" y="-46" width="52" height="36" rx="3" fill="#fff" stroke="#c8d3e0" stroke-width="3"/>' + lines(-38, 3, 36) + '<rect x="-44" y="-12" width="88" height="44" rx="8" fill="' + N + '"/><rect x="-32" y="0" width="64" height="5" rx="2.5" fill="' + T + '"/><rect x="-32" y="12" width="30" height="4" rx="2" fill="#6f8bb0"/><circle cx="32" cy="20" r="4.5" fill="' + M + '"/>',
      box('<rect x="-30" y="-36" width="60" height="16" fill="' + N + '"/><g fill="#dfe8f1">' + [-24, -2, 20].map(function (x) { return [-12, 2, 16, 30].map(function (y) { return '<rect x="' + (x - 6) + '" y="' + y + '" width="18" height="8" rx="2"/>'; }).join(''); }).join('') + '</g><rect x="4" y="22" width="44" height="22" rx="4" fill="' + M + '"/><text x="26" y="38" font-size="15" font-weight="700" text-anchor="middle" fill="#fff" font-family="Arial">XLS</text>'),
      '<rect x="-46" y="-34" width="92" height="68" rx="8" fill="#e6f2fa" stroke="' + N + '" stroke-width="5"/><path d="M-38 26 L-14 -4 L6 18 L18 6 L38 26z" fill="' + N + '" opacity=".75"/><circle cx="-24" cy="-14" r="8" fill="' + T + '"/><g transform="rotate(-12)"><rect x="-6" y="-50" width="30" height="70" fill="#fff" stroke="' + N + '" stroke-width="4"/><rect x="0" y="-40" width="18" height="4" fill="' + N + '"/><rect x="0" y="-30" width="14" height="4" fill="#c8d3e0"/><rect x="0" y="-20" width="18" height="4" fill="#c8d3e0"/><rect x="0" y="4" width="18" height="6" rx="3" fill="' + M + '"/></g>',
      box('<rect x="-22" y="-32" width="26" height="5" rx="2.5" fill="' + N + '"/><rect x="8" y="-32" width="14" height="5" rx="2.5" fill="' + T + '"/>' + [-14, 2, 18].map(function (y, i) { return '<rect x="-24" y="' + (y - 6) + '" width="12" height="12" rx="2" fill="' + (i < 2 ? T : '#fff') + '" stroke="' + N + '" stroke-width="2.5"/>' + (i < 2 ? '<path d="m-21 ' + y + ' 3 3 5-6" stroke="#fff" stroke-width="2.5" fill="none"/>' : '') + '<rect x="-6" y="' + (y - 2) + '" width="24" height="4" rx="2" fill="#c8d3e0"/>'; }).join('') + '<g transform="translate(26 26) rotate(40)"><rect x="-5" y="-24" width="10" height="36" rx="2" fill="' + N + '"/><path d="M-5 12h10l-5 10z" fill="' + N + '"/><rect x="-5" y="-24" width="10" height="7" fill="' + M + '"/></g>'),
      box(lines(-30, 3, 40) + '<path d="M-22 16c5-10 8 6 12-2s6 6 10 0 5-4 8 0" fill="none" stroke="' + M + '" stroke-width="3.5" stroke-linecap="round"/><circle cx="24" cy="30" r="14" fill="' + T + '" stroke="#fff" stroke-width="3"/><path d="m17 30 5 5 8-9" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>'),
      '<rect x="-24" y="-46" width="48" height="92" rx="9" fill="#fff" stroke="' + N + '" stroke-width="5"/><rect x="-8" y="-40" width="16" height="4" rx="2" fill="' + N + '"/><rect x="-15" y="-26" width="30" height="36" rx="3" fill="none" stroke="' + T + '" stroke-width="3" stroke-dasharray="7 5"/>' + lines(-20, 2, 22).replace(/x="-22"/g, 'x="-10"') + '<rect x="-10" y="-2" width="16" height="4" rx="2" fill="' + M + '"/><rect x="-15" y="18" width="30" height="7" rx="3.5" fill="' + T + '" opacity=".6"/><circle cx="24" cy="34" r="15" fill="' + T + '"/><path d="M24 42V27m0 0-6 6m6-6 6 6" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
      box('<rect x="-22" y="-32" width="30" height="5" rx="2.5" fill="' + N + '"/><rect x="12" y="-32" width="10" height="10" rx="2" fill="' + T + '"/>' + lines(-16, 4, 44))
    ];
    var POS = [[250, 150], [390, 215], [250, 290], [390, 355], [250, 430], [390, 495], [250, 570], [390, 635], [250, 710]];
    var HUB = [640, 420], HR = 118;
    var icons = '', paths = '';
    POS.forEach(function (p, i) {
      var x0 = p[0] + (i % 2 ? 48 : 40), y0 = p[1];
      var d = 'M' + x0 + ' ' + y0 + ' C ' + (x0 + 170) + ' ' + y0 + ', ' + (HUB[0] - HR - 150) + ' ' + HUB[1] + ', ' + (HUB[0] - HR) + ' ' + HUB[1];
      var col = i % 2 ? '#a3136c' : '#9aa7d8';
      paths += '<path class="dg-line" id="acs-dgp' + i + '" d="' + d + '" stroke="' + col + '"/>';
      icons += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><g class="dg-icon">' + ICON_ART[i] + '</g></g>';
    });
    var dots = '';
    POS.forEach(function (p, i) {
      dots += '<circle r="9" fill="url(#acs-dotg)" opacity=".95"><animateMotion dur="' + (2.6 + (i % 3) * .35) + 's" begin="-' + (i * .31 + .05).toFixed(2) + 's" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#acs-dgp' + i + '" xlink:href="#acs-dgp' + i + '"/></animateMotion></circle>';
    });
    var R = 270, steps = [
      'Document komt binnen', 'Wordt geclassificeerd', 'Eventueel doorgezet naar specifieke mailbox', 'Aanwezige documenten uitgelezen', 'Gegevens opgeslagen in Dataverse', 'Instelbaar per documentsoort', 'Klaar voor opvolging in ERP, CRM, WMS, PIM, enz.'
    ];
    var arc = 'M ' + (HUB[0] + R * Math.cos(-1.13)) + ' ' + (HUB[1] + R * Math.sin(-1.13)) + ' A ' + R + ' ' + R + ' 0 0 1 ' + (HUB[0] + R * Math.cos(1.13)) + ' ' + (HUB[1] + R * Math.sin(1.13));
    var labels = steps.map(function (s, i) {
      var dy = (i - 3) * 79;
      var x = HUB[0] + Math.sqrt(R * R - dy * dy) + 36, y = HUB[1] + dy;
      var last = i === 6;
      return '<div class="dg-step' + (last ? ' is-last' : '') + '" style="left:' + x.toFixed(0) + 'px;top:' + y.toFixed(0) + 'px"><span>' + esc(s) + '</span><b>' + (i + 1) + '</b></div>';
    }).join('');
    return '<div class="acs-scene acs-diagram">' +
      '<svg viewBox="0 0 1440 810" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true"><defs><radialGradient id="acs-dotg"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#d487b8"/><stop offset="1" stop-color="#a3136c"/></radialGradient>' +
      '<linearGradient id="acs-outg" x1="0" x2="1"><stop offset="0" stop-color="#a3136c"/><stop offset="1" stop-color="#6a2a78"/></linearGradient><filter id="acs-sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#1d3f73" flood-opacity=".18"/></filter></defs>' +
      paths + '<g class="dg-dots">' + dots + '</g>' + icons +
      '<g class="dg-hub"><rect x="' + (HUB[0] + HR - 10) + '" y="' + (HUB[1] - 9) + '" width="' + (R - HR + 20) + '" height="18" fill="#c3cfe6"/>' +
      '<path d="' + arc + '" fill="none" stroke="#163d6b" stroke-width="9" stroke-linecap="round"/>' +
      '<circle cx="' + HUB[0] + '" cy="' + HUB[1] + '" r="' + HR + '" fill="#fff" filter="url(#acs-sh)"/>' +
      '<image href="' + asset(this.o, 'peacock-logo.png') + '" xlink:href="' + asset(this.o, 'peacock-logo.png') + '" x="' + (HUB[0] - 88) + '" y="' + (HUB[1] - 58) + '" width="176" height="116"/></g>' +
      '<g class="dg-out"><rect x="1040" y="411" width="90" height="18" fill="url(#acs-outg)"/></g>' +
      '</svg>' + labels +
      '<div class="dg-out dg-box">Data triggert direct het vervolgproces — geen overtypen, geen wachttijd</div>' +
      '</div>';
  };

  Demo.prototype.buildWindow = function () {
    var o = this.o;
    var nav = function (page, ic, label) { return '<div class="sb-item" data-action="nav" data-page="' + page + '">' + icon(ic) + '<span>' + label + '</span></div>'; };
    var initials = o.userName.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    return '<div class="acs-window">' +
      '<div class="bw-chrome"><div class="bw-dots"><i></i><i></i><i></i></div><div class="bw-nav">' + icon('chevLeft') + icon('chevRight') + icon('reload') + '</div>' +
      '<div class="bw-url">' + icon('lock') + '<span>apps.powerapps.com<b>/play/e/default/a/document-understanding-app</b></span></div></div>' +
      '<div class="pa-bar">' + icon('waffle') + '<div class="pa-title">Power Apps <span>|</span> Document Understanding App ' + icon('info') + '</div>' +
      '<div class="pa-right"><div class="pa-share">' + icon('share') + 'Share ' + icon('chevDown') + '</div>' + icon('fit') + icon('download') + icon('settings') + icon('help') + '<div class="pa-avatar">' + esc(initials) + '</div></div></div>' +
      '<div class="app">' +
        '<aside class="sb">' +
          '<div class="sb-logo"><img src="' + asset(o, 'peacock-mark.png') + '" alt=""><div><strong>PEACOCK</strong><small>INTELLIGENT AUTOMATION</small></div></div>' +
          '<nav class="sb-nav">' +
            nav('start', 'home', 'Start') + nav('upload', 'upload', 'Uploaden') + nav('wachtrij', 'queue', 'Wachtrij') + nav('valideren', 'checkCircle', 'Valideren') + nav('verwerkt', 'done', 'Verwerkt') + nav('mail', 'mail', 'Mailoverzicht') +
            '<div class="sb-sep"></div>' +
            nav('doctypes', 'doctypes', 'Documenttypes') + nav('aiconfig', 'cloud', 'Azure AI-configuratie') + nav('dashboard', 'dashboard', 'Dashboard') + nav('mailtypes', 'mailtypes', 'Mailtypes') +
            '<div class="sb-sep"></div>' +
            nav('settings', 'settings', 'Instellingen') +
          '</nav>' +
          '<div class="sb-user">' + icon('user') + '<div><strong>' + esc(o.userName) + '</strong><span>' + esc(o.userEmail) + '</span><span>' + esc(o.userRole) + '</span></div></div>' +
        '</aside>' +
        '<main class="main"></main>' +
        '<div class="modal-root"></div>' +
        '<div class="toasts"></div>' +
      '</div>' +
      '</div>';
  };

  Demo.prototype.buildOutro = function () {
    var o = this.o;
    return '<div class="acs-scene acs-outro">' +
      '<img src="' + asset(o, 'peacock-mark.png') + '" alt="">' +
      '<h2>' + esc(o.productName) + '</h2><p>' + esc(o.tagline) + '</p>' +
      '<div class="acs-outro-actions">' +
        '<a class="is-primary" href="' + esc(o.ctaUrl) + '" target="_top">' + esc(o.ctaLabel) + '</a>' +
        '<button type="button" data-acs="try">Zelf proberen</button>' +
        '<button type="button" data-acs="restart">Opnieuw bekijken</button>' +
      '</div></div>';
  };

  Demo.prototype.initDiagram = function () {
    this.$$('.acs-diagram .dg-line').forEach(function (p) {
      var len = p.getTotalLength ? p.getTotalLength() : 600;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p._len = len;
    });
    this.dgSvg = this.$('.acs-diagram svg');
    if (this.dgSvg && this.dgSvg.pauseAnimations) this.dgSvg.pauseAnimations();
    this.dgDots = false;
  };
  Demo.prototype.syncSmil = function () {
    var svg = this.dgSvg;
    if (!svg || !svg.pauseAnimations) return;
    var dots = this.$('.dg-dots');
    dots.style.opacity = this.dgDots ? 1 : 0;
    if (this.dgDots && this.clock.playing) svg.unpauseAnimations(); else svg.pauseAnimations();
  };

  /* ---------- scènes wisselen ---------- */
  Demo.prototype.scene = function (name, on, opacity) {
    var el = this.$(name === 'window' ? '.acs-window' : '.acs-' + name);
    el.classList.toggle('is-shown', !!on);
    el.style.opacity = on ? (opacity == null ? 1 : opacity) : 0;
    if (!on) el.style.transform = '';
    return el;
  };
  Demo.prototype.resetScenes = function (k) {
    this.scene('intro', k === 0, 1);
    this.scene('diagram', false);
    this.scene('outro', false);
    this.scene('window', k > 0).style.transform = '';
    this.dgDots = false;
    this.syncSmil();
    var logo = this.$('.acs-intro-logo'), title = this.$('.acs-intro-title');
    logo.style.opacity = 0; logo.style.transform = 'translate(-50%,-50%) scale(.9)';
    title.style.opacity = 0; title.style.transform = '';
    this.$$('.acs-diagram .dg-icon, .acs-diagram .dg-hub, .acs-diagram .dg-step, .acs-diagram .dg-out').forEach(function (e) { e.style.opacity = 0; e.style.transform = ''; });
    this.$$('.acs-diagram .dg-line').forEach(function (p) { p.style.strokeDashoffset = p._len; });
  };

  /* =====================================================================
     Rendering van de app-pagina's
     ===================================================================== */
  Demo.prototype.dd = function (key, value, options, o) {
    o = o || {};
    var open = this.S.openDD === key;
    return '<div class="dd' + (open ? ' open' : '') + (o.disabled ? ' is-disabled' : '') + '" data-dd="' + key + '">' +
      '<button type="button" class="dd-btn" data-action="dd-toggle">' + (value ? '<span>' + esc(value) + '</span>' : '<span class="ph">' + esc(o.placeholder || 'Kies een optie') + '</span>') + icon('chevDown') + '</button>' +
      '<div class="dd-list">' + options.map(function (op) {
        return '<div class="dd-opt' + (op === value ? ' is-sel' : '') + '" data-action="dd-pick" data-value="' + esc(op) + '">' + esc(op) + '</div>';
      }).join('') + '</div></div>';
  };
  function statusBadge(d) {
    if (d.status === 'processing') return '<span class="badge b-blue"><i class="spin"></i>In verwerking</span>';
    if (d.status === 'validate') return '<span class="badge b-yellow">Valideren</span>';
    if (d.status === 'done') return '<span class="badge b-green">Verwerkt</span>';
    return '<span class="badge b-red">Afgekeurd</span>';
  }
  function confBadge(c, pop) {
    if (c == null) return '<span class="badge b-grey">N.v.t.</span>';
    var cls = c >= 90 ? 'b-green' : c >= 70 ? 'b-orange' : 'b-red';
    return '<span class="badge ' + cls + (pop ? ' is-pop' : '') + '">' + c + '%</span>';
  }
  Demo.prototype.stepText = function (d) {
    var steps = this.S.dtc[d.type].steps;
    if (d.status === 'processing') {
      var i = Math.max(1, d.step);
      return '<span class="muted">Stap ' + i + ' van ' + steps.length + ' · ' + esc(steps[i - 1].name) + '</span>';
    }
    return '<span class="muted">Gereed</span>';
  };
  Demo.prototype.fileCell = function (d) { return '<span class="file">' + icon('file') + esc(d.name) + '</span>'; };
  Demo.prototype.rowCls = function (d) { return (d.fresh ? ' is-new' : ''); };

  var PAGES = {};

  PAGES.start = function () {
    var S = this.S, docs = S.docs, today = new Date();
    var count = function (f) { return docs.filter(f).length; };
    var mails = S.mails;
    var active = docs.filter(function (d) { return d.status === 'processing' || d.status === 'validate'; }).sort(function (a, b) { return b.up - a.up; }).slice(0, 7);
    var self = this;
    var stat = function (k, n, l) { return '<div class="stat" data-k="' + k + '"><b>' + n + '</b><span>' + l + '</span></div>'; };
    return '<h1 class="pg-title">Start</h1><p class="pg-sub">Snel overzicht en snelle acties.</p>' +
      '<div class="row mt"><button class="btn btn-primary" data-action="nav" data-page="upload">' + icon('upload') + 'Document uploaden</button><button class="btn" data-action="new-dt">' + icon('doctypes') + 'Nieuw documenttype</button></div>' +
      '<h3 class="sec">Documentverwerking</h3><div class="stats4">' +
        stat('docs-total', docs.length, 'Totaal documenten') +
        stat('docs-processing', count(function (d) { return d.status === 'processing'; }), 'In verwerking') +
        stat('docs-validate', count(function (d) { return d.status === 'validate'; }), 'Te valideren') +
        stat('docs-today', count(function (d) { return sameDay(d.up, today); }), 'Vandaag geüpload') +
      '</div>' +
      '<h3 class="sec">Mail</h3><div class="stats4">' +
        stat('mail-total', mails.length, 'Totaal mails') +
        stat('mail-new', mails.filter(function (m) { return m.status === 'Nieuw' || m.status === 'Verwerken'; }).length, 'Nieuw') +
        stat('mail-error', mails.filter(function (m) { return m.status === 'Fout'; }).length, 'Fout') +
        stat('mail-today', mails.filter(function (m) { return sameDay(m.at, today); }).length, 'Vandaag ontvangen') +
      '</div>' +
      '<div class="card mt"><div class="card-head">Documenten in verwerking<span class="link" data-action="nav" data-page="wachtrij">Bekijk wachtrij ' + icon('arrowRight') + '</span></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Bestandsnaam</th><th>Documenttype</th><th>Uploaddatum</th><th>Status</th></tr></thead><tbody>' +
      active.map(function (d) {
        var click = d.status === 'validate';
        return '<tr class="' + (click ? 'is-click' : '') + self.rowCls(d) + '" data-doc="' + d.id + '"' + (click ? ' data-action="open-doc" data-id="' + d.id + '"' : '') + '><td>' + esc(d.name) + '</td><td>' + esc(d.type) + '</td><td>' + fmtDT(d.up) + '</td><td>' + statusBadge(d) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  };

  PAGES.upload = function () {
    var S = this.S, U = S.upload;
    var types = Object.keys(S.dtc);
    var recent = S.docs.slice().sort(function (a, b) { return b.up - a.up; }).slice(0, 6);
    var drop;
    if (U.file) {
      drop = '<div class="drop has-file"><div class="chip-file"><span class="pdf' + (U.file.ext === 'JPG' ? ' jpg' : '') + '">' + U.file.ext + '</span><div><strong>' + esc(U.file.name) + '</strong><small class="muted">' + U.file.size + (U.busy ? ' · bezig met uploaden…' : ' · klaar om te uploaden') + '</small>' + (U.busy ? '<div class="prog"><i></i></div>' : '') + '</div></div></div>';
    } else {
      drop = '<div class="drop" data-action="pick-file">' + icon('upload') + '<strong>Sleep een bestand hierheen of klik om te bladeren (PDF, PNG, JPEG, TIFF, DOCX)</strong><small>PDF · PNG · JPEG · TIFF · DOCX</small></div>';
    }
    var samples = S.samplesOpen ? '<div class="samples" style="left:18px;top:170px"><h4>Kies een voorbeeldbestand</h4>' + Object.keys(SAMPLES).map(function (k) {
      var f = SAMPLES[k];
      return '<button type="button" data-action="sample" data-key="' + k + '"><span class="chip-file"><span class="pdf' + (f.ext === 'JPG' ? ' jpg' : '') + '">' + f.ext + '</span></span><span><strong>' + esc(f.name) + '</strong><small class="muted">' + esc(f.type) + ' · ' + f.size + '</small></span></button>';
    }).join('') + '</div>' : '';
    var can = U.type && U.file && !U.busy;
    return '<h1 class="pg-title">Document uploaden</h1>' +
      '<div class="upl-col"><div class="card card-pad" style="position:relative"><label class="lbl">Kies een documenttype <span class="req">*</span></label>' +
      this.dd('upl-type', U.type, types, { placeholder: ' ' }) + drop + samples +
      '<button class="btn upl-btn ' + (can ? 'btn-primary' : 'is-disabled') + '" data-action="do-upload">' + icon('upload') + 'Uploaden</button></div>' +
      '<div class="card"><div class="card-head">Recent aangeboden</div><ul class="recent">' +
      recent.map(function (d) { return '<li data-doc="' + d.id + '" class="' + (d.fresh ? 'is-new' : '') + '"><span class="file">' + icon('file') + esc(d.name) + '</span>' + statusBadge(d) + '</li>'; }).join('') +
      '</ul></div></div>';
  };

  PAGES.wachtrij = function () {
    var self = this;
    var list = this.S.docs.filter(function (d) { return d.status === 'processing' || d.status === 'validate'; }).sort(function (a, b) { return a.up - b.up; });
    return '<h1 class="pg-title">Wachtrij</h1><p class="pg-sub">Alle documenten die nog door de AI verwerkt of gevalideerd moeten worden.</p>' +
      '<div class="card mt"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Bestandsnaam</th><th>Documenttype</th><th>Aanbiedingskanaal</th><th>Uploaddatum</th><th>Verwerkingsstap</th><th>Confidence</th><th>Status</th></tr></thead><tbody>' +
      list.map(function (d) {
        var click = d.status === 'validate';
        return '<tr class="' + (click ? 'is-click' : '') + self.rowCls(d) + '" data-doc="' + d.id + '"' + (click ? ' data-action="open-doc" data-id="' + d.id + '"' : '') + '>' +
          '<td>' + self.fileCell(d) + '</td><td>' + esc(d.type) + '</td><td>' + d.channel + '</td><td>' + fmtDT(d.up) + '</td><td class="step">' + self.stepText(d) + '</td><td class="conf">' + (d.status === 'processing' ? '<span class="muted">…</span>' : confBadge(d.conf, d.fresh)) + '</td><td>' + statusBadge(d) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  };

  PAGES.valideren = function () {
    var self = this;
    var list = this.S.docs.filter(function (d) { return d.status === 'validate'; }).sort(function (a, b) { return a.up - b.up; });
    return '<h1 class="pg-title">Valideren</h1>' +
      '<div class="card mt"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Bestandsnaam</th><th>Documenttype</th><th>Aanbiedingskanaal</th><th>Uploaddatum</th><th>Confidence</th><th>Status</th></tr></thead><tbody>' +
      (list.length ? list.map(function (d) {
        return '<tr class="is-click' + self.rowCls(d) + '" data-doc="' + d.id + '" data-action="open-doc" data-id="' + d.id + '"><td>' + esc(d.name) + '</td><td>' + esc(d.type) + '</td><td>' + d.channel + '</td><td>' + fmtDT(d.up) + '</td><td>' + confBadge(d.conf) + '</td><td>' + statusBadge(d) + '</td></tr>';
      }).join('') : '<tr><td colspan="6" class="empty">Alles is gevalideerd. Mooi werk!</td></tr>') +
      '</tbody></table></div></div>';
  };

  PAGES.verwerkt = function () {
    var list = this.S.docs.filter(function (d) { return d.status === 'done' || d.status === 'rejected'; }).sort(function (a, b) { return b.doneAt - a.doneAt; });
    return '<h1 class="pg-title">Verwerkt</h1><p class="pg-sub">Gevalideerde documenten waarvan de gegevens in Dataverse staan.</p>' +
      '<div class="card mt"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Bestandsnaam</th><th>Documenttype</th><th>Validatie</th><th>Verwerkt op</th><th>Confidence</th><th>Status</th></tr></thead><tbody>' +
      list.map(function (d) {
        return '<tr data-doc="' + d.id + '"><td>' + esc(d.name) + '</td><td>' + esc(d.type) + '</td><td>' + (d.validation || 'Handmatig') + '</td><td>' + fmtDT(d.doneAt || d.up) + '</td><td>' + confBadge(d.conf) + '</td><td>' + (d.status === 'done' ? '<span class="badge b-green">' + icon('check') + 'Weggeschreven</span>' : statusBadge(d)) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  };

  PAGES.mail = function () {
    var cats = {};
    MAILTYPES.forEach(function (m) { cats[m[0]] = m[3]; });
    var list = this.S.mails.slice().sort(function (a, b) { return b.at - a.at; });
    return '<h1 class="pg-title">Mailoverzicht</h1><p class="pg-sub">Inkomende mail wordt automatisch geclassificeerd en afgehandeld.</p>' +
      '<div class="card mt"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Ontvangen</th><th>Van</th><th>Onderwerp</th><th>Bijlagen</th><th>Toegekende categorie</th><th>Status</th></tr></thead><tbody>' +
      list.map(function (m) {
        var cat = m.cat ? '<span class="cat badge b-grey is-pop"><i class="dot" style="background:' + cats[m.cat] + '"></i>' + esc(m.cat) + '</span>' + (m.note ? ' <span class="muted" style="font-size:11.5px">' + esc(m.note) + '</span>' : '') : (m.status === 'Verwerken' ? '<span class="badge b-blue"><i class="spin"></i>Classificeren…</span>' : '<span class="muted">—</span>');
        var st = m.status === 'Verwerkt' ? '<span class="badge b-green">Verwerkt</span>' : m.status === 'Fout' ? '<span class="badge b-red">Fout</span>' : m.status === 'Nieuw' ? '<span class="badge b-yellow">Nieuw</span>' : '<span class="badge b-blue">Verwerken</span>';
        return '<tr data-mail="' + m.id + '" class="' + (m.fresh ? 'is-new' : '') + '"><td>' + fmtDT(m.at) + '</td><td>' + esc(m.from) + '</td><td>' + esc(m.subject) + '</td><td>' + (m.att ? m.att + ' ' + icon('file') : '—') + '</td><td class="cat">' + cat + '</td><td>' + st + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  };

  PAGES.doctypes = function () {
    var S = this.S;
    return '<div class="pg-head"><h1 class="pg-title">Documenttypes</h1><div class="row"><span class="tgl' + (S.showInactive ? ' is-on' : '') + '" data-action="toggle" data-key="showInactive"><i></i>Toon inactieve</span><button class="btn btn-primary" data-action="new-dt" style="margin-left:14px">' + icon('plus') + 'Nieuw documenttype</button></div></div>' +
      '<div class="card mt"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Naam</th><th>Beschrijving</th><th>Versie</th><th>Status</th><th>Acties</th></tr></thead><tbody>' +
      Object.keys(S.dtc).map(function (k) {
        var c = S.dtc[k];
        return '<tr class="is-click" data-dt="' + k + '" data-action="open-dt" data-name="' + k + '"><td>' + k + '</td><td>' + esc(c.desc) + '</td><td>' + c.version + '</td><td><span class="badge b-green">Actief</span></td><td>···</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  };

  PAGES.doctype = function () {
    var S = this.S, name = S.dtName, c = S.dtc[name], tab = S.dtTab;
    var tabs = [['algemeen', 'Algemeen'], ['velden', 'Velden'], ['tabellen', 'Tabellen & kolommen'], ['ai', 'AI-model & verwerkingsstappen'], ['regels', 'Validatieregels'], ['team', 'Team']];
    var body = '';
    var acts = '<td><span class="acts">' + icon('edit') + icon('trash') + '</span></td>';
    if (tab === 'algemeen') {
      var dis = !c.autoValidate;
      body = '<div class="form">' +
        '<div class="fld"><label>Naam <span class="req">*</span></label><input class="inp" value="' + esc(name) + '" data-bind="dt-name"></div>' +
        '<div class="fld"><label>Beschrijving</label><textarea class="inp" rows="4" data-bind="dt-desc">' + esc(c.desc) + '</textarea></div>' +
        '<div class="h3">Automatische validatie</div><p class="help" style="margin:0 0 12px">Bepaalt of documenten van dit type automatisch mogen worden gevalideerd, of altijd naar de handmatige validatiewachtrij gaan.</p>' +
        '<div class="fld"><span class="tgl' + (c.autoValidate ? ' is-on' : '') + '" data-action="toggle" data-key="autoValidate"><i></i>Automatische validatie toegestaan</span></div>' +
        '<div class="fld' + (dis ? ' is-disabled' : '') + '" style="max-width:260px"><label>Validatiecriterium</label>' + this.dd('criterion', c.criterion, ['Confidence-drempel', 'Alle verplichte velden gevuld'], { disabled: dis }) +
        '<p class="help">Bepaalt waarop automatische validatie wordt beoordeeld: een confidence-drempel, of alleen of alle verplichte velden gevuld zijn.</p></div>' +
        '<div class="fld' + (dis ? ' is-disabled' : '') + '" style="max-width:160px"><label>Confidence-drempel</label><input class="inp" value="' + esc(c.threshold) + '" data-bind="threshold"' + (dis ? ' disabled' : '') + '>' +
        '<p class="help">Minimale confidence die elk verplicht veld moet halen om automatisch te mogen valideren (0–1).</p></div>' +
        '</div>';
    } else if (tab === 'velden') {
      body = '<div class="row" style="justify-content:flex-end;margin:-6px 0 10px"><button class="btn btn-primary" data-action="demo-only">' + icon('plus') + 'Nieuw veld</button></div>' +
        '<table class="tbl"><thead><tr><th>Naam</th><th>AI Veldnaam</th><th>Doelkolom</th><th>Data Type</th><th>Verplicht</th><th>Acties</th></tr></thead><tbody>' +
        c.fields.map(function (f, i) { return '<tr data-field="' + i + '"><td>' + esc(f[0]) + '</td><td>' + esc(f[1]) + '</td><td>' + f[2] + '</td><td>' + f[3] + '</td><td>' + f[4] + '</td>' + acts + '</tr>'; }).join('') + '</tbody></table>';
    } else if (tab === 'tabellen') {
      body = '<div class="row" style="justify-content:flex-end;margin:-6px 0 10px"><button class="btn btn-primary" data-action="demo-only">' + icon('plus') + 'Nieuwe tabel</button></div>' +
        '<table class="tbl"><thead><tr><th style="width:50%">Naam</th><th>Acties</th></tr></thead><tbody><tr><td>' + esc(c.table) + '</td>' + acts + '</tr></tbody></table>' +
        '<div class="card mt"><div class="card-head">Kolommen<button class="btn btn-primary" data-action="demo-only">' + icon('plus') + 'Nieuwe kolom</button></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Volgorde</th><th>Naam</th><th>AI Kolomnaam</th><th>Doelkolom</th><th>Verplicht</th><th>Acties</th></tr></thead><tbody>' +
        c.cols.map(function (col, i) { return '<tr data-col="' + i + '"><td>' + (i + 1) + '</td><td>' + esc(col) + '</td><td>' + esc(col) + '</td><td>Data ' + (i + 1) + '</td><td>Nee</td>' + acts + '</tr>'; }).join('') + '</tbody></table></div></div>';
    } else if (tab === 'ai') {
      body = '<div class="row" style="justify-content:flex-end;margin:-6px 0 10px"><button class="btn btn-primary" data-action="demo-only">' + icon('plus') + 'Nieuwe verwerkingsstap</button></div>' +
        '<table class="tbl"><thead><tr><th>Volgorde</th><th>Naam</th><th>AI-model / verwerkingstype</th><th>Azure AI-configuratie</th><th>Prompt</th><th>Acties</th></tr></thead><tbody>' +
        c.steps.map(function (s, i) { return '<tr data-step="' + i + '"><td>' + (i + 1) + '</td><td>' + esc(s.name) + '</td><td>' + esc(s.model) + '</td><td>' + esc(s.config) + '</td><td>' + (s.prompt ? esc(s.prompt) : '—') + '</td><td><span class="acts"><span data-action="edit-step" data-idx="' + i + '">' + icon('edit') + '</span>' + icon('trash') + '</span></td></tr>'; }).join('') + '</tbody></table>';
    } else if (tab === 'regels') {
      body = '<div class="card empty">' + icon('rules') + '<p>Er zijn nog geen extra validatieregels voor dit documenttype.</p><button class="btn btn-primary" data-action="demo-only">' + icon('plus') + 'Nieuwe validatieregel</button></div>';
    } else {
      body = '<p class="help" style="font-size:12.5px;margin:0 0 14px">Alleen leden van het gekozen team kunnen documenten van dit documenttype zien en valideren.</p>' +
        '<label class="lbl">Team</label><div class="row" style="align-items:flex-start"><div style="width:380px">' + this.dd('team', c.team, ['Geen team ingesteld', 'Crediteurenadministratie', 'Finance', 'Inkoop', 'Statements', 'Team Mails']) + '</div><button class="btn" data-action="demo-only">' + icon('plus') + 'Nieuw team</button></div>';
    }
    return '<div class="pg-head"><h1 class="pg-title">' + esc(name) + '</h1><div class="row"><button class="btn" data-action="nav" data-page="doctypes">Terug</button><button class="btn btn-primary" data-action="save-dt">Opslaan</button></div></div>' +
      '<div class="tabs">' + tabs.map(function (t) { return '<div class="tab' + (t[0] === tab ? ' is-active' : '') + '" data-action="tab" data-tab="' + t[0] + '">' + t[1] + '</div>'; }).join('') + '</div>' + body;
  };

  PAGES.aiconfig = function () {
    var rows = [
      ['Documenten Uitlezen', 'Azure AI Document Intelligence', 'https://docint-••••.cognitiveservices.azure.com'],
      ['Azure Agent', 'Azure AI Foundry', 'https://foundry-••••.services.ai.azure.com'],
      ['Mistral OCR', 'Azure AI Foundry · Mistral', 'https://mistral-••••.services.ai.azure.com']
    ];
    return '<div class="pg-head"><h1 class="pg-title">Azure AI-configuratie</h1><button class="btn btn-primary" data-action="demo-only">' + icon('plus') + 'Nieuwe configuratie</button></div>' +
      '<p class="pg-sub">De AI-diensten in je eigen Azure-omgeving waarmee documenten worden uitgelezen.</p>' +
      '<div class="card mt"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Naam</th><th>Dienst</th><th>Endpoint</th><th>Status</th><th>Acties</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td class="muted">' + r[2] + '</td><td><span class="badge b-green">Verbonden</span></td><td><span class="acts">' + icon('edit') + '</span></td></tr>'; }).join('') + '</tbody></table></div></div>';
  };

  PAGES.mailtypes = function () {
    return '<div class="pg-head"><h1 class="pg-title">Mailtypes</h1><button class="btn btn-primary" data-action="demo-only">' + icon('plus') + 'Nieuw mailtype</button></div>' +
      '<p class="pg-sub">De AI deelt elke inkomende mail in één van deze categorieën in en voert de bijbehorende actie uit.</p>' +
      '<div class="card mt"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Mailtype</th><th>Omschrijving</th><th>Actie</th><th>Acties</th></tr></thead><tbody>' +
      MAILTYPES.map(function (m) { return '<tr><td><span class="cat"><i class="dot" style="background:' + m[3] + '"></i>' + esc(m[0]) + '</span></td><td>' + esc(m[1]) + '</td><td>' + esc(m[2]) + '</td><td><span class="acts">' + icon('edit') + icon('trash') + '</span></td></tr>'; }).join('') + '</tbody></table></div></div>';
  };

  PAGES.settings = function () {
    var row = function (k, v) { return '<tr><td style="width:40%">' + k + '</td><td>' + v + '</td></tr>'; };
    return '<h1 class="pg-title">Instellingen</h1>' +
      '<div class="card mt"><div class="tbl-wrap"><table class="tbl tbl-plain"><tbody>' +
      row('Taal van de app', 'Nederlands') +
      row('Dataverse-omgeving', 'Productie') +
      row('Postvak voor inkomende mail', 'documenten@voorbeeldbedrijf.nl') +
      row('Meldingen bij uitval', '<span class="tgl is-on" data-action="demo-only"><i></i>Aan</span>') +
      row('Bewaartermijn documenten', '7 jaar') +
      '</tbody></table></div></div>';
  };

  PAGES.dashboard = function () {
    var S = this.S, tab = S.dashTab;
    var head = '<div class="pg-head"><h1 class="pg-title">Dashboard</h1>' + (tab === 'docs' ? '<button class="btn" data-action="demo-only">' + icon('download') + 'Exporteren (CSV)</button>' : '') + '</div>' +
      '<div class="tabs"><div class="tab' + (tab === 'docs' ? ' is-active' : '') + '" data-action="dash-tab" data-dash="docs">Documentverwerking</div><div class="tab' + (tab === 'mail' ? ' is-active' : '') + '" data-action="dash-tab" data-dash="mail">Mail</div></div>';
    var stat = function (v, l, fmt) { return '<div class="stat is-blue"><b data-count="' + v + '" data-fmt="' + (fmt || 'int') + '">' + fmtCount(v, fmt) + '</b><span>' + l + '</span></div>'; };
    if (tab === 'docs') {
      var docs = S.docs, today = new Date();
      var confs = docs.filter(function (d) { return d.conf != null; }).map(function (d) { return d.conf; });
      var avg = confs.reduce(function (a, b) { return a + b; }, 0) / (confs.length || 1);
      var rej = docs.filter(function (d) { return d.status === 'rejected'; }).length;
      var days = [];
      for (var i = 6; i >= 0; i--) {
        var d = new Date(); d.setDate(d.getDate() - i);
        days.push({ label: DAYS[d.getDay()], n: docs.filter(function (x) { return sameDay(x.up, d); }).length });
      }
      var max = Math.max.apply(null, days.map(function (x) { return x.n; }).concat([1]));
      var types = Object.keys(S.dtc).map(function (t) {
        var ds = docs.filter(function (x) { return x.type === t; });
        var cs = ds.filter(function (x) { return x.conf != null; }).map(function (x) { return x.conf; });
        return { t: t, n: ds.length, c: cs.length ? Math.round(cs.reduce(function (a, b) { return a + b; }, 0) / cs.length) + '%' : '—', f: ds.length ? (ds.filter(function (x) { return x.status === 'rejected'; }).length / ds.length * 100).toFixed(1) + '%' : '—', l: t === 'Facturen' ? '1.6 u' : t === 'Statements' ? '2.1 u' : '0.4 u' };
      });
      return head + '<div class="stats5">' +
        stat(docs.length, 'Totaal documenten') + stat(docs.filter(function (x) { return sameDay(x.up, today); }).length, 'Vandaag geüpload') +
        stat(Math.round(avg), 'Gem. confidence', 'pct') + stat(docs.length ? rej / docs.length * 100 : 0, 'Foutpercentage', 'pct1') + stat(1.8, 'Gem. doorlooptijd', 'hrs') + '</div>' +
        '<div class="card mt"><div class="card-head">Documenten per dag (laatste 7 dagen)</div><div class="chart">' +
        days.map(function (x, i) { return '<div class="bar-col" data-i="' + i + '"><span class="bar" data-h="' + Math.round(x.n / max * 120) + '"><span class="bar-tip">' + x.n + ' document' + (x.n === 1 ? '' : 'en') + '</span></span><small>' + x.label + '</small></div>'; }).join('') +
        '</div></div>' +
        '<div class="card mt"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Documenttype</th><th class="num">Aantal</th><th class="num">Gem. confidence</th><th class="num">Foutpercentage</th><th class="num">Gem. doorlooptijd</th></tr></thead><tbody>' +
        types.map(function (x) { return '<tr data-type="' + x.t + '"><td>' + x.t + '</td><td class="num">' + x.n + '</td><td class="num">' + x.c + '</td><td class="num">' + x.f + '</td><td class="num">' + x.l + '</td></tr>'; }).join('') +
        '</tbody></table></div></div>';
    }
    var m = S.mails;
    var by = function (st) { return m.filter(function (x) { return x.status === st; }).length; };
    return head + '<div class="stats5">' + stat(m.length, 'Totaal mails') + stat(by('Nieuw'), 'Nieuw') + stat(by('Verwerken'), 'Verwerken') + stat(by('Verwerkt'), 'Verwerkt') + stat(by('Fout'), 'Fout') + '</div>' +
      '<div class="card mt"><div class="card-head">Mails per mailtype</div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Toegekende categorie</th><th class="num">Aantal</th></tr></thead><tbody>' +
      MAILTYPES.map(function (t) { return '<tr data-cat="' + esc(t[0]) + '"><td><span class="cat"><i class="dot" style="background:' + t[3] + '"></i>' + esc(t[0]) + '</span></td><td class="num">' + m.filter(function (x) { return x.cat === t[0]; }).length + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
  };
  function fmtCount(v, fmt) {
    if (fmt === 'pct') return Math.round(v) + '%';
    if (fmt === 'pct1') return v.toFixed(1) + '%';
    if (fmt === 'hrs') return v.toFixed(1) + ' u';
    return String(Math.round(v));
  }

  PAGES.doc = function () {
    var S = this.S, d = this.docById(S.docId);
    if (!d) return '';
    var todo = d.fields.filter(function (f) { return f.c != null && f.c < 70 && !f.fixed; }).length;
    var head = '<div class="crumb"><a data-action="nav" data-page="wachtrij">Wachtrij</a> / ' + esc(d.name) + '</div>' +
      '<div class="vd"><div class="vd-head"><h2>' + esc(d.name) + '</h2>' +
      '<div class="vd-stat"><b>' + (d.conf == null ? '—' : d.conf + '%') + '</b><span>Confidence</span></div>' +
      '<div class="vd-stat vd-todo"><b>' + todo + '</b><span>Te controleren</span></div>' +
      '<div class="vd-actions"><button class="btn" data-action="reject-doc">' + icon('xCircle') + 'Afkeuren</button><button class="btn btn-primary" data-action="validate-doc">' + icon('checkCircle') + 'Valideren &amp; wegschrijven</button></div></div>';
    if (S.docLoading) return head + '<div class="loading"><i class="spin"></i>Laden…</div></div>';
    var paper = d.kind === 'invoice' ? paperInvoice(d.paper) : d.kind === 'statement' ? paperStatement(d.paper) : '<img class="photo" src="' + asset(this.o, 'receipt.jpg') + '" alt="Foto van een kassabon">';
    var tool = d.kind === 'receipt' ? '' : '<div class="vtool"><span class="off">' + icon('chevLeft') + '</span>Pagina 1 van 1<span class="off">' + icon('chevRight') + '</span>' + icon('zoomOut') + '100%' + icon('zoomIn') + '</div>';
    var kf = d.fields.map(function (f, i) {
      var low = f.c != null && f.c < 70;
      return '<div class="kf is-in' + (low && !f.fixed ? ' is-low' : '') + (f.fixed ? ' is-fixed' : '') + '" data-kf="' + i + '" style="animation-delay:' + (i * 70) + 'ms"><div class="kf-top"><span>' + esc(f.k) + '</span>' + (f.fixed ? '<span class="badge b-green">' + icon('check') + 'Aangepast</span>' : confBadge(f.c)) + '</div><input class="inp" value="' + esc(f.v) + '" data-kf-i="' + i + '"></div>';
    }).join('');
    var tables = d.tables.map(function (t, ti) {
      return '<h4>' + esc(t.name) + '</h4><table class="grid-tbl"><thead><tr>' + t.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        t.rows.map(function (r, ri) {
          return '<tr data-r="' + ri + '" class="is-in" style="animation-delay:' + (200 + ri * 45) + 'ms">' + r.map(function (v, ci) {
            var ed = t.edited && t.edited[ri + ':' + ci];
            return '<td><input class="inp' + (ed ? ' is-edited' : '') + '" value="' + esc(v) + '" data-cell="' + ti + ':' + ri + ':' + ci + '"></td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table>';
    }).join('');
    return head +
      '<div class="vd-body"><div class="viewer">' + tool + '<div class="paper-wrap">' + paper + '</div></div>' +
      '<div class="kop"><h3>Kopvelden</h3>' + kf + '</div></div>' +
      '<div class="tg"><div class="tg-head"><h3>Tabelgegevens</h3><span class="link">' + icon('compress') + 'Toon compact onder kopvelden</span></div>' + tables + '</div>' +
      '</div>';
  };

  Demo.prototype.docById = function (id) {
    for (var i = 0; i < this.S.docs.length; i++) if (this.S.docs[i].id === id) return this.S.docs[i];
    return null;
  };

  Demo.prototype.render = function (opts) {
    opts = opts || {};
    var S = this.S, main = this.main;
    var top = main.scrollTop;
    main.innerHTML = '<div class="pg' + (opts.anim ? ' pg-in' : '') + '">' + PAGES[S.page].call(this) + '</div>';
    if (opts.keep) main.scrollTop = top; else main.scrollTop = 0;
    var navKey = S.page === 'doc' ? 'valideren' : S.page === 'doctype' ? 'doctypes' : S.page;
    this.$$('.sb-item').forEach(function (el) { el.classList.toggle('is-active', el.getAttribute('data-page') === navKey); });
    this.renderModal();
    // 'nieuw'-markering maar één keer tonen
    S.docs.forEach(function (d) { d.fresh = false; });
    S.mails.forEach(function (m) { m.fresh = false; });
    if (S.page === 'dashboard' && !opts.keep) this.animateDashboard();
    if (S.page === 'upload' && S.upload.busy) {
      var bar = main.querySelector('.prog i');
      if (bar) bar.style.width = (S.upload.progress * 100) + '%';
    }
  };
  Demo.prototype.refresh = function () {
    var p = this.S.page;
    if (p === 'start' || p === 'upload' || p === 'wachtrij' || p === 'valideren' || p === 'verwerkt' || p === 'mail') this.render({ keep: true });
  };
  Demo.prototype.go = function (page) {
    this.S.page = page;
    this.S.openDD = null;
    this.S.samplesOpen = false;
    this.S.modal = null;
    this.render({ anim: true });
  };

  Demo.prototype.animateDashboard = function () {
    var ctx = this.appCtx(), main = this.main;
    var els = Array.prototype.slice.call(main.querySelectorAll('[data-count]'));
    ctx.tween(1100, function (p) {
      els.forEach(function (el) { el.textContent = fmtCount(parseFloat(el.getAttribute('data-count')) * p, el.getAttribute('data-fmt')); });
    }, easeOut).catch(swallow);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        Array.prototype.slice.call(main.querySelectorAll('.bar')).forEach(function (b) { b.style.height = b.getAttribute('data-h') + 'px'; });
      });
    });
  };

  Demo.prototype.renderModal = function () {
    var root = this.$('.modal-root'), M = this.S.modal;
    var prevBody = root.querySelector('.modal-body');
    var st = prevBody ? prevBody.scrollTop : 0;
    var ta = root.querySelector('.prompt-ta');
    var taTop = ta ? ta.scrollTop : 0;
    if (!M) { root.innerHTML = ''; return; }
    var prompts = Object.keys(this.S.prompts);
    root.innerHTML = '<div class="modal-bg"><div class="modal" role="dialog" aria-label="Verwerkingsstap bewerken">' +
      '<div class="modal-head"><h3>Bewerken</h3><button class="btn" data-action="demo-only">' + icon('history') + 'Versiegeschiedenis</button></div>' +
      '<div class="modal-body">' +
        '<div class="fld"><label>Naam <span class="req">*</span></label><input class="inp" value="' + esc(M.name) + '" data-bind="m-name"></div>' +
        '<div class="fld"><label>Volgorde</label><input class="inp" value="' + (M.idx + 1) + '"></div>' +
        '<div class="fld"><label>AI-model / verwerkingstype <span class="req">*</span></label>' + this.dd('model', M.model, ['prebuilt-layout', 'prebuilt-invoice', 'prebuilt-receipt', 'mistral-ocr', 'gpt-4.1', 'gpt-4o', 'foundry-agent:<agent-id>']) + '<p class="help">' + MODEL_HELP + '</p></div>' +
        '<div class="fld"><label>Azure AI-configuratie <span class="req">*</span></label>' + this.dd('config', M.config, ['Documenten Uitlezen', 'Azure Agent', 'Mistral OCR']) + '</div>' +
        '<div class="fld"><label>Prompt</label><div class="row"><div style="flex:1">' + this.dd('prompt', M.prompt, prompts, { placeholder: 'Bestaande prompt kiezen' }) + '</div><button class="btn" data-action="demo-only">Nieuwe prompt aanmaken</button></div></div>' +
        '<div class="fld"><label>Naam van de prompt</label><input class="inp" value="' + esc(M.prompt || '') + '"></div>' +
        '<div class="fld"><label>Prompttekst</label><textarea class="inp prompt-ta" data-bind="m-text">' + esc(M.text || '') + '</textarea></div>' +
      '</div>' +
      '<div class="modal-foot"><small>Wijzigingen gelden voor nieuw binnenkomende documenten.</small><button class="btn" data-action="modal-close">Annuleren</button><button class="btn btn-primary" data-action="modal-save">Opslaan</button></div>' +
      '</div></div>';
    var nb = root.querySelector('.modal-body');
    if (nb) nb.scrollTop = st;
    var nta = root.querySelector('.prompt-ta');
    if (nta) nta.scrollTop = taTop;
  };

  /* ---------- toasts ---------- */
  Demo.prototype.toast = function (title, text, kind) {
    var box = this.$('.toasts');
    var el = document.createElement('div');
    el.className = 'toast' + (kind === 'info' ? ' is-info' : '');
    el.innerHTML = icon(kind === 'info' ? 'info' : 'checkCircle') + '<div><strong>' + esc(title) + '</strong><span>' + esc(text) + '</span></div>';
    box.appendChild(el);
    var ctx = this.appCtx();
    ctx.wait(4200).then(function () {
      el.classList.add('is-out');
      return ctx.wait(320);
    }).then(function () { el.remove(); }).catch(function () { el.remove(); });
  };

  /* =====================================================================
     App-logica (werkt zowel voor de rondleiding als voor "zelf proberen")
     ===================================================================== */
  Demo.prototype.cfgOf = function () { return this.S.dtc[this.S.dtName]; };

  Demo.prototype.onAction = function (action, el) {
    var S = this.S, self = this;
    switch (action) {
      case 'nav': this.go(el.getAttribute('data-page')); break;
      case 'dd-toggle': {
        var dd = el.closest('.dd');
        if (dd.classList.contains('is-disabled')) return;
        var key = dd.getAttribute('data-dd');
        S.openDD = S.openDD === key ? null : key;
        this.$$('.dd').forEach(function (x) { x.classList.toggle('open', x.getAttribute('data-dd') === S.openDD); });
        break;
      }
      case 'dd-pick': this.pick(el.closest('.dd').getAttribute('data-dd'), el.getAttribute('data-value')); break;
      case 'toggle': {
        var k = el.getAttribute('data-key');
        if (k === 'showInactive') S.showInactive = !S.showInactive;
        else { var c = this.cfgOf(); c[k] = !c[k]; }
        this.render({ keep: true });
        break;
      }
      case 'tab': S.dtTab = el.getAttribute('data-tab'); S.openDD = null; this.render({ keep: false }); break;
      case 'dash-tab': S.dashTab = el.getAttribute('data-dash'); this.render({}); break;
      case 'open-dt': S.dtName = el.getAttribute('data-name'); S.dtTab = 'algemeen'; this.go('doctype'); break;
      case 'new-dt': this.toast('Alleen in de volledige versie', 'Nieuwe documenttypes maak je aan in de echte app.', 'info'); break;
      case 'demo-only': this.toast('Alleen in de volledige versie', 'Deze functie is in de demo niet beschikbaar.', 'info'); break;
      case 'save-dt': {
        var cfg = this.cfgOf();
        cfg.version += 1;
        this.toast('Documenttype opgeslagen', S.dtName + ' is bijgewerkt naar versie ' + cfg.version + '.');
        break;
      }
      case 'open-doc': this.openDoc(el.getAttribute('data-id')); break;
      case 'validate-doc': this.finishDoc('done'); break;
      case 'reject-doc': this.finishDoc('rejected'); break;
      case 'pick-file': S.samplesOpen = !S.samplesOpen; this.render({ keep: true }); break;
      case 'sample': {
        var smp = SAMPLES[el.getAttribute('data-key')];
        S.upload.file = smp;
        if (!S.upload.type) S.upload.type = smp.type;
        S.samplesOpen = false;
        this.render({ keep: true });
        break;
      }
      case 'do-upload': this.upload().catch(swallow); break;
      case 'edit-step': {
        var cf = this.cfgOf(), i = +el.getAttribute('data-idx'), st = cf.steps[i];
        S.modal = { idx: i, name: st.name, model: st.model, config: st.config, prompt: st.prompt, text: st.prompt ? S.prompts[st.prompt] : '' };
        S.openDD = null;
        this.renderModal();
        break;
      }
      case 'modal-close': S.modal = null; S.openDD = null; this.renderModal(); break;
      case 'modal-save': {
        var M = S.modal, cfs = this.cfgOf(), step = cfs.steps[M.idx];
        step.name = M.name; step.model = M.model; step.config = M.config; step.prompt = M.prompt || '';
        if (M.prompt) S.prompts[M.prompt] = M.text;
        S.modal = null; S.openDD = null;
        this.render({ keep: true });
        this.toast('Verwerkingsstap opgeslagen', step.name + ' gebruikt nu ' + step.model + '.');
        break;
      }
    }
    void self;
  };

  Demo.prototype.pick = function (key, value) {
    var S = this.S;
    S.openDD = null;
    if (key === 'upl-type') S.upload.type = value;
    else if (key === 'criterion') this.cfgOf().criterion = value;
    else if (key === 'team') this.cfgOf().team = value;
    else if (S.modal && key === 'model') S.modal.model = value;
    else if (S.modal && key === 'config') S.modal.config = value;
    else if (S.modal && key === 'prompt') { S.modal.prompt = value; S.modal.text = S.prompts[value]; }
    if (S.modal) this.renderModal(); else this.render({ keep: true });
  };

  Demo.prototype.onInput = function (el) {
    var S = this.S;
    var b = el.getAttribute('data-bind');
    if (b === 'threshold') this.cfgOf().threshold = el.value;
    else if (b === 'dt-desc') this.cfgOf().desc = el.value;
    else if (b === 'm-name' && S.modal) S.modal.name = el.value;
    else if (b === 'm-text' && S.modal) S.modal.text = el.value;
    var d = this.docById(S.docId);
    if (!d) return;
    if (el.hasAttribute('data-kf-i')) {
      var f = d.fields[+el.getAttribute('data-kf-i')];
      f.v = el.value;
      if (f.c != null && f.c < 70 && !f.fixed) {
        f.fixed = true;
        var kf = el.closest('.kf');
        kf.classList.remove('is-low'); kf.classList.add('is-fixed');
        kf.querySelector('.badge').outerHTML = '<span class="badge b-green">' + icon('check') + 'Aangepast</span>';
        var todo = d.fields.filter(function (x) { return x.c != null && x.c < 70 && !x.fixed; }).length;
        var t = this.main.querySelector('.vd-todo b');
        if (t) t.textContent = todo;
      }
    } else if (el.hasAttribute('data-cell')) {
      var p = el.getAttribute('data-cell').split(':').map(Number);
      var tb = d.tables[p[0]];
      tb.rows[p[1]][p[2]] = el.value;
      tb.edited = tb.edited || {};
      tb.edited[p[1] + ':' + p[2]] = true;
      el.classList.add('is-edited');
    }
  };

  Demo.prototype.openDoc = function (id) {
    var S = this.S, self = this;
    S.docId = id;
    S.docLoading = true;
    this.go('doc');
    var ctx = this.appCtx();
    ctx.wait(650).then(function () {
      if (S.page !== 'doc' || S.docId !== id) return;
      S.docLoading = false;
      self.render({ keep: true });
    }).catch(swallow);
  };

  Demo.prototype.finishDoc = function (status) {
    var S = this.S, d = this.docById(S.docId), self = this;
    if (!d || S.docLoading) return;
    d.status = status;
    d.doneAt = new Date();
    d.validation = 'Handmatig';
    if (status === 'done') {
      this.toast('Gevalideerd en weggeschreven', d.name + ' staat nu in Dataverse.');
      var ctx = this.appCtx();
      ctx.wait(1300).then(function () { self.toast('Klaar voor opvolging', 'Het vervolgproces in je ERP kan direct verder.', 'info'); }).catch(swallow);
    } else {
      this.toast('Document afgekeurd', d.name + ' is uit de validatiewachtrij gehaald.', 'info');
    }
    this.go('valideren');
  };

  Demo.prototype.upload = function () {
    var S = this.S, U = S.upload, self = this;
    if (!U.type || !U.file || U.busy) return Promise.resolve();
    U.busy = true;
    U.progress = 0;
    this.render({ keep: true });
    var ctx = this.appCtx();
    return ctx.tween(1300, function (p) {
      U.progress = p;
      var bar = self.main.querySelector('.prog i');
      if (bar) bar.style.width = (p * 100) + '%';
    }, linear).then(function () {
      var id = 'u' + (S.seq++);
      var doc = docFromSample(U.file, U.type, id);
      doc.fresh = true;
      S.docs.push(doc);
      S.lastUploadId = id;
      S.upload = { type: null, file: null, busy: false };
      if (S.page === 'upload') self.render({ keep: true });
      self.toast('Document geüpload', doc.name + ' staat in de wachtrij voor AI-verwerking.', 'info');
      self.process(doc).catch(swallow);
    });
  };

  Demo.prototype.process = function (doc) {
    var self = this, ctx = this.appCtx(), S = this.S;
    var steps = S.dtc[doc.type].steps;
    doc.status = 'processing';
    doc.step = 1;
    this.refresh();
    var chain = Promise.resolve();
    steps.forEach(function (s, i) {
      chain = chain.then(function () { doc.step = i + 1; self.refresh(); return ctx.wait(i === 0 ? 2100 : 2500); });
    });
    return chain.then(function () {
      doc.conf = doc.target;
      var cfg = S.dtc[doc.type];
      var th = parseFloat(String(cfg.threshold).replace(',', '.'));
      if (cfg.autoValidate && doc.conf != null && cfg.criterion === 'Confidence-drempel' && doc.conf / 100 >= th) {
        doc.status = 'done'; doc.validation = 'Automatisch'; doc.doneAt = new Date();
        self.toast('Automatisch gevalideerd', doc.name + ' haalde de drempel van ' + Math.round(th * 100) + '% en is direct weggeschreven.');
      } else {
        doc.status = 'validate';
      }
      doc.fresh = true;
      self.refresh();
    });
  };

  Demo.prototype.receiveMail = function () {
    var S = this.S, self = this, ctx = this.appCtx();
    var m = { id: 'm-new', at: new Date(), from: 'avis@frischkontor.de', subject: 'Zahlungsavis 4502', att: 1, cat: null, status: 'Nieuw', fresh: true };
    S.mails.push(m);
    this.refresh();
    return ctx.wait(1300).then(function () {
      m.status = 'Verwerken'; self.refresh();
      return ctx.wait(1900);
    }).then(function () {
      m.cat = 'Betaalspecificaties'; m.status = 'Verwerkt'; m.note = '→ bijlage naar documentverwerking';
      self.refresh();
      return ctx.wait(700);
    }).then(function () {
      var d = invoiceDoc({ id: 'mz', name: 'Zahlungsavis 4502.pdf', up: new Date(), conf: 94, status: 'processing', sup: SUPPLIERS.frisch, number: '4502', date: new Date(), lines: [['Äpfel Elstar', 'DE', 20, '12KG', 14.10]], title: 'ZAHLUNGSAVIS', fc: [99, 94, 96, 95, 94] });
      d.fresh = true;
      S.docs.push(d);
      return self.process(d);
    });
  };

  /* Snel vooruitspoelen naar de toestand aan het begin van een hoofdstuk */
  Demo.prototype.fastForward = function (k) {
    var S = this.S;
    if (k >= 2) {
      S.mails.push({ id: 'm-new', at: new Date(Date.now() - 60000), from: 'avis@frischkontor.de', subject: 'Zahlungsavis 4502', att: 1, cat: 'Betaalspecificaties', status: 'Verwerkt', note: '→ bijlage naar documentverwerking' });
      S.docs.push(invoiceDoc({ id: 'mz', name: 'Zahlungsavis 4502.pdf', up: new Date(Date.now() - 50000), conf: 94, status: 'validate', sup: SUPPLIERS.frisch, number: '4502', date: new Date(), lines: [['Äpfel Elstar', 'DE', 20, '12KG', 14.10]], title: 'ZAHLUNGSAVIS', fc: [99, 94, 96, 95, 94] }));
    }
    if (k >= 3) {
      var doc = docFromSample(SAMPLES.invoice, 'Facturen', 'u' + (S.seq++));
      S.docs.push(doc);
      S.lastUploadId = doc.id;
      if (k === 3) { this.process(doc).catch(swallow); }
      else { doc.conf = doc.target; doc.status = k >= 5 ? 'done' : 'validate'; if (k >= 5) { doc.doneAt = new Date(); doc.validation = 'Handmatig'; } }
    }
    if (k >= 6) {
      var r = this.docById('r1'), t = r.tables[0];
      t.rows[4][2] = '1'; t.rows[4][4] = '0,99'; t.rows[8][2] = '1'; t.rows[8][4] = '1,99';
      t.edited = { '4:2': true, '4:4': true, '8:2': true, '8:4': true };
      r.status = 'done'; r.doneAt = new Date(); r.validation = 'Handmatig';
    }
    if (k >= 7) {
      var c = S.dtc.Facturen;
      c.autoValidate = true; c.threshold = '0.95'; c.team = 'Crediteurenadministratie'; c.version = 23;
      S.prompts['Azure GPT 4.1 prompt'] = PROMPT_TEXT + TOUR_PROMPT_LINE;
    }
    var pages = [null, 'start', 'mail', 'upload', 'wachtrij', 'valideren', 'valideren', 'doctype', 'dashboard'];
    if (k === 7) { S.dtName = 'Facturen'; S.dtTab = 'team'; }
    if (k === 8) S.dashTab = 'mail';
    S.page = pages[k] || 'start';
  };
  var TOUR_PROMPT_LINE = '\n\nNoteer bedragen met een komma als decimaalteken.';

  /* =====================================================================
     Nep-cursor
     ===================================================================== */
  Demo.prototype.placeCursor = function () {
    this.cursorEl.style.transform = 'translate(' + this.cursor.x.toFixed(1) + 'px,' + this.cursor.y.toFixed(1) + 'px)';
  };
  Demo.prototype.showCursor = function (on) { this.cursorEl.classList.toggle('is-on', !!on); };
  Demo.prototype.ripple = function () {
    var r = document.createElement('div');
    r.className = 'acs-ripple';
    r.style.left = this.cursor.x + 'px';
    r.style.top = this.cursor.y + 'px';
    this.stage.appendChild(r);
    setTimeout(function () { r.remove(); }, 700);
  };

  /* =====================================================================
     Piloot: voert de rondleiding uit
     ===================================================================== */
  function Pilot(demo, ctx) { this.d = demo; this.ctx = ctx; this.bendSign = 1; }
  Pilot.prototype.wait = function (ms) { return this.ctx.wait(ms); };
  Pilot.prototype.tween = function (ms, fn, e) { return this.ctx.tween(ms, fn, e); };
  Pilot.prototype.q = function (sel) { return typeof sel === 'string' ? this.d.stage.querySelector(sel) : sel; };
  Pilot.prototype.until = function (fn, ms) {
    var self = this, t0 = this.d.clock.t;
    var loop = function () {
      if (fn() || self.d.clock.t - t0 > (ms || 9000)) return Promise.resolve();
      return self.wait(120).then(loop);
    };
    return loop();
  };
  /* Ondertitel tonen; wacht eerst tot de vorige lang genoeg in beeld was */
  Pilot.prototype.caption = function (text) {
    var d = this.d, self = this;
    var need = d.capAt + readTime(d.capText) - d.clock.t;
    return (need > 0 && d.capText ? this.wait(need) : Promise.resolve()).then(function () {
      if (!self.ctx.alive()) throw CANCEL;
      d.setCaption(text);
    });
  };
  Pilot.prototype.point = function (el, fx, fy) {
    var r = el.getBoundingClientRect(), s = this.d.stage.getBoundingClientRect(), k = this.d.scale;
    return { x: (r.left - s.left + r.width * fx) / k, y: (r.top - s.top + r.height * fy) / k };
  };
  Pilot.prototype.scroller = function (el) { return el.closest('.modal-body') || el.closest('.main'); };
  Pilot.prototype.scrollTo = function (box, to, ms) {
    var from = box.scrollTop;
    to = clamp(to, 0, box.scrollHeight - box.clientHeight);
    if (Math.abs(to - from) < 2) return Promise.resolve();
    return this.tween(ms || Math.min(1300, 450 + Math.abs(to - from) * .8), function (p) { box.scrollTop = from + (to - from) * p; });
  };
  Pilot.prototype.scrollMain = function (target, offset) {
    var main = this.d.main;
    if (typeof target === 'number') return this.scrollTo(main, target);
    return this.scrollInto(main, this.q(target), offset);
  };
  Pilot.prototype.scrollInto = function (box, el, offset) {
    if (!box || !el) return Promise.resolve();
    var delta = (el.getBoundingClientRect().top - box.getBoundingClientRect().top) / this.d.scale - (offset || 16);
    return this.scrollTo(box, box.scrollTop + delta);
  };
  Pilot.prototype.ensureVisible = function (el) {
    var box = this.scroller(el);
    if (!box) return Promise.resolve();
    var k = this.d.scale, r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    var margin = 70 * k, delta = 0;
    var cap = this.d.caption;
    var bottomPad = margin + (cap.classList.contains('is-on') && !this.d.root.classList.contains('is-narrow') && box.classList.contains('main') ? cap.offsetHeight : 0);
    if (r.top < b.top + margin * .5) delta = r.top - (b.top + margin);
    else if (r.bottom > b.bottom - bottomPad) delta = Math.min(r.bottom - (b.bottom - bottomPad), r.top - (b.top + margin));
    if (Math.abs(delta) < 2) return Promise.resolve();
    return this.scrollTo(box, box.scrollTop + delta / k);
  };
  Pilot.prototype.moveXY = function (x, y, dur) {
    var d = this.d, c = d.cursor, x0 = c.x, y0 = c.y;
    var dx = x - x0, dy = y - y0, dist = Math.hypot(dx, dy);
    if (dist < 2) return Promise.resolve();
    var nx = -dy / dist, ny = dx / dist, bend = .1 * dist * (this.bendSign = -this.bendSign);
    var cx = x0 + dx / 2 + nx * bend, cy = y0 + dy / 2 + ny * bend;
    return this.tween(dur || Math.min(1150, 420 + dist * .55), function (p) {
      var q = 1 - p;
      c.x = q * q * x0 + 2 * q * p * cx + p * p * x;
      c.y = q * q * y0 + 2 * q * p * cy + p * p * y;
      d.placeCursor();
    });
  };
  Pilot.prototype.move = function (target, o) {
    o = o || {};
    var self = this, el = this.q(target);
    if (!el) { console.warn('[demo] element niet gevonden:', target); return Promise.resolve(null); }
    return this.ensureVisible(el).then(function () {
      var p = self.point(el, o.fx == null ? .5 : o.fx, o.fy == null ? .5 : o.fy);
      return self.moveXY(p.x + (o.dx || 0), p.y + (o.dy || 0), o.dur);
    }).then(function () {
      var clickable = el.closest('[data-action], button, a, input, textarea, .dd-btn');
      self.d.cursorEl.classList.toggle('is-hand', !!clickable && !el.closest('input, textarea'));
      return el;
    });
  };
  Pilot.prototype.hover = function (target, ms, o) {
    var self = this;
    return this.move(target, o).then(function (el) {
      if (!el) return;
      var hot = el.closest('.kf, tr, .stat, .bar-col, .dd-opt') || el;
      hot.classList.add(hot.classList.contains('kf') ? 'is-hot' : 'is-hover');
      return self.wait(ms || 700).then(function () { hot.classList.remove('is-hot', 'is-hover'); });
    });
  };
  Pilot.prototype.click = function (target, o) {
    o = o || {};
    var self = this, d = this.d;
    return this.move(target, o).then(function (el) {
      if (!el) return null;
      return self.wait(o.pause == null ? 150 : o.pause).then(function () {
        d.cursorEl.classList.add('is-down');
        d.ripple();
        var btn = el.closest('.btn');
        if (btn) btn.classList.add('is-pressed');
        return self.wait(120);
      }).then(function () {
        d.cursorEl.classList.remove('is-down');
        var live = (typeof target === 'string' && self.q(target)) || el;
        if (live.matches('input, textarea')) live.classList.add('is-focus');
        live.click();
        return self.wait(o.after == null ? 420 : o.after);
      });
    });
  };
  Pilot.prototype.type = function (target, text, o) {
    o = o || {};
    var self = this, el = this.q(target);
    if (!el) return Promise.resolve();
    el.classList.add('is-focus');
    if (!o.append) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }
    var i = 0;
    var next = function () {
      if (i >= text.length) {
        return self.wait(250).then(function () { el.classList.remove('is-focus'); });
      }
      el.value += text[i++];
      el.dispatchEvent(new Event('input', { bubbles: true }));
      if (el.tagName === 'TEXTAREA') el.scrollTop = el.scrollHeight;
      return self.wait((o.speed || 70) + Math.random() * 45).then(next);
    };
    return next();
  };
  Pilot.prototype.fade = function (el, from, to, ms) {
    return this.tween(ms, function (p) { el.style.opacity = from + (to - from) * p; });
  };

  /* =====================================================================
     De hoofdstukken van de rondleiding
     ===================================================================== */
  var CHAPTERS = [
    { label: 'Intro', est: 14700, run: chIntro },
    { label: 'Start & mail', est: 14500, run: chStart },
    { label: 'Uploaden', est: 13400, run: chUpload },
    { label: 'AI-verwerking', est: 7900, run: chAI },
    { label: 'Valideren', est: 23400, run: chValidate },
    { label: 'Bonnetje', est: 26900, run: chReceipt },
    { label: 'Instellen', est: 48900, run: chConfig },
    { label: 'Dashboard', est: 14800, run: chDash },
    { label: 'Einde', est: 3500, run: chEnd }
  ];

  function chIntro(P, d) {
    d.showCursor(false);
    d.setCaption(null);
    var intro = d.scene('intro', true, 1), logo = d.$('.acs-intro-logo'), title = d.$('.acs-intro-title');
    var dg, icons, steps, start;
    if (d.introSkip) {
      d.introSkip = false;
      start = P.wait(1800);
    } else {
      start = P.wait(250).then(function () {
        return P.tween(1100, function (p) { logo.style.opacity = p; logo.style.transform = 'translate(-50%,-50%) scale(' + (.9 + .1 * p) + ')'; }, easeOut);
      }).then(function () { return P.wait(500); }).then(function () {
        return P.tween(1000, function (p) {
          logo.style.transform = 'translate(-50%, calc(-50% - ' + (120 * p) + 'px)) scale(' + (1 - .24 * p) + ')';
          title.style.opacity = p;
          title.style.transform = 'translateY(' + (24 * (1 - p)) + 'px)';
        });
      }).then(function () { return P.wait(2800); });
    }
    return start.then(function () {
      dg = d.scene('diagram', true, 0);
      return P.tween(700, function (p) { dg.style.opacity = p; intro.style.opacity = 1 - p; });
    }).then(function () {
      d.scene('intro', false);
      icons = d.$$('.acs-diagram .dg-icon');
      return P.tween(1300, function (p) {
        icons.forEach(function (ic, i) {
          var q = clamp((p * 1.7 - i * .08) / .45, 0, 1);
          ic.style.opacity = q;
          ic.style.transform = 'translateX(' + (-26 * (1 - easeOut(q))) + 'px)';
        });
      }, linear);
    }).then(function () {
      var hub = d.$('.acs-diagram .dg-hub'), lines = d.$$('.acs-diagram .dg-line');
      hub.style.transformOrigin = '640px 420px';
      return P.tween(1000, function (p) {
        lines.forEach(function (l) { l.style.strokeDashoffset = l._len * (1 - p); });
        var q = clamp(p * 1.6, 0, 1);
        hub.style.opacity = q;
        hub.style.transform = 'scale(' + (.85 + .15 * easeOut(q)) + ')';
      });
    }).then(function () {
      d.dgDots = true; d.syncSmil();
      steps = d.$$('.acs-diagram .dg-step');
      var chain = Promise.resolve();
      steps.forEach(function (s) {
        chain = chain.then(function () {
          return P.tween(420, function (p) { s.style.opacity = p; s.style.transform = 'translate(-50%,-50%) translateX(' + (-24 * (1 - p)) + 'px)'; }, easeOut);
        }).then(function () { return P.wait(160); });
      });
      return chain;
    }).then(function () {
      var outs = d.$$('.acs-diagram .dg-out');
      return P.tween(700, function (p) { outs.forEach(function (o) { o.style.opacity = p; }); });
    }).then(function () { return P.wait(3600); }).then(function () {
      var win = d.scene('window', true, 0);
      return P.tween(900, function (p) { dg.style.opacity = 1 - p; win.style.opacity = p; win.style.transform = 'scale(' + (1.035 - .035 * p) + ')'; });
    }).then(function () {
      d.scene('diagram', false);
      d.dgDots = false; d.syncSmil();
      d.$('.acs-window').style.transform = '';
    });
  }

  function chStart(P, d) {
    d.cursor = { x: 900, y: 560 }; d.placeCursor(); d.showCursor(true);
    return P.caption('De hoofdpagina toont de twee onderdelen: mail- en documentverwerking.')
      .then(function () { return P.wait(500); })
      .then(function () { return P.hover('.stat[data-k="docs-total"]', 800); })
      .then(function () { return P.hover('.stat[data-k="docs-validate"]', 800); })
      .then(function () { return P.hover('.stat[data-k="mail-total"]', 900); })
      .then(function () { return P.hover('tr[data-doc="d8"]', 700, { fx: .2 }); })
      .then(function () { return P.click('.sb-item[data-page="mail"]'); })
      .then(function () { return P.caption('Inkomende mail wordt automatisch geclassificeerd en waar nodig doorgezet.'); })
      .then(function () { d.receiveMail().catch(swallow); return P.wait(900); })
      .then(function () { return P.move('tr[data-mail="m-new"] td:nth-child(3)', { fx: .3 }); })
      .then(function () { return P.until(function () { return d.S.mails.some(function (m) { return m.id === 'm-new' && m.cat; }); }, 7000); })
      .then(function () { return P.move('tr[data-mail="m-new"] td.cat', { fx: .25 }); })
      .then(function () { return P.wait(2200); });
  }

  function chUpload(P, d) {
    return P.click('.sb-item[data-page="upload"]')
      .then(function () { return P.caption('Om documenten te uploaden kies je eenvoudig het soort document en voeg je het toe.'); })
      .then(function () { return P.click('[data-dd="upl-type"] .dd-btn', { fx: .4 }); })
      .then(function () { return P.hover('[data-dd="upl-type"] .dd-opt[data-value="Statements"]', 350, { fx: .2 }); })
      .then(function () { return P.click('[data-dd="upl-type"] .dd-opt[data-value="Facturen"]', { fx: .2 }); })
      .then(function () { return d.dragFile(P, SAMPLES.invoice); })
      .then(function () { return P.wait(500); })
      .then(function () { return P.click('[data-action="do-upload"]'); })
      .then(function () { return P.until(function () { return !!d.S.lastUploadId; }, 5000); })
      .then(function () { return P.hover('.recent li[data-doc="' + d.S.lastUploadId + '"]', 1300, { fx: .3 }); });
  }

  function chAI(P, d) {
    var id = d.S.lastUploadId;
    var doc = function () { return d.docById(id); };
    return P.click('.sb-item[data-page="wachtrij"]')
      .then(function () { return P.caption('De AI doorloopt automatisch de verwerkingsstappen van het documenttype.'); })
      .then(function () { return P.move('tr[data-doc="' + id + '"] td.step', { fx: .35 }); })
      .then(function () { return P.until(function () { return doc() && doc().status !== 'processing'; }, 9000); })
      .then(function () { return P.caption('Na upload komen de documenten in de wachtrij, waar ze gevalideerd worden.'); })
      .then(function () { return P.wait(300); })
      .then(function () { return P.hover('tr[data-doc="' + id + '"] td.conf', 1400, { fx: .2 }); });
  }

  function chValidate(P, d) {
    var id = d.S.lastUploadId;
    return P.click('tr[data-doc="' + id + '"]', { fx: .12 })
      .then(function () { return P.caption('De gevraagde gegevens worden uitgelezen en opgeslagen in Dataverse.'); })
      .then(function () { return P.until(function () { return !d.S.docLoading; }, 3000); })
      .then(function () { return P.wait(700); })
      .then(function () { return P.move('.paper .inv-title', { fx: .2 }); })
      .then(function () { return P.wait(900); })
      .then(function () { return P.caption('Je ziet hier wat de app uit dit document heeft opgehaald uit de header.'); })
      .then(function () { return P.hover('.kf[data-kf="0"]', 750, { fx: .75, fy: .7 }); })
      .then(function () { return P.hover('.kf[data-kf="1"]', 750, { fx: .75, fy: .7 }); })
      .then(function () { return P.hover('.kf[data-kf="3"]', 900, { fx: .75, fy: .7 }); })
      .then(function () { return P.hover('.kf[data-kf="3"] .badge', 900); })
      .then(function () { return P.scrollMain('.tg', 20); })
      .then(function () { return P.caption('Ook regels uit order- of aanvraagdocumenten worden opgehaald en weggeschreven.'); })
      .then(function () { return P.hover('.grid-tbl tr[data-r="0"] td:nth-child(1)', 600); })
      .then(function () { return P.hover('.grid-tbl tr[data-r="1"] td:nth-child(3)', 500); })
      .then(function () { return P.hover('.grid-tbl tr[data-r="3"] td:nth-child(5)', 700); })
      .then(function () { return P.wait(900); })
      .then(function () { return P.scrollMain(0); })
      .then(function () { return P.click('.vd-actions [data-action="validate-doc"]'); })
      .then(function () { return P.caption('Data triggert direct het vervolgproces: geen overtypen, geen wachttijd.'); })
      .then(function () { return P.move('.toast', { fx: .45, fy: .6 }); })
      .then(function () { return P.wait(2000); });
  }

  function chReceipt(P, d) {
    var cell = function (r, c) { return 'input[data-cell="0:' + r + ':' + c + '"]'; };
    var fix = function (r, c, v) {
      return function () { return P.click(cell(r, c), { fx: .6, after: 150 }).then(function () { return P.type(cell(r, c), v, { speed: 95 }); }); };
    };
    return P.click('tr[data-doc="r1"]', { fx: .12 })
      .then(function () { return P.caption('Ongeacht het soort document leest de app de gegevens uit. Dus ook een gekreukt bonnetje op een foto.'); })
      .then(function () { return P.until(function () { return !d.S.docLoading; }, 3000); })
      .then(function () { return P.wait(600); })
      .then(function () { return P.move('.photo', { fx: .5, fy: .12 }); })
      .then(function () { return P.wait(1100); })
      .then(function () { return P.hover('.kf[data-kf="4"]', 800, { fx: .75, fy: .7 }); })
      .then(function () { return P.hover('.kf[data-kf="1"]', 800, { fx: .75, fy: .7 }); })
      .then(function () { return P.hover('.kf[data-kf="6"]', 900, { fx: .75, fy: .7 }); })
      .then(function () { return P.scrollMain('.tg', 20); })
      .then(function () { return P.caption('Heb je toch een fout ontdekt? Pas het direct aan in de tabel.'); })
      .then(function () { return P.hover('.grid-tbl tr[data-r="4"] td:nth-child(2)', 900); })
      .then(fix(4, 2, '1'))
      .then(fix(4, 4, '0,99'))
      .then(function () { return P.hover('.grid-tbl tr[data-r="8"] td:nth-child(2)', 600); })
      .then(fix(8, 2, '1'))
      .then(fix(8, 4, '1,99'))
      .then(function () { return P.wait(800); })
      .then(function () { return P.scrollMain(0); })
      .then(function () { return P.click('.vd-actions [data-action="validate-doc"]'); })
      .then(function () { return P.wait(1400); });
  }

  function chConfig(P, d) {
    var hoverRows = function (sel, n, ms) {
      var chain = Promise.resolve();
      for (var i = 0; i < n; i++) (function (i) { chain = chain.then(function () { return P.hover(sel(i), ms, { fx: .15 }); }); })(i);
      return chain;
    };
    return P.click('.sb-item[data-page="doctypes"]')
      .then(function () { return P.caption('Dit gebeurt op basis van eerder ingestelde regels, passend bij het specifieke documenttype.'); })
      .then(function () { return P.hover('tr[data-dt="Statements"]', 500, { fx: .12 }); })
      .then(function () { return P.click('tr[data-dt="Facturen"]', { fx: .12 }); })
      .then(function () { return P.caption('Bij een vooraf ingestelde zekerheid kun je ervoor kiezen de documenten automatisch te laten verwerken.'); })
      .then(function () { return P.click('[data-action="toggle"][data-key="autoValidate"]', { fx: .08 }); })
      .then(function () { return P.click('[data-dd="criterion"] .dd-btn', { fx: .4 }); })
      .then(function () { return P.click('[data-dd="criterion"] .dd-opt[data-value="Confidence-drempel"]', { fx: .3 }); })
      .then(function () { return P.click('input[data-bind="threshold"]', { fx: .3 }); })
      .then(function () { return P.type('input[data-bind="threshold"]', '0.95', { speed: 120 }); })
      .then(function () { return P.wait(900); })
      .then(function () { return P.click('.tab[data-tab="velden"]'); })
      .then(function () { return P.caption('Ook de headervelden en tabelvelden stel je eenmalig in.'); })
      .then(function () { return hoverRows(function (i) { return 'tr[data-field="' + i + '"]'; }, 3, 380); })
      .then(function () { return P.click('.tab[data-tab="tabellen"]'); })
      .then(function () { return hoverRows(function (i) { return 'tr[data-col="' + (i + 1) + '"]'; }, 3, 340); })
      .then(function () { return P.click('.tab[data-tab="ai"]'); })
      .then(function () { return P.caption('Je kunt zelf het AI-model kiezen dat het best bij je vraag past.'); })
      .then(function () { return P.hover('tr[data-step="0"]', 800, { fx: .15 }); })
      .then(function () { return P.click('[data-action="edit-step"][data-idx="1"]'); })
      .then(function () { return P.wait(500); })
      .then(function () { return P.click('[data-dd="model"] .dd-btn', { fx: .3 }); })
      .then(function () { return P.hover('[data-dd="model"] .dd-opt[data-value="mistral-ocr"]', 400, { fx: .2 }); })
      .then(function () { return P.click('[data-dd="model"] .dd-opt[data-value="gpt-4.1"]', { fx: .2 }); })
      .then(function () { return P.caption('Met de specifieke prompt geef je aan wat de AI-oplossing moet doen.'); })
      .then(function () { return P.scrollInto(d.$('.modal-body'), d.$('.prompt-ta'), 70); })
      .then(function () { return P.click('.prompt-ta', { fx: .5, fy: .9 }); })
      .then(function () { var ta = d.$('.prompt-ta'); return P.tween(500, function (p) { ta.scrollTop = ta.scrollHeight * p; }); })
      .then(function () { return P.type('.prompt-ta', TOUR_PROMPT_LINE, { append: true, speed: 30 }); })
      .then(function () { return P.wait(700); })
      .then(function () { return P.click('[data-action="modal-save"]'); })
      .then(function () { return P.click('.tab[data-tab="team"]'); })
      .then(function () { return P.caption('Toegang alleen voor specifieke teams? Stel in welke rollen welke rechten krijgen.'); })
      .then(function () { return P.click('[data-dd="team"] .dd-btn', { fx: .4 }); })
      .then(function () { return P.click('[data-dd="team"] .dd-opt[data-value="Crediteurenadministratie"]', { fx: .3 }); })
      .then(function () { return P.wait(400); })
      .then(function () { return P.click('[data-action="save-dt"]'); })
      .then(function () { return P.wait(1300); });
  }

  function chDash(P, d) {
    return P.click('.sb-item[data-page="dashboard"]')
      .then(function () { return P.caption('Houd in het dashboard bij waar je eventueel kunt bijsturen.'); })
      .then(function () { return P.wait(1100); })
      .then(function () { return P.hover('.bar-col[data-i="0"] .bar', 700, { fy: .3 }); })
      .then(function () { return P.hover('.bar-col[data-i="6"] .bar', 900, { fy: .3 }); })
      .then(function () { return P.hover('tr[data-type="Facturen"]', 900, { fx: .1 }); })
      .then(function () { return P.click('.tab[data-dash="mail"]'); })
      .then(function () { return P.wait(700); })
      .then(function () { return P.hover('tr[data-cat="Betaalspecificaties"]', 800, { fx: .15 }); })
      .then(function () { return P.hover('tr[data-cat="Uitval"]', 900, { fx: .15 }); })
      .then(function () { return P.wait(1200); });
  }

  function chEnd(P, d) {
    var need = d.capAt + readTime(d.capText) - d.clock.t;
    return P.wait(Math.max(0, need)).then(function () {
      d.setCaption(null);
      d.showCursor(false);
      var out = d.scene('outro', true, 0);
      return P.tween(900, function (p) { out.style.opacity = p; });
    });
  }

  /* Bestand van "het bureaublad" naar de dropzone slepen */
  Demo.prototype.dragFile = function (P, sample) {
    var d = this, df = this.$('.acs-dragfile');
    df.querySelector('.acs-df-name').textContent = sample.name;
    var place = function () { df.style.transform = 'translate(' + (d.cursor.x - 18) + 'px,' + (d.cursor.y - 16) + 'px) rotate(-3deg)'; };
    var drop;
    return P.moveXY(1360, 770, 900).then(function () {
      d.cursorEl.classList.remove('is-hand');
      place();
      return P.tween(250, function (p) { df.style.opacity = p; });
    }).then(function () {
      drop = P.q('.drop');
      var tgt = P.point(drop, .45, .5);
      var anim = P.moveXY(tgt.x, tgt.y, 1400);
      var follow = function () { place(); };
      d.clock.anims.add(follow);
      return anim.then(function () { d.clock.anims.delete(follow); place(); }, function (e) { d.clock.anims.delete(follow); throw e; });
    }).then(function () {
      drop.classList.add('is-over');
      return P.wait(450);
    }).then(function () {
      return P.tween(200, function (p) { df.style.opacity = 1 - p; });
    }).then(function () {
      d.S.upload.file = sample;
      d.render({ keep: true });
    });
  };

  /* =====================================================================
     Speler: afspelen, pauzeren, hoofdstukken, zelf proberen
     ===================================================================== */
  Demo.prototype.setCaption = function (text) {
    var cap = this.caption, span = this.captionText;
    this.capText = text;
    this.capAt = this.clock.t;
    if (!text) { cap.classList.remove('is-on'); return; }
    if (!cap.classList.contains('is-on')) {
      span.textContent = text;
      cap.classList.add('is-on');
      return;
    }
    span.classList.add('is-swap');
    setTimeout(function () { span.textContent = text; span.classList.remove('is-swap'); }, 220);
  };

  Demo.prototype.run = function (k) {
    var self = this;
    this.token++;
    var tok = this.token;
    var ctx = new Ctx(this.clock, function () { return tok === self.token; });
    var P = new Pilot(this, ctx);
    var step = function (i) {
      if (tok !== self.token) return;
      if (i >= CHAPTERS.length) { self.ended(); return; }
      self.chIndex = i;
      self.chStart = self.clock.t;
      self.updateChapters();
      return CHAPTERS[i].run(P, self).then(function () { return step(i + 1); });
    };
    Promise.resolve().then(function () { return step(k); }).catch(swallow);
  };

  Demo.prototype.poster = function () {
    this.resetScenes(0);
    var logo = this.$('.acs-intro-logo'), title = this.$('.acs-intro-title');
    logo.style.opacity = 1;
    logo.style.transform = 'translate(-50%, calc(-50% - 120px)) scale(.76)';
    title.style.opacity = 1;
    this.posterShown = true;
  };

  Demo.prototype.jump = function (k) {
    k = clamp(k | 0, 0, CHAPTERS.length - 1);
    var fromPoster = this.posterShown && k === 0;
    this.posterShown = false;
    this.token++;
    this.appEpoch++;
    this.mode = 'auto';
    this.root.classList.remove('is-try', 'is-ended');
    this.$('.toasts').innerHTML = '';
    this.S = seed();
    this.setCaption(null);
    this.resetScenes(k);
    if (k > 0) {
      this.fastForward(k);
      this.render({ anim: false });
      this.cursor = { x: 900, y: 560 };
      this.placeCursor();
      this.showCursor(k < CHAPTERS.length - 1);
    } else {
      this.render({ anim: false });
      this.showCursor(false);
      if (fromPoster) { this.poster(); this.posterShown = false; this.introSkip = true; }
    }
    this.$('.acs-controls [data-acs="try"]').classList.remove('is-active');
    this.state = 'playing';
    this.setPlaying(true);
    this.run(k);
  };

  Demo.prototype.setPlaying = function (on) {
    this.clock.playing = on || this.mode === 'try';
    this.root.classList.toggle('is-idle', this.state === 'idle');
    this.root.classList.toggle('is-paused', !on && this.mode !== 'try');
    var b = this.$('[data-acs="toggle"]');
    var ended = this.state === 'ended';
    b.innerHTML = icon(ended ? 'replay' : on ? 'pause' : 'play');
    b.setAttribute('aria-label', ended ? 'Opnieuw afspelen' : on ? 'Pauzeren' : 'Afspelen');
    this.syncSmil();
  };
  Demo.prototype.play = function () {
    if (this.mode === 'try') { this.jump(this.chIndex); return; }
    if (this.state === 'idle' || this.state === 'ended') { this.jump(this.state === 'ended' ? 0 : this.o.chapter); return; }
    this.state = 'playing';
    this.setPlaying(true);
  };
  Demo.prototype.pause = function () {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.setPlaying(false);
  };
  Demo.prototype.toggle = function () { this.state === 'playing' && this.mode !== 'try' ? this.pause() : this.play(); };
  Demo.prototype.ended = function () {
    this.state = 'ended';
    this.root.classList.add('is-ended');
    this.chIndex = CHAPTERS.length - 1;
    this.updateChapters(true);
    this.setPlaying(false);
    this.clock.playing = true;
  };

  Demo.prototype.enterTry = function () {
    this.token++;
    this.mode = 'try';
    this.state = 'paused';
    this.root.classList.add('is-try');
    this.root.classList.remove('is-ended', 'is-paused');
    this.setCaption(null);
    this.showCursor(false);
    var win = this.$('.acs-window');
    if (!win.classList.contains('is-shown') || this.$('.acs-outro').classList.contains('is-shown') || this.$('.acs-intro').classList.contains('is-shown') || this.$('.acs-diagram').classList.contains('is-shown')) {
      this.resetScenes(1);
      win.style.transform = '';
      if (this.chIndex === 0) this.chIndex = 1;
      this.go('start');
    }
    this.S.openDD = null;
    this.setPlaying(false);
    this.clock.playing = true;
    this.$('.acs-controls [data-acs="try"]').classList.add('is-active');
    this.updateChapters();
  };

  Demo.prototype.updateChapters = function (all) {
    var i = this.chIndex, t = this.clock.t - this.chStart;
    var self = this;
    this.$$('.acs-ch').forEach(function (el, k) {
      var fill = el.firstChild.firstChild;
      var p = all || k < i ? 1 : k > i ? 0 : clamp(t / CHAPTERS[k].est, 0, .97);
      if (self.state === 'ended') p = 1;
      fill.style.width = (p * 100).toFixed(1) + '%';
      el.classList.toggle('is-current', k === i);
    });
    var now = this.$('.acs-now');
    if (now) now.textContent = (i + 1) + '/' + CHAPTERS.length + ' · ' + CHAPTERS[i].label;
  };

  /* ---------- afmetingen / schalen ---------- */
  Demo.prototype.layout = function () {
    var root = this.root, screen = this.$('.acs-screen');
    var fs = document.fullscreenElement === root || document.webkitFullscreenElement === root;
    var w = root.clientWidth;
    if (fs) {
      var controls = this.$('.acs-controls').offsetHeight + 32;
      var capH = w < 620 ? 70 : 0;
      w = Math.min(w - 48, (window.innerHeight - controls - capH) * 16 / 9);
      screen.style.width = w + 'px';
    } else {
      screen.style.width = '';
      w = screen.clientWidth || w;
    }
    this.base = w / 1440;
    root.classList.toggle('is-narrow', w < 620);
    this.updateCam(true);
    root.classList.toggle('is-compact', root.clientWidth < 760);
    var cap = clamp(24 * this.scale * 1.05, 13, 28);
    if (w < 620) cap = 14;
    root.style.setProperty('--acs-cap-size', cap.toFixed(1) + 'px');
    if (this.o.embed && window.parent !== window) {
      try { window.parent.postMessage({ type: 'acs-demo:height', height: document.documentElement.scrollHeight }, '*'); } catch (e) { /* negeren */ }
    }
  };

  /* Op smalle schermen zoomt de "camera" in en volgt hij de cursor */
  Demo.prototype.updateCam = function (snap) {
    var c = this.cam || (this.cam = { z: 1, x: 0, y: 0 });
    var narrow = this.root.classList.contains('is-narrow');
    if (!narrow && c.z === 1 && !snap) return;
    var appOn = this.$('.acs-window').classList.contains('is-shown') && !this.$('.acs-outro').classList.contains('is-shown') && !this.$('.acs-diagram').classList.contains('is-shown');
    var follow = narrow && this.mode === 'auto' && appOn && this.cursorEl.classList.contains('is-on');
    var tz = follow ? 1.9 : 1, vw = 1440 / tz, vh = 810 / tz;
    var tx = follow ? clamp(this.cursor.x - vw / 2, 0, 1440 - vw) : 0;
    var ty = follow ? clamp(this.cursor.y - vh * .45, 0, 810 - vh) : 0;
    var f = snap ? 1 : .09;
    c.z += (tz - c.z) * f; c.x += (tx - c.x) * f; c.y += (ty - c.y) * f;
    if (Math.abs(c.z - tz) < .002 && Math.abs(c.x - tx) < .3 && Math.abs(c.y - ty) < .3) { c.z = tz; c.x = tx; c.y = ty; }
    this.scale = this.base * c.z;
    this.stage.style.transform = 'scale(' + this.scale + ') translate(' + (-c.x).toFixed(1) + 'px,' + (-c.y).toFixed(1) + 'px)';
  };

  /* ---------- events ---------- */
  Demo.prototype.bind = function () {
    var self = this, root = this.root, stage = this.stage;

    stage.addEventListener('click', function (e) {
      var a = e.target.closest('[data-action]');
      if (!e.target.closest('.dd') && self.S.openDD) {
        self.S.openDD = null;
        self.$$('.dd.open').forEach(function (x) { x.classList.remove('open'); });
      }
      if (self.S.samplesOpen && !e.target.closest('.samples, .drop')) { self.S.samplesOpen = false; self.render({ keep: true }); }
      if (!a || !stage.contains(a)) return;
      if (a.classList.contains('is-disabled') || a.disabled) return;
      self.onAction(a.getAttribute('data-action'), a, e);
    });
    stage.addEventListener('input', function (e) { self.onInput(e.target); });

    this.$('.acs-shield').addEventListener('click', function () { self.toggle(); });
    this.$('.acs-bigplay').addEventListener('click', function () { self.play(); });

    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-acs]');
      if (b) {
        var what = b.getAttribute('data-acs');
        if (what === 'toggle') self.toggle();
        else if (what === 'restart') self.jump(0);
        else if (what === 'try') { if (self.mode === 'try') self.jump(self.chIndex); else self.enterTry(); }
        else if (what === 'resume') self.jump(self.chIndex);
        else if (what === 'fullscreen') self.fullscreen();
        return;
      }
      var ch = e.target.closest('.acs-ch');
      if (ch) self.jump(+ch.getAttribute('data-ch'));
    });

    root.addEventListener('keydown', function (e) {
      if (e.target.closest('input, textarea')) return;
      if (e.key === ' ' || e.key === 'k') {
        if (e.target.closest('button, a') && e.key === ' ') return;
        e.preventDefault(); self.toggle();
      } else if (e.key === 'ArrowRight' && !e.target.closest('.acs-stage')) self.jump(self.chIndex + 1);
      else if (e.key === 'ArrowLeft' && !e.target.closest('.acs-stage')) self.jump(self.chIndex - 1);
    });

    if (window.ResizeObserver) new ResizeObserver(function () { self.layout(); }).observe(root);
    window.addEventListener('resize', function () { self.layout(); });
    document.addEventListener('fullscreenchange', function () { self.layout(); });

    this.clock.anims.add(function () {
      if (self.state !== 'idle' && self.mode === 'auto') self.updateChapters();
      self.updateCam(false);
    });

    // automatisch starten zodra de demo in beeld komt, pauzeren als hij uit beeld scrolt
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.poster();
    this.updateChapters();
    this.setPlaying(false);
    if (this.o.autoplay && !reduce && 'IntersectionObserver' in window) {
      var auto = false;
      new IntersectionObserver(function (entries) {
        var vis = entries[0].isIntersecting;
        if (vis && self.state === 'idle') self.play();
        else if (!vis && self.state === 'playing') { auto = true; self.pause(); }
        else if (vis && auto && self.state === 'paused') { auto = false; self.play(); }
      }, { threshold: .35 }).observe(this.viewport);
    }
  };

  Demo.prototype.fullscreen = function () {
    var r = this.root;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else if (r.requestFullscreen) r.requestFullscreen();
    else if (r.webkitRequestFullscreen) r.webkitRequestFullscreen();
  };

  /* =====================================================================
     Automatisch koppelen aan <div data-acs-demo>
     ===================================================================== */
  function ensureAssets() {
    if (!document.querySelector('link[href*="demo.css"]') && BASE) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = BASE + 'demo.css';
      document.head.appendChild(l);
    }
    if (!document.querySelector('link[href*="family=Questrial"]')) {
      var f = document.createElement('link');
      f.rel = 'stylesheet'; f.href = 'https://fonts.googleapis.com/css2?family=Questrial&display=swap';
      document.head.appendChild(f);
    }
  }

  function optionsFor(el) {
    var o = {}, k;
    for (k in DEFAULTS) o[k] = DEFAULTS[k];
    var ds = el.dataset;
    if (ds.ctaUrl) o.ctaUrl = ds.ctaUrl;
    if (ds.ctaLabel) o.ctaLabel = ds.ctaLabel;
    if (ds.productName) o.productName = ds.productName;
    if (ds.tagline) o.tagline = ds.tagline;
    if (ds.userName) o.userName = ds.userName;
    if (ds.userEmail) o.userEmail = ds.userEmail;
    if (ds.theme) o.theme = ds.theme;
    if (ds.autoplay) o.autoplay = ds.autoplay !== 'false' && ds.autoplay !== '0';
    if (ds.chapter) o.chapter = +ds.chapter || 0;
    if (ds.assets) o.assets = ds.assets;
    if (ds.urlParams !== undefined) {
      var q = new URLSearchParams(location.search);
      if (q.has('autoplay')) o.autoplay = q.get('autoplay') !== '0' && q.get('autoplay') !== 'false';
      if (q.has('chapter')) o.chapter = clamp(+q.get('chapter') || 0, 0, CHAPTERS.length - 1);
      if (q.has('theme')) o.theme = q.get('theme');
      if (q.has('cta')) o.ctaUrl = q.get('cta');
      if (q.has('ctaLabel')) o.ctaLabel = q.get('ctaLabel');
      if (q.has('embed')) o.embed = q.get('embed') !== '0';
      if (q.has('speed')) o.speed = clamp(+q.get('speed') || 1, .25, 8);
    }
    return o;
  }

  function mountAll() {
    ensureAssets();
    Array.prototype.forEach.call(document.querySelectorAll('[data-acs-demo]'), function (el) {
      if (el._acsDemo) return;
      el._acsDemo = new Demo(el, optionsFor(el));
    });
  }

  window.ACSDemo = { mount: function (el, opts) { var o = optionsFor(el); for (var k in opts || {}) o[k] = opts[k]; ensureAssets(); return (el._acsDemo = new Demo(el, o)); }, chapters: CHAPTERS };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
  else mountAll();
})();
