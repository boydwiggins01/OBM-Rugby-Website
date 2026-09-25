/* OBM Rugby website.
   All page text lives in /content/*.json and is edited through Pages CMS (see README.md).
   This script loads that content and draws each page. You shouldn't need to edit it to update the site. */
(function () {
  "use strict";

  var FILES = ["settings", "about", "juniors", "venue", "gear", "teams", "fixtures", "news", "events", "sponsors"];
  var PAGES = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "seniors", label: "Seniors" },
    { id: "juniors", label: "Juniors" },
    { id: "draws", label: "Draws & Results" },
    { id: "news", label: "News & Events" },
    { id: "sponsors", label: "Sponsors" },
    { id: "venue", label: "Venue Hire" },
    { id: "gear", label: "Club Gear" },
    { id: "contact", label: "Contact" }
  ];
  var TIER_ORDER = ["Premier Partner", "Apparel Partner", "Club Supporter", "Junior Club Sponsor", "Community Funder"];
  var C = {};
  var CREST = "images/crest.png";

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Rich text from the editor arrives as HTML. Plain text gets wrapped in paragraphs.
  function rich(s) {
    s = String(s || "").trim();
    if (!s) return "";
    if (/<[a-z][\s\S]*>/i.test(s)) return s;
    return s.split(/\n\s*\n/).map(function (p) { return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>"; }).join("");
  }
  function img(path) {
    if (!path) return "";
    if (/^(https?:|data:)/.test(path)) return path;
    return path.replace(/^\//, "");
  }
  function parseDate(d) { return d ? new Date(String(d).slice(0, 10) + "T00:00:00") : null; }
  function fmt(d, opts) { var x = parseDate(d); return x ? x.toLocaleDateString("en-NZ", opts) : ""; }
  function today() { var t = new Date(); t.setHours(0, 0, 0, 0); return t; }
  function hasScore(f) { return f.ourScore !== "" && f.ourScore != null && f.theirScore !== "" && f.theirScore != null; }
  function list(x) { return Array.isArray(x) ? x : []; }
  function ext(url) { return url ? ' href="' + esc(url) + '" target="_blank" rel="noopener"' : ""; }

  /* ---------- shared pieces ---------- */
  function pageHead(label, title, text) {
    return '<header class="page-head"><div class="wrap"><span class="label">' + esc(label) + "</span><h1>" + esc(title) + "</h1>" +
      (text ? "<p>" + esc(text) + "</p>" : "") + "</div></header>";
  }
  function fixtureRow(f) {
    var d = parseDate(f.date);
    var score = "";
    if (hasScore(f)) {
      var a = +f.ourScore, b = +f.theirScore;
      var res = a > b ? ["win", "Won"] : a < b ? ["loss", "Lost"] : ["draw", "Drew"];
      score = '<div class="fx-score"><span class="pill ' + res[0] + '">' + res[1] + "</span> " + esc(f.ourScore) + "–" + esc(f.theirScore) + "</div>";
    } else {
      score = '<div class="fx-score"><span class="pill">' + esc(f.homeAway || "Fixture") + "</span></div>";
    }
    return '<div class="fx"><div class="fx-date">' + (d ? d.toLocaleDateString("en-NZ", { weekday: "short" }) + "<b>" + d.getDate() + "</b>" + d.toLocaleDateString("en-NZ", { month: "short" }) : "TBC") +
      '</div><div class="fx-match"><b>OBM ' + esc(f.team) + " v " + esc(f.opponent) + "</b><span>" +
      [f.time ? esc(f.time) : "", esc(f.venue)].filter(Boolean).join(" · ") + "</span></div>" + score + "</div>";
  }
  function upcoming(n) {
    var t = today();
    var u = list(C.fixtures).filter(function (f) { return !hasScore(f) && (!f.date || parseDate(f.date) >= t); })
      .sort(function (a, b) { return (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")); });
    return n ? u.slice(0, n) : u;
  }
  function results(n) {
    var r = list(C.fixtures).filter(hasScore).sort(function (a, b) { return b.date.localeCompare(a.date); });
    return n ? r.slice(0, n) : r;
  }
  function newsSorted() { return list(C.news).slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }); }
  function newsId(n, i) { return (n.id || n.title || "post-" + i).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function newsCard(n, i) {
    var media = n.image ? '<div class="card-media" style="background-image:url(\'' + esc(img(n.image)) + '\')"></div>' : '<div class="card-media blank"></div>';
    return '<a class="card" href="#news.' + newsId(n, i) + '">' + media + '<div class="card-body"><span class="card-meta">' + esc(fmt(n.date, { day: "numeric", month: "long", year: "numeric" })) +
      "</span><h3>" + esc(n.title) + "</h3><p>" + esc(n.summary) + "</p></div></a>";
  }
  function eventsUpcoming(n) {
    var t = today();
    var e = list(C.events).filter(function (x) { return !x.date || parseDate(x.date) >= t; }).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    return n ? e.slice(0, n) : e;
  }
  function eventItem(e) {
    var d = parseDate(e.date);
    return '<div class="event"><div class="event-date">' + (d ? d.toLocaleDateString("en-NZ", { month: "short" }) + "<b>" + d.getDate() + "</b>" : "TBC") +
      '</div><div><h3>' + esc(e.title) + '</h3><p>' + [esc(e.time), esc(e.location)].filter(Boolean).join(" · ") + "</p>" + (e.description ? "<p>" + esc(e.description) + "</p>" : "") + "</div></div>";
  }
  function sponsorTiers(large) {
    var s = list(C.sponsors), tiers = [];
    s.forEach(function (x) { if (tiers.indexOf(x.tier) < 0) tiers.push(x.tier); });
    tiers.sort(function (a, b) {
      var ia = TIER_ORDER.indexOf(a), ib = TIER_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    return tiers.map(function (t, ti) {
      var items = s.filter(function (x) { return x.tier === t; }).map(function (x) {
        var inner = x.logo ? '<img src="' + esc(img(x.logo)) + '" alt="' + esc(x.name) + '">' : esc(x.name);
        return x.link ? '<a class="logo"' + ext(x.link) + ">" + inner + "</a>" : '<div class="logo">' + inner + "</div>";
      }).join("");
      return '<div class="tier"><h3>' + esc(t || "Sponsors") + '</h3><div class="logos' + (large && ti === 0 ? " lg" : "") + '">' + items + "</div></div>";
    }).join("");
  }
  function empty(msg) { return '<div class="empty">' + esc(msg) + "</div>"; }

  /* ---------- pages ---------- */
  var render = {};

  render.home = function () {
    var s = C.settings;
    var heroStyle = s.heroImage ? ' style="background-image:url(\'' + esc(img(s.heroImage)) + '\')"' : "";
    var up = upcoming(4), rs = results(3), nw = newsSorted().slice(0, 3), ev = eventsUpcoming(3);
    return '<section class="hero' + (s.heroImage ? " has-photo" : "") + '"' + heroStyle + '><div class="wrap hero-inner"><div>' +
      '<span class="label">' + esc(s.heroEyebrow) + "</span><h1>" + esc(s.heroTitle) + "</h1><p>" + esc(s.heroText) + "</p>" +
      '<div class="hero-actions"><a class="btn btn-green" href="#seniors">Join the club</a><a class="btn btn-line" href="#draws">Draws &amp; results</a></div></div>' +
      '<div class="hero-crest"><img src="' + CREST + '" alt="OBM RFC Whangārei crest"></div></div></section>' +
      '<div class="wrap"><nav class="quick" aria-label="Quick links">' +
      '<a href="#seniors"><b>Senior Club</b><span>Teams, coaches &amp; registration</span></a>' +
      '<a href="#juniors"><b>Junior Club</b><span>Rippa to Under 13</span></a>' +
      '<a href="#draws"><b>Draws &amp; Results</b><span>This week\'s games</span></a>' +
      '<a href="#gear"><b>Club Gear</b><span>Hoodies, shorts &amp; socks</span></a></nav></div>' +
      '<section class="section"><div class="wrap split"><div><div class="section-head"><div><span class="label">Coming up</span><h2>Next fixtures</h2></div><a class="more" href="#draws">Full draw →</a></div>' +
      '<div class="fixtures">' + (up.length ? up.map(fixtureRow).join("") : empty("The draw for next season hasn't been added yet.")) + "</div></div>" +
      '<div><div class="section-head"><div><span class="label">Scoreboard</span><h2>Latest results</h2></div></div><div class="fixtures">' +
      (rs.length ? rs.map(fixtureRow).join("") : empty("Results appear here once scores are entered.")) + "</div></div></div></section>" +
      '<section class="section"><div class="wrap"><div class="section-head"><div><span class="label">Club news</span><h2>From the clubrooms</h2></div><a class="more" href="#news">All news →</a></div>' +
      '<div class="grid">' + (nw.length ? nw.map(newsCard).join("") : empty("No news posts yet.")) + "</div></div></section>" +
      (ev.length ? '<section class="section"><div class="wrap"><div class="section-head"><div><span class="label">Calendar</span><h2>Club events</h2></div><a class="more" href="#news">All events →</a></div><div class="events">' + ev.map(eventItem).join("") + "</div></div></section>" : "") +
      '<section class="section sponsor-band"><div class="wrap"><div class="section-head"><div><span class="label">Thank you</span><h2>Our partners</h2></div><a class="more" href="#sponsors">Become a sponsor →</a></div>' + sponsorTiers(true) + "</div></section>";
  };

  render.about = function () {
    var a = C.about;
    var honours = list(a.honours), com = list(a.committee);
    return pageHead("Est. " + C.settings.established, "About the club", a.intro) +
      '<section class="section"><div class="wrap split"><div><span class="label">Our story</span><h2 style="margin:8px 0 18px">History</h2><div class="prose">' + rich(a.history) + "</div></div>" +
      '<aside class="panel"><span class="label">Honours board</span>' +
      (honours.length ? '<div class="table-wrap"><table><thead><tr><th>Year</th><th>Honour</th></tr></thead><tbody>' +
        honours.map(function (h) { return '<tr><td class="num">' + esc(h.year) + "</td><td>" + esc(h.title) + "</td></tr>"; }).join("") + "</tbody></table></div>" : empty("No honours added yet.")) +
      "</aside></div></section>" +
      '<section class="section"><div class="wrap"><div class="section-head"><div><span class="label">Who runs the club</span><h2>Committee</h2></div></div>' +
      '<div class="table-wrap"><table><thead><tr><th>Role</th><th>Name</th><th>Email</th></tr></thead><tbody>' +
      com.map(function (m) { return "<tr><td><b>" + esc(m.role) + "</b></td><td>" + esc(m.name) + "</td><td>" + (m.email ? '<span class="muted">' + esc(m.email) + "</span>" : "") + "</td></tr>"; }).join("") +
      "</tbody></table></div></div></section>";
  };

  function teamCards(section) {
    var t = list(C.teams).filter(function (x) { return (x.section || "Senior") === section; });
    if (!t.length) return empty("No teams listed yet.");
    return '<div class="grid">' + t.map(function (x) {
      var rows = [["Coach", x.coach], ["Manager", x.manager], ["Training", x.training]].filter(function (r) { return r[1]; });
      return '<div class="card"><div class="card-body"><span class="card-meta">' + esc(section) + "</span><h3>" + esc(x.name) + "</h3><p>" + esc(x.description) + "</p>" +
        (rows.length ? '<dl class="kv">' + rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" : "") + "</div></div>";
    }).join("") + "</div>";
  }

  render.seniors = function () {
    var s = C.settings;
    return pageHead("Senior Club", "Senior rugby", "Premier, reserves, women, colts and social rugby. Training is at the club fields.") +
      '<section class="section"><div class="wrap"><div class="section-head"><div><span class="label">2027 season</span><h2>Teams &amp; coaches</h2></div>' +
      (s.seniorRegistrationLink ? '<a class="btn btn-green"' + ext(s.seniorRegistrationLink) + ">Register as a senior player</a>" : "") + "</div>" + teamCards("Senior") + "</div></section>";
  };

  render.juniors = function () {
    var j = C.juniors, s = C.settings;
    var g = list(j.grades), faq = list(j.faq);
    return pageHead("Junior Club", "Junior rugby", j.intro) +
      '<section class="section"><div class="wrap"><div class="section-head"><div><span class="label">Grades</span><h2>Find the right grade</h2></div>' +
      (s.juniorRegistrationLink ? '<a class="btn btn-green"' + ext(s.juniorRegistrationLink) + ">Register a junior player</a>" : "") + "</div>" +
      '<div class="table-wrap"><table><thead><tr><th>Grade</th><th>Ages</th><th>Training</th><th>Notes</th></tr></thead><tbody>' +
      g.map(function (x) { return "<tr><td><b>" + esc(x.grade) + "</b></td><td class=\"num\">" + esc(x.ages) + "</td><td>" + esc(x.training) + "</td><td>" + esc(x.notes) + "</td></tr>"; }).join("") +
      "</tbody></table></div></div></section>" +
      (list(C.teams).some(function (t) { return t.section === "Junior"; }) ? '<section class="section"><div class="wrap"><h2 style="margin-bottom:20px">Junior teams</h2>' + teamCards("Junior") + "</div></section>" : "") +
      (faq.length ? '<section class="section"><div class="wrap"><div class="section-head"><div><span class="label">Parents</span><h2>Questions</h2></div></div><div class="prose">' +
        faq.map(function (q) { return "<details><summary>" + esc(q.question) + "</summary><p>" + esc(q.answer) + "</p></details>"; }).join("") + "</div></div></section>" : "");
  };

  var drawFilter = "All";
  render.draws = function () {
    var teams = ["All"];
    list(C.fixtures).forEach(function (f) { if (f.team && teams.indexOf(f.team) < 0) teams.push(f.team); });
    if (teams.indexOf(drawFilter) < 0) drawFilter = "All";
    var pick = function (f) { return drawFilter === "All" || f.team === drawFilter; };
    var up = upcoming().filter(pick), rs = results().filter(pick);
    var link = C.settings.drawsLink;
    return pageHead("Draws & Results", "Draws & results", "Every OBM game, home and away.") +
      '<section class="section"><div class="wrap"><div class="filters" role="group" aria-label="Filter by team">' +
      teams.map(function (t) { return '<button class="chip" data-team="' + esc(t) + '" aria-pressed="' + (t === drawFilter) + '">' + esc(t) + "</button>"; }).join("") + "</div>" +
      '<div class="split"><div><h2 style="margin-bottom:16px">Upcoming</h2><div class="fixtures">' + (up.length ? up.map(fixtureRow).join("") : empty("No upcoming games in the draw.")) + "</div></div>" +
      '<div><h2 style="margin-bottom:16px">Results</h2><div class="fixtures">' + (rs.length ? rs.map(fixtureRow).join("") : empty("No results yet.")) + "</div>" +
      (link ? '<p style="margin-top:18px"><a' + ext(link) + ">Full competition draw and standings →</a></p>" : "") + "</div></div></div></section>";
  };

  render.news = function (sub) {
    var all = newsSorted();
    if (sub) {
      var i = all.findIndex(function (n, k) { return newsId(n, k) === sub; });
      var n = all[i];
      if (!n) return pageHead("News", "Post not found", "This post may have been removed.") + '<section class="section"><div class="wrap"><a class="back" href="#news">← All news</a></div></section>';
      return pageHead(fmt(n.date, { day: "numeric", month: "long", year: "numeric" }), n.title, n.summary) +
        '<section class="section"><div class="wrap"><article class="prose">' + (n.image ? '<img class="article-img" src="' + esc(img(n.image)) + '" alt="">' : "") + rich(n.body) +
        '<p><a class="back" href="#news">← All news</a></p></article></div></section>';
    }
    var ev = eventsUpcoming();
    return pageHead("News & Events", "Club news", "What's happening at OBM.") +
      '<section class="section"><div class="wrap split"><div class="grid">' + (all.length ? all.map(newsCard).join("") : empty("No news posts yet.")) + "</div>" +
      '<aside class="panel"><span class="label">Calendar</span><h2>Upcoming events</h2><div class="events">' + (ev.length ? ev.map(eventItem).join("") : empty("No upcoming events.")) + "</div></aside></div></section>";
  };

  render.sponsors = function () {
    return pageHead("Partners", "Sponsors & funders", "OBM runs on the support of local businesses and community funders. Thank you.") +
      '<section class="section"><div class="wrap">' + sponsorTiers(true) + "</div></section>" +
      '<section class="section"><div class="wrap"><div class="panel" style="max-width:720px"><span class="label">Get involved</span><h2>Sponsor the club</h2>' +
      "<p>Sponsorship packages include signage at the fields, logos on kit and this website, and hospitality on home game days. Get in touch to find the package that suits your business.</p>" +
      '<p><a class="btn btn-green" href="#contact">Talk to us about sponsorship</a></p></div></div></section>';
  };

  render.venue = function () {
    var v = C.venue;
    return pageHead("Venue Hire", "Hire the clubrooms", v.intro) +
      '<section class="section"><div class="wrap"><div class="grid">' + list(v.spaces).map(function (x) {
        var media = x.image ? '<div class="card-media" style="background-image:url(\'' + esc(img(x.image)) + '\')"></div>' : '<div class="card-media blank"></div>';
        return '<div class="card">' + media + '<div class="card-body"><span class="card-meta">' + esc(x.capacity) + "</span><h3>" + esc(x.name) + "</h3><p>" + esc(x.description) + "</p></div></div>";
      }).join("") + '</div><p style="margin-top:24px"><a class="btn btn-green" href="#contact">Make a booking enquiry</a></p></div></section>';
  };

  render.gear = function () {
    var g = C.gear;
    return pageHead("Club Gear", "Club gear", g.intro) +
      '<section class="section"><div class="wrap"><div class="grid">' + list(g.items).map(function (x) {
        var media = x.image ? '<div class="card-media" style="background-image:url(\'' + esc(img(x.image)) + '\')"></div>' : '<div class="card-media blank"></div>';
        return '<div class="card">' + media + '<div class="card-body"><h3>' + esc(x.name) + '</h3><span class="price">' + esc(x.price) + "</span><p>" + esc(x.description) + "</p></div></div>";
      }).join("") + "</div>" + (g.storeLink ? '<p style="margin-top:24px"><a class="btn btn-green"' + ext(g.storeLink) + ">Order from the online store</a></p>" : "") + "</div></section>";
  };

  render.contact = function () {
    var s = C.settings;
    var rows = [["Address", s.address], ["Email", s.email], ["Phone", s.phone], ["Clubrooms", s.clubroomHours]].filter(function (r) { return r[1]; });
    return pageHead("Contact", "Get in touch", "Questions about playing, sponsorship or hiring the clubrooms.") +
      '<section class="section"><div class="wrap split"><form id="contact-form" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field">' +
      '<input type="hidden" name="form-name" value="contact"><p hidden><label>Leave empty <input name="bot-field" id="bot-field"></label></p>' +
      '<div class="form-row"><label for="c-name">Name<input id="c-name" name="name" required autocomplete="name"></label>' +
      '<label for="c-email">Email<input id="c-email" name="email" type="email" required autocomplete="email"></label></div>' +
      '<label for="c-topic">Topic<select id="c-topic" name="topic"><option>Playing (seniors)</option><option>Playing (juniors)</option><option>Sponsorship</option><option>Venue hire</option><option>Something else</option></select></label>' +
      '<label for="c-msg">Message<textarea id="c-msg" name="message" required></textarea></label>' +
      '<div><button class="btn btn-green" type="submit">Send message</button></div><div id="form-status" role="status"></div></form>' +
      '<aside class="panel"><span class="label">Find us</span><dl class="kv">' + rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" +
      social() + "</aside></div></section>";
  };

  function social() {
    var s = C.settings, l = [["Facebook", s.facebook], ["Instagram", s.instagram], ["YouTube", s.youtube]].filter(function (x) { return x[1]; });
    return l.length ? "<p>" + l.map(function (x) { return "<a" + ext(x[1]) + ">" + x[0] + "</a>"; }).join(" · ") + "</p>" : "";
  }

  /* ---------- chrome ---------- */
  function drawChrome() {
    var s = C.settings;
    document.title = s.shortName || "OBM Rugby";
    var n = document.getElementById("notice");
    if (s.announcement) { n.textContent = s.announcement; n.hidden = false; } else n.hidden = true;
    document.getElementById("brand-name").textContent = s.shortName;
    document.getElementById("brand-sub").textContent = s.location + " · Est. " + s.established;
    document.getElementById("nav").innerHTML = PAGES.map(function (p) { return '<a href="#' + p.id + '" data-page="' + p.id + '">' + esc(p.label) + "</a>"; }).join("");
    document.getElementById("footer").innerHTML =
      '<div class="wrap"><div class="foot"><img class="foot-crest" src="' + CREST + '" alt="">' +
      "<div><h3>" + esc(s.clubName) + "</h3><p>" + esc(s.address) + "</p><p>" + esc(s.clubroomHours) + "</p></div>" +
      "<div><h3>Club</h3><ul>" + PAGES.slice(1, 6).map(function (p) { return '<li><a href="#' + p.id + '">' + esc(p.label) + "</a></li>"; }).join("") + "</ul></div>" +
      "<div><h3>Contact</h3><ul>" + (s.email ? "<li>" + esc(s.email) + "</li>" : "") + (s.phone ? "<li>" + esc(s.phone) + "</li>" : "") +
      '<li><a href="#contact">Send us a message</a></li></ul>' + social() + "</div></div>" +
      '<div class="foot-base"><span>© ' + new Date().getFullYear() + " " + esc(s.clubName) + '</span><span>Kit by Dynasty Sport</span></div></div>';
    document.documentElement.style.setProperty("--crest", 'url("' + CREST + '")');
  }

  function route(keepScroll) {
    var h = (location.hash || "#home").slice(1);
    var parts = h.split(".");
    var page = render[parts[0]] ? parts[0] : "home";
    document.getElementById("main").innerHTML = render[page](parts.slice(1).join("."));
    document.querySelectorAll("#nav a").forEach(function (a) {
      if (a.dataset.page === page) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    document.getElementById("nav").classList.remove("open");
    document.getElementById("nav-toggle").setAttribute("aria-expanded", "false");
    if (keepScroll !== true) window.scrollTo(0, 0);
  }

  document.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip[data-team]");
    if (chip) { drawFilter = chip.dataset.team; route(true); }
    if (e.target.closest("#nav-toggle")) {
      var nav = document.getElementById("nav"), open = nav.classList.toggle("open");
      e.target.closest("#nav-toggle").setAttribute("aria-expanded", String(open));
    }
  });

  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (f.id !== "contact-form") return;
    e.preventDefault();
    var status = document.getElementById("form-status");
    if (window.OBM_PREVIEW) { status.innerHTML = '<div class="form-ok">This is a preview, so the message wasn\'t sent. On the live site it goes to the club inbox.</div>'; return; }
    var body = new URLSearchParams(new FormData(f)).toString();
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
      .then(function (r) {
        if (!r.ok) throw new Error();
        f.reset();
        status.innerHTML = '<div class="form-ok">Thanks. Your message has been sent to the club.</div>';
      })
      .catch(function () { status.innerHTML = '<div class="empty">The message didn\'t send. Please try again, or email the club directly.</div>'; });
  });

  function start(data) {
    C = data;
    if (window.OBM_CREST) CREST = window.OBM_CREST;
    drawChrome();
    route();
    window.addEventListener("hashchange", function () { route(); });
  }

  if (window.OBM_CONTENT) { start(window.OBM_CONTENT); return; }
  Promise.all(FILES.map(function (f) { return fetch("content/" + f + ".json", { cache: "no-cache" }).then(function (r) { return r.json(); }); }))
    .then(function (arr) { var d = {}; FILES.forEach(function (f, i) { d[f] = arr[i]; }); start(d); })
    .catch(function () { document.getElementById("main").innerHTML = '<div class="wrap section"><div class="empty">The site content didn\'t load. Refresh the page to try again.</div></div>'; });
})();
